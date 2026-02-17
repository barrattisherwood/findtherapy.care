import express from 'express';
import { getDashboardMetrics, getPendingProviders, vetProvider, getPendingCount, getAllProviders, suspendProvider, deleteProvider } from '../controllers/adminController';
import { getBlogMetrics } from '../controllers/blogController';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = express.Router();

// Admin dashboard - requires auth + admin
router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardMetrics);
router.get('/blog-metrics', authMiddleware, adminMiddleware, getBlogMetrics);

// Provider vetting - requires auth + admin
router.get('/providers/pending-count', authMiddleware, adminMiddleware, getPendingCount);
router.get('/providers/vetting', authMiddleware, adminMiddleware, getPendingProviders);
router.post('/providers/:id/vet', authMiddleware, adminMiddleware, vetProvider);

// Provider management - requires auth + admin
router.get('/providers', authMiddleware, adminMiddleware, getAllProviders);
router.post('/providers/:id/suspend', authMiddleware, adminMiddleware, suspendProvider);
router.delete('/providers/:id', authMiddleware, adminMiddleware, deleteProvider);

export default router;
