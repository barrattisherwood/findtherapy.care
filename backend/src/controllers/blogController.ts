import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import BlogPost from '../models/BlogPost';
import { Provider } from '../models/Provider';
import { 
  CreateBlogPostRequest, 
  UpdateBlogPostRequest, 
  BlogPostFilters,
  BlogPostsResponse,
  BlogMetrics 
} from '@findlocal/shared';
import { uploadBlogImage, deleteImage } from '../services/cloudinaryService';

// Get all blog posts (public endpoint)
export const getBlogPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: BlogPostFilters = {
      status: req.query.status as any,
      category: req.query.category as string,
      tag: req.query.tag as string,
      author: req.query.author as string,
    };

    // Build MongoDB query
    const query: any = { status: 'published' };
    
    if (filters.category) {
      query.categories = { $in: [filters.category] };
    }
    
    if (filters.tag) {
      query.tags = { $in: [filters.tag] };
    }
    
    if (filters.author) {
      query.author = filters.author;
    }

    const [posts, totalCount] = await Promise.all([
      BlogPost.find(query)
        .populate('author', 'name email')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlogPost.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const response: BlogPostsResponse = {
      posts: posts as any,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch blog posts', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Get single blog post by slug (public endpoint)
export const getBlogPostBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const post = await BlogPost.findOne({ 
      slug, 
      status: 'published' 
    }).populate('author', 'name email');

    if (!post) {
      res.status(404).json({ message: 'Blog post not found' });
      return;
    }

    // Increment view count
    await BlogPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } });
    post.views += 1;

    // Attach author summary for provider-authored posts
    let authorSummary: object | undefined;
    if (post.authorType === 'provider' && post.authorProviderId) {
      const provider = await Provider.findOne({
        _id: post.authorProviderId,
        vettingStatus: 'approved',
        isPublished: true,
      }).select('displayName profileImage type location specialties pricing sessionFormats bio isFounder founderNumber');
      if (provider) {
        const p = provider.toJSON() as Record<string, unknown>;
        authorSummary = {
          id: provider._id.toString(),
          displayName: p['displayName'],
          type: p['type'],
          bio: p['bio'],
          profileImage: p['profileImage'],
          location: p['location'],
          specialties: p['specialties'],
          pricing: p['pricing'],
          sessionFormats: p['sessionFormats'],
          isFounder: p['isFounder'],
          founderNumber: p['founderNumber'],
        };
      }
    }

    res.json({ ...post.toJSON(), authorSummary });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch blog post', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Admin endpoints below - require authentication and admin rights

// Get single post by ID for admin (includes drafts, scheduled, etc.)
export const getAdminBlogPostById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const post = await BlogPost.findById(id).populate('author', 'name email');

    if (!post) {
      res.status(404).json({ message: 'Blog post not found' });
      return;
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({
      message: 'Failed to fetch blog post',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all posts for admin (includes drafts, scheduled, etc.)
export const getAdminBlogPosts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filters: BlogPostFilters = {
      status: req.query.status as any,
      category: req.query.category as string,
      tag: req.query.tag as string,
      author: req.query.author as string,
    };

    // Build query
    const query: any = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.category) {
      query.categories = { $in: [filters.category] };
    }
    
    if (filters.tag) {
      query.tags = { $in: [filters.tag] };
    }
    
    if (filters.author) {
      query.author = filters.author;
    }

    const [posts, totalCount] = await Promise.all([
      BlogPost.find(query)
        .populate('author', 'name email')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlogPost.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const response: BlogPostsResponse = {
      posts: posts as any,
      totalCount,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch blog posts', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Create new blog post
export const createBlogPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const postData: CreateBlogPostRequest = req.body;

    // Generate slug from title if not provided
    const slug = postData.title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-')
      .trim();

    // Check if slug already exists
    const existingPost = await BlogPost.findOne({ slug });
    if (existingPost) {
      res.status(400).json({ message: 'A post with this title already exists' });
      return;
    }

    const blogPost = new BlogPost({
      ...postData,
      slug,
      author: userId,
    });

    await blogPost.save();
    await blogPost.populate('author', 'name email');

    res.status(201).json(blogPost);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to create blog post', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Update blog post
export const updateBlogPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateBlogPostRequest = req.body;

    const blogPost = await BlogPost.findById(id);
    if (!blogPost) {
      res.status(404).json({ message: 'Blog post not found' });
      return;
    }

    // Update slug if title changed
    if (updateData.title && updateData.title !== blogPost.title) {
      const newSlug = updateData.title
        .toLowerCase()
        .replace(/[^a-z0-9 ]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      
      const existingPost = await BlogPost.findOne({ slug: newSlug, _id: { $ne: id } });
      if (existingPost) {
        res.status(400).json({ message: 'A post with this title already exists' });
        return;
      }
      
      (updateData as any).slug = newSlug;
    }

    Object.assign(blogPost, updateData);
    await blogPost.save();
    await blogPost.populate('author', 'name email');

    res.json(blogPost);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to update blog post', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Delete blog post
export const deleteBlogPost = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const blogPost = await BlogPost.findByIdAndDelete(id);
    if (!blogPost) {
      res.status(404).json({ message: 'Blog post not found' });
      return;
    }

    // Delete featured image from Cloudinary if exists
    if (blogPost.featuredImage) {
      try {
        const publicId = blogPost.featuredImage.split('/').pop()?.split('.')[0];
        if (publicId) {
          await deleteImage(publicId);
        }
      } catch (cloudinaryError) {
        console.error('Failed to delete image from Cloudinary:', cloudinaryError);
      }
    }

    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to delete blog post', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Upload featured image
export const uploadFeaturedImage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No image file provided' });
      return;
    }

    const result = await uploadBlogImage(req.file.buffer, undefined);

    res.json({ url: result.url });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to upload image', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Get blog metrics for admin dashboard
export const getBlogMetrics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalPosts,
      publishedPosts,
      draftPosts,
      scheduledPosts,
      viewsAggregate,
      likesAggregate,
      avgReadingTime,
      categoriesAggregate,
      tagsAggregate,
      recentPosts,
      monthlyStats
    ] = await Promise.all([
      BlogPost.countDocuments(),
      BlogPost.countDocuments({ status: 'published' }),
      BlogPost.countDocuments({ status: 'draft' }),
      BlogPost.countDocuments({ status: 'scheduled' }),
      BlogPost.aggregate([{ $group: { _id: null, totalViews: { $sum: '$views' } } }]),
      BlogPost.aggregate([{ $group: { _id: null, totalLikes: { $sum: '$likes' } } }]),
      BlogPost.aggregate([{ $group: { _id: null, avgTime: { $avg: '$readingTime' } } }]),
      BlogPost.aggregate([
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      BlogPost.aggregate([
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      BlogPost.find({ status: 'published' })
        .select('title slug views publishedAt')
        .sort({ publishedAt: -1 })
        .limit(5)
        .lean(),
      BlogPost.aggregate([
        {
          $match: { status: 'published', publishedAt: { $exists: true } }
        },
        {
          $group: {
            _id: {
              year: { $year: '$publishedAt' },
              month: { $month: '$publishedAt' }
            },
            posts: { $sum: 1 },
            views: { $sum: '$views' }
          }
        },
        {
          $sort: { '_id.year': -1, '_id.month': -1 }
        },
        { $limit: 12 }
      ])
    ]);

    const metrics: BlogMetrics = {
      totalPosts,
      publishedPosts,
      draftPosts,
      scheduledPosts,
      totalViews: viewsAggregate[0]?.totalViews || 0,
      totalLikes: likesAggregate[0]?.totalLikes || 0,
      avgReadingTime: Math.round(avgReadingTime[0]?.avgTime || 0),
      popularCategories: categoriesAggregate.map(cat => ({
        category: cat._id,
        count: cat.count
      })),
      popularTags: tagsAggregate.map(tag => ({
        tag: tag._id,
        count: tag.count
      })),
      recentPosts: recentPosts as any,
      monthlyStats: monthlyStats.map(stat => ({
        month: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
        posts: stat.posts,
        views: stat.views
      }))
    };

    res.json(metrics);
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch blog metrics', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

// Get unique categories and tags for filters
export const getBlogFilters = async (req: Request, res: Response): Promise<void> => {
  try {
    const [categories, tags] = await Promise.all([
      BlogPost.distinct('categories', { status: 'published' }),
      BlogPost.distinct('tags', { status: 'published' })
    ]);

    res.json({
      categories: categories.sort(),
      tags: tags.sort()
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Failed to fetch blog filters', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};