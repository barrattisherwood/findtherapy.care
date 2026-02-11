import express from 'express';
import { getDashboardMetrics } from '../controllers/adminController';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = express.Router();

// Admin dashboard - requires auth + admin
router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardMetrics);

export default router;
