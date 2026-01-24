import express from 'express';
import {
  createCheckout,
  handleITN,
  getSubscriptionStatus,
  cancelSubscription,
} from '../controllers/subscriptionController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// PayFast ITN (Instant Transaction Notification) endpoint - must be public
router.post('/notify', handleITN);

// Protected routes
router.post('/create-checkout', authMiddleware, createCheckout);
router.get('/status', authMiddleware, getSubscriptionStatus);
router.post('/cancel', authMiddleware, cancelSubscription);

export default router;
