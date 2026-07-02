import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getAllFlags, updateFlag } from '../models/FeatureFlag';
import { invalidateCache } from '../services/featureFlagService';

export async function listFlags(req: AuthRequest, res: Response) {
  try {
    const flags = await getAllFlags();
    return res.json({ flags });
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function toggleFlag(req: AuthRequest, res: Response) {
  try {
    const { key } = req.params;
    const { enabled } = req.body;

    const updated = await updateFlag(key, { enabled, updatedBy: req.userId });
    if (!updated) {
      return res.status(404).json({ message: 'Feature flag not found' });
    }

    invalidateCache(key);

    return res.json({ flag: updated });
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
}
