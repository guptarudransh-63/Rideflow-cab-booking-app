import mongoose from 'mongoose';

const driverProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    licenseExpiry: {
      type: Date,
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
      index: true,
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      default: null,
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
    currentRide: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      default: null,
      index: true,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    completedTrips: {
      type: Number,
      default: 0,
    },
    documents: [
      {
        type: { type: String, enum: ['license', 'insurance', 'vehicle_registration'] },
        url: { type: String, default: '' },
        status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const DriverProfile = mongoose.model('DriverProfile', driverProfileSchema);
