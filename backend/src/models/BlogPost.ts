import { Schema, model, Document } from 'mongoose';

export interface SocialQueueItem {
  platform: 'instagram' | 'facebook' | 'linkedin';
  scheduledAt?: Date;
  postedAt?: Date;
  status: 'pending' | 'posted' | 'failed';
  postUrl?: string;
}

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  author: Schema.Types.ObjectId;
  status: 'draft' | 'published' | 'scheduled' | 'archived' | 'pending_review';
  publishedAt?: Date;
  scheduledFor?: Date;
  categories: string[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  authorDisplayName?: string;
  authorProviderId?: Schema.Types.ObjectId;
  readingTime: number;
  views: number;
  likes: number;
  commentsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Provider-authored post fields
  authorType: 'admin' | 'provider';
  brief?: string;
  aiGenerated: boolean;
  aiGeneratedAt?: Date;
  generationCount: number;
  providerApproved: boolean;
  providerApprovedAt?: Date;
  socialQueue: SocialQueueItem[];
}

const blogPostSchema = new Schema<IBlogPost>({
  title: {
    type: String,
    required: true,
    maxlength: 200,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  content: {
    type: String,
    default: '',
  },
  excerpt: {
    type: String,
    maxlength: 300,
    trim: true,
    default: '',
  },
  featuredImage: {
    type: String,
    trim: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'scheduled', 'archived', 'pending_review'],
    default: 'draft'
  },
  publishedAt: {
    type: Date
  },
  scheduledFor: {
    type: Date
  },
  categories: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  seoTitle: {
    type: String,
    maxlength: 60,
    trim: true
  },
  seoDescription: {
    type: String,
    maxlength: 160,
    trim: true
  },
  authorDisplayName: {
    type: String,
    trim: true
  },
  authorProviderId: {
    type: Schema.Types.ObjectId,
    ref: 'Provider',
    required: false
  },
  readingTime: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  commentsEnabled: {
    type: Boolean,
    default: true
  },
  // Provider-authored post fields
  authorType: {
    type: String,
    enum: ['admin', 'provider'],
    default: 'admin',
  },
  brief: {
    type: String,
    trim: true,
  },
  aiGenerated: {
    type: Boolean,
    default: false,
  },
  aiGeneratedAt: {
    type: Date,
  },
  generationCount: {
    type: Number,
    default: 0,
  },
  providerApproved: {
    type: Boolean,
    default: false,
  },
  providerApprovedAt: {
    type: Date,
  },
  socialQueue: {
    type: [{
      platform: { type: String, enum: ['instagram', 'facebook', 'linkedin'], required: true },
      scheduledAt: { type: Date },
      postedAt: { type: Date },
      status: { type: String, enum: ['pending', 'posted', 'failed'], default: 'pending' },
      postUrl: { type: String },
    }],
    default: [],
  },
}, {
  timestamps: true
});

// Index for better query performance
blogPostSchema.index({ status: 1, publishedAt: -1 });
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ categories: 1 });
blogPostSchema.index({ tags: 1 });
blogPostSchema.index({ author: 1 });
blogPostSchema.index({ authorType: 1, status: 1 }); // admin pending review query

// Pre-save middleware to auto-generate slug and reading time
blogPostSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  
  if (this.isModified('content')) {
    // Calculate reading time (average 200 words per minute)
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

const BlogPost = model<IBlogPost>('BlogPost', blogPostSchema);

export default BlogPost;