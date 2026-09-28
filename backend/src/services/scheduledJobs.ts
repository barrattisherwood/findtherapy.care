import cron from 'node-cron';
import { Provider } from '../models/Provider';
import { User } from '../models/User';
import ProviderDocument from '../models/ProviderDocument';
import { sendTrialEndingReminderEmail } from './emailService';
import { deleteDocument } from './cloudinaryService';

/**
 * Check for providers whose trial ends within 7 days and send reminder emails.
 * Using a 7-day look-ahead (rather than an exact 5-6 day window) means a missed
 * cron run is automatically caught on the next execution — no provider falls through
 * because the server was down during one specific night.
 * Runs daily at 9:00 AM.
 */
export const checkTrialEndingReminders = async (): Promise<void> => {
  try {
    console.log('[Cron] Running trial ending reminder check...');

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Find providers whose trial ends within 7 days but hasn't ended yet,
    // who haven't subscribed and haven't been sent the reminder yet.
    const providersEndingSoon = await Provider.find({
      trialEndsAt: {
        $gt: now,
        $lte: sevenDaysFromNow,
      },
      subscriptionStatus: 'none',
      trialEndingReminderSent: { $ne: true },
    });

    console.log(`[Cron] Found ${providersEndingSoon.length} providers with trials ending within 7 days`);

    let sentCount = 0;
    let errorCount = 0;

    for (const provider of providersEndingSoon) {
      try {
        // Get the user's email
        const user = await User.findOne({ _id: provider.userId });
        if (!user) {
          console.warn(`[Cron] User not found for provider ${provider._id}`);
          continue;
        }

        // Send the reminder email
        await sendTrialEndingReminderEmail(
          user.email,
          provider.displayName,
          provider.trialEndsAt!
        );

        // Mark reminder as sent
        provider.trialEndingReminderSent = true;
        await provider.save();

        sentCount++;
        console.log(`[Cron] ✅ Sent trial ending reminder to ${user.email}`);
      } catch (error) {
        errorCount++;
        console.error(`[Cron] ❌ Failed to send reminder for provider ${provider._id}:`, error);
      }
    }

    console.log(`[Cron] Trial ending reminder check complete. Sent: ${sentCount}, Errors: ${errorCount}`);
  } catch (error) {
    console.error('[Cron] Error in trial ending reminder check:', error);
  }
};

const APPROVED_RETENTION_DAYS = 90;
const REJECTED_RETENTION_DAYS = 30;

/**
 * Delete Cloudinary assets for reviewed provider documents past their POPIA retention window.
 * The ProviderDocument record is kept as an audit trail; only cloudinaryPublicId is cleared.
 * Runs daily.
 */
export const deleteExpiredDocuments = async (): Promise<{ deletedCount: number }> => {
  try {
    console.log('[Cron] Running expired document deletion...');

    const now = new Date();

    const approvedCutoff = new Date(now);
    approvedCutoff.setDate(approvedCutoff.getDate() - APPROVED_RETENTION_DAYS);

    const rejectedCutoff = new Date(now);
    rejectedCutoff.setDate(rejectedCutoff.getDate() - REJECTED_RETENTION_DAYS);

    const expiredDocs = await ProviderDocument.find({
      cloudinaryPublicId: { $ne: '' },
      $or: [
        { reviewOutcome: 'approved', reviewedAt: { $lt: approvedCutoff } },
        { reviewOutcome: 'rejected', reviewedAt: { $lt: rejectedCutoff } },
      ],
    });

    let deletedCount = 0;
    for (const doc of expiredDocs) {
      try {
        await deleteDocument(doc.cloudinaryPublicId);
        doc.cloudinaryPublicId = '';
        await doc.save();
        deletedCount++;
      } catch (err) {
        console.error(`[Cron] Failed to delete document ${doc._id}:`, err);
      }
    }

    console.log(`[Cron] Expired document deletion complete. Deleted: ${deletedCount}`);
    return { deletedCount };
  } catch (error) {
    console.error('[Cron] Error in expired document deletion:', error);
    return { deletedCount: 0 };
  }
};

/**
 * Initialize all scheduled jobs
 */
export const initializeScheduledJobs = (): void => {
  console.log('[Cron] Initializing scheduled jobs...');

  // Run trial ending reminder check daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    await checkTrialEndingReminders();
  });

  // Run document retention cleanup daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    await deleteExpiredDocuments();
  });

  console.log('[Cron] ✅ Scheduled jobs initialized successfully');
  console.log('[Cron] - Trial ending reminders: Daily at 9:00 AM');
  console.log('[Cron] - Document retention cleanup: Daily at 2:00 AM');

  // Run once on startup in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Cron] Development mode: Running trial reminder check on startup...');
    setTimeout(() => {
      checkTrialEndingReminders();
    }, 5000); // Wait 5 seconds after server start
  }
};
