import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import BlogPost from '../models/BlogPost';

// GET /api/admin/blog/pending
export const getPendingPosts = async (req: AuthRequest, res: Response) => {
  try {
    const posts = await BlogPost.find({ status: 'pending_review', authorType: 'provider' })
      .populate('authorProviderId', 'displayName contactEmail')
      .sort({ publishedAt: 1 }); // oldest first — fair queue
    res.json({ posts, total: posts.length });
  } catch {
    res.status(500).json({ message: 'Failed to fetch pending posts' });
  }
};

// PATCH /api/admin/blog/:id/review
// body: { action: 'approve' | 'reject', rejectionReason?: string }
export const reviewPost = async (req: AuthRequest, res: Response) => {
  try {
    const { action, rejectionReason } = req.body;
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'action must be approve or reject' });
    }

    const update =
      action === 'approve'
        ? { status: 'published' }
        : { status: 'draft', providerApproved: false };

    const post = await BlogPost.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // TODO: send rejection email to provider when action === 'reject' and rejectionReason is set

    res.json(post);
  } catch {
    res.status(500).json({ message: 'Failed to review post' });
  }
};
