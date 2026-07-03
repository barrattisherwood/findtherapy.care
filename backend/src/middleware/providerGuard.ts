import { Response, NextFunction } from 'express';
import { Provider, IProvider } from '../models/Provider';
import { User } from '../models/User';
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
    if (provider) {
      req.provider = provider;
      return next();
    }

    // Admins can access provider routes without a provider profile (for testing)
    const user = await User.findById(req.userId).select('email isAdmin');
    if (user?.isAdmin) {
      req.provider = {
        _id: user._id,
        userId: user._id.toString(),
        displayName: user.email.split('@')[0],
      } as unknown as IProvider;
      return next();
    }

    return res.status(403).json({ message: 'Provider account required' });
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
};
