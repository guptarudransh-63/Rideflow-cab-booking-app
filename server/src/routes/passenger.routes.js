import { Router } from 'express';
import { PassengerController } from '../controllers/passenger.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { validateBody } from '../middleware/validate.js';
import {
  estimateSchema,
  createRideSchema,
  cancelRideSchema,
  ratingSchema,
  supportCaseSchema,
} from '../validations/schemas.js';

const router = Router();

// Location Search (available to authenticated users)
router.get('/locations', authenticate, PassengerController.searchLocations);

// Profile
router.get('/profile', authenticate, authorize('passenger', 'admin'), PassengerController.getProfile);
router.patch('/profile', authenticate, authorize('passenger'), PassengerController.updateProfile);

// Rides and Booking
router.get('/rides', authenticate, authorize('passenger', 'admin'), PassengerController.getRides);
router.post('/rides/estimate', authenticate, validateBody(estimateSchema), PassengerController.getEstimate);
router.post('/rides', authenticate, authorize('passenger'), validateBody(createRideSchema), PassengerController.createRide);
router.get('/rides/:id', authenticate, PassengerController.getRideById);
router.post('/rides/:id/cancel', authenticate, validateBody(cancelRideSchema), PassengerController.cancelRide);

// Ratings and Support
router.post('/rides/:id/rating', authenticate, authorize('passenger'), validateBody(ratingSchema), PassengerController.submitRating);
router.post('/rides/:id/support', authenticate, validateBody(supportCaseSchema), PassengerController.reportSupportIssue);

// Payments history
router.get('/payments', authenticate, authorize('passenger'), PassengerController.getPayments);

export default router;
