import { User } from '../models/User.js';
import { Ride } from '../models/Ride.js';
import { Rating } from '../models/Rating.js';
import { SupportCase } from '../models/SupportCase.js';
import { Payment } from '../models/Payment.js';
import { MapsService } from '../services/maps.service.js';
import { FareService } from '../services/fare.service.js';
import { RideService } from '../services/ride.service.js';

export class PassengerController {
  static async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user._id);
      return res.status(200).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { name, phone, avatar } = req.body;
      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { ...(name && { name }), ...(phone && { phone }), ...(avatar && { avatar }) } },
        { new: true }
      );
      return res.status(200).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  static async searchLocations(req, res, next) {
    try {
      const { q } = req.query;
      const results = await MapsService.searchLocations(q);
      return res.status(200).json({ success: true, locations: results });
    } catch (err) {
      next(err);
    }
  }

  static async getEstimate(req, res, next) {
    try {
      const { pickup, destination } = req.body;
      const route = await MapsService.getRoute(pickup.coordinates, destination.coordinates);
      const estimates = await FareService.calculateAllEstimates(route.distanceKm, route.durationMin);

      return res.status(200).json({
        success: true,
        route,
        estimates,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createRide(req, res, next) {
    try {
      const { pickup, destination, category = 'economy' } = req.body;

      // Check if passenger already has an active ride
      const activeRide = await Ride.findOne({
        passenger: req.user._id,
        status: { $in: ['requested', 'offered', 'driver_assigned', 'arrived', 'in_progress'] },
      });

      if (activeRide) {
        return res.status(400).json({
          success: false,
          message: 'You already have an active ride request in progress',
          activeRideId: activeRide._id,
        });
      }

      const ride = await RideService.createRide({
        passengerId: req.user._id,
        pickup,
        destination,
        category,
      });

      return res.status(201).json({
        success: true,
        ride,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getRides(req, res, next) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '10', 10);
      const skip = (page - 1) * limit;

      const [rides, total] = await Promise.all([
        Ride.find({ passenger: req.user._id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('driver', 'name phone ratingAvg avatar')
          .populate('vehicle')
          .populate('payment'),
        Ride.countDocuments({ passenger: req.user._id }),
      ]);

      return res.status(200).json({
        success: true,
        rides,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getRideById(req, res, next) {
    try {
      const ride = await Ride.findById(req.params.id)
        .populate('passenger', 'name email phone ratingAvg avatar')
        .populate('driver', 'name email phone ratingAvg avatar')
        .populate('vehicle')
        .populate('payment');

      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found' });
      }

      // Check access permission
      const isOwner =
        ride.passenger._id.toString() === req.user._id.toString() ||
        (ride.driver && ride.driver._id.toString() === req.user._id.toString()) ||
        req.user.role === 'admin';

      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Forbidden: Access denied' });
      }

      return res.status(200).json({ success: true, ride });
    } catch (err) {
      next(err);
    }
  }

  static async cancelRide(req, res, next) {
    try {
      const { reason } = req.body;
      const ride = await RideService.cancelRide({
        rideId: req.params.id,
        userId: req.user._id,
        userRole: req.user.role,
        reason,
      });
      return res.status(200).json({ success: true, ride });
    } catch (err) {
      next(err);
    }
  }

  static async submitRating(req, res, next) {
    try {
      const { score, comment } = req.body;
      const rideId = req.params.id;

      const ride = await Ride.findById(rideId);
      if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

      if (ride.status !== 'completed') {
        return res.status(400).json({ success: false, message: 'Ratings can only be submitted for completed rides' });
      }

      if (ride.passenger.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized to rate this trip' });
      }

      if (!ride.driver) {
        return res.status(400).json({ success: false, message: 'No driver associated with this trip' });
      }

      // Check for existing rating
      const existing = await Rating.findOne({ ride: rideId, reviewer: req.user._id });
      if (existing) {
        return res.status(409).json({ success: false, message: 'You have already submitted a rating for this ride' });
      }

      const rating = await Rating.create({
        ride: rideId,
        reviewer: req.user._id,
        reviewee: ride.driver,
        role: 'passenger',
        score,
        comment,
      });

      // Update driver average rating
      const driverRatings = await Rating.find({ reviewee: ride.driver });
      const avg = driverRatings.reduce((sum, r) => sum + r.score, 0) / driverRatings.length;
      await User.findByIdAndUpdate(ride.driver, {
        ratingAvg: Math.round(avg * 10) / 10,
        ratingCount: driverRatings.length,
      });

      return res.status(201).json({ success: true, rating });
    } catch (err) {
      next(err);
    }
  }

  static async reportSupportIssue(req, res, next) {
    try {
      const { issueType, description } = req.body;
      const rideId = req.params.id;

      const ride = await Ride.findById(rideId);
      if (!ride) return res.status(404).json({ success: false, message: 'Ride not found' });

      const supportCase = await SupportCase.create({
        ride: rideId,
        user: req.user._id,
        issueType,
        description,
      });

      return res.status(201).json({ success: true, supportCase });
    } catch (err) {
      next(err);
    }
  }

  static async getPayments(req, res, next) {
    try {
      const payments = await Payment.find({ passenger: req.user._id })
        .sort({ createdAt: -1 })
        .populate('ride');
      return res.status(200).json({ success: true, payments });
    } catch (err) {
      next(err);
    }
  }
}
