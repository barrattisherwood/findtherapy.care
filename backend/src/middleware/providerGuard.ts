import { Response, NextFunction } from 'express';
import { Provider, IProvider } from '../models/Provider';
import { AuthRequest } from './auth';

export interface ProviderAuthRequest extends AuthRequest {
  provider?: IProvider;
}

export const providerGuard = async (
  req: ProviderAuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const provider = await Provider.findOne({ userId: req.userId });
    if (!provider) {
      return res.status(403).json({ message: 'Provider account required' });
    }
    req.provider = provider;
    next();
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};
