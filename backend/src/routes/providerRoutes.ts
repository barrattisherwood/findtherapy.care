import express from 'express';
import {
  createProvider,
  getMyProvider,
  updateProvider,
  deleteProvider,
  searchProviders,
  getProviderById,
} from '../controllers/providerController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Protected routes (must come before /:id to avoid conflicts)
router.post('/', authMiddleware, createProvider);
router.get('/me', authMiddleware, getMyProvider);
router.put('/me', authMiddleware, updateProvider);
router.delete('/me', authMiddleware, deleteProvider);

// Public routes
router.get('/', searchProviders);
router.get('/:id', getProviderById);

export default router;
