import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { setupSwagger } from './docs/swagger.js';

// Route imports
import authRoutes from './routes/auth.routes.js';
import passengerRoutes from './routes/passenger.routes.js';
import driverRoutes from './routes/driver.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import adminRoutes from './routes/admin.routes.js';

export const createApp = () => {
  const app = express();

  // Helmet with relaxed directives for Swagger and development
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS Configuration
  app.use(
    cors({
      origin: [ENV.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));

  // Swagger Documentation
  setupSwagger(app);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'RideFlow API',
      timestamp: new Date().toISOString(),
      mapProvider: ENV.MAP_PROVIDER,
      paymentMode: ENV.PAYMENT_MODE,
    });
  });

  // Apply general rate limiter
  app.use('/api', apiLimiter);

  // Mount API v1 Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/passenger', passengerRoutes);
  // Also alias /api/v1/rides to passenger routes for clean REST naming
  app.use('/api/v1/rides', passengerRoutes);
  app.use('/api/v1/driver', driverRoutes);
  app.use('/api/v1/payments', paymentRoutes);
  app.use('/api/v1/admin', adminRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Endpoint ${req.originalUrl} not found on RideFlow server`,
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
