import { Request, Response } from 'express';
import { Provider } from '../models/Provider';
import { FOUNDERS_MAX_SPOTS, FOUNDERS_PROMO_CODE, FOUNDERS_PRICE_ZAR, FOUNDERS_TRIAL_DAYS } from '@findlocal/shared';

// Validate a promo code and return deal info
export const validatePromoCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.params;
    
    if (!code || code.toUpperCase() !== FOUNDERS_PROMO_CODE) {
      res.status(400).json({ valid: false, message: 'Invalid promo code' });
      return;
    }

    // Count existing founders
    const founderCount = await Provider.countDocuments({ isFounder: true });
    const spotsRemaining = Math.max(0, FOUNDERS_MAX_SPOTS - founderCount);

    if (spotsRemaining <= 0) {
      res.status(400).json({ 
        valid: false, 
        message: 'Sorry, all founding supporter spots have been claimed' 
      });
      return;
    }

    res.json({
      valid: true,
      deal: {
        name: 'Founding Supporter',
        trialDays: FOUNDERS_TRIAL_DAYS,
        trialMonths: Math.round(FOUNDERS_TRIAL_DAYS / 30),
        monthlyPrice: FOUNDERS_PRICE_ZAR,
        regularPrice: 150,
        spotsRemaining,
        totalSpots: FOUNDERS_MAX_SPOTS,
      }
    });
  } catch (error) {
    console.error('Validate promo code error:', error);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
};

// Get founders deal status (public - for landing page)
export const getFoundersDealStatus = async (_req: Request, res: Response): Promise<void> => {
  try {
    const founderCount = await Provider.countDocuments({ isFounder: true });
    const spotsRemaining = Math.max(0, FOUNDERS_MAX_SPOTS - founderCount);

    res.json({
      totalSpots: FOUNDERS_MAX_SPOTS,
      spotsTaken: founderCount,
      spotsRemaining,
      isAvailable: spotsRemaining > 0,
      trialDays: FOUNDERS_TRIAL_DAYS,
      trialMonths: Math.round(FOUNDERS_TRIAL_DAYS / 30),
      monthlyPrice: FOUNDERS_PRICE_ZAR,
      regularPrice: 150,
    });
  } catch (error) {
    console.error('Get founders deal status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
