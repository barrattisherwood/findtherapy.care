import { FeatureFlag } from '../models/FeatureFlag';

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  flag: { enabled: boolean; allowlistedAdminIds: string[] } | null;
  ts: number;
}

const cache = new Map<string, CacheEntry>();

export async function isEnabledFor(key: string, userId?: string): Promise<boolean> {
  const now = Date.now();
  const cached = cache.get(key);

  let entry: CacheEntry;
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    entry = cached;
  } else {
    const flag = await FeatureFlag.findOne({ key }).select('enabled allowlistedAdminIds');
    entry = {
      flag: flag
        ? { enabled: flag.enabled, allowlistedAdminIds: flag.allowlistedAdminIds }
        : null,
      ts: now,
    };
    cache.set(key, entry);
  }

  if (!entry.flag) return false; // fail closed: unknown key
  if (entry.flag.enabled) return true;
  if (userId && entry.flag.allowlistedAdminIds.includes(userId)) return true;
  return false;
}

export function invalidateCache(key: string): void {
  cache.delete(key);
}

// Exported for testing only — resets all cached entries between test runs.
export function _clearAllCache(): void {
  cache.clear();
}
