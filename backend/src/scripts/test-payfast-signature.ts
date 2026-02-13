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
// Note: Field order must match PayFast's ITN documentation order
const itnPayload = {
  m_payment_id: '697cfef5b77b97edeadc9052_1770987950390',
  pf_payment_id: '3007453',
  payment_status: 'COMPLETE',
  item_name: 'findtherapy.care Provider Subscription',
  item_description: 'Monthly subscription for provider listing',
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
  billing_date: '2026-03-31'
};

console.log('=== PayFast Signature Testing Tool ===\n');
console.log('Passphrase:', PASSPHRASE ? `"${PASSPHRASE}"` : '(not set)\n');

// Test 1: Generate signature EXCLUDING empty fields (PayFast spec)
// Per PayFast docs: if($val !== '') - empty strings are excluded
console.log('\n1. Signature Generation (PayFast spec - excludes empty strings):\n');
let pfOutput = '';
for (const key of Object.keys(itnPayload)) {
  const value = itnPayload[key as keyof typeof itnPayload];
  // Exclude empty strings, undefined, null (per PayFast PHP: if($val !== ''))
  if (value !== undefined && value !== null && String(value).trim() !== '') {
    pfOutput += `${key}=${encodeURIComponent(String(value).trim()).replace(/%20/g, '+')}&`;
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
console.log('\nGenerated Signature:', generatedSignature);

// Test 2: Show URL-encoded payload for PayFast Tools (excludes empty strings)
console.log('\n\n2. Full ITN Payload (for PayFast Tools - excludes empty strings):\n');
console.log('─'.repeat(100));
const fullPayload = Object.keys(itnPayload)
  .filter(key => {
    const val = itnPayload[key as keyof typeof itnPayload];
    return val !== undefined && val !== null && String(val).trim() !== '';
  })
  .map(key => `${key}=${encodeURIComponent(String(itnPayload[key as keyof typeof itnPayload]).trim()).replace(/%20/g, '+')}`)
  .join('&');
console.log(fullPayload);
console.log('─'.repeat(100));

// Generate string WITHOUT passphrase for Signature Troubleshooter
const pfOutputWithoutPassphrase = pfOutput.replace(`&passphrase=${PASSPHRASE.trim()}`, '');

console.log('\n\n📋 INSTRUCTIONS:\n');
console.log('Per PayFast docs: "Variable order: The pairs must be listed in the order in which');
console.log('they appear in the attributes description" and empty strings are excluded.\n');

console.log('For ITN Tester (https://sandbox.payfast.co.za/eng/recurring/tools):');
console.log('  ✅ This one worked! Signature matches: f71a7951350332dbe71091e09e9fbda0\n');

console.log('For Signature Troubleshooter:');
console.log('  1. Paste this string (WITHOUT passphrase):');
console.log('     ' + pfOutputWithoutPassphrase);
console.log('  2. In the "Passphrase" field, enter: testpayfast222');
console.log('  3. Click "Test signature matching"');
console.log('  4. Should match: ' + generatedSignature + '\n');

