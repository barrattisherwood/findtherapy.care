import { test, expect, type Page } from '@playwright/test';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const providerUser = {
  id: 'prov-e2e-001',
  email: 'test-provider@example.com',
  isAdmin: false,
};

const createdProvider = {
  _id: 'prov-e2e-001',
  type: 'psychologist',
  displayName: 'Dr. E2E Test',
  bio: 'A dedicated test provider for end-to-end verification flow testing purposes.',
  degrees: ['MA'],
  professionalBodies: [{ body: 'HPCSA', registrationNumber: 'PS 0123456' }],
  certifications: [],
  specialties: [],
  pricing: { individualCounsellingRate: 800, offersIntroductoryConsultation: false },
  location: { type: 'online-only' },
  sessionFormats: { inPerson: false, online: true },
  contactEmail: 'test-provider@example.com',
  vettingStatus: 'unverified',
  isPublished: false,
  viewCount: 0,
};

const pendingProvider = { ...createdProvider, vettingStatus: 'pending' };

const unverifiedStatus = {
  vettingStatus: 'unverified',
  vettingNotes: null,
  vettedAt: null,
  documents: [],
};

const pendingStatus = {
  vettingStatus: 'pending',
  vettingNotes: null,
  vettedAt: null,
  documents: [
    {
      id: 'doc-e2e-001',
      documentType: 'hpcsa_registration',
      fileName: 'test-cert.pdf',
      fileType: 'pdf',
      fileAvailable: true,
      reviewOutcome: null,
      uploadedAt: new Date().toISOString(),
    },
  ],
};

// Legacy state: vettingStatus was 'pending' by default before the verification
// flow was introduced, so a provider can have pending status with no documents.
const pendingStatusNoDocs = {
  vettingStatus: 'pending',
  vettingNotes: null,
  vettedAt: null,
  documents: [],
};

const uploadResponse = {
  id: 'doc-e2e-001',
  documentType: 'hpcsa_registration',
  fileName: 'test-cert.pdf',
  fileType: 'pdf',
  uploadedAt: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function injectProviderSession(page: Page) {
  await page.goto('/');
  await page.evaluate((user) => {
    localStorage.setItem('token', 'mock-provider-jwt');
    localStorage.setItem('currentUser', JSON.stringify(user));
  }, providerUser);
}

async function setupMocks(
  page: Page,
  options: { hasProfile?: boolean; verificationStatus?: object; provider?: object } = {}
) {
  const { hasProfile = true, verificationStatus = unverifiedStatus, provider = createdProvider } = options;

  // Catch-alls first (lowest priority in LIFO)
  await page.route('**/api/promo/**', route =>
    route.fulfill({ json: { active: false, spotsRemaining: 0 } })
  );

  // Auth
  await page.route('**/api/auth/me', route =>
    route.fulfill({ json: { user: providerUser } })
  );
  await page.route('**/api/auth/login', route =>
    route.fulfill({ status: 200, json: { token: 'mock-provider-jwt', user: providerUser } })
  );

  // Feature flags
  await page.route('**/api/feature-flags/mine', route =>
    route.fulfill({ json: { flags: { provider_blog: false } } })
  );

  // Subscription (note: plural — /api/subscriptions/status)
  await page.route('**/api/subscriptions/status', route =>
    route.fulfill({ json: { subscriptionStatus: 'trial', accessStatus: 'active', trialEndsAt: null, subscriptionEndsAt: null, isFounder: false } })
  );

  // Provider profile — GET /api/providers/me; POST/PUT /api/providers (both plural)
  await page.route('**/api/providers/me', route => {
    if (!hasProfile) {
      return route.fulfill({ status: 404, json: { message: 'Provider not found' } });
    }
    return route.fulfill({ json: { provider } });
  });

  await page.route('**/api/providers', async route => {
    const method = route.request().method();
    if (method === 'POST') {
      return route.fulfill({ status: 201, json: { provider } });
    }
    if (method === 'PUT') {
      return route.fulfill({ json: { provider } });
    }
    return route.fulfill({ json: { providers: [], total: 0, page: 1, totalPages: 1 } });
  });

  // Verification status
  let currentVerificationStatus = verificationStatus;
  await page.route('**/api/provider/documents/verification-status', route =>
    route.fulfill({ json: currentVerificationStatus })
  );

  // Document upload — on success, upgrade the verification status mock to pending
  await page.route('**/api/provider/documents/upload', async route => {
    currentVerificationStatus = pendingStatus;
    return route.fulfill({ status: 201, json: uploadResponse });
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Provider Verification Flow', () => {

  test('creating a profile redirects to /provider/verify', async ({ page }) => {
    test.setTimeout(60000);
    await setupMocks(page, { hasProfile: false });
    await injectProviderSession(page);
    await page.goto('/provider/profile');

    // Wait for form to be fully loaded (loading skeleton gone, input visible)
    await page.waitForSelector('#displayName', { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Create Provider Profile' })).toBeVisible();

    // Fill required fields
    await page.fill('#displayName', 'Dr. E2E Test');
    await page.fill('#bio', 'A dedicated test provider for end-to-end verification flow testing purposes.');

    // Location: select online-only (avoids province selection)
    await page.locator('app-location-input input[value="online-only"]').click();

    // Session formats: check Online
    await page.locator('app-session-formats-input input[type="checkbox"]').nth(1).check();

    // Professional body: add one entry, then wait for Angular to render the new row.
    // Angular property-binds [name], so use the section ID instead of an attribute selector.
    await page.getByRole('button', { name: /Add Professional Body/ }).click();
    const pbSection = page.locator('#professional-bodies-section');
    const pbSelect = pbSection.locator('select').first();
    await pbSelect.waitFor({ state: 'visible', timeout: 10000 });
    await pbSelect.selectOption('HPCSA');
    await pbSection.locator('input[type="text"]').first().fill('PS 0123456');

    // Pricing: individual rate
    await page.fill('#individualRate', '800');

    // Contact email
    await page.fill('#contactEmail', 'test-provider@example.com');

    // Submit
    await page.getByRole('button', { name: /Save Profile|Create Profile/i }).click();

    // Should redirect to /provider/verify
    await expect(page).toHaveURL(/\/provider\/verify/, { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'Verify your credentials' })).toBeVisible();
  });

  test('/provider/verify has no Skip button', async ({ page }) => {
    await setupMocks(page, { verificationStatus: unverifiedStatus });
    await injectProviderSession(page);
    await page.goto('/provider/verify');

    await expect(page.getByRole('heading', { name: 'Verify your credentials' })).toBeVisible();

    // No skip/dismiss path off this page
    await expect(page.getByRole('button', { name: /skip/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /skip/i })).not.toBeVisible();
    await expect(page.getByRole('button', { name: /later/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /later/i })).not.toBeVisible();
  });

  test('uploading a document on /provider/verify redirects to /provider/profile', async ({ page }) => {
    await setupMocks(page, { verificationStatus: unverifiedStatus });
    await injectProviderSession(page);
    await page.goto('/provider/verify');

    await expect(page.getByRole('heading', { name: 'Verify your credentials' })).toBeVisible();

    // Create a minimal PDF buffer to upload
    const pdfContent = Buffer.from('%PDF-1.4 test');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'test-cert.pdf',
      mimeType: 'application/pdf',
      buffer: pdfContent,
    });

    // Click submit
    await page.click('button:has-text("Submit document")');

    // Should show brief success state
    await expect(page.getByText('Document submitted')).toBeVisible();

    // Then redirect to profile
    await expect(page).toHaveURL(/\/provider\/profile/, { timeout: 5000 });
  });

  test('provider who abandoned /provider/verify sees persistent action-required banner on profile page', async ({ page }) => {
    // Provider has a profile but vettingStatus is still 'unverified' (abandoned the upload step)
    await setupMocks(page, { hasProfile: true, verificationStatus: unverifiedStatus });
    await injectProviderSession(page);
    await page.goto('/provider/profile');

    // The persistent amber banner must be visible — not just a sidebar element
    const banner = page.locator('text=Action required: upload your verification documents');
    await expect(banner).toBeVisible();

    // Banner must link to /provider/verify
    const uploadLink = page.getByRole('link', { name: 'Upload documents' });
    await expect(uploadLink).toBeVisible();
    await expect(uploadLink).toHaveAttribute('href', '/provider/verify');
  });

  test('provider with pending status does not see the action-required banner', async ({ page }) => {
    // Provider's own vettingStatus must be 'pending' — the banner reads from the provider model
    await setupMocks(page, { hasProfile: true, verificationStatus: pendingStatus, provider: pendingProvider });
    await injectProviderSession(page);
    await page.goto('/provider/profile');

    await expect(page.locator('text=Action required: upload your verification documents')).not.toBeVisible();
    // Use heading role to avoid strict-mode clash with the lowercase sidebar variant
    await expect(page.getByRole('heading', { name: 'Profile Under Review' })).toBeVisible();
  });

  test('navigating to /provider/verify when already pending redirects to /provider/profile', async ({ page }) => {
    await setupMocks(page, { hasProfile: true, verificationStatus: pendingStatus, provider: pendingProvider });
    await injectProviderSession(page);
    await page.goto('/provider/verify');

    // Should be redirected away from /provider/verify since status is pending
    await expect(page).toHaveURL(/\/provider\/profile/, { timeout: 5000 });
  });

  test('legacy provider with pending status but no documents can access /provider/verify and sees upload form', async ({ page }) => {
    // Regression test for accounts that got vettingStatus:'pending' as the old default
    // without ever uploading a document. They must NOT be bounced back to the profile page —
    // they need to be able to upload their first document.
    await setupMocks(page, { hasProfile: true, verificationStatus: pendingStatusNoDocs, provider: pendingProvider });
    await injectProviderSession(page);
    await page.goto('/provider/verify');

    // Must stay on /provider/verify — not redirected
    await expect(page).toHaveURL(/\/provider\/verify/, { timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Verify your credentials' })).toBeVisible();

    // Upload form must be present so they can submit their first document
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Submit document' })).toBeVisible();
  });

  test('sidebar shows correct message when provider is pending but has no documents uploaded', async ({ page }) => {
    // Regression test: the sidebar widget was showing "We have received your documents"
    // even when documents array was empty — false for legacy pending accounts.
    await setupMocks(page, { hasProfile: true, verificationStatus: pendingStatusNoDocs, provider: pendingProvider });
    await injectProviderSession(page);
    await page.goto('/provider/profile');

    // The false "We have received your documents" message must not appear
    await expect(page.locator('text=We have received your documents')).not.toBeVisible();

    // The correct prompt to upload must appear instead
    await expect(page.locator('text=Please upload your verification documents')).toBeVisible();
  });

});
