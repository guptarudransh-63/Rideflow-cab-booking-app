import mongoose from 'mongoose';

const rideEventSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'requested',
        'offered',
        'offer_accepted',
        'offer_rejected',
        'offer_expired',
        'driver_assigned',
        'driver_arrived',
        'trip_started',
        'location_updated',
        'trip_completed',
        'trip_cancelled',
        'payment_processed',
        'rating_submitted',
      ],
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorRole: {
      type: String,
      enum: ['passenger', 'driver', 'admin', 'system'],
      default: 'system',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const RideEvent = mongoose.model('RideEvent', rideEventSchema);
