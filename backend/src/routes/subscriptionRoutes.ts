import express from 'express';
import {
  createCheckout,
  handleITN,
  getSubscriptionStatus,
  cancelSubscription,
} from '../controllers/subscriptionController';
import { authMiddleware } from '../middleware/auth';
import { payfastIpWhitelist } from '../middleware/payfastIpWhitelist';
import { checkoutRateLimiter, itnRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// PayFast ITN (Instant Transaction Notification) endpoint - must be public
// Protected by IP whitelist and rate limiting
router.post('/notify', itnRateLimiter, payfastIpWhitelist, handleITN);

// Protected routes
router.post('/create-checkout', authMiddleware, checkoutRateLimiter, createCheckout);
router.get('/status', authMiddleware, getSubscriptionStatus);
router.post('/cancel', authMiddleware, cancelSubscription);

export default router;
