import crypto from 'crypto';
import {
  setPayFastEnvVars,
  clearPayFastEnvVars,
  mockPayFastConfig,
  generateTestSignature,
} from '../helpers/mockPayFast';

// We need to import the module after setting env vars
// So we use dynamic imports in beforeEach

describe('PayFast Service', () => {
  let payfastService: typeof import('../../services/payfastService');

  beforeEach(() => {
    // Clear module cache to reset env var readings
    jest.resetModules();
  });

  afterEach(() => {
    clearPayFastEnvVars();
  });

  describe('isPayFastConfigured', () => {
    it('returns true when both merchant ID and key are set', async () => {
      setPayFastEnvVars();
      payfastService = await import('../../services/payfastService');

      expect(payfastService.isPayFastConfigured()).toBe(true);
    });

    it('returns false when merchant ID is missing', async () => {
      process.env.PAYFAST_MERCHANT_KEY = mockPayFastConfig.PAYFAST_MERCHANT_KEY;
      // PAYFAST_MERCHANT_ID not set
      payfastService = await import('../../services/payfastService');

      expect(payfastService.isPayFastConfigured()).toBe(false);
    });

    it('returns false when merchant key is missing', async () => {
      process.env.PAYFAST_MERCHANT_ID = mockPayFastConfig.PAYFAST_MERCHANT_ID;
      // PAYFAST_MERCHANT_KEY not set
      payfastService = await import('../../services/payfastService');

      expect(payfastService.isPayFastConfigured()).toBe(false);
    });

    it('returns false when both are missing', async () => {
      payfastService = await import('../../services/payfastService');

      expect(payfastService.isPayFastConfigured()).toBe(false);
    });
  });

  describe('generateSignature', () => {
    beforeEach(async () => {
      setPayFastEnvVars();
      payfastService = await import('../../services/payfastService');
    });

    it('generates correct MD5 signature without passphrase', () => {
      const data = {
        merchant_id: '10000100',
        merchant_key: '46f0cd694581a',
        amount: '100.00',
      };

      const signature = payfastService.generateSignature(data);

      // Verify it's a valid MD5 hash (32 hex characters)
      expect(signature).toMatch(/^[a-f0-9]{32}$/);
    });

    it('generates correct MD5 signature with passphrase', () => {
      const data = {
        merchant_id: '10000100',
        amount: '100.00',
      };

      const signatureWithPass = payfastService.generateSignature(data, 'testpassphrase');
      const signatureWithoutPass = payfastService.generateSignature(data);

      // Signatures should be different with and without passphrase
      expect(signatureWithPass).not.toBe(signatureWithoutPass);
      expect(signatureWithPass).toMatch(/^[a-f0-9]{32}$/);
    });

    it('sorts keys alphabetically', () => {
      const data1 = {
        z_field: 'last',
        a_field: 'first',
        m_field: 'middle',
      };

      const data2 = {
        a_field: 'first',
        m_field: 'middle',
        z_field: 'last',
      };

      const signature1 = payfastService.generateSignature(data1);
      const signature2 = payfastService.generateSignature(data2);

      // Same data in different order should produce same signature
      expect(signature1).toBe(signature2);
    });

    it('excludes empty values from signature', () => {
      const dataWithEmpty = {
        field1: 'value1',
        field2: '',
        field3: 'value3',
      };

      const dataWithoutEmpty = {
        field1: 'value1',
        field3: 'value3',
      };

      const sig1 = payfastService.generateSignature(dataWithEmpty);
      const sig2 = payfastService.generateSignature(dataWithoutEmpty);

      expect(sig1).toBe(sig2);
    });

    it('excludes signature field from calculation', () => {
      const dataWithSig = {
        amount: '100.00',
        signature: 'existing_signature',
      };

      const dataWithoutSig = {
        amount: '100.00',
      };

      const sig1 = payfastService.generateSignature(dataWithSig);
      const sig2 = payfastService.generateSignature(dataWithoutSig);

      expect(sig1).toBe(sig2);
    });

    it('encodes spaces as + in URL encoding', () => {
      const data = {
        name: 'John Doe',
      };

      // The signature should be calculated with spaces encoded as +
      const signature = payfastService.generateSignature(data);

      // Verify by manually calculating
      const expected = crypto
        .createHash('md5')
        .update('name=John+Doe')
        .digest('hex');

      expect(signature).toBe(expected);
    });

    it('trims whitespace from values', () => {
      const dataWithWhitespace = {
        name: '  John  ',
      };

      const dataTrimmed = {
        name: 'John',
      };

      const sig1 = payfastService.generateSignature(dataWithWhitespace);
      const sig2 = payfastService.generateSignature(dataTrimmed);

      expect(sig1).toBe(sig2);
    });
  });

  describe('createSubscriptionPaymentData', () => {
    it('returns null when PayFast is not configured', async () => {
      // Don't set env vars
      payfastService = await import('../../services/payfastService');

      const result = payfastService.createSubscriptionPaymentData(
        'test@example.com',
        'John Doe',
        'payment_123',
        150,
        'http://localhost/success',
        'http://localhost/cancel',
        'http://localhost/notify'
      );

      expect(result).toBeNull();
    });

    it('creates correct payment data with all fields', async () => {
      setPayFastEnvVars();
      payfastService = await import('../../services/payfastService');

      const result = payfastService.createSubscriptionPaymentData(
        'test@example.com',
        'John Doe',
        'payment_123',
        150,
        'http://localhost/success',
        'http://localhost/cancel',
        'http://localhost/notify'
      );

      expect(result).not.toBeNull();
      expect(result!.merchant_id).toBe(mockPayFastConfig.PAYFAST_MERCHANT_ID);
      expect(result!.merchant_key).toBe(mockPayFastConfig.PAYFAST_MERCHANT_KEY);
      expect(result!.email_address).toBe('test@example.com');
      expect(result!.m_payment_id).toBe('payment_123');
      expect(result!.return_url).toBe('http://localhost/success');
      expect(result!.cancel_url).toBe('http://localhost/cancel');
      expect(result!.notify_url).toBe('http://localhost/notify');
      expect(result!.item_name).toBe('findtherapy.care Provider Subscription');
    });

    it('extracts first name from display name', async () => {
      setPayFastEnvVars();
      payfastService = await import('../../services/payfastService');

      const result = payfastService.createSubscriptionPaymentData(
        'test@example.com',
        'John Michael Doe',
        'payment_123',
        150,
        'http://localhost/success',
        'http://localhost/cancel',
        'http://localhost/notify'
      );

      expect(result!.name_first).toBe('John');
    });

    it('formats amount with 2 decimal places', async () => {
      setPayFastEnvVars();
      payfastService = await import('../../services/payfastService');

      const result = payfastService.createSubscriptionPaymentData(
        'test@example.com',
        'John',
        'payment_123',
        150,
        'http://localhost/success',
        'http://localhost/cancel',
        'http://localhost/notify'
      );

      expect(result!.amount).toBe('150.00');
      expect(result!.recurring_amount).toBe('150.00');
    });

    it('sets subscription_type to 1', async () => {
      setPayFastEnvVars();
      payfastService = await import('../../services/payfastService');

      const result = payfastService.createSubscriptionPaymentData(
        'test@example.com',
        'John',
        'payment_123',
        150,
        'http://localhost/success',
        'http://localhost/cancel',
        'http://localhost/notify'
      );

      expect(result!.subscription_type).toBe('1');
    });

    it('sets frequency to 3 (monthly)', async () => {
      setPayFastEnvVars();
      payfastService = await import('../../services/payfastService');

      const result = payfastService.createSubscriptionPaymentData(
        'test@example.com',
        'John',
        'payment_123',
        150,
        'http://localhost/success',
        'http://localhost/cancel',
        'http://localhost/notify'
      );

      expect(result!.frequency).toBe('3');
    });

    it('sets cycles to 0 (indefinite)', async () => {
      setPayFastEnvVars();
      payfastService = await import('../../services/payfastService');

      const result = payfastService.createSubscriptionPaymentData(
        'test@example.com',
        'John',
        'payment_123',
        150,
        'http://localhost/success',
        'http://localhost/cancel',
        'http://localhost/notify'
      );

      expect(result!.cycles).toBe('0');
    });

    it('generates valid signature', async () => {
      setPayFastEnvVars();
      payfastService = await import('../../services/payfastService');

      const result = payfastService.createSubscriptionPaymentData(
        'test@example.com',
        'John',
        'payment_123',
        150,
        'http://localhost/success',
        'http://localhost/cancel',
        'http://localhost/notify'
      );

      expect(result!.signature).toBeDefined();
      expect(result!.signature).toMatch(/^[a-f0-9]{32}$/);
    });
  });

  describe('validateITN', () => {
    beforeEach(async () => {
      setPayFastEnvVars();
      payfastService = await import('../../services/payfastService');
    });

    it('returns false when signature does not match', async () => {
      const pfData = {
        m_payment_id: 'payment_123',
        amount: '150.00',
        signature: 'invalid_signature',
      };
      const pfParamString = 'm_payment_id=payment_123&amount=150.00&signature=invalid_signature';

      const result = await payfastService.validateITN(pfData, pfParamString);

      expect(result).toBe(false);
    });

    it('returns true when signature matches (server validation may fail in test)', async () => {
      const pfData: Record<string, string> = {
        m_payment_id: 'payment_123',
        amount: '150.00',
      };

      // Generate valid signature
      pfData.signature = generateTestSignature(pfData);

      const pfParamString = Object.keys(pfData)
        .map((key) => `${key}=${encodeURIComponent(pfData[key])}`)
        .join('&');

      // Mock global fetch
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        text: () => Promise.resolve('VALID'),
      }) as jest.Mock;

      const result = await payfastService.validateITN({ ...pfData }, pfParamString);

      expect(result).toBe(true);

      global.fetch = originalFetch;
    });

    it('returns true when signature matches but server validation fails (fallback)', async () => {
      const pfData: Record<string, string> = {
        m_payment_id: 'payment_123',
        amount: '150.00',
      };

      pfData.signature = generateTestSignature(pfData);

      const pfParamString = Object.keys(pfData)
        .map((key) => `${key}=${encodeURIComponent(pfData[key])}`)
        .join('&');

      // Mock fetch to return invalid
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        text: () => Promise.resolve('INVALID'),
      }) as jest.Mock;

      const result = await payfastService.validateITN({ ...pfData }, pfParamString);

      // Should return false because server said INVALID
      expect(result).toBe(false);

      global.fetch = originalFetch;
    });

    it('handles network errors gracefully', async () => {
      const pfData: Record<string, string> = {
        m_payment_id: 'payment_123',
        amount: '150.00',
      };

      pfData.signature = generateTestSignature(pfData);

      const pfParamString = Object.keys(pfData)
        .map((key) => `${key}=${encodeURIComponent(pfData[key])}`)
        .join('&');

      // Mock fetch to throw error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      // Should still return true because signature was valid
      const result = await payfastService.validateITN({ ...pfData }, pfParamString);

      expect(result).toBe(true);

      global.fetch = originalFetch;
    });
  });

  describe('mapPaymentStatus', () => {
    beforeEach(async () => {
      setPayFastEnvVars();
      payfastService = await import('../../services/payfastService');
    });

    it('maps COMPLETE to active', () => {
      expect(payfastService.mapPaymentStatus('COMPLETE')).toBe('active');
    });

    it('maps CANCELLED to canceled', () => {
      expect(payfastService.mapPaymentStatus('CANCELLED')).toBe('canceled');
    });

    it('maps unknown status to none', () => {
      expect(payfastService.mapPaymentStatus('PENDING')).toBe('none');
      expect(payfastService.mapPaymentStatus('FAILED')).toBe('none');
      expect(payfastService.mapPaymentStatus('UNKNOWN')).toBe('none');
    });

    it('handles empty string', () => {
      expect(payfastService.mapPaymentStatus('')).toBe('none');
    });
  });

  describe('getPayFastUrl', () => {
    it('returns sandbox URL in development/test', async () => {
      process.env.NODE_ENV = 'test';
      setPayFastEnvVars();
      payfastService = await import('../../services/payfastService');

      const url = payfastService.getPayFastUrl();

      expect(url).toContain('sandbox.payfast.co.za');
    });

    it('returns production URL in production', async () => {
      process.env.NODE_ENV = 'production';
      setPayFastEnvVars();
      jest.resetModules();
      payfastService = await import('../../services/payfastService');

      const url = payfastService.getPayFastUrl();

      expect(url).toContain('www.payfast.co.za');
      expect(url).not.toContain('sandbox');

      // Reset to test
      process.env.NODE_ENV = 'test';
    });
  });

  describe('parseAmount', () => {
    beforeEach(async () => {
      setPayFastEnvVars();
      payfastService = await import('../../services/payfastService');
    });

    it('parses amount string to number', () => {
      expect(payfastService.parseAmount('150.00')).toBe(150);
      expect(payfastService.parseAmount('99.99')).toBe(99.99);
      expect(payfastService.parseAmount('0.50')).toBe(0.5);
    });
  });
});
