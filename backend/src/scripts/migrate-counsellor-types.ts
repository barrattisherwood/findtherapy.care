import mongoose from 'mongoose';
import { Provider } from '../models/Provider';
import * as readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

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

  // Fetch all counsellors that don't already have counsellorTypes assigned
  const counsellors = await Provider.find({
    type: 'counsellor',
    $or: [{ counsellorTypes: { $exists: false } }, { counsellorTypes: { $size: 0 } }],
  }).select('displayName professionalBodies');

  if (counsellors.length === 0) {
    console.log('\nNo counsellors require migration.');
    await mongoose.disconnect();
    return;
  }

  // Bucket into groups
  const aschpOnly: typeof counsellors = [];
  const hpcsaOnly: typeof counsellors = [];
  const both: typeof counsellors = [];
  const neither: typeof counsellors = [];

  for (const p of counsellors) {
    const bodies = (p.professionalBodies ?? []).map((b: any) => b.body as string);
    const hasASCHP = bodies.includes('ASCHP');
    const hasHPCSA = bodies.includes('HPCSA');

    if (hasASCHP && hasHPCSA) {
      both.push(p);
    } else if (hasASCHP) {
      aschpOnly.push(p);
    } else if (hasHPCSA) {
      hpcsaOnly.push(p);
    } else {
      neither.push(p);
    }
  }

  console.log('\n========== DRY RUN SUMMARY ==========');
  console.log(`ASCHP only  → will be assigned "wellness"              : ${aschpOnly.length}`);
  console.log(`HPCSA only  → will be assigned "registered"            : ${hpcsaOnly.length}`);
  console.log(`Both        → will be assigned ["wellness","registered"]: ${both.length}`);
  console.log(`Neither     → will be SKIPPED (manual review needed)  : ${neither.length}`);
  console.log('======================================\n');

  if (neither.length > 0) {
    console.log('Providers skipped (neither ASCHP nor HPCSA):');
    neither.forEach(p => console.log(`  - ${p.displayName}`));
    console.log('');
  }

  const toUpdate = [...aschpOnly, ...hpcsaOnly, ...both];
  if (toUpdate.length === 0) {
    console.log('Nothing to migrate (only "neither" providers found — all require manual review).');
    await mongoose.disconnect();
    return;
  }

  const ok = await confirm('⚠️  This will modify live data. Proceed?');
  if (!ok) {
    console.log('Aborted.');
    await mongoose.disconnect();
    process.exit(0);
  }

  let updated = 0;

  for (const p of aschpOnly) {
    await Provider.updateOne({ _id: p._id }, { $set: { counsellorTypes: ['wellness'] } });
    console.log(`✅ ${p.displayName} → ['wellness']`);
    updated++;
  }

  for (const p of hpcsaOnly) {
    await Provider.updateOne({ _id: p._id }, { $set: { counsellorTypes: ['registered'] } });
    console.log(`✅ ${p.displayName} → ['registered']`);
    updated++;
  }

  for (const p of both) {
    await Provider.updateOne({ _id: p._id }, { $set: { counsellorTypes: ['wellness', 'registered'] } });
    console.log(`✅ ${p.displayName} → ['wellness', 'registered']`);
    updated++;
  }

  console.log(`\n✅ Migration complete — updated ${updated} provider(s).`);
  if (neither.length > 0) {
    console.log(`⚠️  ${neither.length} provider(s) were skipped and require manual sub-type assignment.`);
  }

  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
