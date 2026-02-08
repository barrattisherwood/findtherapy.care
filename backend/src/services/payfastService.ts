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
  signature?: string;
}

export const isPayFastConfigured = (): boolean => {
  return !!(PAYFAST_MERCHANT_ID && PAYFAST_MERCHANT_KEY);
};

// Generate MD5 signature for PayFast
export const generateSignature = (data: Record<string, string>, passphrase?: string): string => {
  // Create parameter string
  let pfOutput = '';
  for (const key of Object.keys(data).sort()) {
    if (data[key] !== '' && key !== 'signature') {
      pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}&`;
    }
  }

  // Remove last ampersand
  pfOutput = pfOutput.slice(0, -1);

  // Add passphrase if provided
  if (passphrase) {
    pfOutput += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
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
  notifyUrl: string
): PayFastPaymentData | null => {
  if (!isPayFastConfigured()) {
    return null;
  }

  const data: PayFastPaymentData = {
    merchant_id: PAYFAST_MERCHANT_ID!,
    merchant_key: PAYFAST_MERCHANT_KEY!,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    name_first: name.split(' ')[0],
    email_address: email,
    m_payment_id: paymentId,
    amount: amount.toFixed(2),
    item_name: 'findtherapy.care Provider Subscription',
    item_description: 'Monthly subscription for provider listing',
    subscription_type: '1',
    recurring_amount: amount.toFixed(2),
    frequency: '3', // Monthly
    cycles: '0', // Indefinite
  };

  // Generate signature
  const dataForSig: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      dataForSig[key] = value;
    }
  }
  data.signature = generateSignature(dataForSig, PAYFAST_PASSPHRASE);

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

  const generatedSignature = generateSignature(pfData, PAYFAST_PASSPHRASE);

  if (generatedSignature !== signature) {
    console.error('PayFast signature mismatch');
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

// Get PayFast checkout URL
export const getPayFastUrl = (): string => {
  return PAYFAST_URL;
};

// Parse amount from PayFast (comes as string with 2 decimal places)
export const parseAmount = (amount: string): number => {
  return parseFloat(amount);
};

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
