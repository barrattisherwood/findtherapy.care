import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Provider } from '../models/Provider';

dotenv.config();

export async function migrateVettingStatus(): Promise<{ updatedCount: number }> {
  const result = await Provider.updateMany(
    { isPublished: true, vettingStatus: 'pending' },
    { $set: { vettingStatus: 'approved' } }
  );
  return { updatedCount: result.modifiedCount };
}

if (require.main === module) {
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findlocal';
  (async () => {
    try {
      console.log('Connecting to MongoDB...');
      await mongoose.connect(MONGODB_URI);
      const { updatedCount } = await migrateVettingStatus();
      console.log(`Migration complete. Updated ${updatedCount} providers to vettingStatus=approved.`);
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  })();
}
