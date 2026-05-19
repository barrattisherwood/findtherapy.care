import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  BlogPost,
  BlogPostsResponse,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
  BlogMetrics,
  BlogPostFilters
} from '@findlocal/shared';

// ── Arclink response shapes ────────────────────────────────────────────────────

interface ArclinkFeaturedImage {
  url: string;
  alt: string;
  credit: {
    photographer: string;
    photographer_url: string;
    unsplash_url: string;
  } | null;
}

interface ArclinkPost {
  id: string;
  tenant_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  seo_title: string;
  seo_description: string;
  categories: string[];
  tags: string[];
  reading_time: number;
  word_count: number;
  status: string;
  generated: boolean;
  featured: boolean;
  views: number;
  likes: number;
  author_name: string | null;
  featured_image: ArclinkFeaturedImage | null;
  published_at: string;
  created_at: string;
}

interface ArclinkListResponse {
  posts: ArclinkPost[];
  total: number;
  page: number;
  pages: number;
}

interface ArclinkSingleResponse {
  post: ArclinkPost;
}

// ──────────────────────────────────────────────────────────────────────────────

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private http = inject(HttpClient);
  private adminApiUrl = `${environment.apiUrl}/blog`;
  private arclinkUrl = `${environment.arclinkBlogBaseUrl}/posts/${environment.arclinkTenantId}`;

  loading = signal(false);
  error = signal<string | null>(null);

  // ── Arclink mappers ──────────────────────────────────────────────────────────

  private mapArclinkPost(p: ArclinkPost): BlogPost {
    const authorName = p.author_name ?? 'FindTherapy Editorial';
    return {
      _id: p.id,
      title: p.title,
      slug: p.slug,
      content: p.content ?? '',
      excerpt: p.excerpt,
      featuredImage: p.featured_image?.url,
      author: { _id: '', name: authorName, email: '' },
      authorDisplayName: authorName,
      status: 'published',
      publishedAt: new Date(p.published_at),
      categories: p.categories,
      tags: p.tags,
      seoTitle: p.seo_title,
      seoDescription: p.seo_description,
      readingTime: p.reading_time,
      views: p.views,
      likes: p.likes,
      commentsEnabled: false,
      createdAt: new Date(p.created_at),
      updatedAt: new Date(p.created_at),
    };
  }

  private mapArclinkListResponse(r: ArclinkListResponse): BlogPostsResponse {
    return {
      posts: r.posts.map(p => this.mapArclinkPost(p)),
      totalCount: r.total,
      currentPage: r.page,
      totalPages: r.pages,
      hasNextPage: r.page < r.pages,
      hasPrevPage: r.page > 1,
    };
  }

  // ── Public methods (Arclink) ─────────────────────────────────────────────────

  getBlogPosts(
    page: number = 1,
    limit: number = 10,
    filters?: BlogPostFilters
  ): Observable<BlogPostsResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.category) params.append('category', filters.category);
    if (filters?.tag) params.append('tag', filters.tag);

    return this.http.get<ArclinkListResponse>(`${this.arclinkUrl}?${params}`).pipe(
      map(r => this.mapArclinkListResponse(r)),
      tap({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false),
      }),
    );
  }

  getBlogPostBySlug(slug: string): Observable<BlogPost> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.get<ArclinkSingleResponse>(`${this.arclinkUrl}/${slug}`).pipe(
      map(r => this.mapArclinkPost(r.post)),
      tap({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false),
      }),
    );
  }

  // Arclink has no /filters endpoint — derive categories and tags from the first page of posts
  getBlogFilters(): Observable<{ categories: string[], tags: string[] }> {
    return this.http.get<ArclinkListResponse>(`${this.arclinkUrl}?page=1&limit=50`).pipe(
      map(r => ({
        categories: [...new Set(r.posts.flatMap(p => p.categories))].sort(),
        tags: [...new Set(r.posts.flatMap(p => p.tags))].sort(),
      })),
    );
  }

  // ── Admin methods (standalone backend, unchanged) ────────────────────────────

  getAdminBlogPosts(
    page: number = 1,
    limit: number = 20,
    filters?: BlogPostFilters
  ): Observable<BlogPostsResponse> {
    this.loading.set(true);
    this.error.set(null);

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString()
    });

    if (filters) {
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.tag) params.append('tag', filters.tag);
      if (filters.author) params.append('author', filters.author);
    }

    return this.http.get<BlogPostsResponse>(`${this.adminApiUrl}/admin/posts?${params}`).pipe(
      tap({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false)
      })
    );
  }

  getAdminBlogPostById(id: string): Observable<BlogPost> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.get<BlogPost>(`${this.adminApiUrl}/admin/posts/${id}`).pipe(
      tap({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false)
      })
    );
  }

  getBlogMetrics(): Observable<BlogMetrics> {
    return this.http.get<BlogMetrics>(`${this.adminApiUrl}/admin/metrics`);
  }

  createBlogPost(postData: CreateBlogPostRequest): Observable<BlogPost> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<BlogPost>(`${this.adminApiUrl}/admin/posts`, postData).pipe(
      tap({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false)
      })
    );
  }

  updateBlogPost(id: string, postData: UpdateBlogPostRequest): Observable<BlogPost> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.put<BlogPost>(`${this.adminApiUrl}/admin/posts/${id}`, postData).pipe(
      tap({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false)
      })
    );
  }

  deleteBlogPost(id: string): Observable<{ message: string }> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.delete<{ message: string }>(`${this.adminApiUrl}/admin/posts/${id}`).pipe(
      tap({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false)
      })
    );
  }

  uploadFeaturedImage(file: File): Observable<{ url: string }> {
    this.loading.set(true);
    this.error.set(null);

    const formData = new FormData();
    formData.append('image', file);

    return this.http.post<{ url: string }>(`${this.adminApiUrl}/admin/upload-image`, formData).pipe(
      tap({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false)
      })
    );
  }

  // ── Utility methods ──────────────────────────────────────────────────────────

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatReadingTime(minutes: number): string {
    if (minutes < 1) return 'Less than a minute';
    if (minutes === 1) return '1 minute';
    return `${minutes} minutes`;
  }

  generateExcerpt(content: string, maxLength: number = 150): string {
    // Strip HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, '');
    if (plainText.length <= maxLength) return plainText;

    // Find last complete word within limit
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return lastSpace > -1 ?
      truncated.substring(0, lastSpace) + '...' :
      truncated + '...';
  }
}
