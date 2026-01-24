import express from 'express';
import {
  createSupportGroup,
  updateSupportGroup,
  deleteSupportGroup,
  searchSupportGroups,
  getSupportGroupById,
} from '../controllers/supportGroupController';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware } from '../middleware/admin';

const router = express.Router();

// Public routes
router.get('/', searchSupportGroups);
router.get('/:id', getSupportGroupById);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, createSupportGroup);
router.put('/:id', authMiddleware, adminMiddleware, updateSupportGroup);
router.delete('/:id', authMiddleware, adminMiddleware, deleteSupportGroup);

export default router;
