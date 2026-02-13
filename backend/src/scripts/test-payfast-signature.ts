/**
 * Test script to verify PayFast signature generation
 * Use with PayFast Integration Tools: https://sandbox.payfast.co.za/eng/recurring/tools
 * Run with: npx ts-node src/scripts/test-payfast-signature.ts
 */

import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const PASSPHRASE = process.env.PAYFAST_PASSPHRASE || '';

// Test with the actual ITN payload you received
const itnPayload = {
  m_payment_id: '697cfef5b77b97edeadc9052_1770987950390',
  pf_payment_id: '3007453',
  payment_status: 'COMPLETE',
  item_name: '',
  item_description: '',
  amount_gross: '0.00',
  amount_fee: '0.00',
  amount_net: '0.00',
  custom_str1: '',
  custom_str2: '',
  custom_str3: '',
  custom_str4: '',
  custom_str5: '',
  custom_int1: '',
  custom_int2: '',
  custom_int3: '',
  custom_int4: '',
  custom_int5: '',
  name_first: 'Dr',
  name_last: '',
  email_address: 'test2@findlocal.care',
  merchant_id: '10045829',
  token: 'd12d1b42-9363-4591-b5db-786ef9a26eef',
  billing_date: '2026-03-31',
  // Expected signature from PayFast:
  signature: '4b4f58e91eed5fd5e9a13b855abbf68a'
};

console.log('=== PayFast Signature Testing Tool ===\n');
console.log('Passphrase:', PASSPHRASE ? `"${PASSPHRASE}"` : '(not set)\n');

// Test 1: Generate signature INCLUDING empty fields (for ITN validation)
console.log('\n1. ITN Signature (includes empty fields):\n');
let pfOutput = '';
for (const key of Object.keys(itnPayload)) {
  const value = itnPayload[key as keyof typeof itnPayload];
  if (value !== undefined && value !== null && key !== 'signature') {
    pfOutput += `${key}=${encodeURIComponent(String(value)).replace(/%20/g, '+')}&`;
  }
}
pfOutput = pfOutput.slice(0, -1);
if (PASSPHRASE && PASSPHRASE.trim()) {
  pfOutput += `&passphrase=${PASSPHRASE.trim()}`;
}

const generatedSignature = crypto.createHash('md5').update(pfOutput).digest('hex');

console.log('Signature String:');
console.log('─'.repeat(100));
console.log(pfOutput);
console.log('─'.repeat(100));
console.log('\nExpected Signature:', itnPayload.signature);
console.log('Generated Signature:', generatedSignature);
console.log('Match:', generatedSignature === itnPayload.signature ? '✅ YES' : '❌ NO');

// Test 2: Generate signature EXCLUDING empty fields (for outgoing payments)
console.log('\n\n2. Outgoing Payment Signature (excludes empty fields):\n');
let pfOutputNoEmpty = '';
for (const key of Object.keys(itnPayload)) {
  const value = itnPayload[key as keyof typeof itnPayload];
  if (value !== undefined && value !== null && String(value).trim() !== '' && key !== 'signature') {
    pfOutputNoEmpty += `${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, '+')}&`;
  }
}
pfOutputNoEmpty = pfOutputNoEmpty.slice(0, -1);
if (PASSPHRASE && PASSPHRASE.trim()) {
  pfOutputNoEmpty += `&passphrase=${PASSPHRASE.trim()}`;
}

const generatedSignatureNoEmpty = crypto.createHash('md5').update(pfOutputNoEmpty).digest('hex');

console.log('Signature String:');
console.log('─'.repeat(100));
console.log(pfOutputNoEmpty);
console.log('─'.repeat(100));
console.log('\nGenerated Signature:', generatedSignatureNoEmpty);

// Test 3: Show URL-encoded payload for PayFast ITN Tester
console.log('\n\n3. Full ITN Payload (for PayFast ITN Tester):\n');
console.log('─'.repeat(100));
const fullPayload = Object.keys(itnPayload)
  .filter(key => key !== 'signature')
  .map(key => `${key}=${encodeURIComponent(itnPayload[key as keyof typeof itnPayload] as string).replace(/%20/g, '+')}`)
  .join('&');
console.log(fullPayload);
console.log('─'.repeat(100));

console.log('\n\n📋 INSTRUCTIONS:\n');
console.log('For ITN Tester (https://sandbox.payfast.co.za/eng/recurring/tools):');
console.log('  1. Copy the "Full ITN Payload" above (section 3)');
console.log('  2. Paste into the ITN Tester "Payload String" field');
console.log('  3. Click "Test signature matching"');
console.log('  4. PayFast will validate if the signature matches their calculation\n');

console.log('For Signature Troubleshooter:');
console.log('  1. Copy the "Signature String" from section 1 above');
console.log('  2. Paste into the Signature Troubleshooter "Payload String" field');
console.log('  3. Click "Test signature matching"');
console.log('  4. Compare the result with the "Generated Signature" shown above\n');

