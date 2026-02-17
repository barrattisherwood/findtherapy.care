import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findlocal';

/**
 * Migration: Convert registrations[] (string array) to professionalBodies[]
 * (structured array) and set vettingStatus = 'approved' for all existing providers.
 *
 * This grandfathers all current providers so they remain visible.
 * New providers after this migration will default to vettingStatus = 'pending'.
 */
async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not established');
    }
    const collection = db.collection('providers');

    // Step 1: Convert registrations[] -> professionalBodies[] for providers that have registrations
    const providersWithRegistrations = await collection.find({
      registrations: { $exists: true, $ne: [] },
    }).toArray();

    let convertedCount = 0;
    for (const doc of providersWithRegistrations) {
      const professionalBodies = (doc.registrations as string[]).map((reg: string) => ({
        body: reg,
        registrationNumber: '', // unknown for existing providers
      }));

      await collection.updateOne(
        { _id: doc._id },
        {
          $set: {
            professionalBodies,
            vettingStatus: 'approved',
          },
          $unset: { registrations: '' },
        }
      );
      convertedCount++;
    }

    console.log(`Converted ${convertedCount} provider(s) with registrations -> professionalBodies`);

    // Step 2: Set vettingStatus = 'approved' for all remaining providers that don't have it yet
    const approvedResult = await collection.updateMany(
      { vettingStatus: { $exists: false } },
      { $set: { vettingStatus: 'approved' } }
    );

    console.log(`Set vettingStatus='approved' for ${approvedResult.modifiedCount} additional provider(s)`);

    // Step 3: Remove registrations field from any remaining docs
    const cleanupResult = await collection.updateMany(
      { registrations: { $exists: true } },
      { $unset: { registrations: '' } }
    );

    console.log(`Cleaned up registrations field from ${cleanupResult.modifiedCount} provider(s)`);

    // Step 4: Ensure professionalBodies exists on all providers (empty array if not set)
    const ensureResult = await collection.updateMany(
      { professionalBodies: { $exists: false } },
      { $set: { professionalBodies: [] } }
    );

    console.log(`Added empty professionalBodies to ${ensureResult.modifiedCount} provider(s)`);

    console.log('\n=================================');
    console.log('Migration completed successfully!');
    console.log('=================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
