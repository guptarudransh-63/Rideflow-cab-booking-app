import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true,
      index: true,
    },
    passenger: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    provider: {
      type: String,
      enum: ['simulated', 'stripe'],
      default: 'simulated',
    },
    providerTransactionId: {
      type: String,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'apple_pay', 'google_pay', 'cash', 'demo_card'],
      default: 'demo_card',
    },
    cardLast4: {
      type: String,
      default: '4242',
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
    },
    errorReason: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

export const Payment = mongoose.model('Payment', paymentSchema);
