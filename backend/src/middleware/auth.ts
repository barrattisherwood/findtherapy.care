import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import * as Sentry from '@sentry/node';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
  userId?: string;
  file?: Express.Multer.File;
}

export const optionalAuthMiddleware = (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
    } catch {
      // Invalid token — treat as unauthenticated
    }
  }
  next();
};

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    req.userId = decoded.userId;
    Sentry.setUser({ id: decoded.userId });
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};
