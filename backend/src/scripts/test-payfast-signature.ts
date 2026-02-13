/**
 * Test script to verify PayFast signature generation
 * Run with: npx ts-node src/scripts/test-payfast-signature.ts
 */

import crypto from 'crypto';

// Test with the example from PayFast documentation
const testData = {
  merchant_id: '10029561',
  merchant_key: '2goig1s9efs6l',
  return_url: 'https://findtherapy.care/provider/profile?checkout=success',
  cancel_url: 'https://findtherapy.care/provider/profile?checkout=canceled',
  notify_url: 'https://api.findtherapy.care/api/subscriptions/notify',
  name_first: 'Dr',
  email_address: 'test2@findlocal.care',
  m_payment_id: '697cfef5b77b97edeadc9052_1770815877809',
  amount: '150',
  item_name: 'findtherapy.care Provider Subscription',
  item_description: 'Monthly subscription for provider listing',
  subscription_type: '1',
  frequency: '3',
  cycles: '12',
  subscription_notify_email: 'true',
};

const passphrase = 'FurahaFuraha';
const expectedSignature = '3a0525a489715233cefddf2a3c895d85';

// Generate signature
function generateSignature(data: Record<string, string>, passphrase?: string): string {
  let pfOutput = '';
  
  // Build parameter string
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (value !== undefined && value !== null && value !== '') {
      pfOutput += `${key}=${encodeURIComponent(value.trim()).replace(/%20/g, '+')}&`;
    }
  }
  
  // Remove last ampersand
  pfOutput = pfOutput.slice(0, -1);
  
  // Add passphrase if provided
  if (passphrase && passphrase.trim()) {
    pfOutput += `&passphrase=${passphrase.trim()}`;
  }
  
  console.log('Parameter string:');
  console.log(pfOutput);
  console.log('');
  
  const signature = crypto.createHash('md5').update(pfOutput).digest('hex');
  return signature;
}

// Test signature generation
console.log('Testing PayFast Signature Generation');
console.log('=====================================\n');

const generatedSignature = generateSignature(testData, passphrase);

console.log('Expected signature: ', expectedSignature);
console.log('Generated signature:', generatedSignature);
console.log('');

if (generatedSignature === expectedSignature) {
  console.log('✅ SUCCESS! Signatures match!');
} else {
  console.log('❌ FAILED! Signatures do not match!');
}

// Test URL encoding
console.log('\n\nTesting URL Encoding:');
console.log('=====================\n');

const testCases = [
  { input: 'findtherapy.care Provider Subscription', expected: 'findtherapy.care+Provider+Subscription' },
  { input: 'Monthly subscription for provider listing', expected: 'Monthly+subscription+for+provider+listing' },
  { input: 'https://findtherapy.care/provider/profile?checkout=success', expected: 'https%3A%2F%2Ffindtherapy.care%2Fprovider%2Fprofile%3Fcheckout%3Dsuccess' },
];

for (const test of testCases) {
  const encoded = encodeURIComponent(test.input).replace(/%20/g, '+');
  const match = encoded === test.expected ? '✅' : '❌';
  console.log(`${match} Input: ${test.input}`);
  console.log(`   Expected: ${test.expected}`);
  console.log(`   Got:      ${encoded}`);
  console.log('');
}
