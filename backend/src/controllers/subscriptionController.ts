import { Request, Response } from 'express';
import { Provider } from '../models/Provider';
import { User } from '../models/User';
import { PaymentEvent } from '../models/PaymentEvent';
import { AuthRequest } from '../middleware/auth';
import {
  isPayFastConfigured,
  createSubscriptionPaymentData,
  validateITN,
  getPayFastUrl,
  mapPaymentStatus,
  cancelPayFastSubscription,
} from '../services/payfastService';
import { SUBSCRIPTION_PRICE_ZAR, FOUNDERS_PRICE_ZAR } from '@findlocal/shared';
import { getProviderAccessStatus } from './providerController';

// FRONTEND_URL may be comma-separated (for CORS); take only the first for redirects
// Strip trailing slashes to prevent double slashes in URLs
const FRONTEND_URL = (process.env.FRONTEND_URL || 'http://localhost:4200').split(',')[0].trim().replace(/\/+$/, '');
const BACKEND_URL = (process.env.BACKEND_URL || 'http://localhost:3000').split(',')[0].trim().replace(/\/+$/, '');

// Get PayFast checkout data (returns form data for redirect)
export const createCheckout = async (req: AuthRequest, res: Response) => {
  try {
    if (!isPayFastConfigured()) {
      return res.status(500).json({ message: 'PayFast is not configured' });
    }

    const userId = req.userId!;

    // Get provider profile
    const provider = await Provider.findOne({ userId });
    if (!provider) {
      return res.status(400).json({ message: 'Please create a provider profile first' });
    }

    // Check if already subscribed
    if (provider.subscriptionStatus === 'active') {
      return res.status(400).json({ message: 'You already have an active subscription' });
    }

    // Get user for email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create unique payment ID
    const paymentId = `${provider._id.toString()}_${Date.now()}`;

    // Store payment ID on provider for later reference
    provider.payfastPaymentId = paymentId;
    await provider.save();

    // Use founder pricing if applicable
    const subscriptionAmount = provider.isFounder ? FOUNDERS_PRICE_ZAR : SUBSCRIPTION_PRICE_ZAR;

    // Create PayFast payment data
    // Pass trial end date so billing starts after trial expires
    const paymentData = createSubscriptionPaymentData(
      user.email,
      provider.displayName,
      paymentId,
      subscriptionAmount,
      `${FRONTEND_URL}/provider/profile?checkout=success`,
      `${FRONTEND_URL}/provider/profile?checkout=canceled`,
      `${BACKEND_URL}/api/subscriptions/notify`,
      provider.trialEndsAt // Billing starts when trial ends
    );

    if (!paymentData) {
      return res.status(500).json({ message: 'Failed to create payment data' });
    }

    // Return PayFast URL and form data for client-side redirect
    res.json({
      url: getPayFastUrl(),
      data: paymentData,
    });
  } catch (error: any) {
    console.error('Create checkout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Handle PayFast ITN (Instant Transaction Notification)
export const handleITN = async (req: Request, res: Response) => {
  try {
    console.log('[ITN] Received ITN from PayFast:', JSON.stringify(req.body, null, 2));
    
    const pfData = req.body;
    const pfPaymentId = pfData.pf_payment_id;

    // Check for duplicate ITN (idempotency)
    if (pfPaymentId) {
      const existingEvent = await PaymentEvent.findOne({ pfPaymentId });
      if (existingEvent) {
        console.log('[ITN] Duplicate ITN detected, returning OK');
        return res.status(200).send('OK');
      }
    }

    // Build param string for validation - must match exactly what PayFast sent
    const pfParamString = Object.keys(pfData)
      .map(key => `${key}=${encodeURIComponent(pfData[key]).replace(/%20/g, '+')}`)
      .join('&');

    console.log('[ITN] Validating signature with params');
    console.log('[ITN] PayFast signature:', pfData.signature);

    // Validate ITN - the validateITN function will handle empty value filtering
    const isValid = await validateITN({ ...pfData }, pfParamString);
    if (!isValid) {
      console.error('[ITN] Invalid ITN received - signature mismatch');
      console.error('[ITN] Full payload:', JSON.stringify(pfData, null, 2));
      return res.status(400).send('Invalid ITN');
    }

    console.log('[ITN] Signature valid, processing payment...');

    // Get payment details
    const paymentId = pfData.m_payment_id;
    const paymentStatus = pfData.payment_status;
    const token = pfData.token; // Subscription token for future charges

    console.log('[ITN] Payment details:', { paymentId, paymentStatus, token });

    // Find provider by payment ID
    let providerId: string | undefined;
    const provider = await Provider.findOne({ payfastPaymentId: paymentId });
    if (!provider) {
      // Try to extract provider ID from payment ID (format: providerId_timestamp)
      const extractedId = paymentId.split('_')[0];
      const providerById = await Provider.findById(extractedId);

      if (!providerById) {
        console.error('Provider not found for payment:', paymentId);
        // Still record the event for tracking
        if (pfPaymentId) {
          await recordPaymentEvent(pfPaymentId, paymentId, paymentStatus, pfData.amount_gross, undefined, pfData);
        }
        return res.status(200).send('OK'); // Still return OK to PayFast
      }

      providerId = providerById._id.toString();
    } else {
      providerId = provider._id.toString();
    }

    // Record payment event for idempotency
    if (pfPaymentId) {
      await recordPaymentEvent(pfPaymentId, paymentId, paymentStatus, pfData.amount_gross, providerId, pfData);
    }

    // Update provider subscription
    await updateProviderSubscription(providerId, paymentId, token, paymentStatus);

    // PayFast expects 200 OK response
    res.status(200).send('OK');
  } catch (error: any) {
    // Handle duplicate key error gracefully (race condition)
    if (error.code === 11000) {
      return res.status(200).send('OK');
    }
    console.error('ITN error:', error);
    res.status(200).send('OK'); // Still return OK to prevent retries
  }
};

// Get subscription status
export const getSubscriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const provider = await Provider.findOne({ userId });

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Get access status (includes trial check)
    const accessStatus = getProviderAccessStatus(provider);

    res.json({
      subscriptionStatus: provider.subscriptionStatus,
      subscriptionEndsAt: provider.subscriptionEndsAt,
      trialEndsAt: provider.trialEndsAt,
      accessStatus, // 'trial' | 'active' | 'expired' | 'none'
      isFounder: provider.isFounder || false,
      founderNumber: provider.founderNumber,
      subscriptionPrice: provider.isFounder ? FOUNDERS_PRICE_ZAR : SUBSCRIPTION_PRICE_ZAR,
    });
  } catch (error: any) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel subscription (PayFast subscriptions can't be canceled via API in sandbox)
export const cancelSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const provider = await Provider.findOne({ userId });

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    if (provider.subscriptionStatus !== 'active') {
      return res.status(400).json({ message: 'No active subscription to cancel' });
    }

    if (provider.payfastSubscriptionToken) {
      const cancelled = await cancelPayFastSubscription(provider.payfastSubscriptionToken);
      if (!cancelled) {
        console.error(`[cancelSubscription] Failed to cancel PayFast subscription for provider ${provider._id}`);
        // Continue — mark canceled locally so the user isn't billed again on our side
      }
    }

    provider.subscriptionStatus = 'canceled';
    await provider.save();

    res.json({ message: 'Subscription canceled' });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper to record payment event for idempotency
async function recordPaymentEvent(
  pfPaymentId: string,
  mPaymentId: string,
  paymentStatus: string,
  amountGross: string,
  providerId: string | undefined,
  rawData: Record<string, unknown>
) {
  try {
    await PaymentEvent.create({
      pfPaymentId,
      mPaymentId,
      paymentStatus,
      amountGross: amountGross || '0',
      providerId: providerId ? providerId : undefined,
      rawData,
    });
  } catch (error: any) {
    // Ignore duplicate key errors (race condition handled)
    if (error.code !== 11000) {
      throw error;
    }
  }
}

// Helper to update provider subscription
async function updateProviderSubscription(
  providerId: string,
  paymentId: string,
  token: string | undefined,
  paymentStatus: string
) {
  const status = mapPaymentStatus(paymentStatus);

  const updateData: any = {
    payfastPaymentId: paymentId,
    subscriptionStatus: status,
  };

  if (token) {
    updateData.payfastSubscriptionToken = token;
  }

  if (status === 'active') {
    // Set subscription end date to 1 month from now
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + 1);
    updateData.subscriptionEndsAt = endsAt;
  }

  await Provider.findByIdAndUpdate(providerId, updateData);
}
