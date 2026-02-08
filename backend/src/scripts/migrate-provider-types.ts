import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Provider } from '../models/Provider';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findlocal';

async function migrateProviderTypes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all 'therapist' -> 'psychologist'
    const result = await Provider.updateMany(
      { type: 'therapist' as any },
      { $set: { type: 'psychologist' } }
    );

    console.log('\n=================================');
    console.log('Migration completed successfully!');
    console.log('=================================');
    console.log(`Updated ${result.modifiedCount} provider(s) from 'therapist' to 'psychologist'`);
    console.log('=================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateProviderTypes();
