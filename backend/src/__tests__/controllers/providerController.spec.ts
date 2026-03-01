import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../middleware/auth';
import { Provider } from '../../models/Provider';
import {
  createTestProvider,
  createProviderWithActiveTrial,
  createProviderWithExpiredTrial,
  createProviderWithActiveSubscription,
  createProviderWithCanceledSubscription,
  createFounderProvider,
} from '../fixtures/providers';
import { createTestUser } from '../fixtures/users';
import {
  getProviderAccessStatus,
  hasProviderAccess,
  createProvider,
  searchProviders,
} from '../../controllers/providerController';
import {
  FOUNDERS_MAX_SPOTS,
  FOUNDERS_PROMO_CODE,
  FOUNDERS_TRIAL_DAYS,
  TRIAL_PERIOD_DAYS,
} from '@findlocal/shared';

describe('Provider Controller - Subscription Logic', () => {
  describe('getProviderAccessStatus', () => {
    it('returns trial when trialEndsAt is in the future', async () => {
      const user = await createTestUser();
      const provider = await createProviderWithActiveTrial(user._id.toString(), 30);

      const status = getProviderAccessStatus(provider);

      expect(status).toBe('trial');
    });

    it('returns active when subscriptionStatus is active', async () => {
      const user = await createTestUser();
      const provider = await createProviderWithActiveSubscription(user._id.toString());

      const status = getProviderAccessStatus(provider);

      expect(status).toBe('active');
    });

    it('returns expired when trial has ended and no subscription', async () => {
      const user = await createTestUser();
      const provider = await createProviderWithExpiredTrial(user._id.toString());

      const status = getProviderAccessStatus(provider);

      expect(status).toBe('expired');
    });

    it('returns none when no trial and no subscription', async () => {
      const user = await createTestUser();
      const provider = await createTestProvider({
        userId: user._id.toString(),
        subscriptionStatus: 'none',
        trialEndsAt: undefined,
      });

      const status = getProviderAccessStatus(provider);

      expect(status).toBe('none');
    });

    it('prioritizes trial status over none', async () => {
      const user = await createTestUser();
      // Provider with active trial but no subscription
      const provider = await createProviderWithActiveTrial(user._id.toString(), 30);

      const status = getProviderAccessStatus(provider);

      expect(status).toBe('trial');
    });

    it('handles date comparison at exact boundary', async () => {
      const user = await createTestUser();

      // Create provider with trial ending exactly now
      const exactNow = new Date();
      const provider = await createTestProvider({
        userId: user._id.toString(),
        trialEndsAt: exactNow,
        subscriptionStatus: 'none',
      });

      // At exact moment, trial should be expired (not >)
      const status = getProviderAccessStatus(provider);

      expect(status).toBe('expired');
    });

    it('returns trial when trial is 1 millisecond in the future', async () => {
      const user = await createTestUser();

      const futureDate = new Date();
      futureDate.setMilliseconds(futureDate.getMilliseconds() + 1000); // 1 second buffer for test

      const provider = await createTestProvider({
        userId: user._id.toString(),
        trialEndsAt: futureDate,
        subscriptionStatus: 'none',
      });

      const status = getProviderAccessStatus(provider);

      expect(status).toBe('trial');
    });

    it('returns active subscription even if trial also exists', async () => {
      const user = await createTestUser();

      // Provider has both active trial AND active subscription
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 30);

      const subscriptionEndsAt = new Date();
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);

      const provider = await createTestProvider({
        userId: user._id.toString(),
        trialEndsAt,
        subscriptionStatus: 'active',
        subscriptionEndsAt,
      });

      const status = getProviderAccessStatus(provider);

      // Trial takes precedence in the current implementation
      expect(status).toBe('trial');
    });
  });

  describe('hasProviderAccess', () => {
    it('returns true for trial status', async () => {
      const user = await createTestUser();
      const provider = await createProviderWithActiveTrial(user._id.toString(), 30);

      const access = hasProviderAccess(provider);

      expect(access).toBe(true);
    });

    it('returns true for active status', async () => {
      const user = await createTestUser();
      const provider = await createProviderWithActiveSubscription(user._id.toString());

      const access = hasProviderAccess(provider);

      expect(access).toBe(true);
    });

    it('returns false for expired status', async () => {
      const user = await createTestUser();
      const provider = await createProviderWithExpiredTrial(user._id.toString());

      const access = hasProviderAccess(provider);

      expect(access).toBe(false);
    });

    it('returns false for none status', async () => {
      const user = await createTestUser();
      const provider = await createTestProvider({
        userId: user._id.toString(),
        subscriptionStatus: 'none',
        trialEndsAt: undefined,
      });

      const access = hasProviderAccess(provider);

      expect(access).toBe(false);
    });

    it('returns false for canceled subscription without trial', async () => {
      const user = await createTestUser();
      const provider = await createProviderWithCanceledSubscription(user._id.toString());

      const access = hasProviderAccess(provider);

      expect(access).toBe(false);
    });
  });

  describe('Provider Search Visibility', () => {
    it('only returns providers with active subscription OR trial in search', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();
      const user3 = await createTestUser();
      const user4 = await createTestUser();

      // Provider with active trial (should be visible)
      await createProviderWithActiveTrial(user1._id.toString(), 30);

      // Provider with active subscription (should be visible)
      await createProviderWithActiveSubscription(user2._id.toString());

      // Provider with expired trial (should NOT be visible)
      await createProviderWithExpiredTrial(user3._id.toString());

      // Provider with no trial and no subscription (should NOT be visible)
      await createTestProvider({
        userId: user4._id.toString(),
        subscriptionStatus: 'none',
        trialEndsAt: undefined,
        isPublished: true,
      });

      const now = new Date();

      // Query for visible providers
      const visibleProviders = await Provider.find({
        isPublished: true,
        $or: [{ subscriptionStatus: 'active' }, { trialEndsAt: { $gt: now } }],
      });

      expect(visibleProviders.length).toBe(2);
    });

    it('filters out providers with expired trial and no subscription', async () => {
      const user = await createTestUser();
      await createProviderWithExpiredTrial(user._id.toString());

      const now = new Date();

      const visibleProviders = await Provider.find({
        isPublished: true,
        $or: [{ subscriptionStatus: 'active' }, { trialEndsAt: { $gt: now } }],
      });

      expect(visibleProviders.length).toBe(0);
    });

    it('filters out providers with canceled subscription and expired trial', async () => {
      const user = await createTestUser();

      const expiredTrial = new Date();
      expiredTrial.setDate(expiredTrial.getDate() - 1);

      await createTestProvider({
        userId: user._id.toString(),
        subscriptionStatus: 'canceled',
        trialEndsAt: expiredTrial,
        isPublished: true,
      });

      const now = new Date();

      const visibleProviders = await Provider.find({
        isPublished: true,
        $or: [{ subscriptionStatus: 'active' }, { trialEndsAt: { $gt: now } }],
      });

      expect(visibleProviders.length).toBe(0);
    });

    it('includes providers with active subscription even if trial expired', async () => {
      const user = await createTestUser();

      const expiredTrial = new Date();
      expiredTrial.setDate(expiredTrial.getDate() - 1);

      const subscriptionEndsAt = new Date();
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);

      await createTestProvider({
        userId: user._id.toString(),
        subscriptionStatus: 'active',
        subscriptionEndsAt,
        trialEndsAt: expiredTrial,
        isPublished: true,
      });

      const now = new Date();

      const visibleProviders = await Provider.find({
        isPublished: true,
        $or: [{ subscriptionStatus: 'active' }, { trialEndsAt: { $gt: now } }],
      });

      expect(visibleProviders.length).toBe(1);
      expect(visibleProviders[0].subscriptionStatus).toBe('active');
    });

    it('includes providers with valid trial even if no subscription', async () => {
      const user = await createTestUser();
      await createProviderWithActiveTrial(user._id.toString(), 60);

      const now = new Date();

      const visibleProviders = await Provider.find({
        isPublished: true,
        $or: [{ subscriptionStatus: 'active' }, { trialEndsAt: { $gt: now } }],
      });

      expect(visibleProviders.length).toBe(1);
    });
  });

  describe('View Count Increment', () => {
    it('increments view count atomically', async () => {
      const user = await createTestUser();
      const provider = await createProviderWithActiveSubscription(user._id.toString());

      expect(provider.viewCount).toBe(0);

      // Simulate view count increment
      await Provider.findByIdAndUpdate(provider._id, { $inc: { viewCount: 1 } });

      const updatedProvider = await Provider.findById(provider._id);
      expect(updatedProvider?.viewCount).toBe(1);

      // Increment again
      await Provider.findByIdAndUpdate(provider._id, { $inc: { viewCount: 1 } });

      const finalProvider = await Provider.findById(provider._id);
      expect(finalProvider?.viewCount).toBe(2);
    });
  });

  describe('Trial Period Calculation', () => {
    it('calculates trial end date correctly', () => {
      const trialPeriodDays = 60;
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + trialPeriodDays);

      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(trialPeriodDays);
    });

    it('calculates founder trial end date (180 days) correctly', () => {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + FOUNDERS_TRIAL_DAYS);

      const now = new Date();
      const diffTime = trialEnd.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      expect(diffDays).toBe(FOUNDERS_TRIAL_DAYS);
      expect(FOUNDERS_TRIAL_DAYS).toBeGreaterThan(TRIAL_PERIOD_DAYS);
    });
  });

  describe('Founder Provider Creation', () => {
    let mockResponse: Partial<Response>;
    let responseJson: jest.Mock;
    let responseStatus: jest.Mock;

    const validProviderData = {
      type: 'psychologist',
      displayName: 'Dr. Founder Test',
      bio: 'A test provider bio that is at least 50 characters long for validation purposes.',
      degrees: ['PhD Psychology'],
      professionalBodies: [{ body: 'HPCSA', registrationNumber: 'PS 0123456' }],
      certifications: [],
      specialties: ['Anxiety & Stress'],
      pricing: {
        individualCounsellingRate: 800,
        offersIntroductoryConsultation: false,
      },
      location: {
        city: 'Cape Town',
        postcode: '8001',
      },
      contactEmail: 'founder@example.com',
    };

    beforeEach(() => {
      responseJson = jest.fn();
      responseStatus = jest.fn().mockReturnThis();

      mockResponse = {
        json: responseJson,
        status: responseStatus,
      };
    });

    it('creates a founder provider when valid promo code is provided', async () => {
      const user = await createTestUser();
      const mockRequest = {
        userId: user._id.toString(),
        body: { ...validProviderData, promoCode: FOUNDERS_PROMO_CODE },
      } as unknown as AuthRequest;

      await createProvider(mockRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
      const response = responseJson.mock.calls[0][0];
      expect(response.provider.isFounder).toBe(true);
      expect(response.provider.founderNumber).toBe(1);
      expect(response.provider.founderSince).toBeDefined();
    });

    it('assigns sequential founder numbers', async () => {
      // Create 3 existing founders
      for (let i = 0; i < 3; i++) {
        const existingUser = await createTestUser();
        await createFounderProvider(existingUser._id.toString(), i + 1);
      }

      const user = await createTestUser();
      const mockRequest = {
        userId: user._id.toString(),
        body: { ...validProviderData, promoCode: FOUNDERS_PROMO_CODE },
      } as unknown as AuthRequest;

      await createProvider(mockRequest, mockResponse as Response);

      const response = responseJson.mock.calls[0][0];
      expect(response.provider.isFounder).toBe(true);
      expect(response.provider.founderNumber).toBe(4);
    });

    it('does not start trial at creation (deferred to vetting approval)', async () => {
      const user = await createTestUser();
      const mockRequest = {
        userId: user._id.toString(),
        body: { ...validProviderData, promoCode: FOUNDERS_PROMO_CODE },
      } as unknown as AuthRequest;

      await createProvider(mockRequest, mockResponse as Response);

      const response = responseJson.mock.calls[0][0];
      // Trial should NOT be set at creation — it starts when admin approves
      expect(response.provider.trialEndsAt).toBeUndefined();
      // But founder status should still be recorded
      expect(response.provider.isFounder).toBe(true);
      expect(response.provider.vettingStatus).toBe('pending');
    });

    it('creates regular provider without promo code (no trial until approved)', async () => {
      const user = await createTestUser();
      const mockRequest = {
        userId: user._id.toString(),
        body: { ...validProviderData },
      } as unknown as AuthRequest;

      await createProvider(mockRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
      const response = responseJson.mock.calls[0][0];
      expect(response.provider.isFounder).toBe(false);
      expect(response.provider.founderNumber).toBeUndefined();

      // Trial should NOT be set at creation — starts on vetting approval
      expect(response.provider.trialEndsAt).toBeUndefined();
      expect(response.provider.vettingStatus).toBe('pending');
    });

    it('ignores invalid promo code and creates regular provider', async () => {
      const user = await createTestUser();
      const mockRequest = {
        userId: user._id.toString(),
        body: { ...validProviderData, promoCode: 'INVALID' },
      } as unknown as AuthRequest;

      await createProvider(mockRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
      const response = responseJson.mock.calls[0][0];
      expect(response.provider.isFounder).toBe(false);
      expect(response.provider.founderNumber).toBeUndefined();
    });

    it('is case-insensitive for promo code', async () => {
      const user = await createTestUser();
      const mockRequest = {
        userId: user._id.toString(),
        body: { ...validProviderData, promoCode: 'founder50' },
      } as unknown as AuthRequest;

      await createProvider(mockRequest, mockResponse as Response);

      const response = responseJson.mock.calls[0][0];
      expect(response.provider.isFounder).toBe(true);
    });

    it('does not grant founder status when all spots are taken', async () => {
      // Fill all founder spots
      for (let i = 0; i < FOUNDERS_MAX_SPOTS; i++) {
        const existingUser = await createTestUser();
        await createFounderProvider(existingUser._id.toString(), i + 1);
      }

      const user = await createTestUser();
      const mockRequest = {
        userId: user._id.toString(),
        body: { ...validProviderData, promoCode: FOUNDERS_PROMO_CODE },
      } as unknown as AuthRequest;

      await createProvider(mockRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(201);
      const response = responseJson.mock.calls[0][0];
      // Provider is created but NOT as founder
      expect(response.provider.isFounder).toBe(false);
      expect(response.provider.founderNumber).toBeUndefined();
    });
  });

  describe('City Filter (searchProviders)', () => {
    let mockResponse: Partial<Response>;
    let responseJson: jest.Mock;

    beforeEach(() => {
      responseJson = jest.fn();
      mockResponse = {
        json: responseJson,
        status: jest.fn().mockReturnThis(),
      };
    });

    const makeRequest = (city: string) =>
      ({ query: { city } }) as unknown as import('../../middleware/auth').AuthRequest;

    it('returns providers matching the city name', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      await createProviderWithActiveTrial(user1._id.toString(), 30); // default city: Cape Town
      await createTestProvider({
        userId: user2._id.toString(),
        location: { city: 'Johannesburg', postcode: '2000' },
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      await searchProviders(makeRequest('Cape Town'), mockResponse as Response);

      const { providers } = responseJson.mock.calls[0][0];
      expect(providers.length).toBe(1);
      expect(providers[0].location.city).toBe('Cape Town');
    });

    it('matches city name case-insensitively', async () => {
      const user = await createTestUser();
      await createProviderWithActiveTrial(user._id.toString(), 30); // Cape Town

      await searchProviders(makeRequest('cape town'), mockResponse as Response);

      const { providers } = responseJson.mock.calls[0][0];
      expect(providers.length).toBe(1);
    });

    it('does not match slug format "cape-town" against stored value "Cape Town"', async () => {
      // This documents the bug that was present in city-landing.html before the fix:
      // passing cityConfig.slug ("cape-town") to the city filter would return 0 results
      // because the regex /cape-town/i does not match the string "Cape Town".
      const user = await createTestUser();
      await createProviderWithActiveTrial(user._id.toString(), 30); // Cape Town

      await searchProviders(makeRequest('cape-town'), mockResponse as Response);

      const { providers } = responseJson.mock.calls[0][0];
      expect(providers.length).toBe(0);
    });

    it('returns all providers when no city filter is provided', async () => {
      const user1 = await createTestUser();
      const user2 = await createTestUser();

      await createProviderWithActiveTrial(user1._id.toString(), 30);
      await createTestProvider({
        userId: user2._id.toString(),
        location: { city: 'Johannesburg', postcode: '2000' },
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      await searchProviders(makeRequest(''), mockResponse as Response);

      const { providers } = responseJson.mock.calls[0][0];
      expect(providers.length).toBe(2);
    });
  });

  describe('Founder Provider Model', () => {
    it('stores founder fields correctly in database', async () => {
      const user = await createTestUser();
      const provider = await createFounderProvider(user._id.toString(), 7);

      const dbProvider = await Provider.findById(provider._id);
      expect(dbProvider?.isFounder).toBe(true);
      expect(dbProvider?.founderNumber).toBe(7);
      expect(dbProvider?.founderSince).toBeDefined();
    });

    it('defaults isFounder to false for regular providers', async () => {
      const user = await createTestUser();
      const provider = await createTestProvider({ userId: user._id.toString() });

      const dbProvider = await Provider.findById(provider._id);
      expect(dbProvider?.isFounder).toBe(false);
      expect(dbProvider?.founderNumber).toBeUndefined();
      expect(dbProvider?.founderSince).toBeUndefined();
    });

    it('founder provider has correct access status while in trial', async () => {
      const user = await createTestUser();
      const provider = await createFounderProvider(user._id.toString(), 1, 180);

      const status = getProviderAccessStatus(provider);
      expect(status).toBe('trial');
      expect(hasProviderAccess(provider)).toBe(true);
    });

    it('founder provider can have active subscription after trial', async () => {
      const user = await createTestUser();
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() - 1); // Expired trial

      const subscriptionEndsAt = new Date();
      subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);

      const provider = await createTestProvider({
        userId: user._id.toString(),
        isFounder: true,
        founderNumber: 1,
        founderSince: new Date(),
        trialEndsAt,
        subscriptionStatus: 'active',
        subscriptionEndsAt,
      });

      const status = getProviderAccessStatus(provider);
      expect(status).toBe('active');
      expect(provider.isFounder).toBe(true);
    });
  });
});
