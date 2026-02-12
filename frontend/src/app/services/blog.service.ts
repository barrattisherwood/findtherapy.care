import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  BlogPost, 
  BlogPostsResponse, 
  CreateBlogPostRequest, 
  UpdateBlogPostRequest,
  BlogMetrics,
  BlogPostFilters
} from '@findlocal/shared';

@Injectable({
  providedIn: 'root'
})
export class BlogService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/blog`;
  
  loading = signal(false);
  error = signal<string | null>(null);

  // Public methods
  getBlogPosts(
    page: number = 1, 
    limit: number = 10, 
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

    return this.http.get<BlogPostsResponse>(`${this.apiUrl}?${params}`);
  }

  getBlogPostBySlug(slug: string): Observable<BlogPost> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.get<BlogPost>(`${this.apiUrl}/${slug}`);
  }

  getBlogFilters(): Observable<{ categories: string[], tags: string[] }> {
    return this.http.get<{ categories: string[], tags: string[] }>(`${this.apiUrl}/filters`);
  }

  // Admin methods
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

    return this.http.get<BlogPostsResponse>(`${this.apiUrl}/admin/posts?${params}`);
  }

  getBlogMetrics(): Observable<BlogMetrics> {
    return this.http.get<BlogMetrics>(`${this.apiUrl}/admin/metrics`);
  }

  createBlogPost(postData: CreateBlogPostRequest): Observable<BlogPost> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.post<BlogPost>(`${this.apiUrl}/admin/posts`, postData);
  }

  updateBlogPost(id: string, postData: UpdateBlogPostRequest): Observable<BlogPost> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.put<BlogPost>(`${this.apiUrl}/admin/posts/${id}`, postData);
  }

  deleteBlogPost(id: string): Observable<{ message: string }> {
    this.loading.set(true);
    this.error.set(null);
    return this.http.delete<{ message: string }>(`${this.apiUrl}/admin/posts/${id}`);
  }

  uploadFeaturedImage(file: File): Observable<{ url: string }> {
    this.loading.set(true);
    this.error.set(null);
    
    const formData = new FormData();
    formData.append('image', file);
    
    return this.http.post<{ url: string }>(`${this.apiUrl}/admin/upload-image`, formData);
  }

  // Utility methods
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