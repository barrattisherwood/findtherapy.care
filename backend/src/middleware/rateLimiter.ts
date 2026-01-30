import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AuthRequest } from './auth';

/**
 * Rate limiter for checkout endpoint
 * Limits to 5 attempts per 15 minutes per user
 */
export const checkoutRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: { message: 'Too many checkout attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use userId for authenticated requests, fall back to IP
    const authReq = req as AuthRequest;
    return authReq.userId || req.ip || 'unknown';
  },
  skip: () => process.env.NODE_ENV === 'test', // Skip in test environment
});

/**
 * Rate limiter for ITN endpoint
 * High limit as this is called by PayFast servers
 * Primarily for DDoS protection
 */
export const itnRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Skip in test environment
});

/**
 * General API rate limiter
 * Limits to 100 requests per minute per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Skip in test environment
});

/**
 * Auth rate limiter for login/register
 * Limits to 10 attempts per 15 minutes per IP
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: { message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Skip in test environment
});
