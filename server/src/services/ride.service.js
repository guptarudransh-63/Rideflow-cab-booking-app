import { Ride } from '../models/Ride.js';
import { DriverProfile } from '../models/DriverProfile.js';
import { RideOffer } from '../models/RideOffer.js';
import { RideEvent } from '../models/RideEvent.js';
import { MapsService } from './maps.service.js';
import { FareService } from './fare.service.js';
import { MatchingService } from './matching.service.js';
import { getIO } from './socket.service.js';

export class RideService {
  /**
   * Request / Create a new ride
   */
  static async createRide({ passengerId, pickup, destination, category = 'economy' }) {
    // 1. Calculate route estimates
    const route = await MapsService.getRoute(pickup.coordinates, destination.coordinates);

    // 2. Calculate fare estimate
    const fareEstimate = await FareService.calculateEstimate(
      category,
      route.distanceKm,
      route.durationMin
    );

    // 3. Generate secure 4-digit pickup PIN
    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    // 4. Create Ride document
    const ride = await Ride.create({
      passenger: passengerId,
      category,
      status: 'requested',
      pickup,
      destination,
      route: {
        distanceKm: route.distanceKm,
        durationMin: route.durationMin,
        polyline: route.polyline,
      },
      fareEstimate: {
        base: fareEstimate.base,
        distance: fareEstimate.distance,
        duration: fareEstimate.duration,
        surgeMultiplier: fareEstimate.surgeMultiplier,
        platformFee: fareEstimate.platformFee,
        total: fareEstimate.total,
      },
      pin,
    });

    // 5. Log creation event
    await RideEvent.create({
      ride: ride._id,
      eventType: 'requested',
      actor: passengerId,
      actorRole: 'passenger',
      metadata: { category, totalEstimate: fareEstimate.total },
    });

    // Automatically join passenger's active sockets to the ride room
    try {
      const io = getIO();
      if (io) {
        const passengerSockets = await io.in(`user:${passengerId}`).fetchSockets();
        passengerSockets.forEach((s) => s.join(`ride:${ride._id}`));
      }
    } catch (e) {}

    // 6. Initiate matching dispatch
    MatchingService.dispatchRide(ride._id).catch((err) => {
      // Ignore if DB connection was closed in test tear down
      if (!err.message?.includes('closed')) {
        console.error('Dispatch error:', err.message);
      }
    });

    return ride;
  }

  /**
   * Driver reports arrived at pickup location
   */
  static async driverArrived(rideId, driverId) {
    const ride = await Ride.findById(rideId);
    if (!ride) throw new Error('Ride not found');

    if (!ride.driver || ride.driver.toString() !== driverId.toString()) {
      throw new Error('Unauthorized: You are not the assigned driver for this ride');
    }

    if (ride.status !== 'driver_assigned') {
      throw new Error(`Invalid state transition: Cannot mark arrived from status '${ride.status}'`);
    }

    ride.status = 'arrived';
    ride.arrivedAt = new Date();
    await ride.save();

    await RideEvent.create({
      ride: ride._id,
      eventType: 'driver_arrived',
      actor: driverId,
      actorRole: 'driver',
    });

    try {
      const io = getIO();
      if (io) {
        io.to(`ride:${ride._id}`).emit('ride:arrived', {
          rideId: ride._id,
          arrivedAt: ride.arrivedAt,
          message: 'Your driver has arrived at the pickup location.',
        });
      }
    } catch (err) {}

    return ride;
  }

  /**
   * Start ride with verified 4-digit pickup PIN
   */
  static async startRide(rideId, driverId, pin) {
    const ride = await Ride.findById(rideId);
    if (!ride) throw new Error('Ride not found');

    if (!ride.driver || ride.driver.toString() !== driverId.toString()) {
      throw new Error('Unauthorized: You are not the assigned driver for this ride');
    }

    if (!['driver_assigned', 'arrived'].includes(ride.status)) {
      throw new Error(`Invalid state transition: Cannot start ride from status '${ride.status}'`);
    }

    // Verify PIN
    if (!pin || pin.toString().trim() !== ride.pin.toString().trim()) {
      throw new Error('Invalid pickup PIN. Please confirm the 4-digit PIN with the passenger.');
    }

    ride.status = 'in_progress';
    ride.startedAt = new Date();
    await ride.save();

    await RideEvent.create({
      ride: ride._id,
      eventType: 'trip_started',
      actor: driverId,
      actorRole: 'driver',
    });

    try {
      const io = getIO();
      if (io) {
        io.to(`ride:${ride._id}`).emit('ride:started', {
          rideId: ride._id,
          startedAt: ride.startedAt,
          message: 'Trip has started! Enjoy your ride.',
        });
      }
    } catch (err) {}

    return ride;
  }

  /**
   * Complete ride and calculate authoritative final fare
   */
  static async completeRide(rideId, driverId, actualDistanceKm = null, actualDurationMin = null) {
    const ride = await Ride.findById(rideId).populate('passenger driver vehicle');
    if (!ride) throw new Error('Ride not found');

    if (!ride.driver || ride.driver._id.toString() !== driverId.toString()) {
      throw new Error('Unauthorized: You are not the assigned driver for this ride');
    }

    if (ride.status !== 'in_progress') {
      throw new Error(`Invalid state transition: Cannot complete ride from status '${ride.status}'`);
    }

    // Calculate final fare
    const finalFare = await FareService.calculateFinalFare(
      ride,
      actualDistanceKm,
      actualDurationMin
    );

    ride.status = 'completed';
    ride.completedAt = new Date();
    ride.finalFare = finalFare;
    await ride.save();

    // Release driver availability & update stats
    await DriverProfile.findOneAndUpdate(
      { user: driverId },
      {
        $set: { isAvailable: true, currentRide: null },
        $inc: {
          totalEarnings: finalFare.driverNet,
          completedTrips: 1,
        },
      }
    );

    await RideEvent.create({
      ride: ride._id,
      eventType: 'trip_completed',
      actor: driverId,
      actorRole: 'driver',
      metadata: { finalFare },
    });

    try {
      const io = getIO();
      if (io) {
        io.to(`ride:${ride._id}`).emit('ride:completed', {
          rideId: ride._id,
          finalFare,
          completedAt: ride.completedAt,
          message: 'Trip completed. Please proceed to payment and rating.',
        });
        io.to(`user:${ride.passenger._id || ride.passenger}`).emit('ride:completed', {
          rideId: ride._id,
          finalFare,
          completedAt: ride.completedAt,
          message: 'Trip completed. Please proceed to payment and rating.',
        });
      }
    } catch (err) {}

    return ride;
  }

  /**
   * Cancel ride with role-specific rules and fees
   */
  static async cancelRide({ rideId, userId, userRole, reason }) {
    const ride = await Ride.findById(rideId);
    if (!ride) throw new Error('Ride not found');

    if (ride.status === 'completed') {
      throw new Error('Completed rides cannot be cancelled');
    }

    if (ride.status === 'cancelled') {
      throw new Error('Ride is already cancelled');
    }

    // Verify user authorization
    const isPassenger = ride.passenger.toString() === userId.toString();
    const isDriver = ride.driver && ride.driver.toString() === userId.toString();
    const isAdmin = userRole === 'admin';

    if (!isPassenger && !isDriver && !isAdmin) {
      throw new Error('Unauthorized to cancel this ride');
    }

    let fee = 0;

    // Cancellation fee rule: If passenger cancels after driver has arrived or > 3 mins after assignment
    if (isPassenger && (ride.status === 'arrived' || ride.status === 'in_progress')) {
      const config = await FareService.getConfig(ride.category);
      fee = config.cancellationFee || 5.0;
    }

    ride.status = 'cancelled';
    ride.cancellation = {
      cancelledBy: userId,
      role: isPassenger ? 'passenger' : isDriver ? 'driver' : isAdmin ? 'admin' : 'system',
      reason: reason || 'Cancelled by user',
      fee,
      cancelledAt: new Date(),
    };

    // Calculate final fare for cancellation (even if fee is 0, so finalFare.total is 0 and not undefined)
    ride.finalFare = await FareService.calculateFinalFare(ride, null, null, fee);

    await ride.save();

    // Expire any pending offers and notify drivers
    const pendingOffers = await RideOffer.find({ ride: ride._id, status: 'pending' });
    await RideOffer.updateMany(
      { ride: ride._id, status: 'pending' },
      { $set: { status: 'expired' } }
    );

    // If driver was assigned, release driver
    if (ride.driver) {
      await DriverProfile.findOneAndUpdate(
        { user: ride.driver },
        { $set: { isAvailable: true, currentRide: null } }
      );
    }

    await RideEvent.create({
      ride: ride._id,
      eventType: 'trip_cancelled',
      actor: userId,
      actorRole: ride.cancellation.role,
      metadata: { reason, fee },
    });

    try {
      const io = getIO();
      if (io) {
        io.to(`ride:${ride._id}`).emit('ride:cancelled', {
          rideId: ride._id,
          cancelledBy: ride.cancellation.role,
          reason,
          fee,
        });

        // Also notify drivers who had pending offers
        pendingOffers.forEach((o) => {
          io.to(`driver:${o.driver}`).emit('ride:offer_cancelled', {
            rideId: ride._id,
            offerId: o._id,
          });
        });
      }
    } catch (err) {}

    return ride;
  }
}
