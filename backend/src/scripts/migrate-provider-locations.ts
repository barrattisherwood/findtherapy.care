/**
 * migrate-provider-locations.ts
 *
 * Migrates existing providers from legacy location { city, postcode } to the
 * new StructuredLocation format.
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/scripts/migrate-provider-locations.ts
 *
 * Safe to re-run — skips providers that already have location.type set.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { SA_CITIES, SA_PROVINCES } from '@findlocal/shared';
import { Provider } from '../models/Provider';

async function migrateLocations() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const providers = await Provider.find({});
  console.log(`Found ${providers.length} providers`);

  let migrated = 0;
  let skipped = 0;
  let failed: string[] = [];

  for (const provider of providers) {
    const loc = provider.location as any;

    // Skip if already migrated
    if (loc?.type) {
      skipped++;
      continue;
    }

    const oldCity: string = (loc?.city ?? '').trim();
    const normalized = oldCity.toLowerCase();

    // Attempt to match against SA cities data
    let matched = SA_CITIES.find(c => {
      if (c.slug === normalized) return true;
      if (c.name.toLowerCase() === normalized) return true;
      if (c.displayName?.toLowerCase() === normalized) return true;
      if (c.aliases?.some(a => a === normalized || normalized.includes(a))) return true;
      return false;
    });

    // Fallback: substring match on name
    if (!matched) {
      matched = SA_CITIES.find(c =>
        normalized.includes(c.slug) ||
        normalized.includes(c.name.toLowerCase()) ||
        c.aliases?.some(a => normalized.includes(a))
      );
    }

    if (!matched) {
      console.warn(`  ✗ Cannot match city "${oldCity}" for provider "${provider.displayName}" (${provider._id}) — flagged for manual review`);
      failed.push(`${provider.displayName} (${provider._id}) — city: "${oldCity}"`);
      continue;
    }

    const province = SA_PROVINCES.find(p => p.slug === matched!.province);
    const cityDisplay = matched.displayName ?? matched.name;
    const provinceDisplay = province?.name ?? '';

    provider.location = {
      type: 'physical',
      province: matched.province,
      provinceDisplay,
      city: matched.slug,
      cityDisplay,
      suburb: undefined,
      fullLocation: `${cityDisplay}, ${provinceDisplay}`,
      shortLocation: cityDisplay,
      searchTerms: [matched.slug, matched.province, ...(matched.aliases ?? [])],
    } as any;

    // Default session formats: assume in-person (providers can update online status themselves)
    if (!(provider as any).sessionFormats) {
      (provider as any).sessionFormats = { inPerson: true, online: false };
    }

    try {
      await provider.save();
      console.log(`  ✓ Migrated "${provider.displayName}" → ${cityDisplay}, ${provinceDisplay}`);
      migrated++;
    } catch (err) {
      console.error(`  ✗ Save failed for "${provider.displayName}":`, err);
      failed.push(`${provider.displayName} (${provider._id}) — save error`);
    }
  }

  console.log('\n── Migration complete ──────────────────────────────');
  console.log(`  Migrated : ${migrated}`);
  console.log(`  Skipped  : ${skipped} (already migrated)`);
  console.log(`  Failed   : ${failed.length}`);

  if (failed.length > 0) {
    console.log('\nProviders needing manual review:');
    failed.forEach(f => console.log(`  - ${f}`));
  }

  await mongoose.disconnect();
}

migrateLocations().catch(err => {
  console.error(err);
  process.exit(1);
});
