import crypto from 'crypto';

// PayFast configuration
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
const PAYFAST_PASSPHRASE = process.env.PAYFAST_PASSPHRASE || '';
const PAYFAST_SANDBOX = process.env.NODE_ENV !== 'production';

// PayFast URLs
const PAYFAST_URL = PAYFAST_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';

const PAYFAST_VALIDATE_URL = PAYFAST_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/query/validate'
  : 'https://www.payfast.co.za/eng/query/validate';

const PAYFAST_API_URL = PAYFAST_SANDBOX
  ? 'https://api.sandbox.payfast.co.za'
  : 'https://api.payfast.co.za';

export interface PayFastSubscriptionData {
  merchantId: string;
  merchantKey: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  nameFirst: string;
  emailAddress: string;
  mPaymentId: string; // Your custom payment ID
  amount: string;
  itemName: string;
  itemDescription?: string;
  subscriptionType: number; // 1 = subscription
  billingDate?: number; // Day of month (1-28)
  recurringAmount: string;
  frequency: number; // 3 = monthly, 4 = quarterly, 5 = biannually, 6 = annually
  cycles: number; // 0 = indefinite
}

export interface PayFastPaymentData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last?: string;
  email_address: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description?: string;
  subscription_type?: string;
  billing_date?: string;
  recurring_amount?: string;
  frequency?: string;
  cycles?: string;
  subscription_notify_email?: string;
  signature?: string;
}

export const isPayFastConfigured = (): boolean => {
  return !!(PAYFAST_MERCHANT_ID && PAYFAST_MERCHANT_KEY);
};

// Generate MD5 signature for PayFast
export const generateSignature = (data: Record<string, string>, passphrase?: string): string => {
  // Create parameter string - exclude undefined, null, empty strings, and signature field
  // Fields must be in NATURAL order (the order they appear) - NOT alphabetical
  let pfOutput = '';
  
  for (const key of Object.keys(data)) {
    const value = data[key];
    // Skip signature field, undefined, null, and empty strings
    if (value !== undefined && value !== null && String(value).trim() !== '' && key !== 'signature') {
      pfOutput += `${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, '+')}&`;
    }
  }

  // Remove last ampersand
  pfOutput = pfOutput.slice(0, -1);

  // Add passphrase if provided (append raw, no URL encoding, no prefix if empty)
  if (passphrase && passphrase.trim()) {
    pfOutput += `&passphrase=${passphrase.trim()}`;
  }

  // Debug logging
  console.log('[PayFast] Signature string:', pfOutput);
  const signature = crypto.createHash('md5').update(pfOutput).digest('hex');
  console.log('[PayFast] Generated signature:', signature);

  return signature;
};

// Create subscription payment data
export const createSubscriptionPaymentData = (
  email: string,
  name: string,
  paymentId: string,
  amount: number,
  returnUrl: string,
  cancelUrl: string,
  notifyUrl: string,
  trialEndDate?: Date // When trial ends (billing starts after this date)
): PayFastPaymentData | null => {
  if (!isPayFastConfigured()) {
    return null;
  }

  // Calculate billing date (when first charge should occur)
  // If trial end date provided and in future, use it. Otherwise start billing now.
  const billingDate = trialEndDate && trialEndDate > new Date() ? trialEndDate : new Date();
  const billingDateStr = billingDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

  // Build payment data in exact field order for signature generation
  // This order must match the HTML form order
  const data: PayFastPaymentData = {
    merchant_id: PAYFAST_MERCHANT_ID!,
    merchant_key: PAYFAST_MERCHANT_KEY!,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    name_first: name.split(' ')[0],
    name_last: name.split(' ').slice(1).join(' ') || undefined,
    email_address: email,
    m_payment_id: paymentId,
    amount: '0.00', // No initial charge - free trial period (PayFast may require min R1 - will notify user if so)
    item_name: 'findtherapy.care Provider Subscription',
    item_description: 'Monthly subscription for provider listing',
    subscription_type: '1', // 1 = subscription
    billing_date: billingDateStr, // First recurring charge date (after trial period)
    recurring_amount: amount.toFixed(2), // Amount to charge after trial (R150)
    frequency: '3', // 3 = monthly
    cycles: '0', // 0 = indefinite (use 12 for 12 months, etc.)
    subscription_notify_email: 'true', // Notify subscriber via email
  };

  // Generate signature - must maintain exact field order
  const dataForSig: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      dataForSig[key] = value;
    }
  }
  data.signature = generateSignature(dataForSig, PAYFAST_PASSPHRASE);

  console.log('[PayFast] Created payment data with signature:', data.signature);

  return data;
};

// Validate ITN data from PayFast
export const validateITN = async (
  pfData: Record<string, string>,
  pfParamString: string
): Promise<boolean> => {
  // Verify signature
  const signature = pfData.signature;
  delete pfData.signature;

  // Validate signature - for ITN we must include empty fields (PayFast's actual behavior)
  // This differs from outgoing payments where we exclude empty strings
  const generatedSignature = generateSignatureForITN(pfData, PAYFAST_PASSPHRASE);

  if (generatedSignature !== signature) {
    console.error('[PayFast] Signature mismatch');
    console.error('[PayFast] Expected:', signature);
    console.error('[PayFast] Generated:', generatedSignature);
    return false;
  }

  // Verify with PayFast server (optional but recommended)
  try {
    const response = await fetch(PAYFAST_VALIDATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: pfParamString,
    });

    const result = await response.text();
    if (result !== 'VALID') {
      console.error('PayFast validation failed:', result);
      return false;
    }
  } catch (error) {
    console.error('PayFast validation error:', error);
    // Continue anyway - signature was valid
  }

  return true;
};

// Generate signature for ITN validation (includes empty fields - PayFast's actual behavior)
const generateSignatureForITN = (data: Record<string, string>, passphrase?: string): string => {
  // Despite PayFast docs saying to exclude empty strings (if($val !== '')),
  // their actual ITN signatures INCLUDE empty fields like item_name=&item_description=
  // So we must include ALL fields they send, even empty ones
  let pfOutput = '';
  
  for (const key of Object.keys(data)) {
    const value = data[key];
    // Only skip signature field, undefined, and null (KEEP empty strings for ITN!)
    if (value !== undefined && value !== null && key !== 'signature') {
      pfOutput += `${key}=${encodeURIComponent(String(value)).replace(/%20/g, '+')}&`;
    }
  }

  // Remove last ampersand
  pfOutput = pfOutput.slice(0, -1);

  // Add passphrase if provided
  if (passphrase && passphrase.trim()) {
    pfOutput += `&passphrase=${passphrase.trim()}`;
  }

  // Debug logging
  console.log('[PayFast ITN] Signature string:', pfOutput);
  const signature = crypto.createHash('md5').update(pfOutput).digest('hex');
  console.log('[PayFast ITN] Generated signature:', signature);

  return signature;
};

// Get PayFast checkout URL
export const getPayFastUrl = (): string => {
  return PAYFAST_URL;
};

// Parse amount from PayFast (comes as string with 2 decimal places)
export const parseAmount = (amount: string): number => {
  return parseFloat(amount);
};

// Call PayFast subscriptions API (cancel / pause / unpause)
const callPayFastSubscriptionApi = async (subscriptionToken: string, action: 'cancel' | 'pause' | 'unpause'): Promise<boolean> => {
  if (!isPayFastConfigured()) {
    console.warn(`[PayFast] Cannot ${action} subscription — PayFast not configured`);
    return false;
  }

  const timestamp = new Date().toISOString();
  const url = `${PAYFAST_API_URL}/subscriptions/${subscriptionToken}/${action}`;

  const headers: Record<string, string> = {
    'merchant-id': PAYFAST_MERCHANT_ID!,
    'version': 'v1',
    'timestamp': timestamp,
    'Content-Type': 'application/json',
  };

  const sigParts = Object.entries(headers)
    .filter(([key]) => key !== 'Content-Type')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${encodeURIComponent(value.trim())}`)
    .join('&');

  const sigString = PAYFAST_PASSPHRASE
    ? `${sigParts}&passphrase=${encodeURIComponent(PAYFAST_PASSPHRASE.trim())}`
    : sigParts;

  headers['signature'] = crypto.createHash('md5').update(sigString).digest('hex');

  try {
    const response = await fetch(url, { method: 'PUT', headers });
    const body = await response.text();
    if (response.ok) {
      console.log(`[PayFast] Subscription ${subscriptionToken} ${action}d successfully`);
      return true;
    }
    console.error(`[PayFast] Failed to ${action} subscription ${subscriptionToken}: ${response.status} ${body}`);
    return false;
  } catch (error) {
    console.error(`[PayFast] Error during ${action} for subscription ${subscriptionToken}:`, error);
    return false;
  }
};

// Cancel a PayFast subscription via their API
export const cancelPayFastSubscription = (subscriptionToken: string): Promise<boolean> =>
  callPayFastSubscriptionApi(subscriptionToken, 'cancel');

// Pause a PayFast subscription via their API
export const pausePayFastSubscription = (subscriptionToken: string): Promise<boolean> =>
  callPayFastSubscriptionApi(subscriptionToken, 'pause');

// Unpause a PayFast subscription via their API
export const unpausePayFastSubscription = (subscriptionToken: string): Promise<boolean> =>
  callPayFastSubscriptionApi(subscriptionToken, 'unpause');

// Map PayFast payment status to our subscription status
export const mapPaymentStatus = (status: string): 'active' | 'canceled' | 'none' => {
  switch (status) {
    case 'COMPLETE':
      return 'active';
    case 'CANCELLED':
      return 'canceled';
    default:
      return 'none';
  }
};
