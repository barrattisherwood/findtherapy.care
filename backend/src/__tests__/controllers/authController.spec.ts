import { Request, Response } from 'express';
import crypto from 'crypto';
import { User } from '../../models/User';
import { register, verifyEmail, resendVerification, getCurrentUser } from '../../controllers/authController';
import { AuthRequest } from '../../middleware/auth';

// Mock the email service so the Resend client is never instantiated in tests
jest.mock('../../services/emailService', () => ({
  sendEmailVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  sendNewProviderPendingEmail: jest.fn().mockResolvedValue(undefined),
  sendVettingApprovedEmail: jest.fn().mockResolvedValue(undefined),
  sendVettingRejectedEmail: jest.fn().mockResolvedValue(undefined),
  sendTrialEndingReminderEmail: jest.fn().mockResolvedValue(undefined),
}));

describe('Auth Controller - Email Verification', () => {
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnThis();
    mockResponse = { json: responseJson, status: responseStatus };
  });

  // ─── register ────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('creates user with isEmailVerified false', async () => {
      const req = { body: { email: 'new@example.com', password: 'password123' } } as Request;

      await register(req, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
      const payload = responseJson.mock.calls[0][0];
      expect(payload.user.isEmailVerified).toBe(false);
    });

    it('returns JWT token on successful registration', async () => {
      const req = { body: { email: 'new@example.com', password: 'password123' } } as Request;

      await register(req, mockResponse as Response);

      const payload = responseJson.mock.calls[0][0];
      expect(payload.token).toBeDefined();
      expect(typeof payload.token).toBe('string');
    });

    it('sets emailVerificationToken and expiry on the user document', async () => {
      const req = { body: { email: 'new@example.com', password: 'password123' } } as Request;

      await register(req, mockResponse as Response);

      const user = await User.findOne({ email: 'new@example.com' })
        .select('+emailVerificationToken +emailVerificationExpires');
      expect(user?.emailVerificationToken).toBeDefined();
      expect(user?.emailVerificationExpires).toBeDefined();
      expect(user!.emailVerificationExpires!.getTime()).toBeGreaterThan(Date.now());
    });

    it('returns 400 when email already registered', async () => {
      await User.create({ email: 'taken@example.com', password: 'password123' });
      const req = { body: { email: 'taken@example.com', password: 'password123' } } as Request;

      await register(req, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Email already registered' });
    });

    it('returns 400 when password is too short', async () => {
      const req = { body: { email: 'new@example.com', password: '123' } } as Request;

      await register(req, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
    });
  });

  // ─── verifyEmail ─────────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    const makeUserWithToken = async (expiresIn = 24 * 60 * 60 * 1000) => {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      const user = await User.create({
        email: 'verify@example.com',
        password: 'password123',
        isEmailVerified: false,
        emailVerificationToken: hashedToken,
        emailVerificationExpires: new Date(Date.now() + expiresIn),
      });
      return { user, rawToken };
    };

    it('sets isEmailVerified to true with a valid token', async () => {
      const { rawToken } = await makeUserWithToken();
      const req = { body: { token: rawToken } } as Request;

      await verifyEmail(req, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({ message: 'Email verified successfully' });
      const updated = await User.findOne({ email: 'verify@example.com' });
      expect(updated?.isEmailVerified).toBe(true);
    });

    it('clears the token fields after successful verification', async () => {
      const { rawToken } = await makeUserWithToken();
      const req = { body: { token: rawToken } } as Request;

      await verifyEmail(req, mockResponse as Response);

      const updated = await User.findOne({ email: 'verify@example.com' })
        .select('+emailVerificationToken +emailVerificationExpires');
      expect(updated?.emailVerificationToken).toBeUndefined();
      expect(updated?.emailVerificationExpires).toBeUndefined();
    });

    it('returns 400 for an invalid token', async () => {
      await makeUserWithToken();
      const req = { body: { token: 'totallyinvalidtoken' } } as Request;

      await verifyEmail(req, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Invalid or expired verification link' });
    });

    it('returns 400 for an expired token', async () => {
      const { rawToken } = await makeUserWithToken(-1000); // already expired
      const req = { body: { token: rawToken } } as Request;

      await verifyEmail(req, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Invalid or expired verification link' });
    });

    it('returns 400 when no token provided', async () => {
      const req = { body: {} } as Request;

      await verifyEmail(req, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
    });
  });

  // ─── resendVerification ───────────────────────────────────────────────────────

  describe('resendVerification', () => {
    it('generates a new token for an unverified user', async () => {
      const user = await User.create({
        email: 'unverified@example.com',
        password: 'password123',
        isEmailVerified: false,
      });
      const req = { userId: user._id.toString() } as AuthRequest;

      await resendVerification(req, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({ message: 'Verification email sent' });
      const updated = await User.findById(user._id)
        .select('+emailVerificationToken +emailVerificationExpires');
      expect(updated?.emailVerificationToken).toBeDefined();
      expect(updated!.emailVerificationExpires!.getTime()).toBeGreaterThan(Date.now());
    });

    it('returns 400 if email is already verified', async () => {
      const user = await User.create({
        email: 'verified@example.com',
        password: 'password123',
        isEmailVerified: true,
      });
      const req = { userId: user._id.toString() } as AuthRequest;

      await resendVerification(req, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Email is already verified' });
    });

    it('returns 404 for a non-existent user', async () => {
      const req = { userId: 'aaaaaaaaaaaaaaaaaaaaaaaa' } as AuthRequest;

      await resendVerification(req, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
    });
  });

  // ─── getCurrentUser ───────────────────────────────────────────────────────────

  describe('getCurrentUser', () => {
    it('includes isEmailVerified in the response', async () => {
      const user = await User.create({
        email: 'me@example.com',
        password: 'password123',
        isEmailVerified: true,
      });
      const req = { userId: user._id.toString() } as AuthRequest;

      await getCurrentUser(req, mockResponse as Response);

      const payload = responseJson.mock.calls[0][0];
      expect(payload.user.isEmailVerified).toBe(true);
    });

    it('returns isEmailVerified false for unverified user', async () => {
      const user = await User.create({
        email: 'unverified@example.com',
        password: 'password123',
        isEmailVerified: false,
      });
      const req = { userId: user._id.toString() } as AuthRequest;

      await getCurrentUser(req, mockResponse as Response);

      const payload = responseJson.mock.calls[0][0];
      expect(payload.user.isEmailVerified).toBe(false);
    });
  });
});
