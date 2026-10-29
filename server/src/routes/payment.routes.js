import { Router } from 'express';
import { PaymentController } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { validateBody } from '../middleware/validate.js';
import { paymentIntentSchema, refundSchema } from '../validations/schemas.js';

const router = Router();

// Public webhook route
router.post('/webhook', PaymentController.webhook);

// Authenticated payment operations
router.post('/intent', authenticate, validateBody(paymentIntentSchema), PaymentController.processPayment);
router.get('/:id', authenticate, PaymentController.getPaymentById);
router.post('/:id/refund', authenticate, authorize('admin'), validateBody(refundSchema), PaymentController.refundPayment);

export default router;
