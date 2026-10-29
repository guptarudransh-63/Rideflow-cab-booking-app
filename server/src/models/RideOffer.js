import mongoose from 'mongoose';

const rideOfferSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
      index: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    responseTime: {
      type: Date,
      default: null,
    },
    distanceToPickupKm: {
      type: Number,
      default: 0,
    },
    estimatedArrivalMin: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

rideOfferSchema.index({ ride: 1, driver: 1 });

export const RideOffer = mongoose.model('RideOffer', rideOfferSchema);
