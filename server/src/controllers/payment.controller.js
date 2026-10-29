import { Payment } from '../models/Payment.js';
import { Ride } from '../models/Ride.js';
import { PaymentService } from '../services/payment.service.js';

export class PaymentController {
  static async processPayment(req, res, next) {
    try {
      const { rideId, paymentMethod = 'demo_card', idempotencyKey } = req.body;

      const ride = await Ride.findById(rideId);
      if (!ride) {
        return res.status(404).json({ success: false, message: 'Ride not found' });
      }

      if (ride.passenger.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Unauthorized: Ride does not belong to you' });
      }

      const amountToCharge = ride.finalFare?.total || ride.fareEstimate?.total;
      if (!amountToCharge) {
        return res.status(400).json({ success: false, message: 'No payable fare found on ride' });
      }

      const result = await PaymentService.processPayment({
        rideId: ride._id,
        passengerId: req.user._id,
        amount: amountToCharge,
        idempotencyKey,
        paymentMethod,
        cardLast4: '4242',
      });

      return res.status(200).json({
        success: true,
        message: result.isDuplicate ? 'Payment previously processed' : 'Payment successful',
        isDuplicate: result.isDuplicate,
        payment: result.payment,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async getPaymentById(req, res, next) {
    try {
      const payment = await Payment.findById(req.params.id).populate('ride');
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Payment record not found' });
      }

      if (payment.passenger.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      return res.status(200).json({ success: true, payment });
    } catch (err) {
      next(err);
    }
  }

  static async refundPayment(req, res, next) {
    try {
      const paymentId = req.params.id;
      const { amount, reason } = req.body;

      const refund = await PaymentService.processRefund({
        paymentId,
        amount,
        reason,
        initiatedBy: req.user._id,
      });

      return res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        refund,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }

  static async webhook(req, res) {
    // Webhook endpoint for Stripe or payment provider
    const event = req.body;
    console.log('[Payment Webhook] Received event:', event?.type || 'generic');

    return res.status(200).json({ received: true });
  }
}
