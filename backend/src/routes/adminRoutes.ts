import express from 'express';
import { getDashboardMetrics, getPendingProviders, vetProvider, getPendingCount, getAllProviders, suspendProvider, deleteProvider, setFounderStatus } from '../controllers/adminController';
import { adminGetDocument } from '../controllers/providerDocumentController';
import { getBlogMetrics } from '../controllers/blogController';
import { getMessages, markMessageRead, getUnreadCount } from '../controllers/messagesController';
import { getAdminLogs } from '../controllers/adminLogsController';
import { getSentryIssues } from '../controllers/sentryController';
import { getPendingPosts, reviewPost } from '../controllers/adminBlogController';
import { listFlags, toggleFlag } from '../controllers/adminFeatureFlagsController';
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
router.get('/provider/documents/:id', authMiddleware, adminMiddleware, adminGetDocument);

// Provider management - requires auth + admin
router.get('/providers', authMiddleware, adminMiddleware, getAllProviders);
router.post('/providers/:id/suspend', authMiddleware, adminMiddleware, suspendProvider);
router.post('/providers/:id/founder', authMiddleware, adminMiddleware, setFounderStatus);
router.delete('/providers/:id', authMiddleware, adminMiddleware, deleteProvider);

// Messages - requires auth + admin
router.get('/messages/unread-count', authMiddleware, adminMiddleware, getUnreadCount);
router.get('/messages', authMiddleware, adminMiddleware, getMessages);
router.patch('/messages/:id/read', authMiddleware, adminMiddleware, markMessageRead);

// Activity log - requires auth + admin
router.get('/logs', authMiddleware, adminMiddleware, getAdminLogs);

// Sentry issues proxy - requires auth + admin
router.get('/sentry-issues', authMiddleware, adminMiddleware, getSentryIssues);

// Provider blog review - requires auth + admin
router.get('/blog/pending', authMiddleware, adminMiddleware, getPendingPosts);
router.patch('/blog/:id/review', authMiddleware, adminMiddleware, reviewPost);

// Feature flags management - requires auth + admin
router.get('/feature-flags', authMiddleware, adminMiddleware, listFlags);
router.patch('/feature-flags/:key', authMiddleware, adminMiddleware, toggleFlag);

export default router;
