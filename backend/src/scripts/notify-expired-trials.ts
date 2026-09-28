/**
 * One-shot script: email every provider whose trial has expired and has no active subscription.
 * Run from Railway Console:
 *   node -e "require('./dist/scripts/notify-expired-trials').run()"
 * Or locally after building:
 *   npx ts-node src/scripts/notify-expired-trials.ts [--dry-run]
 */

import mongoose from 'mongoose';
import { Provider } from '../models/Provider';
import { sendTrialExpiredEmail } from '../services/emailService';
import dotenv from 'dotenv';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');

export async function run() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('Connected to MongoDB');

  const now = new Date();

  // Providers whose trial has ended AND who have no active subscription
  const expired = await Provider.find({
    isPublished: true,
    vettingStatus: 'approved',
    isSuspended: { $ne: true },
    subscriptionStatus: { $nin: ['active', 'paused'] },
    $or: [
      { trialEndsAt: { $lt: now } },
      { trialEndsAt: { $exists: false } },
    ],
    contactEmail: { $exists: true, $ne: '' },
  }).select('displayName contactEmail isFounder trialEndsAt subscriptionStatus');

  console.log(`Found ${expired.length} expired provider(s) to notify`);
  if (DRY_RUN) console.log('DRY RUN — no emails will be sent\n');

  let sent = 0;
  let skipped = 0;

  for (const provider of expired) {
    const name = provider.displayName || 'there';
    const email = provider.contactEmail!;
    const isFounder = provider.isFounder ?? false;

    console.log(`  ${DRY_RUN ? '[DRY]' : '[SEND]'} ${name} <${email}> (founder: ${isFounder}, status: ${provider.subscriptionStatus}, trialEndsAt: ${provider.trialEndsAt?.toISOString() ?? 'none'})`);

    if (!DRY_RUN) {
      try {
        await sendTrialExpiredEmail(name, email, isFounder);
        sent++;
        // Brief pause to avoid Resend rate limits
        await new Promise(r => setTimeout(r, 300));
      } catch (err) {
        console.error(`    ❌ Failed to send to ${email}:`, err);
        skipped++;
      }
    } else {
      sent++;
    }
  }

  console.log(`\nDone. Sent: ${sent}, Failed: ${skipped}`);
  await mongoose.disconnect();
}

// Run when executed directly
if (require.main === module) {
  run().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
