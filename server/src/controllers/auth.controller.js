import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { DriverProfile } from '../models/DriverProfile.js';
import { Vehicle } from '../models/Vehicle.js';
import { Ride } from '../models/Ride.js';
import { ENV } from '../config/env.js';

const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN,
  });
};

const sendTokenResponse = (user, statusCode, res, additionalData = {}) => {
  const token = generateToken(user._id, user.role);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: ENV.NODE_ENV === 'production',
    sameSite: 'lax',
  };

  res.cookie(ENV.COOKIE_NAME, token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      ratingAvg: user.ratingAvg,
      status: user.status,
    },
    ...additionalData,
  });
};

export class AuthController {
  static async register(req, res, next) {
    try {
      const {
        name,
        email,
        phone,
        password,
        role = 'passenger',
        licenseNumber,
        licenseExpiry,
        make,
        model,
        year,
        color,
        licensePlate,
        category = 'economy',
        capacity = 4,
      } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists',
        });
      }

      const passwordHash = await User.hashPassword(password);
      const user = await User.create({
        name,
        email,
        phone,
        passwordHash,
        role,
      });

      let driverProfile = null;
      let vehicle = null;

      if (role === 'driver') {
        vehicle = await Vehicle.create({
          driver: user._id,
          make: make || 'Toyota',
          model: model || 'Camry',
          year: year || 2022,
          color: color || 'Silver',
          licensePlate: (licensePlate || `RF-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase(),
          category: category || 'economy',
          capacity: capacity || 4,
        });

        driverProfile = await DriverProfile.create({
          user: user._id,
          licenseNumber: licenseNumber || `DL-${Date.now().toString().slice(-6)}`,
          licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          verificationStatus: 'pending', // Requires admin verification
          vehicle: vehicle._id,
          documents: [
            { type: 'license', status: 'pending' },
            { type: 'vehicle_registration', status: 'pending' },
          ],
        });
      }

      return sendTokenResponse(user, 201, res, {
        driverProfile,
        vehicle,
      });
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      if (user.status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Your account is suspended. Please contact platform support.',
        });
      }

      let driverProfile = null;
      let vehicle = null;

      if (user.role === 'driver') {
        driverProfile = await DriverProfile.findOne({ user: user._id }).populate('vehicle');
        vehicle = driverProfile?.vehicle;
      }

      return sendTokenResponse(user, 200, res, {
        driverProfile,
        vehicle,
      });
    } catch (err) {
      next(err);
    }
  }

  static async logout(req, res) {
    res.clearCookie(ENV.COOKIE_NAME);
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  static async getMe(req, res, next) {
    try {
      const user = req.user;
      let driverProfile = null;
      let vehicle = null;

      if (user.role === 'driver') {
        driverProfile = await DriverProfile.findOne({ user: user._id }).populate('vehicle');
        vehicle = driverProfile?.vehicle;
      }

      // Check for any currently active ride (including recently completed unpaid rides for passengers)
      const activeRide = await Ride.findOne({
        $or: [
          {
            passenger: user._id,
            status: { $in: ['requested', 'offered', 'driver_assigned', 'arrived', 'in_progress'] },
          },
          {
            passenger: user._id,
            status: 'completed',
            paymentStatus: 'unpaid',
          },
          {
            driver: user._id,
            status: { $in: ['driver_assigned', 'arrived', 'in_progress'] },
          },
        ],
      })
        .sort({ updatedAt: -1 })
        .populate('passenger', 'name email phone ratingAvg avatar')
        .populate('driver', 'name email phone ratingAvg avatar')
        .populate('vehicle');

      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          ratingAvg: user.ratingAvg,
          status: user.status,
        },
        driverProfile,
        vehicle,
        activeRide,
      });
    } catch (err) {
      next(err);
    }
  }
}
