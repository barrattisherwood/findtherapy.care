import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { FeatureFlag } from '../../models/FeatureFlag';
import { createTestUser } from '../fixtures/users';
import * as featureFlagService from '../../services/featureFlagService';
import { optionalAuthMiddleware } from '../../middleware/auth';
import { getMyFlags } from '../../controllers/featureFlagsController';

const JWT_SECRET = process.env.JWT_SECRET!;
const makeToken = (userId: string) => jwt.sign({ userId }, JWT_SECRET);

const app = express();
app.use(express.json());
app.get('/api/feature-flags/mine', optionalAuthMiddleware, getMyFlags);

beforeEach(() => {
  featureFlagService._clearAllCache();
});

describe('GET /api/feature-flags/mine', () => {
  it('returns empty flags map when no flags exist', async () => {
    const res = await request(app).get('/api/feature-flags/mine');
    expect(res.status).toBe(200);
    expect(res.body.flags).toEqual({});
  });

  it('works without authentication (unauthenticated request)', async () => {
    await FeatureFlag.create({ key: 'provider_blog', enabled: true });

    const res = await request(app).get('/api/feature-flags/mine');

    expect(res.status).toBe(200);
    expect(res.body.flags).toHaveProperty('provider_blog');
  });

  it('returns true for a globally enabled flag regardless of userId', async () => {
    await FeatureFlag.create({ key: 'provider_blog', enabled: true });
    const user = await createTestUser();
    const token = makeToken(user._id.toString());

    const res = await request(app)
      .get('/api/feature-flags/mine')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.flags.provider_blog).toBe(true);
  });

  it('returns false for a disabled flag when user is not allowlisted', async () => {
    const user = await createTestUser();
    await FeatureFlag.create({ key: 'provider_blog', enabled: false, allowlistedAdminIds: ['other-user'] });
    const token = makeToken(user._id.toString());

    const res = await request(app)
      .get('/api/feature-flags/mine')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.flags.provider_blog).toBe(false);
  });

  it('returns true for a disabled flag when user is allowlisted', async () => {
    const user = await createTestUser();
    await FeatureFlag.create({
      key: 'provider_blog',
      enabled: false,
      allowlistedAdminIds: [user._id.toString()],
    });
    const token = makeToken(user._id.toString());

    const res = await request(app)
      .get('/api/feature-flags/mine')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.flags.provider_blog).toBe(true);
  });

  it('does not expose flag metadata (description, allowlistedAdminIds)', async () => {
    await FeatureFlag.create({
      key: 'provider_blog',
      enabled: false,
      description: 'Secret internal description',
      allowlistedAdminIds: ['admin-user-id'],
    });

    const res = await request(app).get('/api/feature-flags/mine');

    expect(res.status).toBe(200);
    const flag = res.body.flags;
    expect(flag).not.toHaveProperty('description');
    expect(flag).not.toHaveProperty('allowlistedAdminIds');
    expect(flag).not.toHaveProperty('_id');
    expect(typeof flag.provider_blog).toBe('boolean');
  });

  it('returns multiple flags evaluated independently', async () => {
    const user = await createTestUser();
    await FeatureFlag.create({ key: 'flag_a', enabled: true });
    await FeatureFlag.create({ key: 'flag_b', enabled: false });
    const token = makeToken(user._id.toString());

    const res = await request(app)
      .get('/api/feature-flags/mine')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.flags.flag_a).toBe(true);
    expect(res.body.flags.flag_b).toBe(false);
  });
});
