export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  author: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'draft' | 'published' | 'scheduled' | 'archived';
  publishedAt?: Date;
  scheduledFor?: Date;
  categories: string[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  readingTime: number;
  views: number;
  likes: number;
  authorDisplayName?: string;
  commentsEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBlogPostRequest {
  title: string;
  content: string;
  excerpt: string;
  featuredImage?: string;
  status?: 'draft' | 'published' | 'scheduled';
  scheduledFor?: Date;
  categories: string[];
  tags: string[];
  seoTitle?: string;
  seoDescription?: string;
  authorDisplayName?: string;
  commentsEnabled?: boolean;
}

export interface UpdateBlogPostRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  featuredImage?: string;
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  scheduledFor?: Date;
  categories?: string[];
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  authorDisplayName?: string;
  commentsEnabled?: boolean;
}

export interface BlogPostFilters {
  status?: 'draft' | 'published' | 'scheduled' | 'archived';
  category?: string;
  tag?: string;
  author?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface BlogPostsResponse {
  posts: BlogPost[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface BlogMetrics {
  totalPosts: number;
  publishedPosts: number;
  draftPosts: number;
  scheduledPosts: number;
  totalViews: number;
  totalLikes: number;
  avgReadingTime: number;
  popularCategories: Array<{
    category: string;
    count: number;
  }>;
  popularTags: Array<{
    tag: string;
    count: number;
  }>;
  recentPosts: Array<{
    title: string;
    slug: string;
    views: number;
    publishedAt: Date;
  }>;
  monthlyStats: Array<{
    month: string;
    posts: number;
    views: number;
  }>;
}

export interface BlogSettings {
  postsPerPage: number;
  allowComments: boolean;
  moderateComments: boolean;
  featuredPostsCount: number;
  enableNewsletterSignup: boolean;
  defaultCategories: string[];
  seoDefaults: {
    titleSuffix: string;
    description: string;
    ogImage: string;
  };
}