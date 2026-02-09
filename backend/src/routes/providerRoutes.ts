import express from 'express';
import {
  createProvider,
  getMyProvider,
  updateProvider,
  deleteProvider,
  searchProviders,
  getProviderById,
  uploadImageMiddleware,
  uploadProfileImage,
  deleteProfileImage,
} from '../controllers/providerController';
import { contactProvider } from '../controllers/contactController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Protected routes (must come before /:id to avoid conflicts)
router.post('/', authMiddleware, createProvider);
router.get('/me', authMiddleware, getMyProvider);
router.put('/me', authMiddleware, updateProvider);
router.delete('/me', authMiddleware, deleteProvider);

// Image upload routes
router.post('/me/image', authMiddleware, uploadImageMiddleware, uploadProfileImage);
router.delete('/me/image', authMiddleware, deleteProfileImage);

// Public routes
router.get('/', searchProviders);
router.get('/:id', getProviderById);
router.post('/:id/contact', contactProvider);

export default router;
