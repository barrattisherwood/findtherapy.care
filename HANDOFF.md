# findtherapy.care - Handoff Document

## Project Overview
A directory for mental health providers (therapists and counsellors) in South Africa. Providers can list their profiles with a free 60-day trial, then pay R150/month via PayFast to stay visible in search results.

## Tech Stack
- **Frontend**: Angular 21 (standalone components, signals)
- **Backend**: Node.js/Express with TypeScript
- **Database**: MongoDB with Mongoose
- **Styling**: Tailwind CSS with custom color system
- **Payments**: PayFast (South African payment gateway)
- **Monorepo**: npm workspaces with shared package

## Repository
- GitHub: https://github.com/barrattisherwood/findtherapy.care.git
- Branch: main

## Project Structure
```
findlocal.care/
├── backend/           # Express API server
├── frontend/          # Angular app
├── shared/            # Shared types and constants (@findlocal/shared)
└── package.json       # Root workspace config
```

## What's Been Built

### Backend
- **Auth**: JWT-based authentication (register, login, logout)
- **Providers**: CRUD for provider profiles, search with filters
- **Support Groups**: CRUD (admin-only create/update/delete)
- **Subscriptions**: PayFast integration with webhooks
- **Trial System**: 60-day free trial, configurable in constants

### Frontend
- **Landing page**: Hero, features, CTAs
- **Auth**: Login/Register forms
- **Provider listing**: Search with filters (type, city, specialty)
- **Provider detail**: Full profile view
- **Provider profile**: Create/edit form for providers
- **Support groups**: List and detail views
- **Subscription status**: Shows trial/active/expired with days countdown

### Key Files

**Shared Constants** (`shared/src/constants/index.ts`):
```typescript
TRIAL_PERIOD_DAYS = 60        // Set to 0 to disable trial
SUBSCRIPTION_PRICE_ZAR = 150  // Monthly price in Rands
```

**Types** (`shared/src/types/`):
- `user.types.ts` - User interface
- `provider.types.ts` - Provider, SupportGroup, ProviderAccessStatus

**Backend Controllers**:
- `providerController.ts` - Provider CRUD + trial helpers
- `subscriptionController.ts` - PayFast checkout + webhooks
- `supportGroupController.ts` - Support group CRUD

**Frontend Services**:
- `provider.service.ts` - Provider API calls
- `subscription.service.ts` - Subscription status + PayFast redirect
- `support-group.service.ts` - Support group API calls

## Environment Variables Needed

**Backend (.env)**:
```
MONGODB_URI=mongodb://localhost:27017/findtherapy
JWT_SECRET=your-secret-key
PAYFAST_MERCHANT_ID=your-merchant-id
PAYFAST_MERCHANT_KEY=your-merchant-key
PAYFAST_PASSPHRASE=your-passphrase (optional)
FRONTEND_URL=http://localhost:4200
BACKEND_URL=http://localhost:3000
```

## How to Run

```bash
# Install dependencies
npm install

# Build shared package
npm run build:shared

# Seed database with test data
cd backend && npm run seed

# Start backend (terminal 1)
cd backend && npm run dev

# Start frontend (terminal 2)
cd frontend && npm start
```

**Seed credentials**:
- Admin: admin@findtherapy.care / admin123
- All seed users: password123

## Current State
- Core features complete and working
- Trial system implemented (60 days)
- PayFast integration ready (needs credentials in .env)
- 8 sample providers and 10 support groups in seed data

## Backlog / Next Steps

### 1. Profile View Counts (Priority)
Track how many times each provider's profile is viewed.
- Add `viewCount` field to Provider model
- Increment on getProviderById endpoint
- Display on provider dashboard

### 2. Contact Form with SMS (Priority)
Allow site visitors to contact providers without registration.
- Contact form on provider detail page
- Email sent to provider
- SMS notification to provider's phone number
- Consider using a service like Twilio or local SA SMS gateway

### 3. Remove Registration for Browsers
General users (looking for providers) shouldn't need accounts.
- Provider search/list is already public
- Provider detail is already public
- Just need to ensure no login prompts for browsing

### 4. PayFast Production Setup
- Get PayFast sandbox credentials for testing
- Test full payment flow
- Switch to production credentials when ready

### 5. Deployment
- Choose hosting (Vercel for frontend, Railway/Render for backend)
- Set up MongoDB Atlas
- Configure domain (findtherapy.care)

## Important Decisions Made
1. **Trial managed internally** (not via PayFast) - gives flexibility to change trial period
2. **Price centralized** in shared constants - easy to update
3. **PayFast over Stripe** - better for South African market
4. **Providers linked to Users** - one login system, user can optionally become provider
5. **Support groups admin-only** - Phase 2 will allow providers to create groups

## Code Patterns
- Angular signals for state management
- Standalone components (no NgModules)
- Express with TypeScript
- Shared types between frontend/backend via @findlocal/shared package
- Tailwind with custom color tokens (primary, success, warning, error, info)

## Recent Commits
- `52c962d` - Add trial status to subscription UI and update price to R150
- `5cbd836` - Add provider listings, support groups, PayFast, and trial system
- `e872670` - Fix unused RouterLink import warning in Dashboard
- `085acf8` - Initial scaffolding for findlocal.care
