import { FeatureFlag } from '../../models/FeatureFlag';
import { isEnabledFor, invalidateCache, _clearAllCache } from '../../services/featureFlagService';

beforeEach(() => {
  _clearAllCache();
});

describe('FeatureFlagService — isEnabledFor', () => {

  it('returns true when flag is globally enabled regardless of userId', async () => {
    await FeatureFlag.create({ key: 'ff_on', enabled: true });
    expect(await isEnabledFor('ff_on', 'any-user')).toBe(true);
  });

  it('returns true when flag is disabled but userId is in allowlistedAdminIds', async () => {
    await FeatureFlag.create({
      key: 'ff_allowlist',
      enabled: false,
      allowlistedAdminIds: ['admin-001'],
    });
    expect(await isEnabledFor('ff_allowlist', 'admin-001')).toBe(true);
  });

  it('returns false when flag is disabled and userId is not allowlisted', async () => {
    await FeatureFlag.create({
      key: 'ff_blocked',
      enabled: false,
      allowlistedAdminIds: ['admin-001'],
    });
    expect(await isEnabledFor('ff_blocked', 'other-user')).toBe(false);
  });

  it('returns false when flag is disabled and no userId provided (unauthenticated)', async () => {
    await FeatureFlag.create({
      key: 'ff_nouser',
      enabled: false,
      allowlistedAdminIds: ['admin-001'],
    });
    expect(await isEnabledFor('ff_nouser', undefined)).toBe(false);
  });

  it('returns false for an unknown flag key (fail closed)', async () => {
    expect(await isEnabledFor('nonexistent_flag', 'any-user')).toBe(false);
  });

  it('returns cached result within TTL — only queries DB once for two calls', async () => {
    await FeatureFlag.create({ key: 'ff_cache', enabled: true });
    const spy = jest.spyOn(FeatureFlag, 'findOne');

    await isEnabledFor('ff_cache', 'user-1');
    await isEnabledFor('ff_cache', 'user-1');

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('re-queries DB after TTL of 60 s expires', async () => {
    await FeatureFlag.create({ key: 'ff_ttl', enabled: true });

    // Spy on Date.now only — useFakeTimers freezes MongoDB driver internals and hangs.
    let currentTime = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => currentTime);
    const spy = jest.spyOn(FeatureFlag, 'findOne');

    await isEnabledFor('ff_ttl', 'user-1');
    expect(spy).toHaveBeenCalledTimes(1);

    currentTime += 61_000;

    await isEnabledFor('ff_ttl', 'user-1');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('forces a DB re-query after invalidateCache even within the TTL window', async () => {
    await FeatureFlag.create({ key: 'ff_inv', enabled: true });
    const spy = jest.spyOn(FeatureFlag, 'findOne');

    await isEnabledFor('ff_inv', 'user-1');
    expect(spy).toHaveBeenCalledTimes(1);

    invalidateCache('ff_inv');

    await isEnabledFor('ff_inv', 'user-1');
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
