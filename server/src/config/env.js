import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5001', 10),
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rideflow',
  JWT_SECRET: process.env.JWT_SECRET || 'rideflow-super-secret-jwt-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_NAME: 'rideflow_token',
  MAP_PROVIDER: process.env.MAP_PROVIDER || 'simulation', // 'simulation' | 'google' | 'mapbox'
  MAP_API_KEY: process.env.MAP_API_KEY || '',
  PAYMENT_MODE: process.env.PAYMENT_MODE || 'development', // 'development' | 'stripe'
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  DISPATCH_RADIUS_KM: parseFloat(process.env.DISPATCH_RADIUS_KM || '15'),
  OFFER_TIMEOUT_SEC: parseInt(process.env.OFFER_TIMEOUT_SEC || '25', 10),
  LOCATION_THROTTLE_MS: parseInt(process.env.LOCATION_THROTTLE_MS || '1500', 10),
};
