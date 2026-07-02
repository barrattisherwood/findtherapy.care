import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { requireFeatureFlag } from '../../middleware/requireFeatureFlag';
import * as featureFlagService from '../../services/featureFlagService';

const mockRes = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnThis();
  return { json, status, res: { json, status } as unknown as Response };
};

const makeReq = (userId?: string): AuthRequest =>
  ({ userId, body: {}, params: {}, headers: {} } as unknown as AuthRequest);

describe('requireFeatureFlag middleware', () => {
  let next: jest.Mock<NextFunction>;

  beforeEach(() => {
    next = jest.fn();
    featureFlagService._clearAllCache();
  });

  it('calls next() when the flag is enabled for the requesting user', async () => {
    jest.spyOn(featureFlagService, 'isEnabledFor').mockResolvedValue(true);
    const { res } = mockRes();

    await requireFeatureFlag('provider_blog')(makeReq('user-123'), res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns 403 when the flag is disabled and user is not allowlisted', async () => {
    jest.spyOn(featureFlagService, 'isEnabledFor').mockResolvedValue(false);
    const { json, status, res } = mockRes();

    await requireFeatureFlag('provider_blog')(makeReq('user-456'), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ error: 'Feature not available' });
  });

  it('passes the req.userId to isEnabledFor', async () => {
    const spy = jest.spyOn(featureFlagService, 'isEnabledFor').mockResolvedValue(true);
    const { res } = mockRes();

    await requireFeatureFlag('provider_blog')(makeReq('my-user-id'), res, next);

    expect(spy).toHaveBeenCalledWith('provider_blog', 'my-user-id');
  });

  it('handles unauthenticated requests (no userId) without throwing', async () => {
    jest.spyOn(featureFlagService, 'isEnabledFor').mockResolvedValue(false);
    const { json, status, res } = mockRes();

    await requireFeatureFlag('provider_blog')(makeReq(undefined), res, next);

    expect(next).not.toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ error: 'Feature not available' });
  });

  it('passes undefined userId to isEnabledFor when request is unauthenticated', async () => {
    const spy = jest.spyOn(featureFlagService, 'isEnabledFor').mockResolvedValue(false);
    const { res } = mockRes();

    await requireFeatureFlag('provider_blog')(makeReq(undefined), res, next);

    expect(spy).toHaveBeenCalledWith('provider_blog', undefined);
  });
});
