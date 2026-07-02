import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { FeatureFlag } from '../../models/FeatureFlag';
import { User } from '../../models/User';
import { createTestUser } from '../fixtures/users';
import * as featureFlagService from '../../services/featureFlagService';
import { authMiddleware } from '../../middleware/auth';
import { adminMiddleware } from '../../middleware/admin';
import { listFlags, toggleFlag } from '../../controllers/adminFeatureFlagsController';

const JWT_SECRET = process.env.JWT_SECRET!;
const makeToken = (userId: string) => jwt.sign({ userId }, JWT_SECRET);

const app = express();
app.use(express.json());
app.get('/api/admin/feature-flags', authMiddleware, adminMiddleware, listFlags);
app.patch('/api/admin/feature-flags/:key', authMiddleware, adminMiddleware, toggleFlag);

let adminId: string;
let nonAdminToken: string;
let adminToken: string;

beforeEach(async () => {
  featureFlagService._clearAllCache();

  const admin = await createTestUser({ email: 'admin@test.com' });
  await User.findByIdAndUpdate(admin._id, { isAdmin: true });
  adminId = admin._id.toString();
  adminToken = makeToken(adminId);

  const regular = await createTestUser({ email: 'regular@test.com' });
  nonAdminToken = makeToken(regular._id.toString());
});

// ─── GET /api/admin/feature-flags ────────────────────────────────────────────

describe('GET /api/admin/feature-flags', () => {
  it('returns 401 with no auth token', async () => {
    const res = await request(app).get('/api/admin/feature-flags');
    expect(res.status).toBe(401);
  });

  it('returns 403 for a non-admin user', async () => {
    const res = await request(app)
      .get('/api/admin/feature-flags')
      .set('Authorization', `Bearer ${nonAdminToken}`);
    expect(res.status).toBe(403);
  });

  it('returns empty array when no flags exist', async () => {
    const res = await request(app)
      .get('/api/admin/feature-flags')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.flags).toEqual([]);
  });

  it('returns all flags sorted by key', async () => {
    await FeatureFlag.create({ key: 'zzz_flag', enabled: true });
    await FeatureFlag.create({ key: 'aaa_flag', enabled: false });

    const res = await request(app)
      .get('/api/admin/feature-flags')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.flags).toHaveLength(2);
    expect(res.body.flags[0].key).toBe('aaa_flag');
    expect(res.body.flags[1].key).toBe('zzz_flag');
  });
});

// ─── PATCH /api/admin/feature-flags/:key ─────────────────────────────────────

describe('PATCH /api/admin/feature-flags/:key', () => {
  it('returns 403 for a non-admin user', async () => {
    await FeatureFlag.create({ key: 'provider_blog', enabled: false });

    const res = await request(app)
      .patch('/api/admin/feature-flags/provider_blog')
      .set('Authorization', `Bearer ${nonAdminToken}`)
      .send({ enabled: true });

    expect(res.status).toBe(403);
  });

  it('returns 404 when the flag key does not exist', async () => {
    const res = await request(app)
      .patch('/api/admin/feature-flags/nonexistent_flag')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: true });

    expect(res.status).toBe(404);
  });

  it('updates enabled and sets updatedBy to the requesting admin id', async () => {
    await FeatureFlag.create({ key: 'provider_blog', enabled: false });

    const res = await request(app)
      .patch('/api/admin/feature-flags/provider_blog')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: true });

    expect(res.status).toBe(200);
    expect(res.body.flag.enabled).toBe(true);
    expect(res.body.flag.updatedBy).toBe(adminId);
    expect(res.body.flag.key).toBe('provider_blog');

    const inDb = await FeatureFlag.findOne({ key: 'provider_blog' });
    expect(inDb!.enabled).toBe(true);
    expect(inDb!.updatedBy).toBe(adminId);
  });

  it('invalidates the service cache immediately after toggling', async () => {
    await FeatureFlag.create({ key: 'provider_blog', enabled: false });
    const spy = jest.spyOn(featureFlagService, 'invalidateCache');

    await request(app)
      .patch('/api/admin/feature-flags/provider_blog')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: true });

    expect(spy).toHaveBeenCalledWith('provider_blog');
  });

  it('ignores key changes in the request body', async () => {
    await FeatureFlag.create({ key: 'provider_blog', enabled: false });

    await request(app)
      .patch('/api/admin/feature-flags/provider_blog')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: true, key: 'hacked_key' });

    const inDb = await FeatureFlag.findOne({ key: 'provider_blog' });
    expect(inDb).not.toBeNull();
    const renamed = await FeatureFlag.findOne({ key: 'hacked_key' });
    expect(renamed).toBeNull();
  });

  it('ignores allowlistedAdminIds changes in the request body', async () => {
    const original = ['existing-admin'];
    await FeatureFlag.create({ key: 'provider_blog', enabled: false, allowlistedAdminIds: original });

    await request(app)
      .patch('/api/admin/feature-flags/provider_blog')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ enabled: true, allowlistedAdminIds: ['injected-id'] });

    const inDb = await FeatureFlag.findOne({ key: 'provider_blog' });
    expect(inDb!.allowlistedAdminIds).toEqual(original);
  });
});
