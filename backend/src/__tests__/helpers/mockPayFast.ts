import crypto from 'crypto';

export const mockPayFastConfig = {
  PAYFAST_MERCHANT_ID: 'test_merchant_id',
  PAYFAST_MERCHANT_KEY: 'test_merchant_key',
  PAYFAST_PASSPHRASE: 'test_passphrase',
};

export const setPayFastEnvVars = (): void => {
  process.env.PAYFAST_MERCHANT_ID = mockPayFastConfig.PAYFAST_MERCHANT_ID;
  process.env.PAYFAST_MERCHANT_KEY = mockPayFastConfig.PAYFAST_MERCHANT_KEY;
  process.env.PAYFAST_PASSPHRASE = mockPayFastConfig.PAYFAST_PASSPHRASE;
};

export const clearPayFastEnvVars = (): void => {
  delete process.env.PAYFAST_MERCHANT_ID;
  delete process.env.PAYFAST_MERCHANT_KEY;
  delete process.env.PAYFAST_PASSPHRASE;
};

export interface MockITNDataOptions {
  m_payment_id?: string;
  pf_payment_id?: string;
  payment_status?: string;
  item_name?: string;
  amount_gross?: string;
  amount_fee?: string;
  amount_net?: string;
  token?: string;
  signature?: string;
}

export const createMockITNData = (overrides: MockITNDataOptions = {}): Record<string, string> => {
  const data: Record<string, string> = {
    m_payment_id: overrides.m_payment_id || 'provider123_1234567890',
    pf_payment_id: overrides.pf_payment_id || '12345',
    payment_status: overrides.payment_status || 'COMPLETE',
    item_name: overrides.item_name || 'findtherapy.care Provider Subscription',
    amount_gross: overrides.amount_gross || '150.00',
    amount_fee: overrides.amount_fee || '-5.00',
    amount_net: overrides.amount_net || '145.00',
  };

  if (overrides.token) {
    data.token = overrides.token;
  }

  // Generate a valid signature if not provided
  if (!overrides.signature) {
    data.signature = generateTestSignature(data);
  } else {
    data.signature = overrides.signature;
  }

  return data;
};

export const generateTestSignature = (
  data: Record<string, string>,
  passphrase: string = mockPayFastConfig.PAYFAST_PASSPHRASE
): string => {
  let pfOutput = '';
  for (const key of Object.keys(data).sort()) {
    if (data[key] !== '' && key !== 'signature') {
      pfOutput += `${key}=${encodeURIComponent(data[key].trim()).replace(/%20/g, '+')}&`;
    }
  }
  pfOutput = pfOutput.slice(0, -1);

  if (passphrase) {
    pfOutput += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, '+')}`;
  }

  return crypto.createHash('md5').update(pfOutput).digest('hex');
};

// Mock fetch for PayFast validation endpoint
export const mockPayFastValidation = (isValid: boolean = true): jest.Mock => {
  return jest.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(isValid ? 'VALID' : 'INVALID'),
  });
};

export const mockPayFastValidationError = (): jest.Mock => {
  return jest.fn().mockRejectedValue(new Error('Network error'));
};
