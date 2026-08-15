import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Provider } from '../models/Provider';

dotenv.config();

// Providers who registered under the old flow (no document upload) have
// vettingStatus: 'pending' + isPublished: false but zero documents submitted.
// Reset them to 'unverified' so they are prompted to upload documents via
// the new /provider/verify flow.

export async function migrateResetPendingToUnverified(): Promise<{ updatedCount: number }> {
  const result = await Provider.updateMany(
    { isPublished: false, vettingStatus: 'pending' },
    { $set: { vettingStatus: 'unverified' } }
  );
  return { updatedCount: result.modifiedCount };
}

if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findlocal';
  const dryRun = process.argv.includes('--dry-run');
  (async () => {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(MONGODB_URI);
      if (dryRun) {
        const count = await Provider.countDocuments({ isPublished: false, vettingStatus: 'pending' });
        console.log(`Dry run: ${count} provider(s) would be reset from pending → unverified.`);
      } else {
        const { updatedCount } = await migrateResetPendingToUnverified();
        console.log(`Migration complete. Reset ${updatedCount} providers from pending → unverified.`);
      }
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  })();
}
