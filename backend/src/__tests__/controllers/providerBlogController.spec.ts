import { Response } from 'express';
import { ProviderAuthRequest } from '../../middleware/providerGuard';
import BlogPost from '../../models/BlogPost';
import { createTestUser } from '../fixtures/users';
import { createTestProvider } from '../fixtures/providers';
import {
  createDraft,
  getMyPosts,
  getPost,
  updatePost,
  deletePost,
  generateContent,
  approvePost,
  publishPost,
  addToSocialQueue,
  removeFromSocialQueue,
} from '../../controllers/providerBlogController';
import {
  getPendingPosts,
  reviewPost,
} from '../../controllers/adminBlogController';

jest.mock('../../services/claude.service', () => ({
  generateBlogPost: jest.fn(),
}));

jest.mock('../../services/emailService', () => ({
  sendBlogPostPendingReviewEmail: jest.fn().mockResolvedValue(undefined),
}));

import { generateBlogPost } from '../../services/claude.service';
const mockGenerateBlogPost = generateBlogPost as jest.Mock;

const mockRes = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnThis();
  return { json, status, res: { json, status } as unknown as Response };
};

const makeReq = (provider: any, overrides: Partial<ProviderAuthRequest> = {}): ProviderAuthRequest =>
  ({ userId: provider.userId, provider, body: {}, params: {}, ...overrides } as unknown as ProviderAuthRequest);

// ─── createDraft ──────────────────────────────────────────────────────────────

describe('createDraft', () => {
  it('creates a draft post with correct fields and returns 201', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const { json, status, res } = mockRes();

    await createDraft(makeReq(provider, {
      body: { title: 'Managing Burnout', brief: 'How practitioners can avoid burnout' },
    }), res);

    expect(status).toHaveBeenCalledWith(201);
    const post = json.mock.calls[0][0];
    expect(post.title).toBe('Managing Burnout');
    expect(post.authorType).toBe('provider');
    expect(post.status).toBe('draft');
    expect(post.aiGenerated).toBe(false);
    expect(post.generationCount).toBe(0);
    expect(post.slug).toMatch(/^managing-burnout-/);
  });

  it('slug has a random 4-char suffix to avoid collisions', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const { res: res1 } = mockRes();
    const { res: res2 } = mockRes();

    await createDraft(makeReq(provider, { body: { title: 'Same Title', brief: 'brief' } }), res1);
    await createDraft(makeReq(provider, { body: { title: 'Same Title', brief: 'brief' } }), res2);

    const slug1 = (res1.json as jest.Mock).mock.calls[0][0].slug;
    const slug2 = (res2.json as jest.Mock).mock.calls[0][0].slug;
    expect(slug1).not.toBe(slug2);
  });
});

// ─── getMyPosts ───────────────────────────────────────────────────────────────

describe('getMyPosts', () => {
  it('returns only posts belonging to the authenticated provider', async () => {
    const user1 = await createTestUser();
    const provider1 = await createTestProvider({ userId: user1._id.toString() });
    const user2 = await createTestUser();
    const provider2 = await createTestProvider({ userId: user2._id.toString() });

    await BlogPost.create({ title: 'Mine', slug: 'mine-a1b2', authorProviderId: provider1._id, authorType: 'provider', author: user1._id, categories: [], tags: [] });
    await BlogPost.create({ title: 'Theirs', slug: 'theirs-c3d4', authorProviderId: provider2._id, authorType: 'provider', author: user2._id, categories: [], tags: [] });

    const { json, res } = mockRes();
    await getMyPosts(makeReq(provider1), res);

    const posts = json.mock.calls[0][0];
    expect(posts).toHaveLength(1);
    expect(posts[0].title).toBe('Mine');
  });
});

// ─── getPost ──────────────────────────────────────────────────────────────────

describe('getPost', () => {
  it('returns the post for the owning provider', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await BlogPost.create({ title: 'My Post', slug: 'my-post-x1y2', authorProviderId: provider._id, authorType: 'provider', author: user._id, categories: [], tags: [] });

    const { json, res } = mockRes();
    await getPost(makeReq(provider, { params: { id: post._id.toString() } as any }), res);

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ title: 'My Post' }));
  });

  it('returns 404 for another provider\'s post', async () => {
    const user1 = await createTestUser();
    const provider1 = await createTestProvider({ userId: user1._id.toString() });
    const user2 = await createTestUser();
    const provider2 = await createTestProvider({ userId: user2._id.toString() });
    const post = await BlogPost.create({ title: 'Not Mine', slug: 'not-mine-z9', authorProviderId: provider2._id, authorType: 'provider', author: user2._id, categories: [], tags: [] });

    const { status, json, res } = mockRes();
    await getPost(makeReq(provider1, { params: { id: post._id.toString() } as any }), res);

    expect(status).toHaveBeenCalledWith(404);
  });
});

// ─── updatePost ───────────────────────────────────────────────────────────────

describe('updatePost', () => {
  it('updates allowed fields and resets providerApproved', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await BlogPost.create({ title: 'Old Title', slug: 'old-title-a1', authorProviderId: provider._id, authorType: 'provider', author: user._id, categories: [], tags: [], providerApproved: true });

    const { json, res } = mockRes();
    await updatePost(makeReq(provider, {
      params: { id: post._id.toString() } as any,
      body: { title: 'New Title', content: 'Updated content' },
    }), res);

    const updated = json.mock.calls[0][0];
    expect(updated.title).toBe('New Title');
    expect(updated.providerApproved).toBe(false);
  });

  it('returns 404 for another provider\'s post', async () => {
    const user1 = await createTestUser();
    const provider1 = await createTestProvider({ userId: user1._id.toString() });
    const user2 = await createTestUser();
    const provider2 = await createTestProvider({ userId: user2._id.toString() });
    const post = await BlogPost.create({ title: 'Not Mine', slug: 'not-mine-b2', authorProviderId: provider2._id, authorType: 'provider', author: user2._id, categories: [], tags: [] });

    const { status, res } = mockRes();
    await updatePost(makeReq(provider1, { params: { id: post._id.toString() } as any, body: { title: 'Hack' } }), res);

    expect(status).toHaveBeenCalledWith(404);
  });
});

// ─── deletePost ───────────────────────────────────────────────────────────────

describe('deletePost', () => {
  it('deletes the post and returns success message', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await BlogPost.create({ title: 'Delete Me', slug: 'delete-me-c3', authorProviderId: provider._id, authorType: 'provider', author: user._id, categories: [], tags: [] });

    const { json, res } = mockRes();
    await deletePost(makeReq(provider, { params: { id: post._id.toString() } as any }), res);

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('deleted') }));
    expect(await BlogPost.findById(post._id)).toBeNull();
  });
});

// ─── generateContent ──────────────────────────────────────────────────────────

describe('generateContent', () => {
  const generatedPost = {
    content: '# Generated\n\nThis is the generated content.',
    excerpt: 'A generated excerpt.',
    suggestedTags: ['therapy', 'burnout'],
    socialCaption: 'Check out our new post!',
  };

  it('calls claude service and updates the post', async () => {
    mockGenerateBlogPost.mockResolvedValueOnce(generatedPost);
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await BlogPost.create({ title: 'Burnout', slug: 'burnout-d4', brief: 'About burnout', authorProviderId: provider._id, authorType: 'provider', author: user._id, authorDisplayName: provider.displayName, categories: [], tags: [] });

    const { json, res } = mockRes();
    await generateContent(makeReq(provider, { params: { id: post._id.toString() } as any }), res);

    expect(mockGenerateBlogPost).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Burnout',
      brief: 'About burnout',
      authorName: provider.displayName,
    }));
    const result = json.mock.calls[0][0];
    expect(result.post.aiGenerated).toBe(true);
    expect(result.post.generationCount).toBe(1);
    expect(result.post.content).toContain('Generated');
    expect(result.socialCaption).toBe('Check out our new post!');
  });

  it('resets providerApproved after generation', async () => {
    mockGenerateBlogPost.mockResolvedValueOnce(generatedPost);
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await BlogPost.create({ title: 'Test', slug: 'test-e5', brief: 'brief', authorProviderId: provider._id, authorType: 'provider', author: user._id, authorDisplayName: provider.displayName, categories: [], tags: [], providerApproved: true });

    const { json, res } = mockRes();
    await generateContent(makeReq(provider, { params: { id: post._id.toString() } as any }), res);

    expect(json.mock.calls[0][0].post.providerApproved).toBe(false);
  });

  it('rejects with 400 when generationCount reaches 5', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await BlogPost.create({ title: 'Capped', slug: 'capped-f6', brief: 'brief', generationCount: 5, authorProviderId: provider._id, authorType: 'provider', author: user._id, authorDisplayName: provider.displayName, categories: [], tags: [] });

    const { status, json, res } = mockRes();
    await generateContent(makeReq(provider, { params: { id: post._id.toString() } as any }), res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json.mock.calls[0][0].message).toContain('generation limit');
    expect(mockGenerateBlogPost).not.toHaveBeenCalled();
  });

  it('returns 404 for another provider\'s post', async () => {
    const user1 = await createTestUser();
    const provider1 = await createTestProvider({ userId: user1._id.toString() });
    const user2 = await createTestUser();
    const provider2 = await createTestProvider({ userId: user2._id.toString() });
    const post = await BlogPost.create({ title: 'Not Mine', slug: 'not-mine-g7', brief: 'b', authorProviderId: provider2._id, authorType: 'provider', author: user2._id, authorDisplayName: provider2.displayName, categories: [], tags: [] });

    const { status, res } = mockRes();
    await generateContent(makeReq(provider1, { params: { id: post._id.toString() } as any }), res);

    expect(status).toHaveBeenCalledWith(404);
  });
});

// ─── approvePost ──────────────────────────────────────────────────────────────

describe('approvePost', () => {
  it('sets providerApproved=true and records timestamp', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await BlogPost.create({ title: 'Approve Me', slug: 'approve-me-h8', authorProviderId: provider._id, authorType: 'provider', author: user._id, categories: [], tags: [] });

    const { json, res } = mockRes();
    await approvePost(makeReq(provider, { params: { id: post._id.toString() } as any }), res);

    const result = json.mock.calls[0][0];
    expect(result.providerApproved).toBe(true);
    expect(result.providerApprovedAt).toBeTruthy();
  });
});

// ─── publishPost ──────────────────────────────────────────────────────────────

describe('publishPost', () => {
  it('moves post to pending_review when providerApproved is true', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await BlogPost.create({ title: 'Publish Me', slug: 'publish-me-i9', authorProviderId: provider._id, authorType: 'provider', author: user._id, categories: [], tags: [], providerApproved: true });

    const { json, res } = mockRes();
    await publishPost(makeReq(provider, { params: { id: post._id.toString() } as any }), res);

    const result = json.mock.calls[0][0];
    expect(result.status).toBe('pending_review');
    expect(result.publishedAt).toBeTruthy();
  });

  it('rejects with 400 if not provider-approved', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await BlogPost.create({ title: 'Not Approved', slug: 'not-approved-j10', authorProviderId: provider._id, authorType: 'provider', author: user._id, categories: [], tags: [], providerApproved: false });

    const { status, json, res } = mockRes();
    await publishPost(makeReq(provider, { params: { id: post._id.toString() } as any }), res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json.mock.calls[0][0].message).toContain('approved');
  });
});

// ─── social queue ─────────────────────────────────────────────────────────────

describe('addToSocialQueue', () => {
  it('adds a platform entry to the social queue', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await BlogPost.create({ title: 'Social Post', slug: 'social-post-k11', authorProviderId: provider._id, authorType: 'provider', author: user._id, categories: [], tags: [], providerApproved: true });

    const { json, res } = mockRes();
    await addToSocialQueue(makeReq(provider, {
      params: { id: post._id.toString() } as any,
      body: { platform: 'instagram' },
    }), res);

    const result = json.mock.calls[0][0];
    expect(result.socialQueue).toHaveLength(1);
    expect(result.socialQueue[0].platform).toBe('instagram');
  });

  it('replaces existing entry for the same platform (upsert)', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const scheduledFirst = new Date('2026-08-01');
    const scheduledSecond = new Date('2026-09-01');
    const post = await BlogPost.create({
      title: 'Upsert Test', slug: 'upsert-test-l12', authorProviderId: provider._id, authorType: 'provider',
      author: user._id, categories: [], tags: [], providerApproved: true,
      socialQueue: [{ platform: 'instagram', scheduledAt: scheduledFirst, status: 'pending' }],
    });

    const { json, res } = mockRes();
    await addToSocialQueue(makeReq(provider, {
      params: { id: post._id.toString() } as any,
      body: { platform: 'instagram', scheduledAt: scheduledSecond },
    }), res);

    const result = json.mock.calls[0][0];
    expect(result.socialQueue).toHaveLength(1);
    expect(new Date(result.socialQueue[0].scheduledAt).toISOString()).toBe(scheduledSecond.toISOString());
  });

  it('rejects if post not providerApproved', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await BlogPost.create({ title: 'Not Approved', slug: 'not-approved-m13', authorProviderId: provider._id, authorType: 'provider', author: user._id, categories: [], tags: [], providerApproved: false });

    const { status, res } = mockRes();
    await addToSocialQueue(makeReq(provider, { params: { id: post._id.toString() } as any, body: { platform: 'facebook' } }), res);

    expect(status).toHaveBeenCalledWith(400);
  });
});

describe('removeFromSocialQueue', () => {
  it('removes the specified platform from the social queue', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await BlogPost.create({
      title: 'Remove Platform', slug: 'remove-platform-n14', authorProviderId: provider._id, authorType: 'provider',
      author: user._id, categories: [], tags: [], providerApproved: true,
      socialQueue: [
        { platform: 'instagram', status: 'pending' },
        { platform: 'facebook', status: 'pending' },
      ],
    });

    const { json, res } = mockRes();
    await removeFromSocialQueue(makeReq(provider, {
      params: { id: post._id.toString(), platform: 'instagram' } as any,
    }), res);

    const result = json.mock.calls[0][0];
    expect(result.socialQueue).toHaveLength(1);
    expect(result.socialQueue[0].platform).toBe('facebook');
  });
});

// ─── Admin review ─────────────────────────────────────────────────────────────

const makeAdminReq = (overrides: Record<string, unknown> = {}) =>
  ({ userId: 'admin-user-id', body: {}, params: {}, ...overrides } as unknown as ProviderAuthRequest);

describe('getPendingPosts', () => {
  it('returns posts with status pending_review and authorType provider', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    await BlogPost.create({ title: 'Pending Review', slug: 'pending-review-o15', authorProviderId: provider._id, authorType: 'provider', author: user._id, categories: [], tags: [], status: 'pending_review' });
    await BlogPost.create({ title: 'Published Admin', slug: 'published-admin-p16', author: user._id, categories: [], tags: [], status: 'published', authorType: 'admin' });

    const { json, res } = mockRes();
    await getPendingPosts(makeAdminReq(), res);

    const result = json.mock.calls[0][0];
    expect(result.posts).toHaveLength(1);
    expect(result.posts[0].title).toBe('Pending Review');
    expect(result.total).toBe(1);
  });
});

describe('reviewPost', () => {
  it('sets status to published on approve', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await BlogPost.create({ title: 'Approve', slug: 'approve-q17', authorProviderId: provider._id, authorType: 'provider', author: user._id, categories: [], tags: [], status: 'pending_review' });

    const { json, res } = mockRes();
    await reviewPost(makeAdminReq({ params: { id: post._id.toString() }, body: { action: 'approve' } }), res);

    expect(json.mock.calls[0][0].status).toBe('published');
  });

  it('sets status to draft and clears providerApproved on reject', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const post = await BlogPost.create({ title: 'Reject Me', slug: 'reject-me-r18', authorProviderId: provider._id, authorType: 'provider', author: user._id, categories: [], tags: [], status: 'pending_review', providerApproved: true });

    const { json, res } = mockRes();
    await reviewPost(makeAdminReq({ params: { id: post._id.toString() }, body: { action: 'reject', rejectionReason: 'Inaccurate content' } }), res);

    const result = json.mock.calls[0][0];
    expect(result.status).toBe('draft');
    expect(result.providerApproved).toBe(false);
  });

  it('returns 400 for an invalid action', async () => {
    const { status, res } = mockRes();
    await reviewPost(makeAdminReq({ params: { id: 'any' }, body: { action: 'publish_now' } }), res);
    expect(status).toHaveBeenCalledWith(400);
  });
});
