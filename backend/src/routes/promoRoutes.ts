import express from 'express';
import { validatePromoCode, getFoundersDealStatus } from '../controllers/promoController';

const router = express.Router();

// Public routes
router.get('/founders-deal', getFoundersDealStatus);
router.get('/validate/:code', validatePromoCode);

export default router;
