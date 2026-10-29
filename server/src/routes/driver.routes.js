import { Router } from 'express';
import { DriverController } from '../controllers/driver.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { validateBody } from '../middleware/validate.js';
import {
  updateAvailabilitySchema,
  updateLocationSchema,
  startRideSchema,
} from '../validations/schemas.js';

const router = Router();

// Driver Protected Routes
router.use(authenticate, authorize('driver', 'admin'));

router.get('/profile', DriverController.getProfile);
router.post('/availability', validateBody(updateAvailabilitySchema), DriverController.updateAvailability);
router.post('/location', validateBody(updateLocationSchema), DriverController.updateLocation);

// Ride Offers
router.get('/offers', DriverController.getOffers);
router.post('/offers/:id/accept', DriverController.acceptOffer);
router.post('/offers/:id/reject', DriverController.rejectOffer);

// Ride execution transitions
router.post('/rides/:id/arrived', DriverController.markArrived);
router.post('/rides/:id/start', validateBody(startRideSchema), DriverController.startRide);
router.post('/rides/:id/complete', DriverController.completeRide);

// History and Financials
router.get('/earnings', DriverController.getEarnings);
router.get('/rides', DriverController.getRides);

export default router;
