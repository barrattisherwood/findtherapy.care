import { Request, Response } from 'express';
import { Provider } from '../../models/Provider';
import { createTestProvider, createFounderProvider } from '../fixtures/providers';
import { createTestUser } from '../fixtures/users';
import { validatePromoCode, getFoundersDealStatus } from '../../controllers/promoController';
import {
  FOUNDERS_MAX_SPOTS,
  FOUNDERS_PROMO_CODE,
  FOUNDERS_PRICE_ZAR,
  FOUNDERS_TRIAL_DAYS,
} from '@findlocal/shared';

describe('Promo Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(() => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnThis();

    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };

    mockRequest = {
      params: {},
    };
  });

  describe('validatePromoCode', () => {
    it('returns valid for correct FOUNDER50 code', async () => {
      mockRequest.params = { code: FOUNDERS_PROMO_CODE };

      await validatePromoCode(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalled();
      const response = responseJson.mock.calls[0][0];
      expect(response.valid).toBe(true);
      expect(response.deal).toBeDefined();
      expect(response.deal.name).toBe('Founding Supporter');
      expect(response.deal.monthlyPrice).toBe(FOUNDERS_PRICE_ZAR);
      expect(response.deal.trialDays).toBe(FOUNDERS_TRIAL_DAYS);
      expect(response.deal.totalSpots).toBe(FOUNDERS_MAX_SPOTS);
    });

    it('is case-insensitive for promo code', async () => {
      mockRequest.params = { code: 'founder50' };

      await validatePromoCode(mockRequest as Request, mockResponse as Response);

      const response = responseJson.mock.calls[0][0];
      expect(response.valid).toBe(true);
    });

    it('returns invalid for wrong promo code', async () => {
      mockRequest.params = { code: 'INVALIDCODE' };

      await validatePromoCode(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      const response = responseJson.mock.calls[0][0];
      expect(response.valid).toBe(false);
      expect(response.message).toBe('Invalid promo code');
    });

    it('returns invalid for empty code', async () => {
      mockRequest.params = { code: '' };

      await validatePromoCode(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      const response = responseJson.mock.calls[0][0];
      expect(response.valid).toBe(false);
    });

    it('returns correct spots remaining', async () => {
      // Create 5 existing founder providers
      for (let i = 0; i < 5; i++) {
        const user = await createTestUser();
        await createFounderProvider(user._id.toString(), i + 1);
      }

      mockRequest.params = { code: FOUNDERS_PROMO_CODE };

      await validatePromoCode(mockRequest as Request, mockResponse as Response);

      const response = responseJson.mock.calls[0][0];
      expect(response.valid).toBe(true);
      expect(response.deal.spotsRemaining).toBe(FOUNDERS_MAX_SPOTS - 5);
    });

    it('returns invalid when all spots are taken', async () => {
      // Create max founders
      for (let i = 0; i < FOUNDERS_MAX_SPOTS; i++) {
        const user = await createTestUser();
        await createFounderProvider(user._id.toString(), i + 1);
      }

      mockRequest.params = { code: FOUNDERS_PROMO_CODE };

      await validatePromoCode(mockRequest as Request, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      const response = responseJson.mock.calls[0][0];
      expect(response.valid).toBe(false);
      expect(response.message).toContain('all founding supporter spots');
    });

    it('includes regular price for comparison', async () => {
      mockRequest.params = { code: FOUNDERS_PROMO_CODE };

      await validatePromoCode(mockRequest as Request, mockResponse as Response);

      const response = responseJson.mock.calls[0][0];
      expect(response.deal.regularPrice).toBe(150);
      expect(response.deal.monthlyPrice).toBeLessThan(response.deal.regularPrice);
    });
  });

  describe('getFoundersDealStatus', () => {
    it('returns deal status with correct initial values', async () => {
      await getFoundersDealStatus(mockRequest as Request, mockResponse as Response);

      expect(responseJson).toHaveBeenCalled();
      const response = responseJson.mock.calls[0][0];
      expect(response.totalSpots).toBe(FOUNDERS_MAX_SPOTS);
      expect(response.spotsTaken).toBe(0);
      expect(response.spotsRemaining).toBe(FOUNDERS_MAX_SPOTS);
      expect(response.isAvailable).toBe(true);
      expect(response.monthlyPrice).toBe(FOUNDERS_PRICE_ZAR);
      expect(response.regularPrice).toBe(150);
      expect(response.trialDays).toBe(FOUNDERS_TRIAL_DAYS);
    });

    it('reflects spots taken correctly', async () => {
      // Create 10 founders
      for (let i = 0; i < 10; i++) {
        const user = await createTestUser();
        await createFounderProvider(user._id.toString(), i + 1);
      }

      await getFoundersDealStatus(mockRequest as Request, mockResponse as Response);

      const response = responseJson.mock.calls[0][0];
      expect(response.spotsTaken).toBe(10);
      expect(response.spotsRemaining).toBe(FOUNDERS_MAX_SPOTS - 10);
      expect(response.isAvailable).toBe(true);
    });

    it('returns isAvailable false when all spots taken', async () => {
      // Create max founders
      for (let i = 0; i < FOUNDERS_MAX_SPOTS; i++) {
        const user = await createTestUser();
        await createFounderProvider(user._id.toString(), i + 1);
      }

      await getFoundersDealStatus(mockRequest as Request, mockResponse as Response);

      const response = responseJson.mock.calls[0][0];
      expect(response.spotsTaken).toBe(FOUNDERS_MAX_SPOTS);
      expect(response.spotsRemaining).toBe(0);
      expect(response.isAvailable).toBe(false);
    });

    it('does not count non-founder providers', async () => {
      // Create regular providers
      for (let i = 0; i < 5; i++) {
        const user = await createTestUser();
        await createTestProvider({ userId: user._id.toString() });
      }

      // Create 2 founder providers
      for (let i = 0; i < 2; i++) {
        const user = await createTestUser();
        await createFounderProvider(user._id.toString(), i + 1);
      }

      await getFoundersDealStatus(mockRequest as Request, mockResponse as Response);

      const response = responseJson.mock.calls[0][0];
      expect(response.spotsTaken).toBe(2);
      expect(response.spotsRemaining).toBe(FOUNDERS_MAX_SPOTS - 2);
    });
  });
});
