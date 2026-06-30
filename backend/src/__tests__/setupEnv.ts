// Set test environment variables BEFORE any modules are imported
// This file is loaded via Jest's setupFiles (runs before test files are parsed)

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.FRONTEND_URL = 'http://localhost:4200';
process.env.BACKEND_URL = 'http://localhost:3000';

// Claude API (mocked in tests — key just needs to be present)
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

// PayFast test credentials
process.env.PAYFAST_MERCHANT_ID = 'test_merchant_id';
process.env.PAYFAST_MERCHANT_KEY = 'test_merchant_key';
process.env.PAYFAST_PASSPHRASE = 'test_passphrase';
