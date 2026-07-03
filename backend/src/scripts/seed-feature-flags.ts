import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { FeatureFlag } from '../models/FeatureFlag';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findlocal';

// Admin IDs to allowlist for provider_blog while it's in beta
const ALLOWLISTED_ADMIN_IDS = [
  '697dcddbdd2e9922a3b2ab64', // Barratt
  '698226e7addf6a90e7889b49', // Julia (julia@psychinsight.co.za)
];

async function seedFeatureFlags() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const result = await FeatureFlag.findOneAndUpdate(
    { key: 'provider_blog' },
    {
      $setOnInsert: {
        key: 'provider_blog',
        description: 'Provider-written blog submissions (invitation campaigns, submission form, Claude review workflow)',
        enabled: false,
        allowlistedAdminIds: ALLOWLISTED_ADMIN_IDS,
      },
    },
    { upsert: true, new: true }
  );

  if (result) {
    console.log(`provider_blog flag: ${result.enabled ? 'enabled' : 'disabled'}, allowlisted: [${result.allowlistedAdminIds.join(', ')}]`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

seedFeatureFlags().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
