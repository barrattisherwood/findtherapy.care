import express from 'express';
import { register, login, getCurrentUser, forgotPassword, resetPassword, verifyEmail, resendVerification } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Public routes (rate limited)
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/verify-email', authRateLimiter, verifyEmail);
router.post('/resend-verification', authRateLimiter, resendVerification);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);

// Protected routes
router.get('/me', authMiddleware, getCurrentUser);

export default router;
