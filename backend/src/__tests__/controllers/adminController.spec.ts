import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../../middleware/auth';
import { Provider } from '../../models/Provider';
import { User } from '../../models/User';
import { createTestProvider, createFounderProvider } from '../fixtures/providers';
import { createTestUser } from '../fixtures/users';
import { setFounderStatus } from '../../controllers/adminController';

describe('Admin Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;
  let responseJson: jest.Mock;
  let responseStatus: jest.Mock;

  beforeEach(async () => {
    responseJson = jest.fn();
    responseStatus = jest.fn().mockReturnThis();

    mockResponse = {
      json: responseJson,
      status: responseStatus,
    };

    // Create an admin user for req.userId
    const adminUser = await createTestUser({ email: 'admin@example.com' });
    await User.findByIdAndUpdate(adminUser._id, { isAdmin: true });

    mockRequest = {
      params: {},
      body: {},
      userId: adminUser._id.toString(),
    };
  });

  describe('setFounderStatus', () => {
    it('sets a provider as founder', async () => {
      const user = await createTestUser();
      const provider = await createTestProvider({ userId: user._id.toString() });

      mockRequest.params = { id: provider._id.toString() };
      mockRequest.body = { isFounder: true };

      await setFounderStatus(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('set as'),
          provider: expect.objectContaining({
            isFounder: true,
            founderNumber: expect.any(Number),
          }),
        })
      );

      // Verify in database
      const updated = await Provider.findById(provider._id);
      expect(updated!.isFounder).toBe(true);
      expect(updated!.founderNumber).toBe(1);
      expect(updated!.founderSince).toBeDefined();
    });

    it('removes founder status from a provider', async () => {
      const user = await createTestUser();
      const provider = await createFounderProvider(user._id.toString(), 1);

      mockRequest.params = { id: provider._id.toString() };
      mockRequest.body = { isFounder: false };

      await setFounderStatus(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('removed as'),
          provider: expect.objectContaining({
            isFounder: false,
          }),
        })
      );

      // Verify in database
      const updated = await Provider.findById(provider._id);
      expect(updated!.isFounder).toBe(false);
      expect(updated!.founderNumber).toBeUndefined();
    });

    it('returns 400 when isFounder is not a boolean', async () => {
      const user = await createTestUser();
      const provider = await createTestProvider({ userId: user._id.toString() });

      mockRequest.params = { id: provider._id.toString() };
      mockRequest.body = { isFounder: 'yes' };

      await setFounderStatus(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(400);
      expect(responseJson).toHaveBeenCalledWith({ message: 'isFounder must be a boolean' });
    });

    it('returns 404 when provider not found', async () => {
      mockRequest.params = { id: new mongoose.Types.ObjectId().toString() };
      mockRequest.body = { isFounder: true };

      await setFounderStatus(mockRequest as AuthRequest, mockResponse as Response);

      expect(responseStatus).toHaveBeenCalledWith(404);
      expect(responseJson).toHaveBeenCalledWith({ message: 'Provider not found' });
    });

    it('does not re-assign founder if already a founder', async () => {
      const user = await createTestUser();
      const provider = await createFounderProvider(user._id.toString(), 5);

      mockRequest.params = { id: provider._id.toString() };
      mockRequest.body = { isFounder: true };

      await setFounderStatus(mockRequest as AuthRequest, mockResponse as Response);

      // Should succeed without changing founder number
      expect(responseJson).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: expect.objectContaining({
            isFounder: true,
          }),
        })
      );

      const updated = await Provider.findById(provider._id);
      expect(updated!.founderNumber).toBe(5); // unchanged
    });

    it('assigns correct founder number based on existing founders', async () => {
      // Create 3 existing founders
      for (let i = 1; i <= 3; i++) {
        const u = await createTestUser({ email: `founder${i}@example.com` });
        await createFounderProvider(u._id.toString(), i);
      }

      // Now set a new provider as founder
      const user = await createTestUser();
      const provider = await createTestProvider({ userId: user._id.toString() });

      mockRequest.params = { id: provider._id.toString() };
      mockRequest.body = { isFounder: true };

      await setFounderStatus(mockRequest as AuthRequest, mockResponse as Response);

      const updated = await Provider.findById(provider._id);
      expect(updated!.founderNumber).toBe(4);
    });
  });
});
