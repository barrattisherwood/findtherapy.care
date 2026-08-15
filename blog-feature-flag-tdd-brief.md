# TDD Build Brief: Provider Blog Feature Flag

## Context

The Provider Blog Submission system (invitation campaigns, submission form, Claude review, admin approval) is built but must **not be visible to providers yet**. Only Barratt and Julia (admin users) should be able to see and use the feature while it's being tested. Admins need a UI toggle to turn it on for all providers when ready — no redeploy required.

This brief describes a `FeatureFlag` system, generalised so it can gate other unreleased features later, with the first flag being `provider_blog`.

---

## Requirements

### Functional Requirements

1. A `FeatureFlag` MongoDB collection stores flags by key, with a global `enabled` boolean and an `allowlistedAdminIds` array.
2. When a flag is **disabled globally**, only users whose ID appears in `allowlistedAdminIds` can access the gated functionality.
3. When a flag is **enabled globally**, it is visible to everyone regardless of allowlist (allowlist becomes irrelevant once enabled).
4. Admins have a settings UI to view all flags and toggle `enabled` on/off. No env vars, no redeploy.
5. The following provider-facing surfaces must be gated by the `provider_blog` flag:
   - Provider blog submission form route (`/provider/blog/submit`)
   - Provider dashboard "My Blog Submissions" nav item / card
   - Backend submission API endpoint (`POST /api/provider-blog/articles/submit`) — reject with 403 if flag is off and requester is not allowlisted
6. Admin-only surfaces (campaign creation, review dashboard) are **not** gated — admins can always see/use their own tools regardless of flag state, since they need to configure things before flipping the flag on.
7. Public blog listing/published articles are **not** gated by this flag — already-published content must remain visible regardless of flag state.
8. Middleware/guard checks the flag server-side (not just hiding UI client-side) — a provider must not be able to hit the submission endpoint directly via API even if they find the URL.

### Non-Functional Requirements

- Flag checks must be fast (cached in-memory with short TTL, e.g. 60s) — don't hit Mongo on every request.
- Adding a new flag in future should require zero code changes to the flag infrastructure itself — just a new document with a new `key`.
- Toggling a flag takes effect within the cache TTL window (no manual cache-bust required, though a "force refresh" admin action is a nice-to-have).

---

## Data Model

```typescript
// apps/findtherapy-api/src/models/feature-flag.model.ts

interface FeatureFlag {
  _id: ObjectId;
  key: string;                    // unique, e.g. "provider_blog"
  description: string;            // human-readable, shown in admin UI
  enabled: boolean;                // global on/off
  allowlistedAdminIds: string[];   // admin user IDs who can see it even when disabled
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string;                // admin user ID who last toggled it
}
```

Seed data (initial migration/seed script):

```typescript
{
  key: 'provider_blog',
  description: 'Provider-written blog submissions (invitation campaigns, submission form, Claude review workflow)',
  enabled: false,
  allowlistedAdminIds: ['<barratt_admin_id>', '<julia_admin_id>'],
}
```

---

## TDD Task Breakdown

Each task below should be implemented **test-first**: write the failing test, confirm it fails for the right reason, implement the minimum code to pass, refactor if needed, then move to the next task. Do not skip ahead and implement multiple tasks before writing their tests.

---

### Task 1 — FeatureFlag model + repository

**Tests first (`feature-flag.model.spec.ts`):**
- [ ] Creating a flag with a duplicate `key` throws/rejects (unique index)
- [ ] `key` is required
- [ ] `enabled` defaults to `false` if not provided
- [ ] `allowlistedAdminIds` defaults to empty array if not provided

**Then implement:**
- Mongoose schema with unique index on `key`
- Basic CRUD repository functions: `getFlag(key)`, `getAllFlags()`, `updateFlag(key, updates)`

---

### Task 2 — FeatureFlagService with caching

**Tests first (`feature-flag.service.spec.ts`):**
- [ ] `isEnabledFor(key, userId)` returns `true` when flag `enabled === true`, regardless of `userId`
- [ ] `isEnabledFor(key, userId)` returns `true` when flag `enabled === false` but `userId` is in `allowlistedAdminIds`
- [ ] `isEnabledFor(key, userId)` returns `false` when flag `enabled === false` and `userId` is not in `allowlistedAdminIds`
- [ ] `isEnabledFor(key, undefined)` returns `false` when flag is disabled (no user = no allowlist match, e.g. anonymous/unauthenticated request)
- [ ] `isEnabledFor(key, userId)` returns `false` for an unknown/non-existent flag key (fail closed, not open)
- [ ] Calling `isEnabledFor` twice within the cache TTL only queries Mongo once (mock/spy on the repository call count)
- [ ] After cache TTL expires, a subsequent call re-queries Mongo
- [ ] `invalidateCache(key)` forces the next call to re-query Mongo immediately, even within the TTL window

**Then implement:**
- `FeatureFlagService` with an in-memory cache (Map with timestamp, or a small LRU), 60s TTL
- `isEnabledFor(key: string, userId?: string): Promise<boolean>`
- `invalidateCache(key: string): void`
- Fail-closed behaviour for missing/unknown flags is critical — a typo'd flag key must never accidentally expose an unreleased feature

---

### Task 3 — Admin API: list + toggle flags

**Tests first (`feature-flags.routes.spec.ts`):**
- [ ] `GET /api/admin/feature-flags` returns all flags (admin auth required — test 401/403 without admin auth)
- [ ] `PATCH /api/admin/feature-flags/:key` updates `enabled` and sets `updatedBy` to the requesting admin's ID
- [ ] `PATCH /api/admin/feature-flags/:key` with an invalid/unknown key returns 404
- [ ] `PATCH /api/admin/feature-flags/:key` also calls `invalidateCache(key)` on the service (spy/mock to confirm cache is busted immediately on toggle — admin shouldn't have to wait for TTL)
- [ ] `PATCH /api/admin/feature-flags/:key` rejects non-admin users (403)
- [ ] `PATCH` does not allow modifying `key` or `allowlistedAdminIds` via this endpoint (only `enabled`) — separate endpoint/manual DB edit for allowlist changes, to avoid accidental exposure via a loosely-typed request body

**Then implement:**
- `GET /api/admin/feature-flags` — admin-auth-guarded list endpoint
- `PATCH /api/admin/feature-flags/:key` — admin-auth-guarded toggle endpoint, body `{ enabled: boolean }` only
- Wire up `invalidateCache` call after successful update

---

### Task 4 — Backend guard middleware for gated routes

**Tests first (`feature-flag.middleware.spec.ts`):**
- [ ] Middleware calls `next()` when flag is enabled for the requesting user
- [ ] Middleware returns 403 with a clear error body (e.g. `{ error: 'Feature not available' }`) when flag is disabled and user is not allowlisted
- [ ] Middleware correctly extracts `userId` from the authenticated request (test with a mock authenticated provider user)
- [ ] Middleware correctly handles unauthenticated requests (no user on request) — should not throw, should evaluate as "no allowlist match"

**Then implement:**
- `requireFeatureFlag(key: string)` middleware factory
- Apply to `POST /api/provider-blog/articles/submit` (and any other provider-blog write endpoints)

---

### Task 5 — Frontend: FeatureFlagService (Angular)

**Tests first (`feature-flag.service.spec.ts`, Angular/Jasmine):**
- [ ] `isEnabled$(key)` returns an observable that emits `true`/`false` based on API response
- [ ] Service caches the flags list after first fetch (does not re-call the API on every `isEnabled$` subscription within the same session) — spy on HttpClient call count
- [ ] `refresh()` forces a re-fetch from the API
- [ ] If the API call fails, `isEnabled$(key)` emits `false` (fail closed on the frontend too — never fail open on a network error)

**Then implement:**
- `FeatureFlagService` in `apps/findtherapy/src/app/services/`
- Fetches current user's visible flags via `GET /api/feature-flags/mine` (a provider-scoped endpoint — see Task 6) once per session, caches in a `BehaviorSubject`
- `isEnabled$(key: string): Observable<boolean>`
- `refresh(): void`

---

### Task 6 — Backend: provider-scoped "my flags" endpoint

**Tests first:**
- [ ] `GET /api/feature-flags/mine` returns `{ [key]: boolean }` map for all flags, evaluated for the requesting user (using `isEnabledFor`)
- [ ] Works for both authenticated providers and unauthenticated requests (evaluates as if `userId` is undefined for the latter)
- [ ] Does not leak flag metadata (description, allowlist contents) — only key → boolean

**Then implement:**
- `GET /api/feature-flags/mine` — lightweight endpoint, no admin auth required, returns evaluated booleans only (never expose the raw allowlist to non-admin clients)

---

### Task 7 — Frontend: gate the submission route and nav item

**Tests first (component/route guard specs):**
- [ ] `BlogFeatureGuard` (Angular route guard) allows navigation to `/provider/blog/submit` when `isEnabled$('provider_blog')` emits `true`
- [ ] `BlogFeatureGuard` redirects to a fallback route (e.g. provider dashboard home) when the flag emits `false`
- [ ] Provider dashboard component does not render the "My Blog Submissions" card/nav item when flag is `false`
- [ ] Provider dashboard component renders it when flag is `true`

**Then implement:**
- `BlogFeatureGuard` applied to the submission route in the router config
- Conditional `*ngIf` (or equivalent) on the dashboard nav item, driven by `FeatureFlagService.isEnabled$('provider_blog')`

---

### Task 8 — Admin settings UI: flag list + toggle

**Tests first (component spec):**
- [ ] Component fetches and displays all flags with their `key`, `description`, `enabled` state
- [ ] Clicking the toggle calls the PATCH endpoint with the new `enabled` value
- [ ] Toggle UI reflects optimistic update, then reconciles with server response
- [ ] Shows an error state if the PATCH call fails (and reverts the optimistic toggle)

**Then implement:**
- `FeatureFlagsAdminComponent` — simple table/list view under Admin Settings
- Toggle switch per flag, calls `FeatureFlagAdminService.toggle(key, enabled)`
- Basic confirmation on toggle (e.g. "Enable provider blog submissions for all providers?" before flipping on — this is a one-way door in practice, worth a confirm dialog)

---

### Task 9 — Seed script + migration

**Tests first:**
- [ ] Running the seed script twice does not create duplicate `provider_blog` flags (upsert by `key`, not insert)

**Then implement:**
- One-off seed script to insert the `provider_blog` flag with `enabled: false` and `allowlistedAdminIds` set to Barratt's and Julia's real admin IDs
- Document how to add Julia's admin ID if she doesn't have an admin account yet (dependency — confirm with Barratt before running)

---

### Task 10 — End-to-end verification (manual, post-automated-tests)

Once all automated tests pass:
- [ ] Log in as a non-allowlisted provider → confirm blog submission nav item is absent and direct URL navigation redirects away
- [ ] Attempt `POST` to the submission endpoint directly (e.g. via curl/Postman) as that provider → confirm 403
- [ ] Log in as Barratt (allowlisted) → confirm full feature is visible and usable
- [ ] Toggle `provider_blog.enabled` to `true` via admin UI → confirm the previously-blocked provider now sees the feature (within TTL window, or immediately if cache was invalidated on toggle)
- [ ] Toggle back to `false` → confirm it disappears again for that provider, remains visible for Barratt/Julia

---

## Open Dependency (blocking Task 9)

Need Julia's admin user ID (or need to confirm she has an admin account on findtherapy.care at all — if not, that's a prerequisite step before this flag can include her in the allowlist).

## Out of Scope

- Per-provider allowlisting (only admin allowlisting is needed here — providers as a group are either all in or all out)
- Percentage-based rollout / gradual release (not needed for this use case, but the schema doesn't preclude adding it later)
- Gating the public blog listing page (published articles remain visible regardless of this flag)
