import mongoose from 'mongoose';
import { Provider } from '../models/Provider';
import * as readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

// Providers to strip founder status from — matched by partial display name (case-insensitive)
const REMOVE_FOUNDERS = ['steyn', 'zanel'];

function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(`${question} (y/N): `, answer => {
      rl.close();
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
}

async function fixFounders() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const dbName = mongoose.connection.db?.databaseName ?? 'unknown';
  console.log(`Connected to MongoDB — database: ${dbName}`);

  // Show current state first
  const allFounders = await Provider.find({ isFounder: true }).select('displayName founderNumber vettingStatus').sort({ founderNumber: 1 });
  console.log('\nCurrent founders in DB:');
  allFounders.forEach((f: any) => console.log(`  #${f.founderNumber}  ${f.displayName}  (vetting: ${f.vettingStatus})`));

  // Preview what will be changed
  console.log('\nWill strip founder status from providers matching:', REMOVE_FOUNDERS);
  const previews = [];
  for (const term of REMOVE_FOUNDERS) {
    const match = await Provider.findOne({ displayName: new RegExp(term, 'i') }).select('displayName');
    if (match) previews.push(`  - ${match.displayName}`);
    else previews.push(`  - (no match for "${term}")`);
  }
  previews.forEach(p => console.log(p));

  const ok = await confirm('\n⚠️  This will modify live data. Proceed?');
  if (!ok) {
    console.log('Aborted.');
    await mongoose.disconnect();
    process.exit(0);
  }

  // Strip founder status from matched accounts (partial name match, case-insensitive)
  for (const term of REMOVE_FOUNDERS) {
    const regex = new RegExp(term, 'i');
    const result = await Provider.findOneAndUpdate(
      { displayName: regex },
      { $set: { isFounder: false }, $unset: { founderNumber: '', founderSince: '' } },
      { new: true }
    );
    if (result) {
      console.log(`\n✅ Stripped founder status from: ${result.displayName}`);
    } else {
      console.warn(`\n⚠️  No provider matched: "${term}"`);
    }
  }

  // Re-number remaining founders in ascending join order
  const founders = await Provider.find({ isFounder: true }).sort({ founderSince: 1, createdAt: 1 });
  console.log(`\nRe-numbering ${founders.length} remaining founders...`);
  for (let i = 0; i < founders.length; i++) {
    const newNumber = i + 1;
    await Provider.updateOne({ _id: founders[i]._id }, { $set: { founderNumber: newNumber } });
    console.log(`  #${newNumber} — ${founders[i].displayName}`);
  }

  console.log('\nDone.');
  await mongoose.disconnect();
}

fixFounders().catch(err => {
  console.error(err);
  process.exit(1);
});
