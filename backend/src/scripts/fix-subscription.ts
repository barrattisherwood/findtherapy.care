import mongoose from 'mongoose';
import { Provider } from '../models/Provider';
import { PaymentEvent } from '../models/PaymentEvent';
import dotenv from 'dotenv';

dotenv.config();

async function fixSubscription() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Connected to MongoDB');

    // Find provider by payment ID or email
    // Update this with the actual provider ID or payment ID
    const paymentId = process.argv[2]; // Pass payment ID as command line arg
    
    if (!paymentId) {
      console.error('Usage: npm run fix-subscription <paymentId>');
      console.log('Example: npm run fix-subscription 216947');
      process.exit(1);
    }

    // Find all payment events for this payment
    const events = await PaymentEvent.find({ pfPaymentId: paymentId }).sort({ createdAt: -1 });
    
    console.log(`\nFound ${events.length} payment events for payment ${paymentId}:`);
    events.forEach((event: any, i: number) => {
      console.log(`\n${i + 1}. Event:`, {
        pfPaymentId: event.pfPaymentId,
        mPaymentId: event.mPaymentId,
        paymentStatus: event.paymentStatus,
        amountGross: event.amountGross,
        providerId: event.providerId,
        createdAt: event.createdAt
      });
    });

    if (events.length === 0) {
      console.log('\nNo payment events found. Checking providers with payfastPaymentId...');
      
      // Find provider by any payment ID containing this number
      const providers = await Provider.find({
        $or: [
          { payfastPaymentId: new RegExp(paymentId) }
        ]
      });
      
      console.log(`\nFound ${providers.length} providers:`);
      providers.forEach((provider: any, i: number) => {
        console.log(`\n${i + 1}. Provider:`, {
          id: provider._id,
          displayName: provider.displayName,
          email: provider.email,
          subscriptionStatus: provider.subscriptionStatus,
          payfastPaymentId: provider.payfastPaymentId,
          payfastSubscriptionToken: provider.payfastSubscriptionToken,
          trialEndsAt: provider.trialEndsAt
        });
      });

      if (providers.length === 0) {
        console.log('\nNo providers found. Try searching by name or email.');
        process.exit(1);
      }

      return;
    }

    // Get the provider from the most recent event
    const latestEvent = events[0];
    if (!latestEvent.providerId) {
      console.error('\nNo provider ID in payment event!');
      return;
    }

    const provider = await Provider.findById(latestEvent.providerId);
    if (!provider) {
      console.error(`\nProvider not found: ${latestEvent.providerId}`);
      return;
    }

    console.log('\n--- Current Provider Status ---');
    console.log('ID:', provider._id.toString());
    console.log('Name:', provider.displayName);
    console.log('Email:', provider.email);
    console.log('Subscription Status:', provider.subscriptionStatus);
    console.log('PayFast Payment ID:', provider.payfastPaymentId);
    console.log('PayFast Token:', provider.payfastSubscriptionToken);
    console.log('Trial Ends At:', provider.trialEndsAt);
    console.log('Subscription Ends At:', provider.subscriptionEndsAt);

    // Check if needs fixing
    if (provider.subscriptionStatus === 'active' && provider.payfastSubscriptionToken) {
      console.log('\n✅ Provider subscription is already active with token. No fix needed.');
      return;
    }

    // Ask for confirmation
    console.log('\n--- Proposed Fix ---');
    console.log('Set subscriptionStatus to: active');
    if (latestEvent.rawData && latestEvent.rawData.token) {
      console.log('Set payfastSubscriptionToken to:', latestEvent.rawData.token);
    }
    console.log('Set payfastPaymentId to:', latestEvent.mPaymentId);

    // Manual fix (uncomment to apply)
    const fix = process.argv[3] === '--apply';
    if (fix) {
      const updateData: any = {
        subscriptionStatus: 'active',
        payfastPaymentId: latestEvent.mPaymentId
      };

      if (latestEvent.rawData && latestEvent.rawData.token) {
        updateData.payfastSubscriptionToken = latestEvent.rawData.token;
      }

      await Provider.findByIdAndUpdate(provider._id, updateData);
      console.log('\n✅ Provider subscription fixed!');

      // Verify
      const updated = await Provider.findById(provider._id);
      console.log('\n--- Updated Provider Status ---');
      console.log('Subscription Status:', updated?.subscriptionStatus);
      console.log('PayFast Token:', updated?.payfastSubscriptionToken);
      console.log('PayFast Payment ID:', updated?.payfastPaymentId);
    } else {
      console.log('\n⚠️  DRY RUN - Add --apply to actually fix');
      console.log('Run: npm run fix-subscription', paymentId, '--apply');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

fixSubscription();
