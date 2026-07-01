import { test, expect, type Page } from '@playwright/test';
import {
  foundersDealStatus,
  authResponse,
  pendingFounderProvider,
  approvedFounderProvider,
  trialActiveStatus,
  providerSearchResults,
} from '../fixtures/mocks';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Register all API mocks. Use a single provider-route handler that dispatches
 * by URL to avoid glob vs query-param matching issues.
 */
async function setupApiMocks(
  page: Page,
  overrides: {
    provider?: object;
    subscription?: object;
    deal?: object;
    noExistingProvider?: boolean;
  } = {}
) {
  // Promo deal status
  await page.route('**/api/promo/founders-deal', route =>
    route.fulfill({ json: { ...foundersDealStatus, ...overrides.deal } })
  );

  // Promo code validation
  await page.route('**/api/promo/validate/**', route =>
    route.fulfill({ json: { valid: true, code: 'FOUNDER50' } })
  );

  // Auth endpoints
  await page.route('**/api/auth/register', route =>
    route.fulfill({ status: 201, json: { message: 'Registration successful. Please check your email.' } })
  );
  await page.route('**/api/auth/verify-email', route =>
    route.fulfill({ status: 200, json: authResponse })
  );
  await page.route('**/api/auth/me', route =>
    route.fulfill({ json: authResponse.user })
  );
  await page.route('**/api/auth/login', route =>
    route.fulfill({ json: authResponse })
  );

  // Cities API (used by location-input component on provider profile page)
  await page.route('**/api/cities/provinces', route =>
    route.fulfill({ json: { provinces: [] } })
  );
  await page.route('**/api/cities/search*', route =>
    route.fulfill({ json: { results: [] } })
  );

  // Provider endpoints — single handler dispatches by URL + method.
  // Trailing wildcard so query params (e.g. ?page=1) are matched.
  await page.route('**/api/providers**', async route => {
    const url = route.request().url();
    const method = route.request().method();

    // GET /api/providers/me
    if (url.includes('/providers/me')) {
      if (overrides.noExistingProvider) {
        return route.fulfill({ status: 404, json: { message: 'Provider not found' } });
      }
      return route.fulfill({
        json: { provider: overrides.provider ?? pendingFounderProvider },
      });
    }

    // GET /api/providers/{id} (detail page)
    if (url.match(/\/providers\/[^?/]+$/) && method === 'GET') {
      return route.fulfill({ json: { provider: approvedFounderProvider } });
    }

    // POST /api/providers (profile creation)
    if (method === 'POST') {
      return route.fulfill({
        status: 201,
        json: { provider: pendingFounderProvider },
      });
    }

    // GET /api/providers?... (public search)
    route.fulfill({ json: providerSearchResults });
  });

  // Subscription routes — register generic catch-all FIRST so specific status
  // route (registered after) takes priority via Playwright's LIFO ordering.
  await page.route('**/api/subscriptions/**', route =>
    route.fulfill({ json: { url: 'https://example.com' } })
  );

  await page.route('**/api/subscriptions/status', route =>
    route.fulfill({ json: overrides.subscription ?? trialActiveStatus })
  );
}

/**
 * Inject a valid auth session into localStorage so authenticated routes
 * don't redirect to /login. Call before page.goto().
 */
async function injectAuthSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'mock-jwt-token-for-e2e');
    localStorage.setItem(
      'currentUser',
      JSON.stringify({ id: 'user-e2e-001', email: 'founder@test.com', isAdmin: false })
    );
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Founder flow', () => {

  // Scenario 1 — Founders landing page displays deal status
  test('founders page displays deal status', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/founders');

    // Spots remaining — exact match avoids strict mode violation with "27 spots"
    await expect(page.getByText('27', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/spots remaining/i)).toBeVisible();

    // Pricing and trial period — exact match avoids strict mode (R99 appears many times)
    await expect(page.getByText('R99', { exact: true })).toBeVisible();
    await expect(page.getByText('6 months free', { exact: true })).toBeVisible();

    // CTA button present
    await expect(
      page.getByRole('button', { name: /Claim.*Spot|Become a Founding/i }).first()
    ).toBeVisible();
  });

  // Scenario 2 — Claim button navigates to /register?promo=FOUNDER50
  test('claim button navigates to register with promo code', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/founders');

    await page.getByRole('button', { name: /Claim.*Spot|Become a Founding/i }).first().click();

    await expect(page).toHaveURL(/\/register\?promo=FOUNDER50/i);
    await expect(page.getByText(/Founding Supporter Deal Applied!/i)).toBeVisible();
  });

  // Scenario 3 — Register with founder promo code
  test('can register with founder promo code', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/register?promo=FOUNDER50');

    // Founder deal messaging visible
    await expect(page.getByText(/Founding Supporter Deal Applied!/i)).toBeVisible();
    await expect(page.getByText(/6-month free trial/i)).toBeVisible();

    // Fill form
    await page.locator('#email').fill('founder@test.com');
    await page.locator('#password').fill('Test1234!');
    await page.locator('#confirmPassword').fill('Test1234!');

    await page.getByRole('button', { name: /Create account/i }).click();

    // Registration triggers email verification — shows "Check your email" confirmation
    await expect(page.getByText(/Check your email/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('founder@test.com')).toBeVisible();
  });

  // Scenario 4 — Provider profile creation shows pending review state
  test('completing the provider profile shows pending review state', async ({ page }) => {
    await injectAuthSession(page);
    await setupApiMocks(page, { noExistingProvider: true });

    await page.goto('/provider/profile');

    // Wait for form to appear (loading skeleton clears)
    await expect(page.getByRole('button', { name: /Create Profile/i })).toBeVisible({
      timeout: 10_000,
    });

    // Required text fields
    await page.locator('input[name="displayName"]').fill('Dr. Jane Founder');
    await page.locator('textarea[name="bio"]').fill(
      'Experienced psychologist specialising in anxiety and depression. ' +
        'I work with adults navigating life transitions, trauma, and relationship challenges.'
    );
    await page.locator('input[name="contactEmail"]').fill('founder@test.com');

    // Location — use online-only to avoid city autocomplete (calls external API)
    await page.locator('input[name="locationType"][value="online-only"]').click();

    // Session formats — at least one required
    await page.getByText('Online (video / telehealth)').click();

    // Professional body — click Add then fill the dynamic fields.
    // Provider type uses radio buttons, so the first <select> on the form is the pb select.
    await page.getByRole('button', { name: /Add Professional Body/i }).click();
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5_000 });
    await page.locator('select').first().selectOption('HPCSA');
    await page.locator('input[placeholder*="PS"]').fill('PS0123456');

    // Pricing — at least one rate required
    await page.locator('#individualRate').fill('900');

    await page.getByRole('button', { name: /Create Profile/i }).click();

    // After creation hasProfile() → true, heading switches to "Edit Provider Profile"
    await expect(page.getByText('Edit Provider Profile')).toBeVisible({ timeout: 10_000 });
  });

  // Scenario 5 — After approval: trial active on profile page sidebar
  test('approved founder sees trial active with 180 days remaining', async ({ page }) => {
    await injectAuthSession(page);
    await setupApiMocks(page, {
      provider: approvedFounderProvider,
      subscription: trialActiveStatus,
    });

    await page.goto('/provider/profile');

    // Vetting approved banner
    await expect(page.getByText(/Profile Verified/i)).toBeVisible({ timeout: 10_000 });

    // Trial active messaging from subscription-status component in sidebar
    await expect(
      page.getByText(/days remaining in your free trial/i)
    ).toBeVisible({ timeout: 10_000 });

    // Founder-specific pricing locked in
    await expect(page.getByText(/Founding Supporter/i)).toBeVisible();
  });

  // Scenario 6 — Provider appears in public search
  test('approved founder provider appears in /providers search', async ({ page }) => {
    await setupApiMocks(page);
    await page.goto('/providers');

    // Provider card visible with correct name
    await expect(page.getByText('Dr. Jane Founder')).toBeVisible({ timeout: 10_000 });

    // Location shown on card
    await expect(page.getByText('Cape Town')).toBeVisible();
  });

  // Scenario 7 — Full chained happy path smoke test
  test('full founder flow: claim spot → register → profile page', async ({ page }) => {
    await setupApiMocks(page);

    // Step 1: Founders page shows deal
    await page.goto('/founders');
    await expect(page.getByText('27', { exact: true }).first()).toBeVisible();

    // Step 2: Claim spot → /register with promo
    await page.getByRole('button', { name: /Claim.*Spot|Become a Founding/i }).first().click();
    await expect(page).toHaveURL(/\/register\?promo=FOUNDER50/i);
    await expect(page.getByText(/Founding Supporter Deal Applied!/i)).toBeVisible();

    // Step 3: Register
    await page.locator('#email').fill('founder@test.com');
    await page.locator('#password').fill('Test1234!');
    await page.locator('#confirmPassword').fill('Test1234!');
    await page.getByRole('button', { name: /Create account/i }).click();

    // Registration sends verification email — app shows "Check your email"
    await expect(page.getByText(/Check your email/i)).toBeVisible({ timeout: 10_000 });

    // Step 4: Simulate clicking the verification link in the email
    await page.goto('/verify-email?token=mock-token');

    // Verify-email component verifies the token, then redirects to /provider/profile after 2s
    await expect(page).toHaveURL(/\/provider\/profile/, { timeout: 15_000 });
    await expect(
      page.getByRole('heading', { name: /Edit Provider Profile|Create Provider Profile/i })
    ).toBeVisible({ timeout: 10_000 });
  });

});
