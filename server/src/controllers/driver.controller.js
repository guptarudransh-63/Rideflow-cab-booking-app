import { DriverProfile } from '../models/DriverProfile.js';
import { DriverLocation } from '../models/DriverLocation.js';
import { Vehicle } from '../models/Vehicle.js';
import { Ride } from '../models/Ride.js';
import { RideOffer } from '../models/RideOffer.js';
import { MatchingService } from '../services/matching.service.js';
import { RideService } from '../services/ride.service.js';

export class DriverController {
  static async getProfile(req, res, next) {
    try {
      const profile = await DriverProfile.findOne({ user: req.user._id })
        .populate('user', 'name email phone avatar ratingAvg')
        .populate('vehicle');

      if (!profile) {
        return res.status(404).json({ success: false, message: 'Driver profile not found' });
      }

      return res.status(200).json({ success: true, profile });
    } catch (err) {
      next(err);
    }
  }

  static async updateAvailability(req, res, next) {
    try {
      const { isOnline } = req.body;

      const profile = await DriverProfile.findOne({ user: req.user._id });
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Driver profile not found' });
      }

      // Verification check: Only approved drivers can go online!
      if (isOnline && profile.verificationStatus !== 'approved') {
        return res.status(403).json({
          success: false,
          message: `Cannot go online. Account verification status is '${profile.verificationStatus}'. Only approved drivers can go online.`,
        });
      }

      profile.isOnline = isOnline;
      // If going online and no active ride, set available; if going offline, set unavailable
      profile.isAvailable = isOnline && !profile.currentRide;
      await profile.save();

      // Update DriverLocation online state
      await DriverLocation.findOneAndUpdate(
        { driver: req.user._id },
        { $set: { isOnline, isAvailable: profile.isAvailable } }
      );

      return res.status(200).json({
        success: true,
        message: `Driver is now ${isOnline ? 'online' : 'offline'}`,
        isOnline: profile.isOnline,
        isAvailable: profile.isAvailable,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateLocation(req, res, next) {
    try {
      const { coordinates, heading = 0, speed = 0 } = req.body;

      const profile = await DriverProfile.findOne({ user: req.user._id });
      if (!profile) {
        return res.status(404).json({ success: false, message: 'Driver profile not found' });
      }

      const location = await DriverLocation.findOneAndUpdate(
        { driver: req.user._id },
        {
          location: { type: 'Point', coordinates },
          heading,
          speed,
          isOnline: profile.isOnline,
          isAvailable: profile.isAvailable,
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );

      return res.status(200).json({ success: true, location });
    } catch (err) {
      next(err);
    }
  }

  static async getOffers(req, res, next) {
    try {
      const now = new Date();
      const offers = await RideOffer.find({
        driver: req.user._id,
        status: 'pending',
        expiresAt: { $gt: now },
      })
        .sort({ createdAt: -1 })
        .populate({
          path: 'ride',
          populate: { path: 'passenger', select: 'name ratingAvg avatar' },
        });

      return res.status(200).json({ success: true, offers });
    } catch (err) {
      next(err);
    }
  }

  static async acceptOffer(req, res, next) {
    try {
      const offerId = req.params.id;
      const ride = await MatchingService.acceptOffer(offerId, req.user._id);

      return res.status(200).json({
        success: true,
        message: 'Ride offer accepted',
        ride,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  static async rejectOffer(req, res, next) {
    try {
      const offerId = req.params.id;
      await MatchingService.rejectOffer(offerId, req.user._id);

      return res.status(200).json({
        success: true,
        message: 'Ride offer rejected',
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  }

  static async markArrived(req, res, next) {
    try {
      const rideId = req.params.id;
      const ride = await RideService.driverArrived(rideId, req.user._id);
      return res.status(200).json({ success: true, ride });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async startRide(req, res, next) {
    try {
      const rideId = req.params.id;
      const { pin } = req.body;
      const ride = await RideService.startRide(rideId, req.user._id, pin);
      return res.status(200).json({ success: true, ride });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async completeRide(req, res, next) {
    try {
      const rideId = req.params.id;
      const { actualDistanceKm, actualDurationMin } = req.body || {};
      const ride = await RideService.completeRide(
        rideId,
        req.user._id,
        actualDistanceKm,
        actualDurationMin
      );
      return res.status(200).json({ success: true, ride });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getEarnings(req, res, next) {
    try {
      const driverId = req.user._id;
      const profile = await DriverProfile.findOne({ user: driverId });

      const completedRides = await Ride.find({
        driver: driverId,
        status: 'completed',
      }).sort({ completedAt: -1 });

      const grossFares = completedRides.reduce((sum, r) => sum + (r.finalFare?.total || 0), 0);
      const platformCommission = completedRides.reduce(
        (sum, r) => sum + (r.finalFare?.platformCommission || 0),
        0
      );
      const driverNet = completedRides.reduce((sum, r) => sum + (r.finalFare?.driverNet || 0), 0);

      // Today's earnings
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const todayRides = completedRides.filter((r) => new Date(r.completedAt) >= startOfToday);
      const todayNet = todayRides.reduce((sum, r) => sum + (r.finalFare?.driverNet || 0), 0);

      return res.status(200).json({
        success: true,
        summary: {
          totalTrips: completedRides.length,
          todayTrips: todayRides.length,
          todayEarnings: Math.round(todayNet * 100) / 100,
          grossFares: Math.round(grossFares * 100) / 100,
          platformCommission: Math.round(platformCommission * 100) / 100,
          netEarnings: Math.round(driverNet * 100) / 100,
        },
        recentTrips: completedRides.slice(0, 10),
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
        Ride.find({ driver: req.user._id })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('passenger', 'name phone ratingAvg avatar')
          .populate('vehicle')
          .populate('payment'),
        Ride.countDocuments({ driver: req.user._id }),
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
}
