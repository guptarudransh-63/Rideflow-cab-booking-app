import { v4 as uuidv4 } from 'uuid';
import { Payment } from '../models/Payment.js';
import { Refund } from '../models/Refund.js';
import { Ride } from '../models/Ride.js';
import { ENV } from '../config/env.js';

export class PaymentService {
  /**
   * Process a ride payment idempotently
   */
  static async processPayment({
    rideId,
    passengerId,
    amount,
    currency = 'USD',
    idempotencyKey,
    paymentMethod = 'demo_card',
    cardLast4 = '4242',
  }) {
    // 1. Idempotency check
    const existingPayment = await Payment.findOne({ idempotencyKey });
    if (existingPayment) {
      return {
        payment: existingPayment,
        isDuplicate: true,
      };
    }

    const ride = await Ride.findById(rideId);
    if (!ride) {
      throw new Error('Ride not found');
    }

    if (ride.paymentStatus === 'paid') {
      throw new Error('Ride is already paid');
    }

    const receiptNumber = `RF-RCP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    let providerTransactionId = `SIM_TX_${uuidv4().substring(0, 8)}`;
    let status = 'succeeded';

    // If Stripe mode is enabled and secret key exists
    if (ENV.PAYMENT_MODE === 'stripe' && ENV.STRIPE_SECRET_KEY) {
      // Integration hook for Stripe PaymentIntent
      providerTransactionId = `pi_test_${uuidv4().replace(/-/g, '')}`;
    }

    const payment = await Payment.create({
      ride: rideId,
      passenger: passengerId,
      amount,
      currency,
      provider: ENV.PAYMENT_MODE === 'stripe' ? 'stripe' : 'simulated',
      providerTransactionId,
      status,
      idempotencyKey,
      paymentMethod,
      cardLast4,
      receiptNumber,
    });

    // Mark ride as paid
    ride.paymentStatus = 'paid';
    ride.payment = payment._id;
    await ride.save();

    return {
      payment,
      isDuplicate: false,
    };
  }

  /**
   * Process refund for a payment
   */
  static async processRefund({ paymentId, amount, reason, initiatedBy }) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new Error('Payment record not found');
    }

    if (payment.status !== 'succeeded') {
      throw new Error(`Cannot refund payment with status '${payment.status}'`);
    }

    const refundAmount = amount || payment.amount;

    const refund = await Refund.create({
      payment: payment._id,
      ride: payment.ride,
      amount: refundAmount,
      reason,
      status: 'succeeded',
      providerRefundId: `REF_${uuidv4().substring(0, 8)}`,
      initiatedBy,
    });

    payment.status = 'refunded';
    await payment.save();

    await Ride.findByIdAndUpdate(payment.ride, { paymentStatus: 'refunded' });

    return refund;
  }
}
