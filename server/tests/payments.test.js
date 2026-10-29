import { connectDB, disconnectDB } from '../src/config/db.js';
import { User, Ride, Payment } from '../src/models/index.js';
import { PaymentService } from '../src/services/payment.service.js';

let passenger, ride;

beforeAll(async () => {
  await connectDB();

  const pw = await User.hashPassword('testpass123');
  passenger = await User.create({
    name: 'Passenger Pay',
    email: `pass_pay_${Date.now()}@test.com`,
    phone: '+15557770001',
    passwordHash: pw,
    role: 'passenger',
  });

  ride = await Ride.create({
    passenger: passenger._id,
    category: 'economy',
    status: 'completed',
    pickup: { address: 'A', coordinates: [-122.4, 37.7] },
    destination: { address: 'B', coordinates: [-122.41, 37.71] },
    route: { distanceKm: 5, durationMin: 12, polyline: [] },
    fareEstimate: { base: 3.5, distance: 7, duration: 4.2, total: 14.7 },
    finalFare: {
      base: 3.5,
      distance: 7,
      duration: 4.2,
      subtotal: 14.7,
      platformFee: 2.94,
      total: 14.7,
      driverNet: 11.76,
      platformCommission: 2.94,
    },
    pin: '8821',
  });
});

afterAll(async () => {
  await disconnectDB();
});

describe('Payment Engine & Idempotency Tests', () => {
  const idempotencyKey = `IDEMP_KEY_${Date.now()}`;

  it('should process payment and generate receipt', async () => {
    const res = await PaymentService.processPayment({
      rideId: ride._id,
      passengerId: passenger._id,
      amount: 14.7,
      idempotencyKey,
      paymentMethod: 'demo_card',
    });

    expect(res.isDuplicate).toBe(false);
    expect(res.payment.status).toBe('succeeded');
    expect(res.payment.receiptNumber).toMatch(/^RF-RCP-/);

    // Verify ride payment status updated
    const updatedRide = await Ride.findById(ride._id);
    expect(updatedRide.paymentStatus).toBe('paid');
  });

  it('should return existing payment when called with same idempotencyKey (idempotent)', async () => {
    const res = await PaymentService.processPayment({
      rideId: ride._id,
      passengerId: passenger._id,
      amount: 14.7,
      idempotencyKey, // same key!
      paymentMethod: 'demo_card',
    });

    expect(res.isDuplicate).toBe(true);
    expect(res.payment.idempotencyKey).toBe(idempotencyKey);
  });

  it('should process a refund for eligible payment', async () => {
    const payment = await Payment.findOne({ idempotencyKey });
    const refund = await PaymentService.processRefund({
      paymentId: payment._id,
      amount: 14.7,
      reason: 'Disputed fare calculation',
      initiatedBy: passenger._id,
    });

    expect(refund.status).toBe('succeeded');
    expect(refund.amount).toBe(14.7);

    const refundedPayment = await Payment.findById(payment._id);
    expect(refundedPayment.status).toBe('refunded');
  });
});
