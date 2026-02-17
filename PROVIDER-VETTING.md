# Provider Vetting Feature — Implementation Plan

## Overview

When a practitioner registers, they must supply their professional body membership/registration numbers. Their profile remains **hidden from public search** until an admin has vetted and approved them.

---

## Data Model Changes

### 1. New `ProfessionalBodyMembership` interface (shared types)

Replaces the current `registrations: string[]` toggle-chip pattern with a **repeatable structured entry** — the same pattern used for `certifications`.

```typescript
// shared/src/types/provider.types.ts

export type ProfessionalBodyName =
  | 'HPCSA'
  | 'SACSSP'
  | 'ASCHP'
  | 'CCSA'
  | 'Counselling-SA'
  | 'SAAC'
  | 'Other';

export interface ProfessionalBodyMembership {
  body: ProfessionalBodyName;       // selected from predefined list or 'Other'
  otherBodyName?: string;           // required when body === 'Other'
  registrationNumber: string;       // member/reg number
}
```

### 2. New vetting status fields on `Provider`

```typescript
// shared/src/types/provider.types.ts  (add to Provider interface)

vettingStatus: VettingStatus;
vettingNotes?: string;              // admin-facing notes
vettedAt?: Date;                    // timestamp of approval/rejection
vettedBy?: string;                  // admin user ID who vetted

// shared/src/types/provider.types.ts
export type VettingStatus = 'pending' | 'approved' | 'rejected';
```

### 3. Replace `registrations` field

| Current                       | New                                        |
|-------------------------------|--------------------------------------------|
| `registrations: string[]`    | `professionalBodies: ProfessionalBodyMembership[]` |

> The old `registrations` field should be **deprecated and migrated**. A migration script converts each existing string (e.g. `'HPCSA'`) into `{ body: 'HPCSA', registrationNumber: '' }` with `vettingStatus: 'approved'` (grandfather existing providers).

### 4. Updated constant

```typescript
// shared/src/constants/index.ts

// Replace PROVIDER_REGISTRATIONS with:
export const PROFESSIONAL_BODIES = [
  'HPCSA',
  'SACSSP',
  'ASCHP',
  'CCSA',
  'Counselling-SA',
  'SAAC',
] as const;
// 'Other' is always available in the UI but not in this list
```

---

## Mongoose Schema Changes

```typescript
// backend/src/models/Provider.ts

professionalBodies: [{
  body: {
    type: String,
    enum: ['HPCSA', 'SACSSP', 'ASCHP', 'CCSA', 'Counselling-SA', 'SAAC', 'Other'],
    required: true,
  },
  otherBodyName: {
    type: String,
    trim: true,
    // required when body === 'Other' — validated in controller
  },
  registrationNumber: {
    type: String,
    required: true,
    trim: true,
  },
}],

// Vetting
vettingStatus: {
  type: String,
  enum: ['pending', 'approved', 'rejected'],
  default: 'pending',
},
vettingNotes: { type: String, trim: true },
vettedAt:     { type: Date },
vettedBy:     { type: String },
```

---

## Visibility Logic Changes

### Current rule (providerController.ts)

```typescript
// A provider is publicly visible when:
isPublished: true,
$or: [
  { subscriptionStatus: 'active' },
  { trialEndsAt: { $gt: now } },
]
```

### New rule — add `vettingStatus: 'approved'`

```typescript
// A provider is publicly visible when ALL of:
isPublished: true,
vettingStatus: 'approved',
$or: [
  { subscriptionStatus: 'active' },
  { trialEndsAt: { $gt: now } },
]
```

Update **both**:
- `searchProviders` query (public listing)
- `getProviderById` query (public detail view)

---

## Backend Controller Changes

### providerController — `createProvider`

1. Accept `professionalBodies` array in request body.
2. Validate:
   - At least **one** professional body entry is required.
   - Each entry must have a non-empty `registrationNumber`.
   - If `body === 'Other'`, `otherBodyName` must be provided.
3. Set `vettingStatus: 'pending'` on creation.
4. Remove old `registrations` handling.
5. **(Optional)** Send a notification email to admin that a new provider is pending review.

### providerController — `updateProvider`

- Providers can update their `professionalBodies` entries.
- If a provider **changes** any `professionalBodies` entry, reset `vettingStatus` back to `'pending'` (re-vetting required). Alternatively, only re-vet if registration numbers change — business decision.
- Other profile edits (bio, pricing, etc.) should **not** reset vetting status.

### providerController — `getOwnProfile`

- Include `vettingStatus` in the response so the provider can see their vetting state.

### adminController — New endpoints

```
GET  /api/admin/providers/pending    → list providers with vettingStatus === 'pending'
POST /api/admin/providers/:id/vet    → { status: 'approved' | 'rejected', notes?: string }
GET  /api/admin/providers            → list all providers with filters (vettingStatus, type, etc.)
```

**Vet action logic:**
1. Set `vettingStatus` to `approved` or `rejected`.
2. Set `vettedAt` to now, `vettedBy` to admin's user ID.
3. Optionally store `vettingNotes`.
4. **(Optional)** Send email to provider informing them of approval/rejection.

---

## Shared Types Summary

```typescript
// === New types to add ===

export type ProfessionalBodyName =
  | 'HPCSA' | 'SACSSP' | 'ASCHP' | 'CCSA' | 'Counselling-SA' | 'SAAC' | 'Other';

export interface ProfessionalBodyMembership {
  body: ProfessionalBodyName;
  otherBodyName?: string;
  registrationNumber: string;
}

export type VettingStatus = 'pending' | 'approved' | 'rejected';

// === Modify Provider interface ===
// Remove:  registrations: string[];
// Add:
//   professionalBodies: ProfessionalBodyMembership[];
//   vettingStatus: VettingStatus;
//   vettingNotes?: string;
//   vettedAt?: Date;
//   vettedBy?: string;

// === Modify CreateProviderRequest ===
// Remove:  registrations: string[];
// Add:     professionalBodies: ProfessionalBodyMembership[];

// === New request type ===
export interface VetProviderRequest {
  status: 'approved' | 'rejected';
  notes?: string;
}
```

---

## Frontend Changes

### 1. Provider profile form — replace registration chips with repeatable entries

Follow the **same pattern as certifications**:

```typescript
// provider-profile.ts

professionalBodies = signal<ProfessionalBodyMembership[]>([]);

addProfessionalBody(): void {
  this.professionalBodies.set([
    ...this.professionalBodies(),
    { body: '' as any, otherBodyName: '', registrationNumber: '' }
  ]);
}

removeProfessionalBody(index: number): void {
  this.professionalBodies.set(
    this.professionalBodies().filter((_, i) => i !== index)
  );
}

updateProfessionalBody(index: number, field: keyof ProfessionalBodyMembership, value: any): void {
  const updated = [...this.professionalBodies()];
  updated[index] = { ...updated[index], [field]: value };
  this.professionalBodies.set(updated);
}
```

**Template** — for each entry:
- `<select>` dropdown with the 6 predefined bodies + "Other"
- Conditionally show a text input for `otherBodyName` when "Other" is selected
- Text input for `registrationNumber` (always required)
- Remove button
- "Add Professional Body" dashed button to append a new empty entry

### 2. Vetting status banner on provider profile

When the provider views their own profile, show a status banner:

| Status     | Banner                                                                 |
|------------|------------------------------------------------------------------------|
| `pending`  | ⏳ "Your profile is under review. It will be visible once approved."   |
| `approved` | ✅ "Your profile has been approved and is visible to the public."      |
| `rejected` | ❌ "Your registration could not be verified. Please contact support."  |

### 3. Admin dashboard — vetting panel

Add a new section or tab to the admin dashboard:

- **Pending providers list** showing: display name, type, professional bodies + reg numbers, date registered.
- Each row has **Approve** and **Reject** buttons (with optional notes field).
- After action, provider moves out of the pending list.
- Optional: a full provider list with vetting status filter.

---

## Migration

A one-time migration script (`backend/src/scripts/migrate-registrations.ts`) to handle existing data:

```typescript
// For each provider with registrations: string[]
// Convert to professionalBodies: ProfessionalBodyMembership[]
// Set vettingStatus: 'approved' (grandfather existing providers)

db.providers.find({ registrations: { $exists: true, $ne: [] } }).forEach(doc => {
  const professionalBodies = doc.registrations.map(reg => ({
    body: reg,
    registrationNumber: '', // unknown for existing providers
  }));
  db.providers.updateOne(
    { _id: doc._id },
    {
      $set: {
        professionalBodies,
        vettingStatus: 'approved',
      },
      $unset: { registrations: '' },
    }
  );
});

// For providers with no registrations, also set vettingStatus: 'approved'
db.providers.updateMany(
  { vettingStatus: { $exists: false } },
  { $set: { vettingStatus: 'approved' } }
);
```

---

## Implementation Order

1. **Shared types & constants** — add new types, update `Provider`, `CreateProviderRequest`
2. **Backend model** — update Mongoose schema
3. **Migration script** — convert existing data
4. **Backend controller** — update create/update/search, add admin vet endpoints
5. **Backend routes** — wire up new admin endpoints
6. **Frontend provider profile** — replace registration chips with repeatable form
7. **Frontend vetting status banner** — show status to providers
8. **Frontend admin panel** — vetting queue UI
9. **Email notifications** (optional) — notify admin on new registration, notify provider on vetting outcome
10. **Tests** — update existing tests, add vetting tests

---

## Questions / Decisions

| # | Decision | Options | Recommendation |
|---|----------|---------|----------------|
| 1 | Should editing `professionalBodies` reset vetting status? | Always / Only if reg numbers change / Never | Only if reg numbers change |
| 2 | Should trial timer start on registration or on approval? | On registration / On approval | On approval (so vetting delay doesn't eat into trial) |
| 3 | Admin notification on new pending provider? | Email / Dashboard-only / Both | Both |
| 4 | Should rejected providers be able to re-submit? | Yes (update & go back to pending) / No | Yes |
| 5 | Minimum entries required? | At least 1 / Optional | At least 1 professional body required |
