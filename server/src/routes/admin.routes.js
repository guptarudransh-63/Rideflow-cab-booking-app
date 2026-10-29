import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/role.js';
import { validateBody } from '../middleware/validate.js';
import {
  updateDriverStatusSchema,
  fareConfigSchema,
  updateFareConfigSchema,
} from '../validations/schemas.js';

const router = Router();

// Restrict all routes to admin
router.use(authenticate, authorize('admin'));

router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.getUsers);
router.patch('/users/:id/status', AdminController.updateUserStatus);

// Driver management
router.get('/drivers/pending', AdminController.getPendingDrivers);
router.post('/drivers/:id/approve', AdminController.approveDriver);
router.post('/drivers/:id/reject', AdminController.rejectDriver);

// Rides & payments inspection
router.get('/rides', AdminController.getRides);
router.get('/payments', AdminController.getPayments);

// Support cases
router.get('/support-cases', AdminController.getSupportCases);
router.patch('/support-cases/:id', AdminController.updateSupportCase);

// Fare pricing rules
router.get('/fare-configurations', AdminController.getFareConfigurations);
router.patch('/fare-configurations/:category', validateBody(updateFareConfigSchema), AdminController.updateFareConfiguration);

// Audit logs
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;
