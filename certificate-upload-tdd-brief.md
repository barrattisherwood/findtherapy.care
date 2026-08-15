# TDD Build Brief: Certificate Upload for Provider Verification

## Context

Verification is currently manual — providers email documents (HPCSA number, ASCHP certificates, qualifications) to Barratt, who checks them by hand and replies via email. Recent cases (name mismatches, unverifiable registration numbers, candidate-counsellor status) show this is slow and error-prone at low volume, and won't scale as provider count grows toward 100+.

This feature adds an in-platform certificate upload step to onboarding, so documents are attached to the provider's record directly, and admins review/approve from a queue instead of hunting through email.

**This does not replace human judgement** — Barratt/Julia still decide what's valid. It just gets the document into the system and gives admins a structured approve/reject flow instead of email back-and-forth.

---

## Requirements

### Functional Requirements

1. During onboarding (or from their dashboard afterward), a provider can upload one or more documents: certificate, HPCSA/ASCHP proof, qualification.
2. Each upload requires the provider to select a **document type** (e.g. "HPCSA Registration", "ASCHP Registration", "Qualification Certificate", "Other") — this drives what admins expect to see.
3. Provider's `vettingStatus` field: `unverified` (default) → `pending` (docs uploaded) → `approved` or `rejected`.
4. Profile does not go live/publicly visible until `vettingStatus` is `approved` (and `isPublished` is set `true` alongside it) — this is a hard gate, not just a UI nicety.
5. Admin has a review queue listing all `pending` providers with their uploaded documents visible inline (no separate download step needed for common formats).
6. Admin can approve (→ `vettingStatus: 'approved'`, `isPublished: true`, profile goes live) or reject (→ `vettingStatus: 'rejected'`, must include a reason) directly from the queue.
7. On rejection, provider receives an automatic email with the admin's reason, and can re-upload/resubmit — status returns to `pending` on resubmission.
8. On approval, provider receives an automatic "you're verified and live" email.
9. Uploaded file types restricted to PDF, JPG, PNG (documents are certificates/scans, not arbitrary files). Max file size — recommend 10MB, confirm with Barratt if different.
10. Provider can see their own verification status and any rejection reason on their dashboard at all times.

### Non-Functional Requirements

- Documents contain personal/professional identifying information — stored via Cloudinary private/raw upload with only the `public_id` in MongoDB, never a public or directly-accessible URL. All access goes through the auth-gated streaming endpoint (see Storage Decision above).
- Admin review queue must load quickly even as document count grows — paginate, don't load everything at once.
- File upload must show progress/error state clearly (providers uploading from mobile on patchy connections is a realistic scenario).

---

## Storage Decision (resolved)

**Backend-streamed endpoint, via Cloudinary private/raw storage.** Reasoning from the build agent's recommendation:

- Files upload to Cloudinary using `type: 'private'` (or `raw`) — never a public delivery URL
- Only the Cloudinary `public_id` is stored in MongoDB on the `ProviderDocument` record, never a direct/signed URL
- `GET /provider/documents/:id` is the only access path: existing JWT auth middleware checks the requester (owning provider or admin) → server fetches the file from Cloudinary using the stored `public_id` → streams the response to the client
- The document never has a browser-facing URL at any point — no signed-URL leakage risk, no separate Cloudinary access-control configuration to get right
- Adds ~200–400ms latency streaming a 10MB PDF through the backend — acceptable for an admin queue that's reviewed manually, not a real-time feed
- Minimal new surface area: one new route, reuse of existing auth middleware, one Cloudinary fetch call — no new infrastructure

This supersedes the two Cloudinary-URL-based options originally sketched in Task 1/2 below — implement uploads as private/raw Cloudinary storage from the start, not as a public URL that gets locked down later.

```typescript
// apps/findtherapy-api/src/models/provider-document.model.ts

interface ProviderDocument {
  _id: ObjectId;
  providerId: ObjectId;
  documentType: 'hpcsa_registration' | 'aschp_registration' | 'qualification' | 'other';
  cloudinaryPublicId: string;   // Cloudinary public_id for private/raw upload — NEVER a public delivery URL
  fileName: string;              // original filename, for admin readability
  fileType: 'pdf' | 'jpg' | 'png';
  uploadedAt: Date;
  reviewedAt?: Date;             // set when the parent Provider transitions to 'approved' or 'rejected' — lets Task 7's deletion cron query ProviderDocument directly, without joining to Provider just to find its own retention window
  // Note: the deletion cron (Task 7) also needs to know approved-vs-rejected to pick the 90 vs 30 day window —
  // consider adding a lightweight `reviewOutcome?: 'approved' | 'rejected'` snapshot field alongside reviewedAt
  // rather than joining to Provider.vettingStatus for that one piece of information. Build agent's call.
}
```

Extend existing Provider model (do NOT add a new field — extend the existing `vettingStatus`):

```typescript
interface Provider {
  // ...existing fields...
  vettingStatus: 'unverified' | 'pending' | 'approved' | 'rejected';  // extended from existing 'pending' | 'approved' | 'rejected'
  isPublished: boolean;           // existing field — approval action must set this AND vettingStatus together
  verificationReviewedAt?: Date;
  verificationReviewedBy?: string;    // admin user ID
  verificationRejectionReason?: string;
}
```

**Do not introduce a parallel `verificationStatus` field.** The existing `vettingStatus` field already serves this purpose for the admin vetting queue — extend its enum with `'unverified'` as the new pre-document-upload default, rather than creating a second status field that can drift out of sync with the first. `isPublished` remains the existing separate boolean that gates public visibility — every approval action must set both `vettingStatus: 'approved'` and `isPublished: true` in the same operation, never one without the other.

---

## TDD Task Breakdown

Write the failing test first for each item, confirm it fails for the right reason, implement minimum code to pass, then move on.

This brief uses two test layers: **Tasks 1–7** are unit/integration tests (Jest-style — models, endpoints, services in isolation, fast feedback during development). **Task 8** is a Playwright end-to-end suite (real browser, real user flows, catches wiring/UI issues the unit layer can't see). Both layers are required, not alternatives to each other — see the note at the end of Task 8 for why.

---

### Task 1 — ProviderDocument model + upload endpoint

**Tests first:**
- [ ] Creating a document requires `providerId`, `documentType`, `cloudinaryPublicId`
- [ ] `documentType` rejects values outside the allowed enum
- [ ] `POST /api/provider/documents/upload` rejects file types other than PDF/JPG/PNG (test with a `.exe` or `.docx` upload attempt)
- [ ] `POST /api/provider/documents/upload` rejects files over the max size limit
- [ ] Successful upload creates a `ProviderDocument` record and returns its ID
- [ ] Successful upload sets the provider's `vettingStatus` to `pending` if it was previously `unverified` or `rejected`
- [ ] Upload endpoint requires provider authentication (401 test for unauthenticated request)
- [ ] A provider cannot upload a document against another provider's ID (test with mismatched auth token vs providerId in payload)

**Then implement:**
- Mongoose schema for `ProviderDocument`
- `POST /api/provider/documents/upload` — validates file type/size, uploads to Cloudinary using `type: 'private'` (or `raw`) — not the default public delivery type — stores the returned `public_id` on the record, updates provider `vettingStatus`

---

### Task 2 — Secure document access

**Tests first:**
- [ ] Fetching a document URL without valid admin auth (or without being the owning provider) returns 403
- [ ] Fetching as the owning provider succeeds
- [ ] Fetching as an authenticated admin succeeds
- [ ] Requesting a document's Cloudinary asset directly (bypassing the backend endpoint) fails/is inaccessible — confirm the private/raw upload type actually blocks direct access, not just that the backend route has an auth check
- [ ] `ProviderDocument` MongoDB records never contain a plain public Cloudinary delivery URL — only `cloudinaryPublicId`

**Then implement:**
- `GET /api/provider/documents/:id` — auth-gated (existing JWT middleware), resolves `cloudinaryPublicId` → fetches from Cloudinary server-side → streams response to client, checks requester is either the owning provider or an admin

---

### Task 3 — Provider-facing verification status

**Tests first:**
- [ ] `GET /api/provider/verification-status` returns current status, uploaded documents list, and rejection reason if applicable, for the authenticated provider
- [ ] Returns 401 if unauthenticated

**Then implement:**
- `GET /api/provider/verification-status` endpoint
- Angular dashboard component showing status badge (`unverified`/`pending`/`approved`/`rejected` as the underlying code value — display text shown to the provider can read "Approved" or "Verified", but the value in code must be `approved` to match the enum), uploaded docs list, rejection reason banner if rejected, and an upload/re-upload form

---

### Task 4 — Extend existing admin vetting queue with document display

**Do not create a new `/api/admin/verification-queue` endpoint.** An admin vetting queue endpoint already exists and lists `pending` providers — locate it first (check the admin dashboard/vetting page routes) and extend it. This task and Task 5 (approve/reject) touch the same existing endpoint/component and should likely be done together.

**Tests first:**
- [ ] Existing vetting queue endpoint's tests still pass after extension — confirm no regression
- [ ] Existing queue response now includes each pending provider's uploaded documents (with a means to view them — e.g. a document-fetch reference/ID, not a raw URL, consistent with the Storage Decision above)
- [ ] Queue remains admin-auth-guarded (should already be true — confirm it's not accidentally loosened during the extension)
- [ ] Queue sort order (oldest-submission-first, or whatever the existing endpoint already does) is preserved or deliberately adjusted — don't let document-related changes silently change unrelated sort behaviour

**Then implement:**
- Extend the existing vetting queue endpoint/query to join in `ProviderDocument` records for each pending provider
- Extend the existing admin vetting UI component with inline document preview (PDF/image viewer, not just a download link) for each provider — reuse existing table/list structure rather than building a new page

---

### Task 5 — Extend existing approve/reject actions for the document-driven flow

**Do not assume `POST /api/admin/providers/:id/verify` and `/reject` are new endpoints.** An approve/reject admin action already exists as part of the current vetting flow. Locate it first and extend it — this task adds new *behaviour* (email notifications, `isPublished` sync, document-resubmission reset) to the *existing* action, not new routes. If the existing endpoints use different names/paths than `verify`/`reject`, use the real ones and update this brief's references accordingly rather than building parallel routes with these names.

**Tests first:**
- [ ] Existing approve action's tests still pass after extension — confirm no regression
- [ ] Approve action sets `vettingStatus` to `approved` AND `isPublished` to `true` in the same operation, sets `verificationReviewedAt`/`verificationReviewedBy` (test both fields update together, not just one — this may already partly exist, extend rather than replace)
- [ ] Approve action also sets `reviewedAt` on the provider's associated `ProviderDocument` record(s) — this is what Task 7's deletion cron reads, so it must be set at approval time, not derived later
- [ ] Approve action now also triggers an approval email to the provider (new behaviour, if not already present)
- [ ] Existing reject action's tests still pass after extension
- [ ] Reject action requires a `reason` in the request body (400 if missing/empty) — confirm this validation exists already or add it
- [ ] Reject action sets `vettingStatus` to `rejected` (and `isPublished` to `false`, if it was previously `true`) and stores the reason
- [ ] Reject action also sets `reviewedAt` on the associated `ProviderDocument` record(s), same as approve
- [ ] Reject action now also triggers a rejection email containing the reason (new behaviour, if not already present)
- [ ] Both actions remain admin-auth-gated (confirm not accidentally loosened)
- [ ] Re-uploading a document after rejection resets `vettingStatus` to `pending` AND clears `reviewedAt` on the new `ProviderDocument` record (it's a fresh document, not yet reviewed — integration test spanning Task 1 + Task 5 — confirms the full loop closes)

**Then implement:**
- Locate the existing approve/reject admin action(s) and add: email notification triggers, the `isPublished` sync guarantee, `reviewedAt` propagation to the associated `ProviderDocument` record(s), and the resubmission-resets-to-pending behaviour
- Wire up approval/rejection email templates (can reuse tone/structure from existing manual verification emails Barratt has sent)
- **Confirmed:** the Provider model already has `vettingStatus` and `isPublished` fields, currently used to gate visibility on blog author cards and provider-authored posts (see `blogController.ts` — posts return nothing / 404 when the linked provider is unpublished). This verification flow extends `vettingStatus` rather than adding a new field, and the approval action must set `vettingStatus: 'approved'` AND `isPublished: true` together, always in the same operation — never one without the other, to avoid the two fields drifting out of sync.
- Build agent should locate and reuse the existing publish-gating logic already exercised by `blogController.authorCard` tests (7 passing tests referenced in prior work covering unpublished providers, deleted provider references, and unpublished post 404s) rather than writing a second gate from scratch.

---

### Task 6 — Backfill migration for existing published providers (REQUIRED, not optional)

This is a required migration step, not an open question. Without it, deploying this feature with `vettingStatus` defaulting to `'unverified'` for the new pre-document-upload state would incorrectly gate every currently-published provider who was approved before this system existed.

**Tests first:**
- [ ] Migration script sets `vettingStatus: 'approved'` for every provider currently at `isPublished: true` and `vettingStatus` in its old pre-extension state (i.e. anyone published before this migration runs), leaving `isPublished: true` untouched
- [ ] Migration is idempotent — running it twice does not change already-migrated records or throw
- [ ] Providers who were NOT published before migration are unaffected (remain at whatever their pre-migration state was, or default to `unverified` if genuinely new/never reviewed)

**Then implement:**
- One-off migration script, run once against production before this feature ships
- Confirm with Barratt beforehand: are there any `isPublished: true` providers with no admin-vetting paper trail at all? If so they still get backfilled as `approved` (Recommend: don't create retroactive work re-verifying people already trusted and live).

---

## Data Retention Policy

Certificate/document files contain sensitive identifying information (ID numbers, registration numbers, certificate scans) and should not be retained indefinitely once their purpose — verifying the provider at signup — has been served. This follows POPIA's data minimization principle (Section 4, Condition 3): personal information should not be kept longer than necessary for the purpose it was collected for.

**Policy: retain the document file for 90 days after approval, then delete it. Retain the verification record indefinitely.**

*(Confirmed against the published privacy policy — no conflicting retention language exists. See Open Questions — Resolved, item 3, for a follow-up note on updating the policy's wording to disclose this once shipped.)*

This splits the sensitive artifact (the file itself) from the low-sensitivity metadata (the fact that verification happened, when, by whom, and the outcome):

- **Document file (Cloudinary asset):** deleted automatically 90 days after `vettingStatus` transitions to `approved`. The 90-day window exists to allow a short grace period for disputes, re-review, or admin error correction before the source document is gone for good — not to justify indefinite retention.
- **Verification record (MongoDB):** kept indefinitely as long as the provider is listed. This includes `documentType`, `verificationReviewedAt`, `verificationReviewedBy`, and outcome — but not the file itself once deleted. This gives an audit trail (what was checked, when, by whom) without holding onto the actual sensitive document.
- **Rejected documents:** deleted sooner — 30 days after rejection, since there's less reason to retain a document tied to a provider who isn't listed. Rejection reason text is retained (it's Barratt/Julia's own assessment, not the provider's sensitive data).
- **If a provider requests earlier deletion** (POPIA gives data subjects a right to request this), the 90/30-day window should be overridable by a manual admin delete action — don't make the automated schedule the only path to deletion.

This is a policy decision, not just a technical one — flagging that Barratt should sanity-check the 90/30-day windows against how the provider agreement/privacy policy is worded (if it commits to a different retention period, this needs to match).

---

### Task 7 — Scheduled document deletion

Because `ProviderDocument.reviewedAt` is set directly on the document record as part of Task 5's approve/reject actions, this job queries `ProviderDocument` alone — no join to `Provider` needed to determine what's due for deletion. The document knows its own retention clock.

**Tests first:**
- [ ] A cron/scheduled job identifies `ProviderDocument` records where the associated provider's outcome was `approved` and `reviewedAt` is more than 90 days in the past, and deletes the Cloudinary asset + clears `cloudinaryPublicId` on the record (retaining the rest of the record's metadata) — query directly on `ProviderDocument.reviewedAt`, not via a join
- [ ] Same job identifies documents tied to a `rejected` outcome with `reviewedAt` more than 30 days in the past, and deletes them the same way
- [ ] Deletion does not touch documents still within their retention window (test a document at 89 days is untouched, one at 91 days is deleted)
- [ ] Documents with no `reviewedAt` set (still `pending`, never reviewed) are never touched by this job, regardless of `uploadedAt` age — only reviewed documents have a retention clock
- [ ] Deleting the Cloudinary asset does not delete the `ProviderDocument` record itself — only clears the file reference, preserving the audit trail
- [ ] Manual admin-triggered early deletion (`DELETE /api/admin/providers/:providerId/documents/:id`) works independently of the scheduled job, for POPIA data-subject deletion requests — admin-auth-gated
- [ ] Attempting to view a document via `GET /api/provider/documents/:id` after its file has been deleted returns a clear "document no longer available" response, not a broken/opaque error

**Then implement:**
- Scheduled job (reuse existing cron infrastructure if the codebase has one, e.g. alongside the follow-up email cron from the provider blog system) — query `ProviderDocument` directly on `reviewedAt`, since the outcome-at-time-of-review needs to be knowable from the document record too (either store a lightweight `outcome: 'approved' | 'rejected'` snapshot on `ProviderDocument` itself alongside `reviewedAt`, or confirm with the build agent's judgement whether a single indexed field covering both is cleaner than deriving outcome from a join — either way, avoid a join purely to find records due for deletion)
- `DELETE /api/admin/providers/:providerId/documents/:id` — manual override for early deletion requests
- Handle the "file deleted but record exists" state gracefully across the provider dashboard and admin queue UI (should show something like "Approved — document on file until [date]" or "Document retention period expired" rather than a broken image/404)

---

### Task 8 — Playwright end-to-end test suite

Convert the manual verification checklist into an automated Playwright suite. This runs against a real browser and a running instance of the app (local/staging), covering what unit and integration tests structurally can't: actual file-picker interaction, real page navigation/redirects, and visual confirmation that the admin's inline document viewer renders rather than just returning correct JSON.

**Setup (if Playwright isn't already in the repo):**
- [ ] Confirm whether Playwright is already configured anywhere in the monorepo (check `package.json` / existing `playwright.config.ts`) — if the codebase already uses it for other flows (e.g. the provider onboarding or blog editor), extend the existing config/project rather than adding a second Playwright setup
- [ ] If not present, add `@playwright/test`, configure against a local/staging base URL, and set up test-user fixtures (a seedable test provider account, a seedable test admin account) — do not run this suite against production data

**Tests first (write these as failing specs before the feature exists, same TDD discipline as the rest of this brief):**

- [ ] **Upload flow:** log in as a test provider with `vettingStatus: 'unverified'`, navigate to the document upload area, use Playwright's file upload API to attach a real test PDF fixture, submit, and assert the dashboard now shows a `pending` status badge
- [ ] **File type rejection (UI level):** attempt to upload a `.docx` test fixture through the actual file input, assert the UI shows a clear error rather than silently failing or allowing a bad submission through
- [ ] **Gating — pending provider not publicly visible:** as an unauthenticated browser context, navigate to the test provider's public profile URL and assert it 404s or redirects, while `vettingStatus` is still `pending`
- [ ] **Admin queue rendering:** log in as a test admin, navigate to the (extended, existing) vetting queue, assert the test provider's row appears with a visible, actually-rendered document preview (assert on the preview element existing and loading, not just that a link is present)
- [ ] **Approve flow, full loop:** as admin, click approve on the test provider, assert a success state in the UI, then switch to an unauthenticated context and confirm the provider's public profile is now reachable (this is the test that actually proves `vettingStatus` and `isPublished` moved together — a unit test can assert both fields update in the database, but this proves the *effect* is real from a user's perspective)
- [ ] **Reject flow, full loop:** as admin, click reject, enter a reason in the UI, submit, then switch back to the provider account and assert the rejection reason is visible on their dashboard, and that a re-upload is possible and moves status back to `pending`
- [ ] **Retention-aware dashboard state:** for a document past its retention window (seed a `ProviderDocument` with `reviewedAt` set far enough in the past, or call Task 7's deletion logic directly in test setup), assert the provider dashboard renders a sensible "document retention period expired" (or similar) state rather than a broken image or console error
- [ ] **Direct URL access as non-allowlisted/unverified provider:** attempt to navigate directly to any gated route as a `pending` or `rejected` provider and confirm the UI-level redirect/block actually happens in a real browser (this complements, not replaces, the backend 403 test from Task 1 — confirms the frontend guard is wired up too, not just the API)

**Then implement:**
- The feature itself (Tasks 1–7), driven by making these Playwright specs pass, same test-first discipline as the rest of this brief
- Test fixtures: a sample valid PDF, a sample invalid file type, seed scripts or API calls to reset test provider/admin accounts between runs
- Run this suite in CI if the repo already has a CI pipeline with Playwright wired in; if not, at minimum document how to run it locally before merging

**Note on scope:** Playwright specs here intentionally overlap with some unit/integration tests in Tasks 1–7 — that's expected and fine. Unit tests confirm the logic is correct in isolation and give fast feedback during development; this Playwright suite confirms the pieces are actually wired together correctly end-to-end. Keep both — don't treat the Playwright suite as a replacement for the unit-level tests earlier in this brief.

---

## Open Questions — Resolved

1. **Max file size:** confirmed 10MB.
2. **Existing published providers / backfill edge cases:** none. All ~33 current providers went through the same manual vetting process (email back-and-forth, same as the Masego/Lente pattern) — no early providers predate a real verification process. The Task 6 backfill can treat all currently-`isPublished: true` providers uniformly, backfilled to `vettingStatus: 'approved'`, with no special-casing needed.
3. **Retention windows (90 days approved / 30 days rejected):** confirmed, no conflict. The published privacy policy (last updated Feb 11, 2026) does not specify any retention period for documents or personal information — Section 5 covers security measures and Section 6 confirms the POPIA deletion right, but neither commits to a specific timeframe. 90/30 days can proceed as designed.

   **Follow-up, not a build blocker:** once this feature ships, the privacy policy should be updated to actually state this retention period (e.g. under Section 2 or a new "Data Retention" section) — right now the policy promises a deletion *right* but doesn't disclose how long documents are normally kept before that right is even exercised. This is a policy-wording task for Barratt, separate from the build itself, and doesn't need to block Task 7.

## Out of Scope

- Automated document verification (OCR, matching name on cert to profile name, checking against HPCSA/ASCHP registers programmatically) — this remains a human judgement call for now, per the Masego case
- Multi-document versioning/history beyond the current re-upload-on-rejection flow
