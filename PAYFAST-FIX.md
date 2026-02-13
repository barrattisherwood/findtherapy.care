# PayFast Integration Fix - Summary

## Issues Fixed

### 1. **Missing Passphrase in Signature Generation** ✅
- **Problem**: The passphrase was empty in `.env`, causing signature mismatches
- **Fix**: Updated signature generation to properly handle passphrase with format `&passphrase=YourPassphrase`
- **Impact**: Signatures now match PayFast's expected format

### 2. **Incorrect Subscription Fields** ✅
- **Problem**: Using `billing_date` and `recurring_amount` fields which aren't needed for `subscription_type=1`
- **Fix**: Removed these fields and added `subscription_notify_email` field as per PayFast documentation
- **Impact**: Payment requests now match PayFast's subscription requirements

### 3. **Missing subscription_notify_email Field** ✅
- **Problem**: This field wasn't included in the payment data
- **Fix**: Added `subscription_notify_email: 'true'` to enable email notifications to subscribers
- **Impact**: Subscribers will receive email notifications from PayFast

### 4. **Field Ordering for Signature** ✅
- **Problem**: Field order matters for signature generation
- **Fix**: Ensured fields are maintained in consistent order matching the form submission
- **Impact**: Signatures are generated correctly

## Updated Code

### payfastService.ts Changes

1. **Payment Data Interface**:
   - Removed: `billing_date`, `recurring_amount`
   - Added: `subscription_notify_email`

2. **Signature Generation**:
   ```typescript
   // Old (incorrect)
   if (passphrase) {
     pfOutput += `&${passphrase.trim()}`;
   }
   
   // New (correct)
   if (passphrase && passphrase.trim()) {
     pfOutput += `&passphrase=${passphrase.trim()}`;
   }
   ```

3. **Subscription Fields**:
   ```typescript
   subscription_type: '1',      // 1 = subscription
   frequency: '3',              // 3 = monthly
   cycles: '0',                 // 0 = indefinite (or set to 12 for 12 months)
   subscription_notify_email: 'true',  // NEW: Email notifications
   ```

## Configuration for Production (Railway)

Set these environment variables in your Railway deployment:

```env
PAYFAST_MERCHANT_ID=12112194
PAYFAST_MERCHANT_KEY=ufpwccy0ytv6l
PAYFAST_PASSPHRASE=<your-passphrase-here>
```

**IMPORTANT**: Make sure the passphrase in Railway matches the one set in your PayFast account settings (Settings > Integration).

## Testing the Integration

### 1. Test Signature Generation

Run the test script to verify signature generation:

```bash
cd backend
npx ts-node src/scripts/test-payfast-signature.ts
```

You should see:
```
✅ SUCCESS! Signatures match!
```

### 2. Test Complete Payment Flow

#### A. Start the backend server:
```bash
cd backend
npm run dev
```

#### B. Create a test subscription:

1. Login to your application as a provider
2. Navigate to the provider profile page
3. Click "Subscribe" or "Start Subscription"
4. You should be redirected to PayFast's sandbox payment page

#### C. Complete test payment:

On the PayFast sandbox page, you can use test credit cards provided by PayFast:
- https://developers.payfast.co.za/docs#step_3_test_credit_card_details

#### D. Verify ITN (Instant Transaction Notification):

The ITN endpoint will be called by PayFast at:
```
POST https://api.findtherapy.care/api/subscriptions/notify
```

Check your backend logs for:
```
[PayFast] Signature string: ...
[PayFast] Generated signature: ...
```

### 3. Monitor PayFast Sandbox Dashboard

Login to your PayFast sandbox account and check:
- **Transactions**: View all test payments
- **Subscriptions**: See active subscriptions
- **ITN Log**: Check if ITN notifications were sent and received

## Common Issues & Solutions

### Issue: "Invalid signature" error

**Cause**: Passphrase mismatch or field ordering issue

**Solution**:
1. Verify passphrase in Railway matches PayFast account settings
2. Ensure no extra spaces in passphrase
3. Run the test script to verify signature generation

### Issue: ITN not received

**Cause**: Firewall or incorrect notify_url

**Solution**:
1. Verify `BACKEND_URL` in Railway is set correctly
2. Check PayFast ITN log in dashboard for errors
3. Ensure your Railway deployment is publicly accessible
4. In production, ensure IP whitelist is configured correctly

### Issue: Sandbox generic credentials not working

**Cause**: Generic credentials (10000100) don't have passphrase access

**Solution**: 
- Use your own sandbox account created at https://sandbox.payfast.co.za/
- Configure a passphrase in your account settings

## Signature Generation Example

For reference, here's how the signature is generated:

```typescript
// 1. Build parameter string with all fields
const paramString = 
  "merchant_id=12112194" +
  "&merchant_key=ufpwccy0ytv6l" +
  "&return_url=https%3A%2F%2Ffindtherapy.care%2Fprovider%2Fprofile%3Fcheckout%3Dsuccess" +
  // ... all other fields ...
  "&subscription_notify_email=true" +
  "&passphrase=YourPassphrase";

// 2. Generate MD5 hash
const signature = crypto.createHash('md5').update(paramString).digest('hex');
```

## Next Steps

1. ✅ Update Railway environment variables with your PayFast credentials
2. ✅ Deploy the updated code to Railway
3. ✅ Test the complete payment flow in sandbox
4. ✅ Verify ITN notifications are received and processed
5. ✅ Monitor logs for any errors
6. 🔄 Once testing is successful, switch to production PayFast credentials

## Production Checklist

Before going live:

- [ ] Update PayFast credentials to production (not sandbox)
- [ ] Set `NODE_ENV=production` in Railway
- [ ] Verify production passphrase is set correctly
- [ ] Test with real payment in production PayFast
- [ ] Monitor ITN notifications in production
- [ ] Set up error monitoring/alerting
- [ ] Review PayFast production IP whitelist is active

## Support

If issues persist:
- Check PayFast ITN Log in dashboard
- Review backend logs in Railway
- Verify all environment variables are set correctly
- Contact PayFast support for account-specific issues
