import mongoose from 'mongoose';

const driverLocationSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    heading: {
      type: Number,
      default: 0,
      min: 0,
      max: 360,
    },
    speed: {
      type: Number,
      default: 0,
    },
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    isAvailable: {
      type: Boolean,
      default: false,
      index: true,
    },
    category: {
      type: String,
      enum: ['economy', 'comfort', 'premium', 'xl'],
      default: 'economy',
      index: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

driverLocationSchema.index({ location: '2dsphere' });

export const DriverLocation = mongoose.model('DriverLocation', driverLocationSchema);
