import { DriverProfile } from '../models/DriverProfile.js';
import { DriverLocation } from '../models/DriverLocation.js';
import { Ride } from '../models/Ride.js';
import { RideOffer } from '../models/RideOffer.js';
import { RideEvent } from '../models/RideEvent.js';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { calculateHaversineDistanceKm } from './maps.service.js';
import { getIO } from './socket.service.js';
import { ENV } from '../config/env.js';

export class MatchingService {
  /**
   * Find nearby eligible approved drivers for a ride
   */
  static async findEligibleDrivers(ride) {
    const radiusKm = ENV.DISPATCH_RADIUS_KM;
    const [pickupLng, pickupLat] = ride.pickup.coordinates;

    // Exclude drivers who already received an offer for this ride
    const priorOffers = await RideOffer.find({ ride: ride._id }).select('driver');
    const excludedDriverIds = priorOffers.map((o) => o.driver.toString());

    // Find all approved drivers with vehicle matching or exceeding category
    const approvedProfiles = await DriverProfile.find({
      verificationStatus: 'approved',
      isOnline: true,
      isAvailable: true,
      currentRide: null,
      user: { $nin: excludedDriverIds },
    }).populate('vehicle');

    if (approvedProfiles.length === 0) {
      return [];
    }

    const driverUserIds = approvedProfiles
      .filter((p) => {
        if (!p.vehicle) return false;
        // Category match logic: XL or Premium drivers can also accept Economy if configured,
        // or strict matching. Let's allow matching category or higher category
        if (ride.category === 'economy') return true;
        if (ride.category === 'comfort') return ['comfort', 'premium', 'xl'].includes(p.vehicle.category);
        if (ride.category === 'xl') return p.vehicle.category === 'xl';
        if (ride.category === 'premium') return p.vehicle.category === 'premium';
        return p.vehicle.category === ride.category;
      })
      .map((p) => p.user);

    if (driverUserIds.length === 0) {
      return [];
    }

    // Find latest location pings for these drivers
    const locations = await DriverLocation.find({
      driver: { $in: driverUserIds },
    });

    const candidateDrivers = [];

    for (const loc of locations) {
      const distKm = calculateHaversineDistanceKm(
        loc.location.coordinates,
        [pickupLng, pickupLat]
      );

      if (distKm <= radiusKm) {
        const estMinutes = Math.max(2, Math.round(distKm * 2.5));
        candidateDrivers.push({
          driverId: loc.driver.toString(),
          coordinates: loc.location.coordinates,
          distanceKm: distKm,
          estimatedArrivalMin: estMinutes,
        });
      }
    }

    // Rank candidates by shortest distance/ETA
    candidateDrivers.sort((a, b) => a.distanceKm - b.distanceKm);

    return candidateDrivers;
  }

  /**
   * Dispatch ride offer to candidate driver(s)
   */
  static async dispatchRide(rideId) {
    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== 'requested') {
      return null;
    }

    const eligibleCandidates = await this.findEligibleDrivers(ride);

    if (eligibleCandidates.length === 0) {
      // Notify passenger room that no drivers are currently nearby
      try {
        const io = getIO();
        if (io) {
          io.to(`ride:${rideId}`).emit('ride:no_drivers_available', {
            rideId,
            message: 'No available drivers found nearby. Please try again or expand search.',
          });
          io.to(`user:${ride.passenger}`).emit('ride:no_drivers_available', {
            rideId,
            message: 'No available drivers found nearby. Please try again or expand search.',
          });
        }
      } catch (err) {
        // Socket may not be initialized in test
      }
      return null;
    }

    // Mark ride as offered
    ride.status = 'offered';
    await ride.save();

    // Select top ranked driver
    const topCandidate = eligibleCandidates[0];
    const expiresAt = new Date(Date.now() + ENV.OFFER_TIMEOUT_SEC * 1000);

    const offer = await RideOffer.create({
      ride: rideId,
      driver: topCandidate.driverId,
      status: 'pending',
      expiresAt,
      distanceToPickupKm: topCandidate.distanceKm,
      estimatedArrivalMin: topCandidate.estimatedArrivalMin,
    });

    await RideEvent.create({
      ride: rideId,
      eventType: 'offered',
      actorRole: 'system',
      metadata: {
        driverId: topCandidate.driverId,
        offerId: offer._id,
        distanceKm: topCandidate.distanceKm,
      },
    });

    // Notify driver via Socket.IO
    try {
      const io = getIO();
      if (io) {
        const passenger = await User.findById(ride.passenger).select('name ratingAvg avatar');

        io.to(`driver:${topCandidate.driverId}`).emit('ride:offer', {
          offerId: offer._id,
          rideId: ride._id,
          category: ride.category,
          pickup: ride.pickup,
          destination: ride.destination,
          distanceKm: ride.route.distanceKm,
          durationMin: ride.route.durationMin,
          estimatedFare: ride.fareEstimate.total,
          pickupDistanceKm: topCandidate.distanceKm,
          estimatedPickupMin: topCandidate.estimatedArrivalMin,
          expiresInSec: ENV.OFFER_TIMEOUT_SEC,
          passenger: {
            name: passenger ? passenger.name : 'Passenger',
            rating: passenger ? passenger.ratingAvg : 5.0,
          },
        });
      }
    } catch (err) {
      console.error('Socket emit error on dispatchRide:', err.message);
    }

    return offer;
  }

  /**
   * Process Driver Offer Acceptance atomically
   */
  static async acceptOffer(offerId, driverId) {
    const offer = await RideOffer.findById(offerId);
    if (!offer) {
      throw new Error('Offer not found');
    }

    if (offer.driver.toString() !== driverId.toString()) {
      throw new Error('Unauthorized: This offer was not dispatched to you');
    }

    if (offer.status !== 'pending') {
      throw new Error(`Offer is no longer available (Status: ${offer.status})`);
    }

    if (new Date() > new Date(offer.expiresAt)) {
      offer.status = 'expired';
      await offer.save();
      throw new Error('Offer has expired');
    }

    // Check if driver is currently available and doesn't already have an active ride
    const driverProfile = await DriverProfile.findOne({
      user: driverId,
      verificationStatus: 'approved',
      isAvailable: true,
      currentRide: null,
    }).populate('vehicle');

    if (!driverProfile) {
      throw new Error('Driver is not currently available or already has an active ride');
    }

    // ATOMIC RIDE ASSIGNMENT:
    // Ensures only one driver can win the ride and prevents race conditions
    const updatedRide = await Ride.findOneAndUpdate(
      {
        _id: offer.ride,
        status: { $in: ['requested', 'offered'] },
        driver: null,
      },
      {
        $set: {
          driver: driverId,
          vehicle: driverProfile.vehicle?._id || null,
          status: 'driver_assigned',
        },
      },
      { new: true }
    ).populate('driver passenger vehicle');

    if (!updatedRide) {
      offer.status = 'expired';
      await offer.save();
      throw new Error('Ride is no longer available or was accepted by another driver');
    }

    // Mark offer as accepted
    offer.status = 'accepted';
    offer.responseTime = new Date();
    await offer.save();

    // Set driver profile to unavailable & link current ride
    driverProfile.isAvailable = false;
    driverProfile.currentRide = updatedRide._id;
    await driverProfile.save();

    // Expire any other pending offers for this ride
    await RideOffer.updateMany(
      { ride: updatedRide._id, _id: { $ne: offer._id }, status: 'pending' },
      { $set: { status: 'expired' } }
    );

    // Record ride event
    await RideEvent.create({
      ride: updatedRide._id,
      eventType: 'offer_accepted',
      actor: driverId,
      actorRole: 'driver',
      metadata: { offerId },
    });

    // Notify rooms via Socket.IO
    try {
      const io = getIO();
      if (io) {
        // Join driver and passenger to ride room
        const driverSockets = await io.in(`driver:${driverId}`).fetchSockets();
        driverSockets.forEach((s) => s.join(`ride:${updatedRide._id}`));

        const passengerId = updatedRide.passenger?._id || updatedRide.passenger;
        const passengerSockets = await io.in(`user:${passengerId}`).fetchSockets();
        passengerSockets.forEach((s) => s.join(`ride:${updatedRide._id}`));

        const payload = {
          ride: updatedRide,
          driver: {
            id: updatedRide.driver._id,
            name: updatedRide.driver.name,
            phone: updatedRide.driver.phone,
            rating: updatedRide.driver.ratingAvg,
            vehicle: updatedRide.vehicle,
          },
          pin: updatedRide.pin,
        };

        // Emit assignment to ride room
        io.to(`ride:${updatedRide._id}`).emit('ride:accepted', payload);
        // Also emit directly to passenger user room for guaranteed delivery
        io.to(`user:${passengerId}`).emit('ride:accepted', payload);
      }
    } catch (err) {
      console.error('Socket emit error on acceptOffer:', err.message);
    }

    return updatedRide;
  }

  /**
   * Process Driver Offer Rejection
   */
  static async rejectOffer(offerId, driverId) {
    const offer = await RideOffer.findById(offerId);
    if (!offer) {
      throw new Error('Offer not found');
    }

    if (offer.driver.toString() !== driverId.toString()) {
      throw new Error('Unauthorized: This offer was not dispatched to you');
    }

    offer.status = 'rejected';
    offer.responseTime = new Date();
    await offer.save();

    await RideEvent.create({
      ride: offer.ride,
      eventType: 'offer_rejected',
      actor: driverId,
      actorRole: 'driver',
    });

    // Reset ride to requested so it can dispatch to another driver
    await Ride.findByIdAndUpdate(offer.ride, { status: 'requested' });

    // Continue dispatch to next available candidate
    return this.dispatchRide(offer.ride);
  }
}
