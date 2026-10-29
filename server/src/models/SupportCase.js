import mongoose from 'mongoose';

const supportCaseSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    issueType: {
      type: String,
      required: true,
      enum: [
        'fare_dispute',
        'driver_conduct',
        'vehicle_condition',
        'route_issue',
        'lost_item',
        'safety_concern',
        'cancellation_fee_dispute',
        'other',
      ],
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
      index: true,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const SupportCase = mongoose.model('SupportCase', supportCaseSchema);
