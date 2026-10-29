import { User } from '../models/User.js';
import { DriverProfile } from '../models/DriverProfile.js';
import { DriverLocation } from '../models/DriverLocation.js';
import { Ride } from '../models/Ride.js';
import { Payment } from '../models/Payment.js';
import { SupportCase } from '../models/SupportCase.js';
import { AuditLog } from '../models/AuditLog.js';
import { FareConfiguration } from '../models/FareConfiguration.js';

export class AdminService {
  /**
   * Log an administrative action to AuditLog
   */
  static async logAction({ actorId, action, entityType, entityId, changes = {}, ipAddress = '' }) {
    return AuditLog.create({
      actor: actorId,
      action,
      entityType,
      entityId,
      changes,
      ipAddress,
    });
  }

  /**
   * Aggregate operational analytics from persisted database data
   */
  static async getDashboardMetrics() {
    const [
      totalPassengers,
      totalDrivers,
      pendingDrivers,
      onlineDrivers,
      activeRides,
      completedRides,
      cancelledRides,
      paymentsSummary,
      paymentFailures,
      openSupportCases,
      recentRides,
    ] = await Promise.all([
      User.countDocuments({ role: 'passenger' }),
      User.countDocuments({ role: 'driver' }),
      DriverProfile.countDocuments({ verificationStatus: 'pending' }),
      DriverProfile.countDocuments({ isOnline: true }),
      Ride.countDocuments({ status: { $in: ['requested', 'offered', 'driver_assigned', 'arrived', 'in_progress'] } }),
      Ride.countDocuments({ status: 'completed' }),
      Ride.countDocuments({ status: 'cancelled' }),
      Payment.aggregate([
        { $match: { status: 'succeeded' } },
        { $group: { _id: null, totalGross: { $sum: '$amount' } } },
      ]),
      Payment.countDocuments({ status: 'failed' }),
      SupportCase.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      Ride.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('passenger', 'name email')
        .populate('driver', 'name email'),
    ]);

    const grossBookingValue = paymentsSummary[0]?.totalGross || 0;
    // Platform commission is ~ 20%
    const platformCommission = Math.round(grossBookingValue * 0.2 * 100) / 100;

    // Daily breakdown for charts (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const dailyTrends = await Ride.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          ridesCount: { $sum: 1 },
          completedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] },
          },
          revenue: { $sum: '$finalFare.total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      totalPassengers,
      totalDrivers,
      pendingDrivers,
      onlineDrivers,
      activeRides,
      completedRides,
      cancelledRides,
      grossBookingValue: Math.round(grossBookingValue * 100) / 100,
      platformCommission,
      paymentFailures,
      openSupportCases,
      dailyTrends,
      recentRides,
    };
  }

  /**
   * Verify or reject driver application
   */
  static async updateDriverVerification(driverProfileId, adminId, { status, rejectionReason = '' }) {
    const profile = await DriverProfile.findById(driverProfileId).populate('user');
    if (!profile) throw new Error('Driver profile not found');

    const oldStatus = profile.verificationStatus;
    profile.verificationStatus = status;
    if (status === 'rejected' || status === 'suspended') {
      profile.rejectionReason = rejectionReason;
      profile.isOnline = false;
      profile.isAvailable = false;
    }
    await profile.save();

    // Sync DriverLocation online / available state
    if (profile.user?._id) {
      await DriverLocation.findOneAndUpdate(
        { driver: profile.user._id },
        { $set: { isOnline: profile.isOnline, isAvailable: profile.isAvailable } }
      );
    }

    await this.logAction({
      actorId: adminId,
      action: `driver_${status}`,
      entityType: 'DriverProfile',
      entityId: profile._id,
      changes: { oldStatus, newStatus: status, rejectionReason },
    });

    return profile;
  }
}
