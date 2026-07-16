import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { FeatureFlag } from '../models/FeatureFlag';

const ALLOWLISTED_ADMIN_IDS = [
  '697dcddbdd2e9922a3b2ab64', // Barratt
  '698226e7addf6a90e7889b49', // Julia (julia@psychinsight.co.za)
];

export async function seedFeatureFlags() {
  await FeatureFlag.findOneAndUpdate(
    { key: 'provider_blog' },
    {
      $setOnInsert: {
        key: 'provider_blog',
        description: 'Provider-written blog submissions (invitation campaigns, submission form, Claude review workflow)',
        enabled: false,
      },
      $set: {
        allowlistedAdminIds: ALLOWLISTED_ADMIN_IDS,
      },
    },
    { upsert: true, new: true }
  );
  console.log('Feature flags seeded.');
}

// Standalone CLI entry point
if (require.main === module) {
  dotenv.config();
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findlocal';

  mongoose.connect(MONGODB_URI)
    .then(() => seedFeatureFlags())
    .then(() => mongoose.disconnect())
    .then(() => console.log('Done.'))
    .catch(err => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
