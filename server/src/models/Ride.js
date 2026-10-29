import mongoose from 'mongoose';

const locationPointSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    coordinates: {
      type: [Number], // [lng, lat]
      required: true,
    },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
    },
    category: {
      type: String,
      enum: ['economy', 'comfort', 'premium', 'xl'],
      required: true,
      default: 'economy',
      index: true,
    },
    status: {
      type: String,
      enum: [
        'requested',
        'offered',
        'driver_assigned',
        'arrived',
        'in_progress',
        'completed',
        'cancelled',
      ],
      default: 'requested',
      index: true,
    },
    pickup: {
      type: locationPointSchema,
      required: true,
    },
    destination: {
      type: locationPointSchema,
      required: true,
    },
    route: {
      distanceKm: { type: Number, required: true },
      durationMin: { type: Number, required: true },
      polyline: { type: [[Number]], default: [] }, // Array of [lng, lat]
    },
    fareEstimate: {
      base: { type: Number, required: true },
      distance: { type: Number, required: true },
      duration: { type: Number, required: true },
      surgeMultiplier: { type: Number, default: 1.0 },
      platformFee: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    finalFare: {
      base: { type: Number },
      distance: { type: Number },
      duration: { type: Number },
      subtotal: { type: Number },
      platformFee: { type: Number },
      cancellationFee: { type: Number, default: 0 },
      total: { type: Number },
      driverNet: { type: Number },
      platformCommission: { type: Number },
      calculatedAt: { type: Date },
    },
    pin: {
      type: String,
      required: true,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'authorized', 'paid', 'refunded'],
      default: 'unpaid',
      index: true,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    cancellation: {
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['passenger', 'driver', 'admin', 'system'] },
      reason: { type: String, default: '' },
      fee: { type: Number, default: 0 },
      cancelledAt: { type: Date },
    },
    arrivedAt: { type: Date },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

rideSchema.index({ 'pickup.coordinates': '2dsphere' });
rideSchema.index({ status: 1, createdAt: -1 });

export const Ride = mongoose.model('Ride', rideSchema);
