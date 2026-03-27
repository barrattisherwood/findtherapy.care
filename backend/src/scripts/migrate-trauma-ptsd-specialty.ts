import mongoose from 'mongoose';
import { Provider } from '../models/Provider';
import * as readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const OLD_VALUE = 'Trauma, PTSD & Complex PTSD';
const NEW_VALUES = ['Trauma', 'PTSD & Complex PTSD'];

function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(`${question} (y/N): `, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const dbName = mongoose.connection.db?.databaseName ?? 'unknown';
  console.log(`Connected to MongoDB — database: ${dbName}`);

  // Find all providers that still have the old combined specialty
  const affected = await Provider.find({ specialties: OLD_VALUE }).select('displayName specialties');
  console.log(`\nFound ${affected.length} provider(s) with old combined specialty "${OLD_VALUE}":`);
  affected.forEach(p => console.log(`  - ${p.displayName}`));

  if (affected.length === 0) {
    console.log('Nothing to migrate.');
    await mongoose.disconnect();
    return;
  }

  console.log(`\nWill replace "${OLD_VALUE}" with: ${NEW_VALUES.join(', ')}`);
  const ok = await confirm('\n⚠️  This will modify live data. Proceed?');
  if (!ok) {
    console.log('Aborted.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // For each affected provider: remove old value, add both new values (avoiding duplicates)
  for (const provider of affected) {
    const updatedSpecialties = [
      ...provider.specialties.filter((s: string) => s !== OLD_VALUE),
      ...NEW_VALUES.filter(v => !provider.specialties.includes(v as any)),
    ];

    await Provider.updateOne({ _id: provider._id }, { $set: { specialties: updatedSpecialties } });
    console.log(`✅ Migrated: ${provider.displayName}`);
  }

  // Verify no records remain with the old value
  const remaining = await Provider.countDocuments({ specialties: OLD_VALUE });
  if (remaining === 0) {
    console.log(`\n✅ Verification passed — no providers still reference "${OLD_VALUE}"`);
  } else {
    console.error(`\n❌ Verification failed — ${remaining} provider(s) still have the old value!`);
  }

  console.log('\nMigration complete.');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
