export type BlogPostStatus = 'draft' | 'published' | 'scheduled' | 'pending_review' | 'archived';
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
  authorDisplayName?: string;
  authorType: 'admin' | 'provider';
  authorProviderId?: string;
  aiGenerated: boolean;
  aiGeneratedAt?: string;
  generationCount: number;
  providerApproved: boolean;
  providerApprovedAt?: string;
  publishedAt?: string;
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
