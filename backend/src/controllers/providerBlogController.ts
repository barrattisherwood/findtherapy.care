import { Response } from 'express';
import { randomBytes } from 'crypto';
import slugify from 'slugify';
import BlogPost from '../models/BlogPost';
import { User } from '../models/User';
import { generateBlogPost } from '../services/claude.service';
import { sendBlogPostPendingReviewEmail } from '../services/emailService';
import { ProviderAuthRequest } from '../middleware/providerGuard';

const randomSuffix = () => randomBytes(2).toString('hex'); // 4 hex chars

// GET /api/provider/blog
export const getMyPosts = async (req: ProviderAuthRequest, res: Response) => {
  try {
    const posts = await BlogPost.find({ authorProviderId: req.provider!._id })
      .select('-content')
      .sort({ updatedAt: -1 });
    res.json(posts);
  } catch {
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
};

// POST /api/provider/blog
export const createDraft = async (req: ProviderAuthRequest, res: Response) => {
  try {
    const { title, brief, draft } = req.body;
    const slug = `${slugify(title, { lower: true, strict: true })}-${randomSuffix()}`;

    const post = await BlogPost.create({
      title,
      slug,
      brief,
      content: draft ?? '',
      excerpt: '',
      authorType: 'provider',
      authorProviderId: req.provider!._id,
      author: req.provider!.userId,
      authorDisplayName: req.provider!.displayName,
      status: 'draft',
      aiGenerated: false,
      providerApproved: false,
      categories: [],
      tags: [],
      socialQueue: [],
    });

    res.status(201).json(post);
  } catch {
    res.status(400).json({ message: 'Failed to create draft' });
  }
};

// GET /api/provider/blog/:id
export const getPost = async (req: ProviderAuthRequest, res: Response) => {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id, authorProviderId: req.provider!._id });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch {
    res.status(500).json({ message: 'Failed to fetch post' });
  }
};

// PATCH /api/provider/blog/:id
export const updatePost = async (req: ProviderAuthRequest, res: Response) => {
  try {
    const allowed = ['title', 'brief', 'content', 'excerpt', 'tags', 'categories', 'featuredImage'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowed.includes(key))
    );

    const post = await BlogPost.findOneAndUpdate(
      { _id: req.params.id, authorProviderId: req.provider!._id },
      { ...updates, providerApproved: false },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch {
    res.status(400).json({ message: 'Failed to update post' });
  }
};

// DELETE /api/provider/blog/:id
export const deletePost = async (req: ProviderAuthRequest, res: Response) => {
  try {
    await BlogPost.findOneAndDelete({ _id: req.params.id, authorProviderId: req.provider!._id });
    res.json({ message: 'Post deleted' });
  } catch {
    res.status(400).json({ message: 'Failed to delete post' });
  }
};

// POST /api/provider/blog/:id/generate
export const generateContent = async (req: ProviderAuthRequest, res: Response) => {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id, authorProviderId: req.provider!._id });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    if (post.generationCount >= 5) {
      return res.status(400).json({ message: "You've reached the generation limit for this post — try editing manually or contact support for more." });
    }

    const generated = await generateBlogPost({
      title: post.title,
      brief: post.brief ?? '',
      authorName: post.authorDisplayName ?? req.provider!.displayName,
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
        providerApproved: false,
        $inc: { generationCount: 1 },
      },
      { new: true }
    );

    res.json({ post: updated, socialCaption: generated.socialCaption });
  } catch (err: any) {
    const detail = err?.message ?? String(err);
    console.error('Claude generation error:', detail);
    res.status(500).json({ message: `Content generation failed: ${detail}` });
  }
};

// PATCH /api/provider/blog/:id/approve
export const approvePost = async (req: ProviderAuthRequest, res: Response) => {
  try {
    const post = await BlogPost.findOneAndUpdate(
      { _id: req.params.id, authorProviderId: req.provider!._id },
      { providerApproved: true, providerApprovedAt: new Date() },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch {
    res.status(400).json({ message: 'Failed to approve post' });
  }
};

// PATCH /api/provider/blog/:id/publish — sends for admin review
export const publishPost = async (req: ProviderAuthRequest, res: Response) => {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id, authorProviderId: req.provider!._id });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.providerApproved) {
      return res.status(400).json({ message: 'Post must be approved before publishing' });
    }

    const updated = await BlogPost.findByIdAndUpdate(
      post._id,
      { status: 'pending_review', publishedAt: new Date() },
      { new: true }
    );

    User.findById(req.userId).select('email').then(user => {
      sendBlogPostPendingReviewEmail(
        post.title,
        req.provider!.displayName,
        user?.email ?? ''
      ).catch(err => console.error('Blog pending review email error:', err));
    }).catch(() => {});

    res.json(updated);
  } catch {
    res.status(400).json({ message: 'Failed to submit post for review' });
  }
};

// POST /api/provider/blog/:id/social-queue
export const addToSocialQueue = async (req: ProviderAuthRequest, res: Response) => {
  try {
    const { platform, scheduledAt } = req.body;
    const post = await BlogPost.findOne({ _id: req.params.id, authorProviderId: req.provider!._id });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    if (!post.providerApproved) {
      return res.status(400).json({ message: 'Post must be approved before queuing for social' });
    }

    post.socialQueue = post.socialQueue.filter((q: any) => q.platform !== platform) as any;
    (post.socialQueue as any[]).push({ platform, scheduledAt, status: 'pending' });
    await post.save();
    res.json(post);
  } catch {
    res.status(400).json({ message: 'Failed to add to social queue' });
  }
};

// DELETE /api/provider/blog/:id/social-queue/:platform
export const removeFromSocialQueue = async (req: ProviderAuthRequest, res: Response) => {
  try {
    const post = await BlogPost.findOne({ _id: req.params.id, authorProviderId: req.provider!._id });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.socialQueue = post.socialQueue.filter((q: any) => q.platform !== req.params.platform) as any;
    await post.save();
    res.json(post);
  } catch {
    res.status(400).json({ message: 'Failed to remove from social queue' });
  }
};
