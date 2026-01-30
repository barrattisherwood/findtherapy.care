# Deployment Guide - findtherapy.care

This document describes the complete CI/CD pipeline and deployment setup for the findtherapy.care application.

## Overview

The project uses a modern CI/CD pipeline with:
- **Frontend**: Deployed to Vercel
- **Backend**: Deployed to Railway
- **CI/CD**: GitHub Actions
- **Containerization**: Docker (optional, for local development)

---

## Project Structure

```
findtherapy.care/
├── .github/workflows/
│   ├── ci.yml                    # Continuous Integration
│   ├── deploy-staging.yml        # Staging deployment
│   └── deploy-production.yml     # Production deployment
├── backend/
│   ├── Dockerfile                # Backend container
│   ├── .dockerignore
│   └── railway.toml              # Railway configuration
├── frontend/
│   └── vercel.json               # Vercel configuration
└── docker-compose.yml            # Local development stack
```

---

## CI/CD Pipeline

### 1. Continuous Integration (ci.yml)

**Triggers:**
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

**Jobs:**
1. **shared-test** - Build shared package
2. **backend-lint** - ESLint backend code
3. **backend-test** - Run 71 Jest unit tests
4. **backend-build** - TypeScript compilation check
5. **frontend-lint** - ESLint frontend code
6. **frontend-test** - Run 61 Vitest unit tests
7. **frontend-build** - Build Angular production bundle

**Status:** ✅ All jobs must pass before merge

---

### 2. Staging Deployment (deploy-staging.yml)

**Trigger:** Push to `develop` branch

**Jobs:**
1. **deploy-frontend-staging** - Deploy to Vercel staging environment
2. **deploy-backend-staging** - Deploy to Railway staging service
3. **staging-health-check** - Verify deployments with health checks

**Environment Variables Required:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_STAGING`
- `RAILWAY_TOKEN`
- `STAGING_BACKEND_URL`
- `STAGING_FRONTEND_URL`

---

### 3. Production Deployment (deploy-production.yml)

**Triggers:**
- Push to `main` branch
- Manual workflow dispatch

**Jobs:**
1. **deploy-frontend-production** - Deploy to Vercel production
2. **deploy-backend-production** - Deploy to Railway production
3. **production-health-check** - Verify deployments
4. **rollback-on-failure** - Notify if health checks fail

**Features:**
- Creates deployment tags (`deploy-frontend-YYYYMMDD-HHMMSS`)
- Posts deployment URLs as commit comments
- Automated health checks (60s stabilization period)
- Failure notifications

**Environment Variables Required:**
- Same as staging, plus:
- `VERCEL_PROJECT_ID_PRODUCTION`
- `PRODUCTION_BACKEND_URL`
- `PRODUCTION_FRONTEND_URL`

---

## Setup Instructions

### Prerequisites

1. **Vercel Account**
   - Create project for frontend
   - Get: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_STAGING`, `VERCEL_PROJECT_ID_PRODUCTION`

2. **Railway Account**
   - Create services: `backend-staging`, `backend-production`
   - Get: `RAILWAY_TOKEN`
   - Configure MongoDB addon

3. **GitHub Repository Secrets**
   - Go to Settings → Secrets and variables → Actions
   - Add all required secrets

### GitHub Secrets to Configure

```bash
# Vercel
VERCEL_TOKEN=<your-vercel-token>
VERCEL_ORG_ID=<your-org-id>
VERCEL_PROJECT_ID_STAGING=<staging-project-id>
VERCEL_PROJECT_ID_PRODUCTION=<production-project-id>

# Railway
RAILWAY_TOKEN=<your-railway-token>

# Health Check URLs
STAGING_BACKEND_URL=https://backend-staging.railway.app
STAGING_FRONTEND_URL=https://staging.findtherapy.care
PRODUCTION_BACKEND_URL=https://backend.railway.app
PRODUCTION_FRONTEND_URL=https://findtherapy.care
```

### Railway Environment Variables

Configure these in Railway dashboard for each service:

```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=<railway-mongodb-connection-string>
JWT_SECRET=<secure-random-string>
FRONTEND_URL=https://findtherapy.care
BACKEND_URL=https://backend.railway.app

# PayFast
PAYFAST_MERCHANT_ID=<your-merchant-id>
PAYFAST_MERCHANT_KEY=<your-merchant-key>
PAYFAST_PASSPHRASE=<your-passphrase>
PAYFAST_SANDBOX=false  # true for staging

# Email (SendGrid/SMTP)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=<sendgrid-api-key>
EMAIL_FROM=noreply@findtherapy.care

# Twilio SMS
TWILIO_ACCOUNT_SID=<your-account-sid>
TWILIO_AUTH_TOKEN=<your-auth-token>
TWILIO_PHONE_NUMBER=<your-twilio-number>
```

---

## Local Development with Docker

### Start all services:

```bash
# Create .env file in root with required variables
cp .env.example .env

# Start MongoDB, backend, and frontend
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

### Service URLs:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- MongoDB: mongodb://localhost:27017

---

## Testing

### Backend Tests (Jest)

```bash
cd backend
npm test                    # Run all 71 tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # Coverage report
```

**Test Suites:**
- `payfastService.spec.ts` - 18 tests
- `subscriptionController.spec.ts` - 16 tests (includes idempotency)
- `providerController.spec.ts` - 12 tests

### Frontend Tests (Vitest)

```bash
cd frontend
npm test                    # Run all 61 tests
npm test -- --watch         # Watch mode
npm test -- --coverage      # Coverage report
```

**Test Suites:**
- `subscription.service.spec.ts` - 35 tests
- `subscription-status.spec.ts` - 26 tests

---

## Security Features Implemented

### 1. PayFast IP Whitelist ([payfastIpWhitelist.ts](backend/src/middleware/payfastIpWhitelist.ts))
- Validates webhook requests come from PayFast servers
- Supports IPv4/IPv6
- Bypassed in development/test environments
- IP ranges: `197.97.145.144/28`, `41.74.179.192/27`, `102.216.36.0/24`

### 2. Idempotency ([PaymentEvent.ts](backend/src/models/PaymentEvent.ts))
- Prevents duplicate payment processing
- Uses unique `pfPaymentId` constraint
- 30-day TTL on payment events
- Handles race conditions gracefully

### 3. Rate Limiting ([rateLimiter.ts](backend/src/middleware/rateLimiter.ts))
- **Auth routes**: 10 requests per 15 minutes
- **Checkout**: 5 requests per 15 minutes
- **ITN webhook**: 100 requests per minute
- **Global API**: 100 requests per minute
- Skipped in test environment

### 4. Error Handling ([errors.ts](backend/src/utils/errors.ts))
- Custom error classes: `NotFoundError`, `ValidationError`, `UnauthorizedError`, `ForbiddenError`, `ConflictError`
- Global error handler middleware
- Structured error responses

### 5. Security Headers (vercel.json)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## Deployment Workflow

### Development Flow

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and test locally**
   ```bash
   cd backend && npm test
   cd ../frontend && npm test
   ```

3. **Create pull request to `develop`**
   - CI runs automatically
   - All tests must pass

4. **Merge to `develop`**
   - Auto-deploys to staging
   - Health checks run automatically

5. **Test on staging**
   - Verify functionality
   - Check health endpoints

6. **Create pull request to `main`**
   - Final review

7. **Merge to `main`**
   - Auto-deploys to production
   - Deployment tags created
   - Health checks run
   - Notifications posted

---

## Health Check Endpoints

### Backend
```
GET /api/health
Response: { "status": "ok", "message": "findtherapy.care API is running" }
```

### Docker Health Check
```bash
docker inspect --format='{{.State.Health.Status}}' findtherapy-backend
```

---

## Rollback Procedure

### Vercel Rollback
```bash
# Via Vercel dashboard
1. Go to project → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

# Via CLI
vercel rollback <deployment-url>
```

### Railway Rollback
```bash
# Via Railway dashboard
1. Go to service → Deployments
2. Find previous working deployment
3. Click "Redeploy"

# Via CLI
railway rollback
```

### Git-based Rollback
```bash
# Revert last commit on main
git revert HEAD
git push origin main

# Or reset to specific commit (force push required)
git reset --hard <commit-hash>
git push --force origin main
```

---

## Monitoring

### Recommended Monitoring Setup

1. **Vercel Analytics**
   - Enable in project settings
   - Track frontend performance

2. **Railway Logs**
   - View real-time logs in dashboard
   - Set up log drains to external service

3. **Error Tracking** (Optional)
   - Sentry integration for both frontend and backend
   - Track exceptions and performance

4. **Uptime Monitoring** (Optional)
   - UptimeRobot or similar
   - Monitor `/api/health` endpoint
   - Alert on downtime

---

## Troubleshooting

### CI Failing

**Backend tests timeout:**
- MongoDB binary download taking too long
- Solution: Tests use MongoDB 7.0.15 with 120s timeout
- Binary cached after first run

**Shared package not found:**
- Ensure shared package builds first
- Check artifact upload/download steps

### Deployment Failing

**Vercel build fails:**
- Check build logs in Vercel dashboard
- Verify environment variables
- Ensure `vercel.json` is correct

**Railway deployment fails:**
- Check Railway logs
- Verify `railway.toml` configuration
- Ensure MongoDB addon is connected

**Health check fails:**
- Wait longer (deployment may still be starting)
- Check service logs
- Verify environment variables

---

## File Reference

### New Files Created

**Backend:**
- [backend/src/middleware/payfastIpWhitelist.ts](backend/src/middleware/payfastIpWhitelist.ts) - IP whitelist for webhooks
- [backend/src/middleware/rateLimiter.ts](backend/src/middleware/rateLimiter.ts) - Rate limiting middleware
- [backend/src/models/PaymentEvent.ts](backend/src/models/PaymentEvent.ts) - Idempotency tracking
- [backend/src/utils/errors.ts](backend/src/utils/errors.ts) - Custom error classes
- [backend/Dockerfile](backend/Dockerfile) - Multi-stage Docker build
- [backend/.dockerignore](backend/.dockerignore) - Docker ignore patterns
- [backend/railway.toml](backend/railway.toml) - Railway configuration

**Frontend:**
- [frontend/vercel.json](frontend/vercel.json) - Vercel configuration

**CI/CD:**
- [.github/workflows/ci.yml](.github/workflows/ci.yml) - CI pipeline
- [.github/workflows/deploy-staging.yml](.github/workflows/deploy-staging.yml) - Staging deployment
- [.github/workflows/deploy-production.yml](.github/workflows/deploy-production.yml) - Production deployment

**Docker:**
- [docker-compose.yml](docker-compose.yml) - Local development stack

### Modified Files

**Backend:**
- [backend/src/controllers/subscriptionController.ts](backend/src/controllers/subscriptionController.ts) - Added idempotency
- [backend/src/routes/subscriptionRoutes.ts](backend/src/routes/subscriptionRoutes.ts) - Added middleware
- [backend/src/routes/authRoutes.ts](backend/src/routes/authRoutes.ts) - Added rate limiting
- [backend/src/server.ts](backend/src/server.ts) - Added global middleware

---

## Summary

✅ **Completed Implementation:**

1. **Testing Infrastructure**
   - Backend: 71 Jest tests passing
   - Frontend: 61 Vitest tests passing

2. **Security Enhancements**
   - PayFast IP whitelist
   - Payment idempotency
   - Rate limiting (auth, checkout, webhooks, global)
   - Error handling classes
   - Security headers

3. **CI/CD Pipeline**
   - Automated testing on PRs
   - Staging deployment on `develop` push
   - Production deployment on `main` push
   - Health checks and rollback notifications

4. **Deployment Configuration**
   - Vercel (frontend) with security headers
   - Railway (backend) with health checks
   - Docker for local development
   - Environment-specific configurations

Your application is now production-ready with comprehensive testing, security, and deployment automation! 🚀
