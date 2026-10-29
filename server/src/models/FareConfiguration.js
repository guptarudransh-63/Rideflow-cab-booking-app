import mongoose from 'mongoose';

const fareConfigurationSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ['economy', 'comfort', 'premium', 'xl'],
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    capacity: {
      type: Number,
      required: true,
      default: 4,
    },
    baseFare: {
      type: Number,
      required: true,
      min: 0,
    },
    perKmRate: {
      type: Number,
      required: true,
      min: 0,
    },
    perMinuteRate: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumFare: {
      type: Number,
      required: true,
      min: 0,
    },
    platformFeePercent: {
      type: Number,
      default: 20, // 20% platform commission
      min: 0,
      max: 50,
    },
    surgeMultiplier: {
      type: Number,
      default: 1.0,
      min: 1.0,
      max: 5.0,
    },
    cancellationFee: {
      type: Number,
      default: 5.0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const FareConfiguration = mongoose.model('FareConfiguration', fareConfigurationSchema);
