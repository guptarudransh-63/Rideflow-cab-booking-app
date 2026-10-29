import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(7, 'Invalid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['passenger', 'driver']).default('passenger'),
  // Driver-specific fields when registering as driver:
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().or(z.string().regex(/^\d+$/).transform(Number)).optional(),
  color: z.string().optional(),
  licensePlate: z.string().optional(),
  category: z.enum(['economy', 'comfort', 'premium', 'xl']).optional(),
  capacity: z.number().or(z.string().regex(/^\d+$/).transform(Number)).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const locationPointSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  coordinates: z.array(z.number()).length(2, 'Coordinates must be [longitude, latitude]'),
});

export const estimateSchema = z.object({
  pickup: locationPointSchema,
  destination: locationPointSchema,
});

export const createRideSchema = z.object({
  pickup: locationPointSchema,
  destination: locationPointSchema,
  category: z.enum(['economy', 'comfort', 'premium', 'xl']).default('economy'),
});

export const startRideSchema = z.object({
  pin: z.string().length(4, 'PIN must be a 4-digit numeric string'),
});

export const cancelRideSchema = z.object({
  reason: z.string().default('Trip cancelled by user'),
});

export const updateAvailabilitySchema = z.object({
  isOnline: z.boolean(),
});

export const updateLocationSchema = z.object({
  coordinates: z.array(z.number()).length(2, 'Coordinates must be [longitude, latitude]'),
  heading: z.number().min(0).max(360).optional().default(0),
  speed: z.number().min(0).optional().default(0),
});

export const paymentIntentSchema = z.object({
  rideId: z.string().min(1, 'Ride ID is required'),
  paymentMethod: z.enum(['credit_card', 'apple_pay', 'google_pay', 'cash', 'demo_card']).default('demo_card'),
  idempotencyKey: z.string().min(1, 'Idempotency key is required'),
});

export const refundSchema = z.object({
  amount: z.number().positive().optional(),
  reason: z.string().min(3, 'Refund reason is required'),
});

export const ratingSchema = z.object({
  score: z.number().min(1).max(5),
  comment: z.string().max(500).optional().default(''),
});

export const supportCaseSchema = z.object({
  rideId: z.string().min(1, 'Ride ID is required'),
  issueType: z.enum([
    'fare_dispute',
    'driver_conduct',
    'vehicle_condition',
    'route_issue',
    'lost_item',
    'safety_concern',
    'cancellation_fee_dispute',
    'other',
  ]),
  description: z.string().min(5, 'Please provide more details on the issue'),
});

export const updateDriverStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'suspended', 'pending']),
  rejectionReason: z.string().optional().default(''),
});

export const fareConfigSchema = z.object({
  category: z.enum(['economy', 'comfort', 'premium', 'xl']),
  name: z.string().min(1),
  baseFare: z.number().min(0),
  perKmRate: z.number().min(0),
  perMinuteRate: z.number().min(0),
  minimumFare: z.number().min(0),
  platformFeePercent: z.number().min(0).max(50).default(20),
  surgeMultiplier: z.number().min(1.0).max(5.0).default(1.0),
  cancellationFee: z.number().min(0).default(5.0),
});

export const updateFareConfigSchema = fareConfigSchema.partial();
