import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../middleware/auth';
import { Provider } from '../../models/Provider';
import { User } from '../../models/User';
import {
  createTestProvider,
  createProviderWithActiveSubscription,
  createProviderWithActiveTrial,
} from '../fixtures/providers';
import { createTestUser } from '../fixtures/users';
import {
  setPayFastEnvVars,
  clearPayFastEnvVars,
  createMockITNData,
  generateTestSignature,
} from '../helpers/mockPayFast';

// Import controller functions
import {
  createCheckout,
  handleITN,
  getSubscriptionStatus,
  cancelSubscription,
} from '../../controllers/subscriptionController';

describe('Subscription Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;
  let responseSend: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn();
    responseSend = jest.fn();
    responseStatus = jest.fn().mockReturnThis();

    mockResponse = {
      json: responseJson,
      status: responseStatus,
      send: responseSend,
    };

    mockRequest = {
      body: {},
      userId: undefined,
    };

    // Set PayFast env vars by default
    setPayFastEnvVars();
  });

  afterEach(() => {
    clearPayFastEnvVars();
    jest.resetModules();
  });

  describe('createCheckout', () => {
    it('returns 500 when PayFast is not configured', async () => {
      clearPayFastEnvVars();
      jest.resetModules();

      const { createCheckout: createCheckoutFresh } = await import(
        '../../controllers/subscriptionController'
      );

      const user = await createTestUser();
      mockRequest.userId = user._id.toString();

      await createCheckoutFresh(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(500);
      expect(responseJson).toHaveBeenCalledWith({ message: 'PayFast is not configured' });
    });

    it('returns 400 when user has no provider profile', async () => {
      const user = await createTestUser();
      mockRequest.userId = user._id.toString();

      await createCheckout(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        message: 'Please create a provider profile first',
      });
    });

    it('returns 400 when user already has active subscription', async () => {
      const user = await createTestUser();
      await createProviderWithActiveSubscription(user._id.toString());
      mockRequest.userId = user._id.toString();

      await createCheckout(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        message: 'You already have an active subscription',
      });
    });

    it('returns 404 when user not found', async () => {
      const fakeUserId = new mongoose.Types.ObjectId();
      await createTestProvider({ userId: fakeUserId.toString() });
      mockRequest.userId = fakeUserId.toString();

      await createCheckout(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ message: 'User not found' });
    });

    it('generates unique payment ID with provider ID and timestamp', async () => {
      const user = await createTestUser();
      const provider = await createTestProvider({
        userId: user._id.toString(),
        subscriptionStatus: 'none',
      });
      mockRequest.userId = user._id.toString();

      await createCheckout(mockRequest as AuthRequest, mockResponse as Response);

      // Check that provider was updated with payment ID
      const updatedProvider = await Provider.findById(provider._id);
      expect(updatedProvider?.payfastPaymentId).toMatch(
        new RegExp(`^${provider._id.toString()}_\\d+$`)
      );
    });

    it('returns PayFast URL and form data', async () => {
      const user = await createTestUser();
      await createTestProvider({
        userId: user._id.toString(),
        subscriptionStatus: 'none',
      });
      mockRequest.userId = user._id.toString();

      await createCheckout(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseJson).toHaveBeenCalled();
      const response = responseJson.mock.calls[0][0];
      expect(response.url).toContain('payfast.co.za');
      expect(response.data).toBeDefined();
      expect(response.data.merchant_id).toBeDefined();
      expect(response.data.signature).toBeDefined();
    });

    it('stores payment ID in payfastPaymentId field', async () => {
      const user = await createTestUser();
      const provider = await createTestProvider({
        userId: user._id.toString(),
        subscriptionStatus: 'none',
      });
      mockRequest.userId = user._id.toString();

      await createCheckout(mockRequest as AuthRequest, mockResponse as Response);

      const updatedProvider = await Provider.findById(provider._id);
      expect(updatedProvider?.payfastPaymentId).toBeDefined();
      expect(updatedProvider?.payfastPaymentId).toContain(provider._id.toString());
    });
  });

  describe('handleITN', () => {
    beforeEach(() => {
      // Mock fetch for PayFast validation
      global.fetch = jest.fn().mockResolvedValue({
        text: () => Promise.resolve('VALID'),
      }) as jest.Mock;
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('returns 400 for invalid ITN signature', async () => {
      const itnData = createMockITNData({ signature: 'invalid_signature' });
      mockRequest.body = itnData;

      await handleITN(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseSend).toHaveBeenCalledWith('Invalid ITN');
    });

    it('updates provider subscription on valid COMPLETE status', async () => {
      const user = await createTestUser();
      const provider = await createTestProvider({
        userId: user._id.toString(),
        subscriptionStatus: 'none',
      });

      const paymentId = `${provider._id.toString()}_${Date.now()}`;
      provider.payfastPaymentId = paymentId;
      await provider.save();

      const itnData: Record<string, string> = {
        m_payment_id: paymentId,
        pf_payment_id: '12345',
        payment_status: 'COMPLETE',
        amount_gross: '150.00',
        token: 'subscription_token_123',
      };
      itnData.signature = generateTestSignature(itnData);

      mockRequest.body = itnData;

      await handleITN(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseSend).toHaveBeenCalledWith('OK');

      const updatedProvider = await Provider.findById(provider._id);
      expect(updatedProvider?.subscriptionStatus).toBe('active');
    });

    it('sets subscription end date to 1 month from now', async () => {
      const user = await createTestUser();
      const provider = await createTestProvider({
        userId: user._id.toString(),
        subscriptionStatus: 'none',
      });

      const paymentId = `${provider._id.toString()}_${Date.now()}`;
      provider.payfastPaymentId = paymentId;
      await provider.save();

      const itnData: Record<string, string> = {
        m_payment_id: paymentId,
        pf_payment_id: '12345',
        payment_status: 'COMPLETE',
        amount_gross: '150.00',
      };
      itnData.signature = generateTestSignature(itnData);

      mockRequest.body = itnData;

      const beforeDate = new Date();

      await handleITN(mockRequest as Request, mockResponse as Response);

      const updatedProvider = await Provider.findById(provider._id);
      const endDate = new Date(updatedProvider!.subscriptionEndsAt!);

      // Check end date is approximately 1 month from now
      const expectedMonth = new Date();
      expectedMonth.setMonth(expectedMonth.getMonth() + 1);

      expect(endDate.getMonth()).toBe(expectedMonth.getMonth());
    });

    it('stores subscription token', async () => {
      const user = await createTestUser();
      const provider = await createTestProvider({
        userId: user._id.toString(),
        subscriptionStatus: 'none',
      });

      const paymentId = `${provider._id.toString()}_${Date.now()}`;
      provider.payfastPaymentId = paymentId;
      await provider.save();

      const subscriptionToken = 'subscription_token_abc123';
      const itnData: Record<string, string> = {
        m_payment_id: paymentId,
        pf_payment_id: '12345',
        payment_status: 'COMPLETE',
        amount_gross: '150.00',
        token: subscriptionToken,
      };
      itnData.signature = generateTestSignature(itnData);

      mockRequest.body = itnData;

      await handleITN(mockRequest as Request, mockResponse as Response);

      const updatedProvider = await Provider.findById(provider._id);
      expect(updatedProvider?.payfastSubscriptionToken).toBe(subscriptionToken);
    });

    it('returns 200 OK even when provider not found', async () => {
      const itnData: Record<string, string> = {
        m_payment_id: 'nonexistent_provider_123456789',
        pf_payment_id: '12345',
        payment_status: 'COMPLETE',
        amount_gross: '150.00',
      };
      itnData.signature = generateTestSignature(itnData);

      mockRequest.body = itnData;

      await handleITN(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);
      expect(responseSend).toHaveBeenCalledWith('OK');
    });

    it('handles provider lookup by parsed provider ID from payment ID', async () => {
      const user = await createTestUser();
      const provider = await createTestProvider({
        userId: user._id.toString(),
        subscriptionStatus: 'none',
      });

      // Payment ID contains provider ID but payfastPaymentId not set
      const paymentId = `${provider._id.toString()}_${Date.now()}`;

      const itnData: Record<string, string> = {
        m_payment_id: paymentId,
        pf_payment_id: '12345',
        payment_status: 'COMPLETE',
        amount_gross: '150.00',
      };
      itnData.signature = generateTestSignature(itnData);

      mockRequest.body = itnData;

      await handleITN(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(200);

      const updatedProvider = await Provider.findById(provider._id);
      expect(updatedProvider?.subscriptionStatus).toBe('active');
    });
  });

  describe('getSubscriptionStatus', () => {
    it('returns 404 when provider not found', async () => {
      const user = await createTestUser();
      mockRequest.userId = user._id.toString();

      await getSubscriptionStatus(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Provider not found' });
    });

    it('returns subscription status and dates', async () => {
      const user = await createTestUser();
      const subscriptionEndsAt = new Date();
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);

      await createTestProvider({
        userId: user._id.toString(),
        subscriptionStatus: 'active',
        subscriptionEndsAt,
      });
      mockRequest.userId = user._id.toString();

      await getSubscriptionStatus(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseJson).toHaveBeenCalled();
      const response = responseJson.mock.calls[0][0];
      expect(response.subscriptionStatus).toBe('active');
      expect(response.subscriptionEndsAt).toBeDefined();
    });

    it('includes access status from getProviderAccessStatus', async () => {
      const user = await createTestUser();
      await createProviderWithActiveTrial(user._id.toString(), 30);
      mockRequest.userId = user._id.toString();

      await getSubscriptionStatus(mockRequest as AuthRequest, mockResponse as Response);

      const response = responseJson.mock.calls[0][0];
      expect(response.accessStatus).toBe('trial');
    });

    it('returns trial access status when in trial period', async () => {
      const user = await createTestUser();
      await createProviderWithActiveTrial(user._id.toString(), 60);
      mockRequest.userId = user._id.toString();

      await getSubscriptionStatus(mockRequest as AuthRequest, mockResponse as Response);

      const response = responseJson.mock.calls[0][0];
      expect(response.accessStatus).toBe('trial');
      expect(response.trialEndsAt).toBeDefined();
    });
  });

  describe('cancelSubscription', () => {
    it('returns 404 when provider not found', async () => {
      const user = await createTestUser();
      mockRequest.userId = user._id.toString();

      await cancelSubscription(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Provider not found' });
    });

    it('returns 400 when no active subscription', async () => {
      const user = await createTestUser();
      await createTestProvider({
        userId: user._id.toString(),
        subscriptionStatus: 'none',
      });
      mockRequest.userId = user._id.toString();

      await cancelSubscription(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({
        message: 'No active subscription to cancel',
      });
    });

    it('updates subscription status to canceled', async () => {
      const user = await createTestUser();
      const provider = await createProviderWithActiveSubscription(user._id.toString());
      mockRequest.userId = user._id.toString();

      await cancelSubscription(mockRequest as AuthRequest, mockResponse as Response);

      const updatedProvider = await Provider.findById(provider._id);
      expect(updatedProvider?.subscriptionStatus).toBe('canceled');
    });

    it('returns success message', async () => {
      const user = await createTestUser();
      await createProviderWithActiveSubscription(user._id.toString());
      mockRequest.userId = user._id.toString();

      await cancelSubscription(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith({ message: 'Subscription canceled' });
    });
  });
});
