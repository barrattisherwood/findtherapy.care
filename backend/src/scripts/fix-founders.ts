import mongoose from 'mongoose';
import { Provider } from '../models/Provider';
import dotenv from 'dotenv';

dotenv.config();

// Providers to strip founder status from — matched by partial display name (case-insensitive)
const REMOVE_FOUNDERS = ['steyn', 'zanel'];

async function fixFounders() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected to MongoDB');

  // Show current state first
  const allFounders = await Provider.find({ isFounder: true }).select('displayName founderNumber vettingStatus').sort({ founderNumber: 1 });
  console.log('\nCurrent founders in DB:');
  allFounders.forEach((f: any) => console.log(`  #${f.founderNumber}  ${f.displayName}  (vetting: ${f.vettingStatus})`));

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
