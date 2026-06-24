# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev              # All three packages in parallel (shared watch + backend nodemon + frontend ng serve)
npm run dev:shared       # Watch-compile shared package only
npm run dev:backend      # Backend only (nodemon)
npm run dev:frontend     # Angular dev server on :4200
```

### Building
```bash
npm run build            # shared → frontend → backend (in order)
npm run vercel-build     # shared → frontend only (used by Vercel CI)
cd shared && npm run build   # Required after any shared type/constant change before other packages see it
```

### Testing
```bash
# Backend (Jest + mongodb-memory-server)
cd backend && npm test
cd backend && npm test -- path/to/test.spec.ts     # Single test file
cd backend && npm run test:watch
cd backend && npm run test:coverage                 # 80% line/function threshold

# Frontend (Vitest)
cd frontend && npm test
cd frontend && npm test -- --include="**/specific.spec.ts"

# E2E (Playwright — config lives in e2e/playwright.config.ts; server auto-starts)
npm run test:e2e
npm run test:e2e:ui
npx playwright test --config e2e/playwright.config.ts e2e/tests/admin.spec.ts  # single file
```

### Backend scripts
```bash
cd backend && npm run seed          # Seed test data (admin: admin@findtherapy.care / admin123)
cd backend && npm run migrate       # Run DB migrations
cd backend && npm run admin         # Admin account management CLI
```

## Architecture

### Monorepo structure
Three npm workspaces: `shared` → consumed by both `backend` and `frontend`.

```
shared/     @findlocal/shared — types + constants only, no runtime dependencies
backend/    Express 5 + Mongoose — REST API on port 3000
frontend/   Angular 21 standalone — SPA served by Vercel
e2e/        Playwright tests
```

**Critical rule:** After editing anything in `shared/src/`, run `cd shared && npm run build` before the dev server picks up changes. The frontend/backend reference `shared/dist/`, not the source.

### Shared package exports
Everything is re-exported from `shared/src/index.ts`. Key exports:
- Types: `Provider`, `ProviderType`, `BlogPost`, `User`, `SupportGroup`, `StructuredLocation`
- Constants: `PROVIDER_SPECIALTIES` (32), `PROFESSIONAL_BODIES`, `PROVIDER_DEGREES`, `MAJOR_CITIES`, `CITY_CONFIGS`, `SA_CITIES`, `SA_PROVINCES`, `TRIAL_PERIOD_DAYS=60`, `SUBSCRIPTION_PRICE_ZAR=150`

### Frontend (Angular 21)
- **Standalone components only** — no NgModules. Every component declares its own `imports`.
- **Signals** for all reactive state (`signal()`, `.set()`, `.update()`). No RxJS subjects for component state.
- **`@if`/`@for` control flow** — not `*ngIf`/`*ngFor` directives.
- **Lazy routing** — every route uses `loadComponent`. Guards: `authGuard`, `adminGuard`.
- **`FormsModule` vs `ReactiveFormsModule`**: Do not mix `[ngModel]` inside `[formGroup]` — use native `[value]`/`(input)` bindings instead when a reactive form is present.
- **Markdown rendering** — blog content goes through `MarkdownService.render()` which strips `[AUTHOR]...[/AUTHOR]` tags before parsing with `marked`.
- **Environments** — `environment.ts` (production), `environment.development.ts` (dev). Dev build swaps via `fileReplacements` in `angular.json`.
- **Tailwind** — all styling. SCSS files are per-component but contain Tailwind utilities. Budget warnings at 500kB initial / 4kB component style.

### Backend (Express)
- **Structure:** `routes/` → `controllers/` → `models/` (Mongoose). Services (`cloudinary`, `email`, `payfast`) are called from controllers.
- **Middleware chain:** `rateLimiter` → `authMiddleware` (JWT, sets `req.userId`) → `adminMiddleware` (checks `User.isAdmin`).
- **All admin routes** require both `authMiddleware` and `adminMiddleware`.
- **Blog image uploads** go via Cloudinary (`cloudinaryService`) — not stored locally.
- **Sitemap** is dynamically generated at `GET /sitemap.xml` — queries approved/published providers to include their profile URLs.
- **PayFast webhooks** are protected by IP whitelist middleware (`payfastIpWhitelist.ts`).

### Authentication
JWT issued on login, stored in `localStorage`, sent as `Authorization: Bearer <token>`. The auth interceptor (`frontend/src/app/interceptors/`) attaches it to every API request. Token carries `userId`; the middleware resolves the full user from MongoDB.

### Database
MongoDB via Mongoose. Key models: `User`, `Provider`, `BlogPost`, `SupportGroup`, `AdminLog`, `ContactMessage`, `PaymentEvent`. Providers have a status flow: `vettingStatus` (pending → approved/rejected) and `subscriptionStatus` (trial → active → expired).

### Provider search
City filtering uses slugs (`cape-town`, `johannesburg`) — never display names. The `StructuredLocation` type stores `city` as a slug. `CITY_CONFIGS[slug]` maps slugs to display names. `SA_CITIES` has the full list with suburbs and aliases.

### Deployment
- **Frontend → Vercel**: `vercel.json` proxies `/sitemap.xml` to the Railway backend (rewrite, not redirect), and rewrites all other unmatched routes to `/index.html` for SPA routing.
- **Backend → Railway**: Dockerfile multi-stage build (builder: tsc compile; production: dist only + prod deps).
- **`FRONTEND_URL`** on Railway contains all Vercel domain aliases comma-separated — never use it directly as a base URL (hardcode `https://findtherapy.care` instead).
- Pre-push hook runs a full production build of all three packages before allowing push.
