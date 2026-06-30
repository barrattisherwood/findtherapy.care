# findtherapy.care — Member Blog Feature
## Full Stack TDD Build Guide

**Stack:** Angular 21 · Node/Express · MongoDB · Signals · Cloudinary · Claude API  
**Feature:** Practitioners submit blog topics, AI generates/polishes content, posts publish to blog + social  
**New routes:** `/provider/blog` (practitioner) · `/blog/:slug` (public)  
**Estimated effort:** 4–6 focused sessions

---

## Overview

Practitioners get a blog authoring tool inside their existing dashboard area. They submit a title and brief (or a full draft), Claude polishes or generates the post, the practitioner reviews and approves, and the post publishes to the findtherapy.care blog. Approved posts can also be queued for social sharing to Instagram, Facebook, and LinkedIn.

This feature has three distinct layers:

```
Submit → Generate → Review → Publish → Share
```

No post goes live without practitioner approval. Claude is an assistant, not an autopublisher.

---

## Part 0 — Beta Opt-In

The blog feature launches as an **opt-in beta**. Practitioners must explicitly enable it before they see the Blog section in their dashboard. This allows testing with a small group of founding members before wider rollout.

### Provider model addition

```typescript
// backend/src/models/provider.model.ts — add field
blogBetaEnabled: { type: Boolean, default: false }
```

### Toggle endpoint

```typescript
// PATCH /api/provider/profile/blog-beta
export const toggleBlogBeta = async (req: Request, res: Response) => {
  try {
    const { enabled } = req.body;
    const provider = await Provider.findOneAndUpdate(
      { userId: req.user._id },
      { blogBetaEnabled: enabled },
      { new: true }
    );
    res.json({ blogBetaEnabled: provider.blogBetaEnabled });
  } catch {
    res.status(400).json({ message: 'Failed to update beta setting' });
  }
};
```

### UI — Provider profile settings

Add a toggle in the existing `ProviderProfile` component:

```html
<div class="settings-row beta-toggle">
  <div>
    <h4>Blog feature <span class="beta-badge">BETA</span></h4>
    <p>Write blog posts with AI assistance. Early access — content quality 
       and features are still being refined. Always review before publishing.</p>
  </div>
  <app-toggle [checked]="blogBetaEnabled()" (change)="onToggleBlogBeta($event)" />
</div>
```

### Nav visibility

The Blog link in the provider nav only renders when `provider.blogBetaEnabled === true`. Use a guard or simple `*ngIf` / `@if` on the nav item itself — no route guard needed since it's a soft gate, not a security boundary.

### Beta badge in the editor

```html
<!-- post-editor.component.html — top of editor -->
<div class="beta-notice">
  <span class="beta-badge">BETA</span>
  AI-assisted content generation is in early access. Always review generated 
  content carefully before approving — this technology is still being refined.
</div>
```

### Rollout plan

1. Build and deploy with toggle defaulting to `false` for everyone
2. Manually enable `blogBetaEnabled: true` for 3–5 selected founding members via direct DB update or a quick admin toggle
3. Gather feedback for 1–2 weeks
4. Fix issues found
5. Open toggle visibility to all founding members — let them opt in themselves
6. Eventually consider making it default-on once stable

---

## Part 1 — Data Model

### 1.1 Extend `BlogPost` model

The existing `BlogPost` model covers published posts. Add provider-authored fields:

```typescript
// backend/src/models/blog-post.model.ts — additions only

export interface IBlogPost extends Document {
  // --- existing fields ---
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  categories: string[];
  tags: string[];
  status: 'draft' | 'published' | 'scheduled' | 'pending_review';
  featuredImage?: string;         // Cloudinary URL
  authorDisplayName: string;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;

  // --- new fields ---
  authorType: 'admin' | 'provider';
  providerId?: mongoose.Types.ObjectId;  // ref: 'Provider'
  brief?: string;                 // original topic/brief submitted by provider
  aiGenerated: boolean;           // was content AI-assisted?
  aiGeneratedAt?: Date;
  generationCount: number;        // increments each /generate call; capped at 5
  providerApproved: boolean;      // has provider approved for publish?
  providerApprovedAt?: Date;
  socialQueue: SocialQueueItem[]; // scheduled social shares
}

export interface SocialQueueItem {
  platform: 'instagram' | 'facebook' | 'linkedin';
  scheduledAt?: Date;
  postedAt?: Date;
  status: 'pending' | 'posted' | 'failed';
  postUrl?: string;
}

// Add to existing BlogPostSchema:
const SocialQueueSchema = new Schema<SocialQueueItem>({
  platform:    { type: String, enum: ['instagram', 'facebook', 'linkedin'], required: true },
  scheduledAt: { type: Date },
  postedAt:    { type: Date },
  status:      { type: String, enum: ['pending', 'posted', 'failed'], default: 'pending' },
  postUrl:     { type: String },
});

// New fields to add to BlogPostSchema:
authorType:         { type: String, enum: ['admin', 'provider'], default: 'admin' },
providerId:         { type: Schema.Types.ObjectId, ref: 'Provider', default: null },
brief:              { type: String },
aiGenerated:        { type: Boolean, default: false },
aiGeneratedAt:      { type: Date },
generationCount:    { type: Number, default: 0 },   // capped at 5 per post
providerApproved:   { type: Boolean, default: false },
providerApprovedAt: { type: Date },
publishedAt:        { type: Date },
socialQueue:        { type: [SocialQueueSchema], default: [] },

// Also update status enum in existing schema:
// status: { type: String, enum: ['draft', 'published', 'scheduled', 'pending_review'], default: 'draft' }
```

---

## Part 2 — Backend

### 2.1 Routes

**`backend/src/routes/provider-blog.routes.ts`**

```typescript
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { providerGuard } from '../middleware/provider.guard';
import * as ProviderBlogController from '../controllers/provider-blog.controller';

const router = Router();
router.use(authMiddleware, providerGuard);

// Post management
router.get('/',              ProviderBlogController.getMyPosts);
router.post('/',             ProviderBlogController.createDraft);
router.get('/:id',           ProviderBlogController.getPost);
router.patch('/:id',         ProviderBlogController.updatePost);
router.delete('/:id',        ProviderBlogController.deletePost);

// AI generation
router.post('/:id/generate', ProviderBlogController.generateContent);

// Approval + publish
router.patch('/:id/approve', ProviderBlogController.approvePost);
router.patch('/:id/publish', ProviderBlogController.publishPost);

// Social queue
router.post('/:id/social-queue',         ProviderBlogController.addToSocialQueue);
router.delete('/:id/social-queue/:platform', ProviderBlogController.removeFromSocialQueue);

export default router;
```

Register in `app.ts`:
```typescript
import providerBlogRoutes from './routes/provider-blog.routes';
app.use('/api/provider/blog', providerBlogRoutes);
```

---

### 2.2 Provider Guard

```typescript
// backend/src/middleware/provider.guard.ts
import { Request, Response, NextFunction } from 'express';

export const providerGuard = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'provider') {
    return res.status(403).json({ message: 'Provider access required' });
  }
  next();
};
```

---

### 2.3 Claude Service

**`backend/src/services/claude.service.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface GeneratePostOptions {
  title: string;
  brief: string;
  authorName: string;
  draft?: string;       // optional existing draft to polish
}

export interface GeneratedPost {
  content: string;      // full markdown
  excerpt: string;      // 2-3 sentence summary
  suggestedTags: string[];
  socialCaption: string; // ready-to-use social media caption
}

export const generateBlogPost = async (options: GeneratePostOptions): Promise<GeneratedPost> => {
  const { title, brief, authorName, draft } = options;

  const systemPrompt = `You are a professional content writer for findtherapy.care, 
a South African mental health practitioner directory. You write warm, professional, 
evidence-informed blog posts on behalf of registered practitioners. 

Tone: approachable, trustworthy, not clinical. Written for a general SA audience 
seeking mental health support. Never sensationalist, never prescriptive. 
Always include a gentle call to action pointing readers toward finding a therapist.

Respond ONLY with a valid JSON object. No markdown fences, no preamble.`;

  const userPrompt = draft
    ? `Polish and improve this draft blog post by ${authorName}.
Title: "${title}"
Brief/intent: "${brief}"

Existing draft:
${draft}

Return JSON with: { "content": "full markdown post", "excerpt": "2-3 sentence summary", "suggestedTags": ["tag1","tag2"], "socialCaption": "caption for social media max 200 chars" }`
    : `Write a blog post for ${authorName}, a mental health practitioner on findtherapy.care.
Title: "${title}"
Brief: "${brief}"

Return JSON with: { "content": "full markdown post min 600 words", "excerpt": "2-3 sentence summary", "suggestedTags": ["tag1","tag2"], "socialCaption": "caption for social media max 200 chars" }`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => (block as any).text)
    .join('');

  return JSON.parse(text) as GeneratedPost;
};
```

---

### 2.4 Controller

**`backend/src/controllers/provider-blog.controller.ts`**

```typescript
import { Request, Response } from 'express';
import { BlogPost } from '../models/blog-post.model';
import { generateBlogPost } from '../services/claude.service';
import slugify from 'slugify';
import { nanoid } from 'nanoid';

// GET /api/provider/blog
export const getMyPosts = async (req: Request, res: Response) => {
  try {
    const posts = await BlogPost.find({ providerId: req.user._id })
      .select('-content')   // exclude heavy content field from list view
      .sort({ updatedAt: -1 });
    res.json(posts);
  } catch {
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
};

// POST /api/provider/blog
export const createDraft = async (req: Request, res: Response) => {
  try {
    const { title, brief, draft } = req.body;
    // Append 4-char random suffix to avoid collisions between providers
    const slug = `${slugify(title, { lower: true, strict: true })}-${nanoid(4)}`;

    const post = new BlogPost({
      title,
      slug,
      brief,
      content: draft ?? '',
      excerpt: '',
      authorType: 'provider',
      providerId: req.user._id,
      authorDisplayName: req.user.displayName,
      status: 'draft',
      aiGenerated: false,
      providerApproved: false,
      categories: [],
      tags: [],
      socialQueue: [],
    });

    await post.save();
    res.status(201).json(post);
  } catch {
    res.status(400).json({ message: 'Failed to create draft' });
  }
};

// GET /api/provider/blog/:id
export const getPost = async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id, providerId: req.user._id });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch {
    res.status(500).json({ message: 'Failed to fetch post' });
  }
};

// PATCH /api/provider/blog/:id
export const updatePost = async (req: Request, res: Response) => {
  try {
    const allowed = ['title', 'brief', 'content', 'excerpt', 'tags', 'categories', 'featuredImage'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key))
    );

    const post = await BlogPost.findOneAndUpdate(
      { _id: req.params.id, providerId: req.user._id },
      { ...updates, providerApproved: false }, // reset approval on edit
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch {
    res.status(400).json({ message: 'Failed to update post' });
  }
};

// DELETE /api/provider/blog/:id
export const deletePost = async (req: Request, res: Response) => {
  try {
    await BlogPost.findOneAndDelete({ _id: req.params.id, providerId: req.user._id });
    res.json({ message: 'Post deleted' });
  } catch {
    res.status(400).json({ message: 'Failed to delete post' });
  }
};

// POST /api/provider/blog/:id/generate
export const generateContent = async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id, providerId: req.user._id });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.brief && !post.content) {
      return res.status(400).json({ message: 'A title and brief are required before generating' });
    }
    if (post.generationCount >= 5) {
      return res.status(400).json({ message: "You've reached the generation limit for this post — try editing manually or contact support for more." });
    }

    const generated = await generateBlogPost({
      title: post.title,
      brief: post.brief ?? '',
      authorName: post.authorDisplayName,
      draft: post.content || undefined,
    });

    const updated = await BlogPost.findByIdAndUpdate(
      post._id,
      {
        content: generated.content,
        excerpt: generated.excerpt,
        tags: generated.suggestedTags,
        aiGenerated: true,
        aiGeneratedAt: new Date(),
        providerApproved: false,   // must re-approve after generation
        $inc: { generationCount: 1 },
      },
      { new: true }
    );

    res.json({ post: updated, socialCaption: generated.socialCaption });
  } catch (err) {
    console.error('Claude generation error:', err);
    res.status(500).json({ message: 'Content generation failed' });
  }
};

// PATCH /api/provider/blog/:id/approve
export const approvePost = async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findOneAndUpdate(
      { _id: req.params.id, providerId: req.user._id },
      { providerApproved: true, providerApprovedAt: new Date() },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch {
    res.status(400).json({ message: 'Failed to approve post' });
  }
};

// PATCH /api/provider/blog/:id/publish
export const publishPost = async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id, providerId: req.user._id });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.providerApproved) {
      return res.status(400).json({ message: 'Post must be approved before publishing' });
    }

    const updated = await BlogPost.findByIdAndUpdate(
      post._id,
      {
        status: 'pending_review',
        publishedAt: new Date(), // records when the provider submitted — admin sets actual live date
      },
      { new: true }
    );
    res.json(updated);
  } catch {
    res.status(400).json({ message: 'Failed to submit post for review' });
  }
};

// POST /api/provider/blog/:id/social-queue
export const addToSocialQueue = async (req: Request, res: Response) => {
  try {
    const { platform, scheduledAt } = req.body;
    const post = await BlogPost.findOne({ _id: req.params.id, providerId: req.user._id });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.providerApproved) {
      return res.status(400).json({ message: 'Post must be approved before queuing for social' });
    }

    // Remove existing entry for this platform if present, then add new
    post.socialQueue = post.socialQueue.filter(q => q.platform !== platform);
    post.socialQueue.push({ platform, scheduledAt, status: 'pending' });
    await post.save();

    res.json(post);
  } catch {
    res.status(400).json({ message: 'Failed to add to social queue' });
  }
};

// DELETE /api/provider/blog/:id/social-queue/:platform
export const removeFromSocialQueue = async (req: Request, res: Response) => {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id, providerId: req.user._id });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.socialQueue = post.socialQueue.filter(q => q.platform !== req.params.platform);
    await post.save();
    res.json(post);
  } catch {
    res.status(400).json({ message: 'Failed to remove from social queue' });
  }
};
```

---

### 2.5 Admin Review Endpoint

Provider posts land in `pending_review`. Admins approve (→ `published`) or reject (→ `draft`, notified via email).

**Add to `backend/src/routes/admin.routes.ts`** (alongside existing admin routes):
```typescript
router.get('/blog/pending',           AdminBlogController.getPendingPosts);
router.patch('/blog/:id/review',      AdminBlogController.reviewPost);
```

**`backend/src/controllers/admin-blog.controller.ts`**

```typescript
import { Request, Response } from 'express';
import { BlogPost } from '../models/blog-post.model';

// GET /api/admin/blog/pending
export const getPendingPosts = async (req: Request, res: Response) => {
  try {
    const posts = await BlogPost.find({ status: 'pending_review', authorType: 'provider' })
      .populate('providerId', 'displayName contactEmail')
      .sort({ publishedAt: 1 }); // oldest first
    res.json({ posts, total: posts.length });
  } catch {
    res.status(500).json({ message: 'Failed to fetch pending posts' });
  }
};

// PATCH /api/admin/blog/:id/review
// body: { action: 'approve' | 'reject', rejectionReason?: string }
export const reviewPost = async (req: Request, res: Response) => {
  try {
    const { action, rejectionReason } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be approve or reject' });
    }

    const update = action === 'approve'
      ? { status: 'published' }
      : { status: 'draft', providerApproved: false };

    const post = await BlogPost.findOneAndUpdate(
      { _id: req.params.id, authorType: 'provider' },
      update,
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // TODO: email provider on rejection with rejectionReason

    res.json(post);
  } catch {
    res.status(400).json({ message: 'Failed to review post' });
  }
};
```

The admin dashboard's blog section should surface a **"Pending Review"** count badge alongside existing blog metrics, linking to the pending post list. Add `getPendingPosts` count to `getBlogMetrics` or as a separate `/api/admin/blog/pending-count` endpoint.

---

## Part 3 — Frontend

### 3.1 Types

**`shared/src/types/provider-blog.types.ts`**

```typescript
export type BlogPostStatus = 'draft' | 'published' | 'scheduled' | 'pending_review';
export type SocialPlatform = 'instagram' | 'facebook' | 'linkedin';
export type SocialQueueStatus = 'pending' | 'posted' | 'failed';

export interface SocialQueueItem {
  platform: SocialPlatform;
  scheduledAt?: string;
  postedAt?: string;
  status: SocialQueueStatus;
  postUrl?: string;
}

export interface ProviderBlogPost {
  _id: string;
  title: string;
  slug: string;
  brief?: string;
  content: string;
  excerpt: string;
  categories: string[];
  tags: string[];
  status: BlogPostStatus;
  featuredImage?: string;
  authorDisplayName: string;
  authorType: 'admin' | 'provider';
  providerId?: string;
  aiGenerated: boolean;
  aiGeneratedAt?: string;
  generationCount: number;
  providerApproved: boolean;
  providerApprovedAt?: string;
  socialQueue: SocialQueueItem[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerateContentResponse {
  post: ProviderBlogPost;
  socialCaption: string;
}

export interface CreateDraftPayload {
  title: string;
  brief: string;
  draft?: string;
}
```

---

### 3.2 Provider Blog Service

**`frontend/src/app/services/provider-blog.service.ts`**

```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { ProviderBlogPost, CreateDraftPayload, GenerateContentResponse } from '@findtherapy/shared';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProviderBlogService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/provider/blog`;

  // State
  posts = signal<ProviderBlogPost[]>([]);
  loading = signal(false);
  generating = signal(false);
  selectedPostId = signal<string | null>(null);
  lastSocialCaption = signal<string | null>(null);

  // Computed
  selectedPost = computed(() => this.posts().find(p => p._id === this.selectedPostId()) ?? null);
  draftPosts = computed(() => this.posts().filter(p => p.status === 'draft'));
  publishedPosts = computed(() => this.posts().filter(p => p.status === 'published'));
  pendingApproval = computed(() => this.posts().filter(p => !p.providerApproved && p.aiGenerated));

  loadPosts() {
    this.loading.set(true);
    return this.http.get<ProviderBlogPost[]>(this.baseUrl).pipe(
      tap(posts => {
        this.posts.set(posts);
        this.loading.set(false);
      })
    );
  }

  createDraft(payload: CreateDraftPayload) {
    return this.http.post<ProviderBlogPost>(this.baseUrl, payload).pipe(
      tap(post => this.posts.update(ps => [post, ...ps]))
    );
  }

  updatePost(id: string, data: Partial<ProviderBlogPost>) {
    return this.http.patch<ProviderBlogPost>(`${this.baseUrl}/${id}`, data).pipe(
      tap(updated => this.posts.update(ps => ps.map(p => p._id === id ? updated : p)))
    );
  }

  deletePost(id: string) {
    return this.http.delete(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.posts.update(ps => ps.filter(p => p._id !== id)))
    );
  }

  generateContent(id: string) {
    this.generating.set(true);
    return this.http.post<GenerateContentResponse>(`${this.baseUrl}/${id}/generate`, {}).pipe(
      tap(({ post, socialCaption }) => {
        this.posts.update(ps => ps.map(p => p._id === id ? post : p));
        this.lastSocialCaption.set(socialCaption);
        this.generating.set(false);
      })
    );
  }

  approvePost(id: string) {
    return this.http.patch<ProviderBlogPost>(`${this.baseUrl}/${id}/approve`, {}).pipe(
      tap(updated => this.posts.update(ps => ps.map(p => p._id === id ? updated : p)))
    );
  }

  publishPost(id: string) {
    return this.http.patch<ProviderBlogPost>(`${this.baseUrl}/${id}/publish`, {}).pipe(
      tap(updated => this.posts.update(ps => ps.map(p => p._id === id ? updated : p)))
    );
  }

  addToSocialQueue(id: string, platform: string, scheduledAt?: string) {
    return this.http.post<ProviderBlogPost>(`${this.baseUrl}/${id}/social-queue`, { platform, scheduledAt }).pipe(
      tap(updated => this.posts.update(ps => ps.map(p => p._id === id ? updated : p)))
    );
  }

  removeFromSocialQueue(id: string, platform: string) {
    return this.http.delete<ProviderBlogPost>(`${this.baseUrl}/${id}/social-queue/${platform}`).pipe(
      tap(updated => this.posts.update(ps => ps.map(p => p._id === id ? updated : p)))
    );
  }
}
```

---

### 3.3 Route

Add to `frontend/src/app/app.routes.ts`:

```typescript
{
  path: 'provider/blog',
  canActivate: [authGuard, providerGuard],
  loadComponent: () =>
    import('./pages/provider-blog/provider-blog.component').then(m => m.ProviderBlogComponent)
},
{
  path: 'provider/blog/:id',
  canActivate: [authGuard, providerGuard],
  loadComponent: () =>
    import('./pages/provider-blog/post-editor/post-editor.component').then(m => m.PostEditorComponent)
}
```

---

### 3.4 Component Structure

```
frontend/src/app/pages/provider-blog/
  provider-blog.component.ts       ← post list / dashboard
  provider-blog.component.html
  provider-blog.component.scss

  post-editor/
    post-editor.component.ts       ← full editor: brief, generate, review, approve, publish
    post-editor.component.html
    post-editor.component.scss

  post-card/
    post-card.component.ts         ← list item: title, status badge, actions
    post-card.component.html

  social-queue-panel/
    social-queue-panel.component.ts  ← platform toggles + scheduling
    social-queue-panel.component.html

  ai-review-panel/
    ai-review-panel.component.ts     ← shows generated content + approve/edit options
    ai-review-panel.component.html
```

---

### 3.5 Post Editor Flow

The editor has four distinct states driven by a computed signal:

```typescript
// post-editor.component.ts

editorState = computed((): EditorState => {
  const post = this.blogService.selectedPost();
  if (!post) return 'empty';
  if (!post.content && !post.aiGenerated) return 'brief';            // just title/brief, no content yet
  if (post.aiGenerated && !post.providerApproved) return 'review';   // AI generated, awaiting approval
  if (post.providerApproved && post.status === 'draft') return 'ready';    // approved, ready to submit
  if (post.status === 'pending_review') return 'pending_review';     // submitted, awaiting admin
  if (post.status === 'published') return 'published';
  return 'editing';                                                   // manual editing in progress
});

type EditorState = 'empty' | 'brief' | 'review' | 'ready' | 'editing' | 'pending_review' | 'published';
```

**State UI:**

| State | What the practitioner sees |
|---|---|
| `brief` | Title + brief form + "Generate with AI" button |
| `review` | AI content preview (read-only markdown) + "Edit" + "Approve & Submit for Review" |
| `editing` | Full markdown editor |
| `ready` | Approved content preview + "Submit for Admin Review" button + social queue panel |
| `pending_review` | Read-only: "Your post is under review — we'll notify you once it's live." |
| `published` | Published confirmation + social queue panel |

---

### 3.6 Provider Blog Dashboard HTML

```html
<!-- provider-blog.component.html -->
<div class="provider-blog">

  <header class="provider-blog__header">
    <h1>My Blog Posts</h1>
    <button class="btn-primary" (click)="showNewPostForm.set(true)">+ New Post</button>
  </header>

  @if (blogService.loading()) {
    <div class="loading-state">Loading your posts...</div>
  }

  @if (blogService.pendingApproval().length) {
    <div class="review-banner">
      {{ blogService.pendingApproval().length }} post(s) ready for your review
    </div>
  }

  <section class="post-list">
    @for (post of blogService.draftPosts(); track post._id) {
      <app-post-card [post]="post" (open)="openPost(post._id)" />
    }
    @for (post of blogService.publishedPosts(); track post._id) {
      <app-post-card [post]="post" (open)="openPost(post._id)" />
    }
    @empty {
      <div class="empty-state">
        <p>You haven't written any blog posts yet.</p>
        <button class="btn-secondary" (click)="showNewPostForm.set(true)">Write your first post</button>
      </div>
    }
  </section>

  @if (showNewPostForm()) {
    <app-new-post-modal (created)="onPostCreated($event)" (close)="showNewPostForm.set(false)" />
  }

</div>
```

---

## Part 4 — TDD

### 4.1 Testing Stack

Same as existing stack. Install if not present:

```bash
# Backend
npm install --save-dev jest supertest mongodb-memory-server @types/jest ts-jest

# Frontend
npm install --save-dev @angular/core/testing @testing-library/angular @testing-library/jest-dom

# Mock Claude in tests
npm install --save-dev jest-mock-extended
```

---

### 4.2 Backend Tests

#### Claude Service Tests — `backend/src/services/claude.service.spec.ts`

```typescript
import { generateBlogPost } from './claude.service';

// Mock the Anthropic SDK
jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            content: '# Test Post\n\nThis is generated content.',
            excerpt: 'A short summary.',
            suggestedTags: ['mental-health', 'therapy'],
            socialCaption: 'New post on findtherapy.care!',
          })
        }]
      })
    }
  }))
}));

describe('Claude Service — generateBlogPost', () => {
  it('returns generated content for a brief', async () => {
    const result = await generateBlogPost({
      title: 'Burnout or Just Tired?',
      brief: 'Explain the difference between burnout and tiredness',
      authorName: 'Dr. Julia Smith',
    });

    expect(result.content).toContain('Test Post');
    expect(result.excerpt).toBe('A short summary.');
    expect(result.suggestedTags).toContain('mental-health');
    expect(result.socialCaption).toBeDefined();
  });

  it('includes existing draft in prompt when provided', async () => {
    const Anthropic = require('@anthropic-ai/sdk').default;
    const mockCreate = Anthropic.mock.results[0].value.messages.create;

    await generateBlogPost({
      title: 'Test',
      brief: 'A brief',
      authorName: 'Dr. Smith',
      draft: 'My existing draft content',
    });

    const callArgs = mockCreate.mock.calls[0][0];
    expect(callArgs.messages[0].content).toContain('My existing draft content');
  });

  it('throws if Claude returns invalid JSON', async () => {
    const Anthropic = require('@anthropic-ai/sdk').default;
    Anthropic.mockImplementationOnce(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'not json at all' }]
        })
      }
    }));

    await expect(generateBlogPost({
      title: 'Test',
      brief: 'Brief',
      authorName: 'Dr. Smith',
    })).rejects.toThrow();
  });
});
```

---

#### Provider Blog Controller Tests — `backend/src/controllers/provider-blog.controller.spec.ts`

```typescript
import request from 'supertest';
import app from '../app';
import { BlogPost } from '../models/blog-post.model';
import { User } from '../models/user.model';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import * as ClaudeService from '../services/claude.service';

jest.mock('../services/claude.service');
const mockGenerate = ClaudeService.generateBlogPost as jest.Mock;

const makeProvider = async () => {
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    email: `provider${Date.now()}@test.com`,
    password: 'hashed',
    role: 'provider',
    displayName: 'Dr. Test Provider',
    xp: 0,
  });
  await user.save();
  return user;
};

const makeToken = (userId: string) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET!);

const makeDraft = async (providerId: mongoose.Types.ObjectId) =>
  BlogPost.create({
    title: 'Test Post',
    slug: 'test-post',
    brief: 'A test brief',
    content: '',
    excerpt: '',
    authorType: 'provider',
    providerId,
    authorDisplayName: 'Dr. Test',
    status: 'draft',
    aiGenerated: false,
    providerApproved: false,
    categories: [],
    tags: [],
    socialQueue: [],
  });

describe('GET /api/provider/blog', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/provider/blog');
    expect(res.status).toBe(401);
  });

  it('returns only the provider\'s own posts', async () => {
    const provider = await makeProvider();
    const other = await makeProvider();
    const token = makeToken(provider._id.toString());

    await makeDraft(provider._id);
    await makeDraft(other._id);

    const res = await request(app)
      .get('/api/provider/blog')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

describe('POST /api/provider/blog', () => {
  it('creates a draft with correct defaults', async () => {
    const provider = await makeProvider();
    const token = makeToken(provider._id.toString());

    const res = await request(app)
      .post('/api/provider/blog')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'New Post', brief: 'About anxiety' });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.aiGenerated).toBe(false);
    expect(res.body.providerApproved).toBe(false);
    expect(res.body.providerId).toBe(provider._id.toString());
  });

  it('returns 400 if title is missing', async () => {
    const provider = await makeProvider();
    const token = makeToken(provider._id.toString());

    const res = await request(app)
      .post('/api/provider/blog')
      .set('Authorization', `Bearer ${token}`)
      .send({ brief: 'No title here' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/provider/blog/:id/generate', () => {
  it('calls Claude and updates post with generated content', async () => {
    const provider = await makeProvider();
    const token = makeToken(provider._id.toString());
    const draft = await makeDraft(provider._id);

    mockGenerate.mockResolvedValueOnce({
      content: '# Generated Post\n\nContent here.',
      excerpt: 'Short summary.',
      suggestedTags: ['anxiety', 'therapy'],
      socialCaption: 'Check out this post!',
    });

    const res = await request(app)
      .post(`/api/provider/blog/${draft._id}/generate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.post.aiGenerated).toBe(true);
    expect(res.body.post.providerApproved).toBe(false);
    expect(res.body.socialCaption).toBe('Check out this post!');
  });

  it('returns 500 if Claude fails', async () => {
    const provider = await makeProvider();
    const token = makeToken(provider._id.toString());
    const draft = await makeDraft(provider._id);

    mockGenerate.mockRejectedValueOnce(new Error('Claude API error'));

    const res = await request(app)
      .post(`/api/provider/blog/${draft._id}/generate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(500);
  });
});

describe('PATCH /api/provider/blog/:id/approve', () => {
  it('sets providerApproved to true', async () => {
    const provider = await makeProvider();
    const token = makeToken(provider._id.toString());
    const draft = await makeDraft(provider._id);

    const res = await request(app)
      .patch(`/api/provider/blog/${draft._id}/approve`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.providerApproved).toBe(true);
    expect(res.body.providerApprovedAt).toBeDefined();
  });
});

describe('PATCH /api/provider/blog/:id/publish', () => {
  it('publishes an approved post', async () => {
    const provider = await makeProvider();
    const token = makeToken(provider._id.toString());
    const draft = await makeDraft(provider._id);

    // Approve first
    await BlogPost.findByIdAndUpdate(draft._id, { providerApproved: true });

    const res = await request(app)
      .patch(`/api/provider/blog/${draft._id}/publish`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('published');
  });

  it('blocks publishing unapproved post', async () => {
    const provider = await makeProvider();
    const token = makeToken(provider._id.toString());
    const draft = await makeDraft(provider._id);

    const res = await request(app)
      .patch(`/api/provider/blog/${draft._id}/publish`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

describe('POST /api/provider/blog/:id/social-queue', () => {
  it('adds a platform to the social queue', async () => {
    const provider = await makeProvider();
    const token = makeToken(provider._id.toString());
    const draft = await makeDraft(provider._id);
    await BlogPost.findByIdAndUpdate(draft._id, { providerApproved: true });

    const res = await request(app)
      .post(`/api/provider/blog/${draft._id}/social-queue`)
      .set('Authorization', `Bearer ${token}`)
      .send({ platform: 'linkedin' });

    expect(res.status).toBe(200);
    expect(res.body.socialQueue).toHaveLength(1);
    expect(res.body.socialQueue[0].platform).toBe('linkedin');
    expect(res.body.socialQueue[0].status).toBe('pending');
  });

  it('blocks queuing unapproved post', async () => {
    const provider = await makeProvider();
    const token = makeToken(provider._id.toString());
    const draft = await makeDraft(provider._id);

    const res = await request(app)
      .post(`/api/provider/blog/${draft._id}/social-queue`)
      .set('Authorization', `Bearer ${token}`)
      .send({ platform: 'facebook' });

    expect(res.status).toBe(400);
  });
});
```

---

### 4.3 Frontend Tests

#### Provider Blog Service Tests — `provider-blog.service.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProviderBlogService } from './provider-blog.service';
import { ProviderBlogPost } from '@findtherapy/shared';

const mockPost = (): ProviderBlogPost => ({
  _id: 'post-1',
  title: 'Test Post',
  slug: 'test-post',
  brief: 'A brief about anxiety',
  content: '',
  excerpt: '',
  categories: [],
  tags: [],
  status: 'draft',
  authorDisplayName: 'Dr. Smith',
  authorType: 'provider',
  providerId: 'provider-1',
  aiGenerated: false,
  providerApproved: false,
  socialQueue: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('ProviderBlogService', () => {
  let service: ProviderBlogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProviderBlogService],
    });
    service = TestBed.inject(ProviderBlogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('initialises with empty posts signal', () => {
    expect(service.posts()).toEqual([]);
  });

  it('draftPosts computed returns only drafts', () => {
    service.posts.set([
      { ...mockPost(), status: 'draft' },
      { ...mockPost(), _id: 'post-2', status: 'published' },
    ]);
    expect(service.draftPosts().length).toBe(1);
  });

  it('pendingApproval returns AI-generated unapproved posts', () => {
    service.posts.set([
      { ...mockPost(), aiGenerated: true, providerApproved: false },
      { ...mockPost(), _id: 'post-2', aiGenerated: true, providerApproved: true },
      { ...mockPost(), _id: 'post-3', aiGenerated: false, providerApproved: false },
    ]);
    expect(service.pendingApproval().length).toBe(1);
  });

  it('createDraft prepends to posts signal', () => {
    service.createDraft({ title: 'New', brief: 'Brief' }).subscribe();
    const req = httpMock.expectOne(req => req.method === 'POST');
    req.flush(mockPost());
    expect(service.posts().length).toBe(1);
    expect(service.posts()[0].title).toBe('Test Post');
  });

  it('generateContent sets generating signal and updates post', () => {
    service.posts.set([{ ...mockPost() }]);
    expect(service.generating()).toBe(false);

    service.generateContent('post-1').subscribe();
    expect(service.generating()).toBe(true);

    const req = httpMock.expectOne(req => req.url.includes('generate'));
    req.flush({
      post: { ...mockPost(), aiGenerated: true, content: 'Generated content' },
      socialCaption: 'Check this out!',
    });

    expect(service.generating()).toBe(false);
    expect(service.posts()[0].aiGenerated).toBe(true);
    expect(service.lastSocialCaption()).toBe('Check this out!');
  });

  it('approvePost updates providerApproved in signal', () => {
    service.posts.set([{ ...mockPost() }]);
    service.approvePost('post-1').subscribe();
    const req = httpMock.expectOne(req => req.url.includes('approve'));
    req.flush({ ...mockPost(), providerApproved: true });
    expect(service.posts()[0].providerApproved).toBe(true);
  });

  it('deletePost removes from posts signal', () => {
    service.posts.set([{ ...mockPost() }]);
    service.deletePost('post-1').subscribe();
    const req = httpMock.expectOne(req => req.method === 'DELETE');
    req.flush({});
    expect(service.posts().length).toBe(0);
  });
});
```

---

## Part 5 — Build Order (TDD Session by Session)

Red → Green → Refactor each session. Commit at the end of each.

### Session 1 — Data model + Claude service
1. Write Claude service tests → watch fail
2. Install `@anthropic-ai/sdk` → build `claude.service.ts` → watch pass
3. Add new fields to `BlogPost` model
4. Write model-level validation tests → confirm schema changes work
5. Refactor + commit

### Session 2 — Backend routes + controllers
6. Write `provider-blog.controller.spec.ts` (GET, POST, generate, approve, publish, social queue) → watch fail
7. Create `provider.guard.ts`
8. Create `provider-blog.routes.ts` and register
9. Build `provider-blog.controller.ts` → watch pass
10. Refactor + commit

### Session 3 — Frontend types + service
11. Add `provider-blog.types.ts` to shared types (import from `@findlocal/shared`, not `@findtherapy/shared`)
12. Write `provider-blog.service.spec.ts` → watch fail
13. Build `provider-blog.service.ts` → watch pass
14. Add `/provider/blog` and `/provider/blog/:id` routes
15. Add Blog link to provider nav
16. Refactor + commit

### Session 4 — Components
17. Build `provider-blog.component` (post list, empty state, new post button)
18. Build `post-card.component` (status badge, actions)
19. Build `post-editor.component` (4-state editor: brief / review / ready / published)
20. Build `ai-review-panel.component` (generated content preview + approve/edit)
21. Build `social-queue-panel.component` (platform toggles)
22. Refactor + commit

### Session 5 — Admin review UI + integration
23. Add "Pending Review" count badge to admin dashboard blog section
24. Build admin pending posts list at `/admin/blog/pending` (title, provider name, submitted date, approve/reject buttons)
25. Wire `reviewPost` endpoint to approve/reject actions
26. Wire generating spinner to `blogService.generating()` signal
27. Display `lastSocialCaption` in social queue panel as suggested caption
28. Show remaining generation count ("2 of 5 generations used") near the Generate button
29. Add toast on submit-for-review success: "Your post has been submitted and is awaiting admin approval."
30. Style consistently with existing findtherapy design system (Inter, #2D9B9B)
31. Run full test suite — all green
32. Deploy

---

## Notes

- Claude API key goes in `.env` as `ANTHROPIC_API_KEY` — never committed
- Approval resets on every edit (`providerApproved: false`) — practitioners must re-approve if they change content
- Provider posts go to `pending_review` on submit, not directly to `published` — admin must approve via `PATCH /api/admin/blog/:id/review`
- `generationCount` is capped at 5 per post. Shown to the practitioner as "X of 5 generations used". Incrementing uses `$inc` on the Mongoose update.
- Slugs get a 4-char `nanoid` suffix (e.g. `managing-anxiety-a3f9`) to avoid collisions without exposing provider IDs in URLs
- `publishedAt` is set when the provider submits (records submission time). It already holds the right date if admin approves later the same day; for now the admin can't override it. Revisit if scheduling is ever added.
- Social sharing queue is a data structure only in this build — actual posting to Instagram/Facebook/LinkedIn requires Meta and LinkedIn OAuth, which is a separate feature
- The `authorType: 'provider'` field lets admin-authored posts and provider-authored posts coexist cleanly in the same collection
- The shared package is `@findlocal/shared` — the guide originally contained a typo (`@findtherapy/shared`)
- Keep Claude mocked in all tests — never hit the real API in test runs
- Auth middleware sets `req.userId` (string) only — controllers that need provider details must look up `Provider.findOne({ userId: req.userId })`