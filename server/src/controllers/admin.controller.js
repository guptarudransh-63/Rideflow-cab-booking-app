import { User } from '../models/User.js';
import { DriverProfile } from '../models/DriverProfile.js';
import { Ride } from '../models/Ride.js';
import { Payment } from '../models/Payment.js';
import { SupportCase } from '../models/SupportCase.js';
import { FareConfiguration } from '../models/FareConfiguration.js';
import { AuditLog } from '../models/AuditLog.js';
import { AdminService } from '../services/admin.service.js';

export class AdminController {
  static async getDashboard(req, res, next) {
    try {
      const metrics = await AdminService.getDashboardMetrics();
      return res.status(200).json({ success: true, metrics });
    } catch (err) {
      next(err);
    }
  }

  static async getUsers(req, res, next) {
    try {
      const { role, status, search, page = '1', limit = '15' } = req.query;
      const query = {};

      if (role) query.role = role;
      if (status) query.status = status;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
        ];
      }

      const p = parseInt(page, 10);
      const l = parseInt(limit, 10);

      const [users, total] = await Promise.all([
        User.find(query).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l),
        User.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        users,
        pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateUserStatus(req, res, next) {
    try {
      const { status } = req.body;
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { status } },
        { new: true }
      );

      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      await AdminService.logAction({
        actorId: req.user._id,
        action: `user_status_${status}`,
        entityType: 'User',
        entityId: user._id,
        changes: { status },
      });

      return res.status(200).json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  static async getPendingDrivers(req, res, next) {
    try {
      const pendingDrivers = await DriverProfile.find({ verificationStatus: 'pending' })
        .sort({ createdAt: -1 })
        .populate('user', 'name email phone avatar')
        .populate('vehicle');

      return res.status(200).json({ success: true, drivers: pendingDrivers });
    } catch (err) {
      next(err);
    }
  }

  static async approveDriver(req, res, next) {
    try {
      const profile = await AdminService.updateDriverVerification(
        req.params.id,
        req.user._id,
        { status: 'approved' }
      );

      return res.status(200).json({
        success: true,
        message: 'Driver approved successfully',
        profile,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async rejectDriver(req, res, next) {
    try {
      const { rejectionReason } = req.body;
      const profile = await AdminService.updateDriverVerification(
        req.params.id,
        req.user._id,
        { status: 'rejected', rejectionReason: rejectionReason || 'Document verification failed' }
      );

      return res.status(200).json({
        success: true,
        message: 'Driver application rejected',
        profile,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getRides(req, res, next) {
    try {
      const { status, page = '1', limit = '15' } = req.query;
      const query = status ? { status } : {};

      const p = parseInt(page, 10);
      const l = parseInt(limit, 10);

      const [rides, total] = await Promise.all([
        Ride.find(query)
          .sort({ createdAt: -1 })
          .skip((p - 1) * l)
          .limit(l)
          .populate('passenger', 'name email phone')
          .populate('driver', 'name email phone')
          .populate('vehicle')
          .populate('payment'),
        Ride.countDocuments(query),
      ]);

      return res.status(200).json({
        success: true,
        rides,
        pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getPayments(req, res, next) {
    try {
      const { page = '1', limit = '15' } = req.query;
      const p = parseInt(page, 10);
      const l = parseInt(limit, 10);

      const [payments, total] = await Promise.all([
        Payment.find()
          .sort({ createdAt: -1 })
          .skip((p - 1) * l)
          .limit(l)
          .populate('passenger', 'name email')
          .populate('ride'),
        Payment.countDocuments(),
      ]);

      return res.status(200).json({
        success: true,
        payments,
        pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSupportCases(req, res, next) {
    try {
      const cases = await SupportCase.find()
        .sort({ createdAt: -1 })
        .populate('user', 'name email role')
        .populate('ride');

      return res.status(200).json({ success: true, cases });
    } catch (err) {
      next(err);
    }
  }

  static async updateSupportCase(req, res, next) {
    try {
      const { status, resolutionNotes } = req.body;
      const supportCase = await SupportCase.findByIdAndUpdate(
        req.params.id,
        {
          $set: {
            status,
            resolutionNotes,
            resolvedBy: req.user._id,
          },
        },
        { new: true }
      );

      if (!supportCase) {
        return res.status(404).json({ success: false, message: 'Support case not found' });
      }

      return res.status(200).json({ success: true, supportCase });
    } catch (err) {
      next(err);
    }
  }

  static async getFareConfigurations(req, res, next) {
    try {
      const configs = await FareConfiguration.find().sort({ category: 1 });
      return res.status(200).json({ success: true, configs });
    } catch (err) {
      next(err);
    }
  }

  static async updateFareConfiguration(req, res, next) {
    try {
      const { category } = req.params;
      const updateData = req.body;

      const config = await FareConfiguration.findOneAndUpdate(
        { category },
        { $set: updateData },
        { new: true, upsert: true }
      );

      await AdminService.logAction({
        actorId: req.user._id,
        action: 'update_fare_config',
        entityType: 'FareConfiguration',
        entityId: config._id,
        changes: updateData,
      });

      return res.status(200).json({ success: true, config });
    } catch (err) {
      next(err);
    }
  }

  static async getAuditLogs(req, res, next) {
    try {
      const logs = await AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .populate('actor', 'name email role');

      return res.status(200).json({ success: true, logs });
    } catch (err) {
      next(err);
    }
  }
}
