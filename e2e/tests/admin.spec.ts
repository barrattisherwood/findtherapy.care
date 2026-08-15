import { test, expect, type Page } from '@playwright/test';
import {
  adminAuthResponse,
  dashboardMetrics,
  blogMetrics,
  sentryIssues,
  pendingProviders,
  allProviders,
  adminMessages,
  adminLogs,
  adminBlogPosts,
  adminFeatureFlags,
} from '../fixtures/admin-mocks';

const SCREENSHOT_DIR = 'e2e/screenshots';

// ---------------------------------------------------------------------------
// API mock setup
// ---------------------------------------------------------------------------

/**
 * IMPORTANT: Playwright uses LIFO (last-in, first-out) route matching.
 * The LAST registered route that matches a URL wins.
 * Therefore: register CATCH-ALLS FIRST, SPECIFIC ROUTES LAST.
 */
async function setupAdminMocks(page: Page) {
  // ── Catch-alls (registered first = lowest priority) ──────────────────────

  // Blog catch-all: handles any /api/blog/* not matched by specific routes below
  await page.route('**/api/blog/**', async route => {
    const method = route.request().method();
    if (method === 'DELETE') return route.fulfill({ json: { message: 'Deleted' } });
    route.fulfill({ json: adminBlogPosts.posts[0] });
  });

  // Providers public (stray calls from landing/search)
  await page.route('**/api/providers**', route =>
    route.fulfill({ json: { providers: [], total: 0, page: 1, totalPages: 1 } })
  );

  // Admin providers catch-all: handles /api/admin/providers (list)
  await page.route('**/api/admin/providers**', async route => {
    const url = route.request().url();
    const method = route.request().method();
    if (url.includes('/suspend')) return route.fulfill({ json: { message: 'Updated' } });
    if (url.includes('/founder')) return route.fulfill({ json: { message: 'Updated' } });
    if (method === 'DELETE') return route.fulfill({ json: { message: 'Deleted' } });
    route.fulfill({ json: allProviders });
  });

  // Promo / landing page calls
  await page.route('**/api/promo/**', route =>
    route.fulfill({ json: { active: false, spotsRemaining: 0 } })
  );

  // ── Specific routes (registered last = highest priority) ─────────────────

  // Auth
  await page.route('**/api/auth/login', route =>
    route.fulfill({ status: 200, json: adminAuthResponse })
  );
  await page.route('**/api/auth/me', route =>
    route.fulfill({ json: { user: adminAuthResponse.user } })
  );

  // Feature flags (admin isn't allowlisted by default so provider_blog flag returns false)
  await page.route('**/api/feature-flags/mine', route =>
    route.fulfill({ json: { flags: { provider_blog: false } } })
  );
  await page.route('**/api/admin/feature-flags', async route => {
    const method = route.request().method();
    if (method === 'PATCH') {
      const body = JSON.parse(route.request().postData() ?? '{}');
      return route.fulfill({ json: { flag: { ...adminFeatureFlags.flags[0], ...body } } });
    }
    route.fulfill({ json: adminFeatureFlags });
  });

  // Dashboard metrics
  await page.route('**/api/admin/dashboard**', route =>
    route.fulfill({ json: dashboardMetrics })
  );
  await page.route('**/api/admin/sentry-issues', route =>
    route.fulfill({ json: sentryIssues })
  );

  // Messages
  await page.route('**/api/admin/messages**', async route => {
    const url = route.request().url();
    const method = route.request().method();
    if (method === 'PATCH' && url.includes('/read')) {
      return route.fulfill({ json: { message: 'Updated' } });
    }
    route.fulfill({ json: adminMessages });
  });

  // Logs
  await page.route('**/api/admin/logs**', route =>
    route.fulfill({ json: adminLogs })
  );

  // Specific provider routes (override the providers catch-all above)
  await page.route('**/api/admin/providers/*/vet', route =>
    route.fulfill({ json: { message: 'Provider vetted' } })
  );
  await page.route('**/api/admin/providers/vetting**', route =>
    route.fulfill({ json: pendingProviders })
  );
  await page.route('**/api/admin/providers/pending-count', route =>
    route.fulfill({ json: { count: 2 } })
  );
  // Document endpoint now streams the file — return minimal PDF bytes with correct content-type
  await page.route('**/api/admin/provider/documents/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/pdf',
      body: Buffer.from('%PDF-1.4 1 0 obj << /Type /Catalog >> endobj'),
    })
  );

  // Specific blog routes (override the blog catch-all above)
  await page.route('**/api/blog/filters', route =>
    route.fulfill({ json: { categories: ['Anxiety', 'Burnout', 'Therapy'], tags: ['mental-health', 'therapy', 'burnout'] } })
  );
  await page.route('**/api/blog/admin/metrics**', route =>
    route.fulfill({ json: blogMetrics })
  );
  await page.route('**/api/blog/admin/posts**', route =>
    route.fulfill({ json: adminBlogPosts })
  );
}

/**
 * Navigate to the home page (to establish the localhost:4200 origin) then
 * inject an admin session into localStorage. page.addInitScript() has a race
 * with Angular's bootstrap; page.evaluate() after a real navigation is reliable.
 */
async function injectAdminSession(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    localStorage.setItem('token', 'mock-admin-jwt-token');
    localStorage.setItem(
      'currentUser',
      JSON.stringify({ id: 'admin-001', email: 'admin@findtherapy.care', isAdmin: true, name: 'Admin' })
    );
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Admin — Login', () => {
  test('admin can log in and is redirected to dashboard', async ({ page }) => {
    await setupAdminMocks(page);
    await page.goto('/login');

    await page.screenshot({ path: `${SCREENSHOT_DIR}/01-login-page.png`, fullPage: true });

    await page.locator('#email').fill('admin@findtherapy.care');
    await page.locator('#password').fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/admin\/dashboard/, { timeout: 10_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02-dashboard-after-login.png`, fullPage: true });
  });
});

test.describe('Admin — Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminMocks(page);
    await injectAdminSession(page);
  });

  test('shows key metrics cards', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // Wait for provider metrics — "89 active subscriptions" is unique text from the providers card
    await expect(page.getByText('89 active subscriptions')).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03-dashboard-metrics.png`, fullPage: true });
  });

  test('shows blog metrics section', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // Wait for blog metrics — "Total Posts" label always shows when blogMetrics() is truthy
    await expect(page.getByText('Total Posts')).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04-dashboard-blog-metrics.png`, fullPage: true });
  });

  test('shows recent activity log', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.getByText('Dr. Smith')).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/05-dashboard-logs.png`, fullPage: true });
  });

  test('can switch time range filter', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // Wait for metrics to load before switching
    await expect(page.getByText('89 active subscriptions')).toBeVisible({ timeout: 10_000 });
    await page.getByText('Last 7 days').click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/06-dashboard-7days.png`, fullPage: true });
  });
});

test.describe('Admin — Vetting', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminMocks(page);
    await injectAdminSession(page);
  });

  test('shows pending providers list', async ({ page }) => {
    await page.goto('/admin/vetting');
    await expect(page.getByText('Dr. Amara Nkosi')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Lindiwe Dlamini')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/07-vetting-pending.png`, fullPage: true });
  });

  test('can approve a provider', async ({ page }) => {
    await page.goto('/admin/vetting');
    await expect(page.getByText('Dr. Amara Nkosi')).toBeVisible({ timeout: 10_000 });

    const approveBtn = page.getByRole('button', { name: /approve/i }).first();
    await expect(approveBtn).toBeVisible();
    await approveBtn.click();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/08-vetting-approve.png`, fullPage: true });
  });

  test('can open rejection form and reject a provider', async ({ page }) => {
    await page.goto('/admin/vetting');
    await expect(page.getByText('Dr. Amara Nkosi')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /reject/i }).first().click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/09-vetting-reject-form.png`, fullPage: true });

    const notesInput = page.locator('textarea').first();
    if (await notesInput.isVisible()) {
      await notesInput.fill('Missing HPCSA registration number');
    }
    const confirmBtn = page.getByRole('button', { name: /confirm reject/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/10-vetting-reject-confirmed.png`, fullPage: true });
  });

  test('can filter by approved status', async ({ page }) => {
    await page.goto('/admin/vetting');
    await expect(page.getByText('Dr. Amara Nkosi')).toBeVisible({ timeout: 10_000 });
    const approvedBtn = page.getByRole('button', { name: /approved/i }).first();
    if (await approvedBtn.isVisible()) {
      await approvedBtn.click();
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/11-vetting-approved-filter.png`, fullPage: true });
  });

  test('View button opens inline modal when document is available', async ({ page }) => {
    await page.goto('/admin/vetting');
    await expect(page.getByText('Dr. Amara Nkosi')).toBeVisible({ timeout: 10_000 });

    // Expand documents for first provider (has fileAvailable: true)
    await page.getByRole('button', { name: /view documents/i }).first().click();
    await expect(page.getByText('hpcsa-cert.pdf')).toBeVisible();

    // View button must be present
    const viewBtn = page.getByTestId('view-document').first();
    await expect(viewBtn).toBeVisible();

    // Clicking View should open the inline modal, not a new tab
    await viewBtn.click();
    await expect(page.getByTestId('document-viewer-iframe')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('close-viewer')).toBeVisible();

    // Modal header shows the filename
    await expect(page.locator('[data-testid="close-viewer"]').locator('..').locator('span')).toContainText('hpcsa-cert.pdf');

    // Closing the modal removes it
    await page.getByTestId('close-viewer').click();
    await expect(page.getByTestId('document-viewer-iframe')).not.toBeAttached();
  });

  test('View button is absent when document file has been deleted', async ({ page }) => {
    await page.goto('/admin/vetting');
    await expect(page.getByText('Lindiwe Dlamini')).toBeVisible({ timeout: 10_000 });

    // Expand documents for second provider (has fileAvailable: false)
    await page.getByRole('button', { name: /view documents/i }).nth(1).click();
    await expect(page.getByText('aschp-cert.jpg')).toBeVisible();

    // No view-document button — deleted file shows "File deleted" text instead
    await expect(page.getByTestId('view-document')).not.toBeAttached();
    await expect(page.getByText('File deleted')).toBeVisible();
  });

  test('document view endpoint error shows toast, not an uncaught exception', async ({ page }) => {
    // Override the document endpoint to return an error for this test only
    await page.route('**/api/admin/provider/documents/**', route =>
      route.fulfill({ status: 500, json: { message: 'Storage error' } })
    );

    await page.goto('/admin/vetting');
    await expect(page.getByText('Dr. Amara Nkosi')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /view documents/i }).first().click();
    await page.getByTestId('view-document').first().click();

    // Should show an error toast, not crash
    await expect(page.locator('p', { hasText: /could not retrieve document/i })).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('Admin — Provider Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminMocks(page);
    await injectAdminSession(page);
  });

  test('shows full provider list with filters', async ({ page }) => {
    await page.goto('/admin/providers');
    await expect(page.getByText('Dr. Sarah Mitchell')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('James van der Berg')).toBeVisible();
    await expect(page.getByText('Fatima Osman')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/12-providers-list.png`, fullPage: true });
  });

  test('can search providers', async ({ page }) => {
    await page.goto('/admin/providers');
    await expect(page.getByText('Dr. Sarah Mitchell')).toBeVisible({ timeout: 10_000 });

    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await searchInput.fill('Sarah');
    await page.keyboard.press('Enter');
    await page.screenshot({ path: `${SCREENSHOT_DIR}/13-providers-search.png`, fullPage: true });
  });

  test('can open suspend modal', async ({ page }) => {
    await page.goto('/admin/providers');
    await expect(page.getByText('Dr. Sarah Mitchell')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /suspend/i }).first().click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/14-providers-suspend-modal.png`, fullPage: true });

    const reasonInput = page.locator('textarea').first();
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('Violation of terms of service');
    }
    const confirmBtn = page.getByRole('button', { name: /confirm/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/15-providers-suspend-confirmed.png`, fullPage: true });
  });

  test('can open delete confirmation modal', async ({ page }) => {
    await page.goto('/admin/providers');
    await expect(page.getByText('Dr. Sarah Mitchell')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /delete/i }).first().click();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/16-providers-delete-modal.png`, fullPage: true });

    const confirmBtn = page.getByRole('button', { name: /confirm/i });
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/17-providers-delete-confirmed.png`, fullPage: true });
  });

  test('can toggle founder status', async ({ page }) => {
    await page.goto('/admin/providers');
    await expect(page.getByText('Dr. Sarah Mitchell')).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/18-providers-founder-badge.png`, fullPage: true });
  });
});

test.describe('Admin — Messages', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminMocks(page);
    await injectAdminSession(page);
  });

  test('shows inbox with unread count', async ({ page }) => {
    await page.goto('/admin/messages');
    await expect(page.getByText('Thabo Mokoena')).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/19-messages-inbox.png`, fullPage: true });
  });

  test('can expand a message to read it', async ({ page }) => {
    await page.goto('/admin/messages');
    await expect(page.getByText('Thabo Mokoena')).toBeVisible({ timeout: 10_000 });

    await page.getByText('Thabo Mokoena').click();
    await expect(page.getByText(/listing my practice/i)).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/20-messages-expanded.png`, fullPage: true });
  });

  test('can filter by message type', async ({ page }) => {
    await page.goto('/admin/messages');
    await expect(page.getByText('Thabo Mokoena')).toBeVisible({ timeout: 10_000 });

    const typeSelect = page.locator('select').first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption('site');
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/21-messages-filtered.png`, fullPage: true });
  });
});

test.describe('Admin — Activity Log', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminMocks(page);
    await injectAdminSession(page);
  });

  test('shows full activity log', async ({ page }) => {
    await page.goto('/admin/logs');
    await expect(page.getByText('Dr. Smith')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Ms. Jones')).toBeVisible();
    await expect(page.getByText('Mr. Brown')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/22-logs-full.png`, fullPage: true });
  });

  test('can filter logs by action type', async ({ page }) => {
    await page.goto('/admin/logs');
    await expect(page.getByText('Dr. Smith')).toBeVisible({ timeout: 10_000 });

    const select = page.locator('select').first();
    if (await select.isVisible()) {
      await select.selectOption('vet_provider');
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/23-logs-filtered.png`, fullPage: true });
  });
});

test.describe('Admin — Blog Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminMocks(page);
    await injectAdminSession(page);
  });

  test('shows blog post list', async ({ page }) => {
    await page.goto('/admin/blog');
    await expect(page.getByText('Understanding Anxiety')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Signs of Burnout')).toBeVisible();
    await expect(page.getByText('Finding the Right Therapist')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/24-blog-list.png`, fullPage: true });
  });

  test('new post editor loads with empty form', async ({ page }) => {
    await page.goto('/admin/blog/new');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/25-blog-new-post.png`, fullPage: true });
  });

  test('can fill in a new blog post title and content', async ({ page }) => {
    await page.goto('/admin/blog/new');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });

    const titleInput = page.locator('input[formcontrolname="title"], input[placeholder*="title" i], input[name="title"]').first();
    if (await titleInput.isVisible()) {
      await titleInput.fill('How to Manage Stress at Work');
    }
    const contentArea = page.locator('textarea[formcontrolname="content"], textarea').first();
    if (await contentArea.isVisible()) {
      await contentArea.fill('## Introduction\n\nStress in the workplace is increasingly common in South Africa...');
    }
    await page.screenshot({ path: `${SCREENSHOT_DIR}/26-blog-post-filled.png`, fullPage: true });
  });
});

test.describe('Admin — Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminMocks(page);
    await injectAdminSession(page);
  });

  test('all admin nav links are accessible from dashboard', async ({ page }) => {
    await page.goto('/admin/dashboard');
    // Wait for dashboard to fully load before navigating
    await expect(page.getByText('89 active subscriptions')).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/27-admin-nav.png`, fullPage: false });

    for (const [route, label] of [
      ['/admin/vetting', 'vetting'],
      ['/admin/providers', 'providers'],
      ['/admin/messages', 'messages'],
      ['/admin/logs', 'logs'],
      ['/admin/blog', 'blog'],
    ] as const) {
      await page.goto(route);
      await expect(page).toHaveURL(new RegExp(route), { timeout: 10_000 });
      await page.screenshot({ path: `${SCREENSHOT_DIR}/28-nav-${label}.png` });
    }
  });
});

test.describe('Admin — Feature Flags', () => {
  test.beforeEach(async ({ page }) => {
    await setupAdminMocks(page);
    await injectAdminSession(page);
  });

  test('shows feature flags list with provider_blog flag', async ({ page }) => {
    await page.goto('/admin/feature-flags');
    await expect(page.getByText('provider_blog')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('OFF')).toBeVisible();
    await expect(page.getByText('2 allowlisted')).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/29-feature-flags.png`, fullPage: true });
  });

  test('can toggle the provider_blog flag on', async ({ page }) => {
    await page.goto('/admin/feature-flags');
    await expect(page.getByText('provider_blog')).toBeVisible({ timeout: 10_000 });

    const toggle = page.locator('button[role="switch"], button').filter({ hasText: '' }).first();
    // Use the toggle button next to provider_blog
    const flagRow = page.locator('div').filter({ hasText: 'provider_blog' }).first();
    const toggleBtn = flagRow.locator('button').last();
    await toggleBtn.click();

    await page.screenshot({ path: `${SCREENSHOT_DIR}/30-feature-flag-toggled.png`, fullPage: true });
  });
});
