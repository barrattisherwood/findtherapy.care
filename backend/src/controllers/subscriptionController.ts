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
} from '../services/payfastService';
import { SUBSCRIPTION_PRICE_ZAR } from '@findlocal/shared';
import { getProviderAccessStatus } from './providerController';

const PAYFAST_SUBSCRIPTION_AMOUNT = SUBSCRIPTION_PRICE_ZAR;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

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
    provider.stripeCustomerId = paymentId; // Reusing field for PayFast payment ID
    await provider.save();

    // Create PayFast payment data
    const paymentData = createSubscriptionPaymentData(
      user.email,
      provider.displayName,
      paymentId,
      PAYFAST_SUBSCRIPTION_AMOUNT,
      `${FRONTEND_URL}/provider/profile?checkout=success`,
      `${FRONTEND_URL}/provider/profile?checkout=canceled`,
      `${BACKEND_URL}/api/subscriptions/notify`
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
    const pfData = req.body;
    const pfPaymentId = pfData.pf_payment_id;

    // Check for duplicate ITN (idempotency)
    if (pfPaymentId) {
      const existingEvent = await PaymentEvent.findOne({ pfPaymentId });
      if (existingEvent) {
        console.log('Duplicate ITN received, skipping:', pfPaymentId);
        return res.status(200).send('OK');
      }
    }

    // Build param string for validation
    const pfParamString = Object.keys(pfData)
      .map(key => `${key}=${encodeURIComponent(pfData[key]).replace(/%20/g, '+')}`)
      .join('&');

    // Validate ITN
    const isValid = await validateITN({ ...pfData }, pfParamString);
    if (!isValid) {
      console.error('Invalid ITN received');
      return res.status(400).send('Invalid ITN');
    }

    // Get payment details
    const paymentId = pfData.m_payment_id;
    const paymentStatus = pfData.payment_status;
    const token = pfData.token; // Subscription token for future charges

    console.log('PayFast ITN received:', { paymentId, paymentStatus, token });

    // Find provider by payment ID (stored in stripeCustomerId field)
    let providerId: string | undefined;
    const provider = await Provider.findOne({ stripeCustomerId: paymentId });
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
      console.log('Duplicate ITN detected via unique constraint');
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

    // Mark subscription as canceled
    // Note: In production, you would also cancel via PayFast API
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
    stripeCustomerId: paymentId, // Store payment ID
    subscriptionStatus: status,
  };

  if (token) {
    updateData.stripeSubscriptionId = token; // Store subscription token
  }

  if (status === 'active') {
    // Set subscription end date to 1 month from now
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + 1);
    updateData.subscriptionEndsAt = endsAt;
  }

  await Provider.findByIdAndUpdate(providerId, updateData);
  console.log('Provider subscription updated:', { providerId, status });
}
