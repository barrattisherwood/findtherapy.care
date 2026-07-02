import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { isEnabledFor } from '../services/featureFlagService';

export function requireFeatureFlag(key: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const enabled = await isEnabledFor(key, req.userId);
    if (!enabled) {
      return res.status(403).json({ error: 'Feature not available' });
    }
    return next();
  };
}
