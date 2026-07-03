import express from 'express';
import { optionalAuthMiddleware } from '../middleware/auth';
import { getMyFlags } from '../controllers/featureFlagsController';

const router = express.Router();

router.get('/mine', optionalAuthMiddleware, getMyFlags);

export default router;
