# findtherapy.care — Blog Author Card + Featured Image Upload
## Build Brief & TDD Spec

**Two small features, one session (~1.5 max).** Both extend the live member-blog beta.
**Requested by:** Julia (founding member feedback)

---

## Feature 1 — Author Profile Card on Public Blog Posts

### Purpose
Every provider-authored post becomes a marketing asset for its author: blog reader → author card → practitioner profile → potential client. This is also a founding-member selling point ("write posts, get client-facing visibility").

### Behaviour
- On the public blog post page (`/blog/:slug`), render a practitioner card **below the article body**, above the footer.
- Render **only when `authorType === 'provider'`** and the provider is still active/published. Admin posts: no card, unchanged.
- Heading above the card: **"About the author"**.

### Card contents
- Profile photo (existing avatar treatment/fallback)
- Name + Founder badge (existing badge component/markup)
- Practice type (Counsellor / Psychologist / Social Worker etc.)
- Location (city)
- Speciality chips (cap at 3 + "+N more", matching directory card behaviour)
- Session pricing line if the provider displays pricing ("From RXXX/session")
- **CTA: "View profile →"** linking to their public directory profile

### Implementation
- **CONFIRMED:** reuse the existing standalone `ProviderCard` component (`frontend/src/app/components/provider-card/`) — it takes a single required `provider: Provider` input, no service dependencies. Drop `<app-provider-card [provider]="author" />` under the "About the author" heading. No new card component, no variant needed unless a layout tweak proves necessary in review.
- **Backend:** the public blog-post endpoint populates a provider summary from the existing `providerId` ref, shaped to satisfy the `Provider` type the card expects. Return only public-safe fields (name, photo, type, location, specialities, rate display, online tag, founder flag, profile slug/id). Never leak email/billing/internal fields.
- If the provider has since unpublished/deleted their profile: omit the card entirely (guard, no broken CTA).

### SEO bonus (cheap, include it)
Add `author` to the existing blog post JSON-LD / meta via SeoService: `"author": { "@type": "Person", "name": "<provider name>" }`.

---

## Feature 2 — Featured Image Upload

### Purpose
The `featuredImage` field (Cloudinary URL) already exists in the BlogPost schema — this adds the UI and upload plumbing. No schema change.

### Behaviour
- Upload control in the post editor, available in the **brief** and **editing** states (not in read-only review state).
- Flow: pick file → validate client-side → upload → preview renders in editor → URL saved to `featuredImage` on the post.
- **Replace** and **remove** actions once an image exists.
- Public blog post + blog index render the image where the current default treatment sits; absent image = current fallback, untouched. Zero migration for existing posts.

### Constraints (enforce client-side AND server-side)
- Types: jpg / png / webp
- Max size: 2MB
- Aspect: recommend 16:9; at minimum constrain the *rendered* container to a fixed ratio (object-cover) so the blog index grid stays uniform regardless of source dimensions

### Implementation
- **CONFIRMED:** uploads are backend-proxied via multer (memory buffer) → `cloudinaryService`. No signed-upload flow exists; do not introduce one. The `uploadBlogImage()` helper already exists (1200×630 landscape, `gravity: auto`, `quality: auto:good`) — add a provider-scoped route that calls it:
  - `POST /api/provider/blog/:id/image` — multipart/form-data, field name `image`, following the same multer setup as `POST /api/provider/me/image`
  - Save the resulting `secure_url` to `featuredImage` and store the `publicId` (add `featuredImagePublicId` to the schema if not present) so the old asset can be destroyed on replace/remove
  - Remove action deletes the Cloudinary asset via publicId and clears both fields
- Cloudinary folder: use whatever folder `uploadBlogImage()` already targets for admin posts — keep provider and admin blog images in the same folder for consistency.
- Editing the image counts as an edit → existing rule applies: `providerApproved` resets to false (consistency with the approval-reset-on-edit behaviour already shipped).
- Rate/abuse guard: max uploads per post per day is unnecessary at current scale — skip. Size + type validation is sufficient for v1.

---

## TDD

### Backend
- Public post endpoint: provider-authored post returns populated author summary with ONLY the public-safe fields (assert absence of email/billing fields)
- Admin-authored post returns no author payload
- Provider unpublished/deleted → no author payload, 200 still returned
- Image upload endpoint: rejects >2MB, rejects disallowed mime types, accepts valid webp/jpg/png
- Setting/replacing `featuredImage` resets `providerApproved` to false
- User isolation: provider A cannot set the image on provider B's post (404)

### Frontend
- Author card renders below article body for provider posts; absent for admin posts
- Card CTA href points to the correct profile route
- Speciality chips cap at 3 with "+N more"
- Editor: upload control visible in brief/editing states, hidden in review state
- Preview renders after upload; replace and remove actions update the form state
- Client-side rejection of oversized/wrong-type files shows a friendly message (no request fired)
- Blog index: posts with featuredImage render it in a fixed-ratio container; posts without keep the fallback

---

## Build Order

1. ~~Confirm unknowns~~ — both resolved: reuse `ProviderCard` component; reuse `uploadBlogImage()` via a new multer route
2. Backend: author population on public post endpoint + tests
3. Backend: image upload endpoint (reusing existing pattern) + approval-reset wiring + tests
4. Frontend: AuthorCardComponent (or reused card) + public post page integration + tests
5. Frontend: editor upload control + preview + blog index rendering + tests
6. JSON-LD author addition
7. Full suite green, deploy
8. Ping Julia: both features live, ready for her test pass

---

## Acceptance criteria
- A provider-authored post shows the author card with working profile CTA; admin posts unchanged
- A provider can attach, replace and remove a featured image from the editor; approval resets on image change
- No private provider fields exposed in the public post payload
- Existing posts without images render exactly as before
- All existing blog tests still green
