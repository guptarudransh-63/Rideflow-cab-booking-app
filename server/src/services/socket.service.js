import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { User } from '../models/User.js';
import { DriverProfile } from '../models/DriverProfile.js';
import { DriverLocation } from '../models/DriverLocation.js';
import { Ride } from '../models/Ride.js';

let ioInstance = null;

export const initSocket = (io) => {
  ioInstance = io;

  // Authentication Middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      
      // Also check cookies in headers if token not in auth
      if (!token && socket.handshake.headers?.cookie) {
        const cookies = socket.handshake.headers.cookie.split(';');
        const tokenCookie = cookies.find((c) => c.trim().startsWith(`${ENV.COOKIE_NAME}=`));
        if (tokenCookie) {
          token = tokenCookie.split('=')[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication required for socket connection'));
      }

      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');

      if (!user || user.status === 'suspended') {
        return next(new Error('User account not found or suspended'));
      }

      socket.user = user;
      next();
    } catch (err) {
      return next(new Error(`Socket authentication failed: ${err.message}`));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    const userId = user._id.toString();

    // Join personal user room
    socket.join(`user:${userId}`);

    // If driver, join driver room
    if (user.role === 'driver') {
      socket.join(`driver:${userId}`);
    }

    // Auto-join active ride room if any
    try {
      const activeRide = await Ride.findOne({
        $or: [{ passenger: userId }, { driver: userId }],
        status: { $in: ['offered', 'driver_assigned', 'arrived', 'in_progress'] },
      });

      if (activeRide) {
        socket.join(`ride:${activeRide._id.toString()}`);
      }
    } catch (e) {
      console.error('Error auto-joining active ride room:', e);
    }

    // Handle Driver Live Location Updates
    let lastLocationUpdate = 0;
    socket.on('driver:update_location', async (data) => {
      try {
        if (user.role !== 'driver') return;

        const now = Date.now();
        if (now - lastLocationUpdate < ENV.LOCATION_THROTTLE_MS) {
          return; // Throttled
        }
        lastLocationUpdate = now;

        const { coordinates, heading = 0, speed = 0, rideId } = data;
        if (!coordinates || coordinates.length !== 2) return;

        // Upsert DriverLocation
        await DriverLocation.findOneAndUpdate(
          { driver: userId },
          {
            location: { type: 'Point', coordinates },
            heading,
            speed,
            lastUpdated: new Date(),
          },
          { upsert: true, new: true }
        );

        // If currently on an active ride, broadcast to that ride room
        if (rideId) {
          io.to(`ride:${rideId}`).emit('ride:driver_location', {
            driverId: userId,
            coordinates,
            heading,
            speed,
            timestamp: now,
          });
        }
      } catch (err) {
        console.error('Error updating driver location:', err.message);
      }
    });

    // Join specific ride room explicitly
    socket.on('ride:join', async ({ rideId }) => {
      if (!rideId) return;
      try {
        const ride = await Ride.findById(rideId);
        if (!ride) return;

        // Verify authorization
        const isParticipant =
          ride.passenger.toString() === userId ||
          (ride.driver && ride.driver.toString() === userId) ||
          user.role === 'admin';

        if (isParticipant) {
          socket.join(`ride:${rideId}`);
        }
      } catch (err) {
        console.error('Error joining ride room:', err.message);
      }
    });

    socket.on('disconnect', () => {
      // Client disconnected
    });
  });

  return io;
};

export const getIO = () => {
  return ioInstance;
};
