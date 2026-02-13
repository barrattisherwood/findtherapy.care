# Subscription & Trial Flow

## How it Works

### 1. User Signs Up (First Login)
- **Trial starts**: 2 months from first login
- **Access**: Full access to all features
- **Payment**: No payment required
- **Listed**: Yes, visible on site

### 2. During Trial Period
**If user subscribes during trial:**
- **Initial charge**: R0 (or R1 if PayFast requires minimum)*
- **Access**: Continues (unchanged)
- **Billing starts**: When trial ends (not immediately)
- **First recurring charge**: R150/month starting on trial end date

**If user doesn't subscribe:**
- **Access**: Continues until trial ends
- **Listed**: Yes, until trial expires

### 3. After Trial Ends
**If subscribed:**
- **Billing**: R150/month recurring
- **Access**: Full access continues
- **Listed**: Yes, remains visible

**If NOT subscribed:**
- **Access**: Removed from listings
- **Listed**: No, hidden from site
- **Can subscribe**: Yes, billing starts immediately

## Payment Details

### Initial Charge
- **Target**: R0 (no upfront payment)
- **Note**: PayFast may require minimum R1 to tokenize payment method
- **If R1 required**: User will be notified that R1 token fee applies

### Recurring Charges
- **Amount**: R150/month
- **Frequency**: Monthly (every 30 days)
- **Start date**: Trial end date
- **Duration**: Indefinite (until cancelled)

### Trial Period
- **Length**: 2 months
- **Start**: First login date
- **End**: 2 months after first login
- **During trial**: No charges, full access
- **After trial**: Must be subscribed to stay listed

## Important Notes

1. **Trial is from first login**, not from subscription date
2. **Subscribing during trial** doesn't charge immediately - waits for trial to end
3. **No double benefit**: Can't stack free trial days with subscription trial
4. **R0 vs R1**: We try R0, but PayFast may enforce R1 minimum
5. **Access control**: Only subscribed or trial users are listed on site

## User Experience

### Scenario 1: Subscribe During Trial
```
Day 1:    Sign up → Trial starts
Day 15:   Subscribe → R0 charge, trial continues
Day 60:   Trial ends → First R150 charge
Day 90:   Second R150 charge
...continuing monthly
```

### Scenario 2: Subscribe After Trial Ends
```
Day 1:    Sign up → Trial starts
Day 60:   Trial ends → Removed from listings
Day 65:   Subscribe → Immediate R150 charge
Day 95:   Second R150 charge
...continuing monthly
```

### Scenario 3: Never Subscribe
```
Day 1:    Sign up → Trial starts
Day 60:   Trial ends → Removed from listings
          No charges, no access
```

## Technical Implementation

- **Trial tracking**: `trialEndsAt` field in Provider model
- **Billing date**: Calculated from `trialEndsAt` or current date
- **Initial amount**: `0.00` (may fallback to `1.00`)
- **Recurring amount**: `150.00`
- **Subscription type**: PayFast subscription with recurring billing
- **Token**: Created on signup for future billing
