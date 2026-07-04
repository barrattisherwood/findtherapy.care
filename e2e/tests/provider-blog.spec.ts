import { test, expect, type Page } from '@playwright/test';

const SCREENSHOT_DIR = 'e2e/screenshots';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const providerUser = {
  id: 'provider-001',
  email: 'julia@psychinsight.co.za',
  isAdmin: false,
};

const blankDraft = {
  _id: 'post-001',
  title: 'Managing Anxiety in the Workplace',
  brief: '',
  content: '',
  excerpt: '',
  status: 'draft',
  aiGenerated: false,
  providerApproved: false,
  generationCount: 0,
  tags: [],
  categories: [],
  socialQueue: [],
  authorType: 'provider',
  authorDisplayName: 'julia',
  createdAt: new Date('2026-07-04').toISOString(),
  updatedAt: new Date('2026-07-04').toISOString(),
};

const savedDraft = {
  ...blankDraft,
  content: '## Introduction\n\nAnxiety in the workplace is increasingly common.',
};

const polishedPost = {
  ...blankDraft,
  content: '## Managing Anxiety in the Workplace\n\nAnxiety affects many professionals today...',
  excerpt: 'Practical strategies for managing workplace anxiety.',
  aiGenerated: true,
  generationCount: 1,
  tags: ['anxiety', 'workplace', 'mental-health'],
};

const approvedPost = {
  ...savedDraft,
  providerApproved: true,
  providerApprovedAt: new Date('2026-07-04').toISOString(),
};

const pendingReviewPost = {
  ...approvedPost,
  status: 'pending_review',
};

// ---------------------------------------------------------------------------
// Setup helpers
// ---------------------------------------------------------------------------

/**
 * Register API mocks for provider blog tests.
 * IMPORTANT: Playwright uses LIFO — register catch-alls FIRST, specific routes LAST.
 *
 * @param listPosts - posts returned by GET /api/provider/blog (the list)
 */
async function setupProviderMocks(page: Page, listPosts: object[] = []) {
  // Feature flags — provider_blog enabled for this provider
  await page.route('**/api/feature-flags/mine', route =>
    route.fulfill({ json: { flags: { provider_blog: true } } })
  );

  // Auth
  await page.route('**/api/auth/me', route =>
    route.fulfill({ json: { user: providerUser } })
  );

  // All provider blog API calls dispatched by URL + method
  await page.route('**/api/provider/blog**', async route => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/generate') && method === 'POST') {
      return route.fulfill({ json: { post: polishedPost, socialCaption: 'Check this out on social!' } });
    }
    if (url.includes('/approve') && method === 'PATCH') {
      return route.fulfill({ json: approvedPost });
    }
    if (url.includes('/publish') && method === 'PATCH') {
      return route.fulfill({ json: pendingReviewPost });
    }
    if (method === 'POST') {
      return route.fulfill({ status: 201, json: blankDraft });
    }
    if (method === 'PATCH') {
      return route.fulfill({ json: savedDraft });
    }
    // GET list (and individual gets — service reads post from the list)
    route.fulfill({ json: listPosts });
  });
}

async function injectProviderSession(page: Page) {
  await page.goto('/');
  await page.evaluate((user) => {
    localStorage.setItem('token', 'mock-provider-jwt-token');
    localStorage.setItem('currentUser', JSON.stringify(user));
  }, providerUser);
}

// ---------------------------------------------------------------------------
// Tests — List page
// ---------------------------------------------------------------------------

test.describe('Provider Blog — List', () => {
  test.beforeEach(async ({ page }) => {
    await setupProviderMocks(page, []);
    await injectProviderSession(page);
  });

  test('shows empty state and + New Post button', async ({ page }) => {
    await page.goto('/provider/blog');
    await expect(page.getByRole('heading', { name: 'My Blog Posts' })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /\+ New Post/i })).toBeVisible();
    await expect(page.getByText("You haven't written any blog posts yet")).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pb-01-empty-list.png`, fullPage: true });
  });

  test('shows BETA notice', async ({ page }) => {
    await page.goto('/provider/blog');
    await expect(page.getByText('BETA')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/AI-assisted blog authoring is in early access/i)).toBeVisible();
  });

  test('shows existing posts', async ({ page }) => {
    await setupProviderMocks(page, [blankDraft]);
    await page.goto('/provider/blog');
    await expect(page.getByText('Managing Anxiety in the Workplace')).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pb-02-posts-list.png`, fullPage: true });
  });
});

// ---------------------------------------------------------------------------
// Tests — Create new post
// ---------------------------------------------------------------------------

test.describe('Provider Blog — Create post', () => {
  test.beforeEach(async ({ page }) => {
    await setupProviderMocks(page, []);
    await injectProviderSession(page);
  });

  test('new post form shows title field only (no Brief/Topic field)', async ({ page }) => {
    await page.goto('/provider/blog');
    await page.getByRole('button', { name: /\+ New Post/i }).click();

    await expect(page.getByPlaceholder(/Managing Burnout/i)).toBeVisible({ timeout: 5_000 });
    await expect(page.getByPlaceholder(/brief/i)).not.toBeVisible();
    await expect(page.getByText('Brief / Topic')).not.toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pb-03-new-post-form.png`, fullPage: true });
  });

  test('creating a draft navigates straight to the editor', async ({ page }) => {
    await page.goto('/provider/blog');
    await page.getByRole('button', { name: /\+ New Post/i }).click();
    await page.getByPlaceholder(/Managing Burnout/i).fill('Managing Anxiety in the Workplace');
    await page.getByRole('button', { name: /create draft/i }).click();

    await expect(page).toHaveURL(/\/provider\/blog\/post-001/, { timeout: 10_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pb-04-editor-after-create.png`, fullPage: true });
  });

  test('editor shows markdown textarea immediately — no brief/intermediate step', async ({ page }) => {
    await page.goto('/provider/blog');
    await page.getByRole('button', { name: /\+ New Post/i }).click();
    await page.getByPlaceholder(/Managing Burnout/i).fill('Managing Anxiety in the Workplace');
    await page.getByRole('button', { name: /create draft/i }).click();

    await expect(page).toHaveURL(/\/provider\/blog\/post-001/, { timeout: 10_000 });
    // Markdown textarea must be visible immediately — no brief-collection step
    await expect(page.locator('textarea[placeholder*="Markdown"]')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Write manually')).not.toBeVisible();
    await expect(page.getByText('Generate with AI')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Tests — Editor: toolbar + save
// ---------------------------------------------------------------------------

test.describe('Provider Blog — Editor', () => {
  test.beforeEach(async ({ page }) => {
    await setupProviderMocks(page, [blankDraft]);
    await injectProviderSession(page);
  });

  test('markdown toolbar Bold button inserts **bold text**', async ({ page }) => {
    await page.goto('/provider/blog/post-001');
    const textarea = page.locator('textarea[placeholder*="Markdown"]');
    await expect(textarea).toBeVisible({ timeout: 10_000 });

    await page.locator('button[title="Bold"]').click();
    await expect(textarea).toHaveValue(/\*\*bold text\*\*/);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pb-05-toolbar-bold.png` });
  });

  test('markdown toolbar Heading button inserts ## Heading', async ({ page }) => {
    await page.goto('/provider/blog/post-001');
    const textarea = page.locator('textarea[placeholder*="Markdown"]');
    await expect(textarea).toBeVisible({ timeout: 10_000 });

    await page.locator('button[title="Heading"]').click();
    await expect(textarea).toHaveValue(/## Heading/);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pb-06-toolbar-heading.png` });
  });

  test('markdown toolbar Bullet button inserts - list item', async ({ page }) => {
    await page.goto('/provider/blog/post-001');
    const textarea = page.locator('textarea[placeholder*="Markdown"]');
    await expect(textarea).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: 'Bullet list' }).click();
    await expect(textarea).toHaveValue(/- list item/);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pb-07-toolbar-bullet.png` });
  });

  test('can type content and save draft', async ({ page }) => {
    await page.goto('/provider/blog/post-001');
    const textarea = page.locator('textarea[placeholder*="Markdown"]');
    await expect(textarea).toBeVisible({ timeout: 10_000 });

    await textarea.fill('## Introduction\n\nAnxiety in the workplace is increasingly common.');
    await page.getByRole('button', { name: /^Save$/i }).click();

    // Button shows Saving... then returns to Save
    await expect(page.getByRole('button', { name: /^Save$/i })).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pb-08-save-draft.png` });
  });
});

// ---------------------------------------------------------------------------
// Tests — Polish with AI → review → approve → submit
// ---------------------------------------------------------------------------

test.describe('Provider Blog — AI Polish & Approval', () => {
  test.beforeEach(async ({ page }) => {
    await setupProviderMocks(page, [savedDraft]);
    await injectProviderSession(page);
  });

  test('Polish with AI triggers generation and shows review state', async ({ page }) => {
    await page.goto('/provider/blog/post-001');
    await expect(page.locator('textarea[placeholder*="Markdown"]')).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /polish with ai/i }).click();

    // After generation the polished post (aiGenerated: true, not yet approved) shows review state
    await expect(page.getByRole('button', { name: /looks good.*approve/i })).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pb-09-review-state.png`, fullPage: true });
  });

  test('approving AI content transitions to ready state', async ({ page }) => {
    // Start with an AI-generated post in review state
    const aiPost = { ...polishedPost };
    await setupProviderMocks(page, [aiPost]);

    await page.goto('/provider/blog/post-001');
    await expect(page.getByRole('button', { name: /looks good.*approve/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /looks good.*approve/i }).click();

    await expect(page.getByRole('button', { name: /submit for admin review/i })).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pb-10-ready-state.png`, fullPage: true });
  });

  test('submitting for review shows pending_review state', async ({ page }) => {
    const approvedPostData = { ...approvedPost };
    await setupProviderMocks(page, [approvedPostData]);

    await page.goto('/provider/blog/post-001');
    await expect(page.getByRole('button', { name: /submit for admin review/i })).toBeVisible({ timeout: 10_000 });

    await page.getByRole('button', { name: /submit for admin review/i }).click();

    await expect(page.getByText('Under Review')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/awaiting admin approval/i).first()).toBeVisible();
    await page.screenshot({ path: `${SCREENSHOT_DIR}/pb-11-pending-review.png`, fullPage: true });
  });
});
