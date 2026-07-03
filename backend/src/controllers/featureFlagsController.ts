import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getAllFlags } from '../models/FeatureFlag';
import { isEnabledFor } from '../services/featureFlagService';

export async function getMyFlags(req: AuthRequest, res: Response) {
  try {
    const flags = await getAllFlags();
    const result: Record<string, boolean> = {};

    await Promise.all(
      flags.map(async (flag) => {
        result[flag.key] = await isEnabledFor(flag.key, req.userId);
      })
    );

    return res.json({ flags: result });
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
}
