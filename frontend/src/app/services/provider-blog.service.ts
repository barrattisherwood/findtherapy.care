import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import {
  ProviderBlogPost,
  CreateDraftPayload,
  GenerateContentResponse,
} from '@findlocal/shared';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProviderBlogService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/provider/blog`;

  posts = signal<ProviderBlogPost[]>([]);
  loading = signal(false);
  generating = signal(false);
  selectedPostId = signal<string | null>(null);
  lastSocialCaption = signal<string | null>(null);

  selectedPost = computed(() => this.posts().find(p => p._id === this.selectedPostId()) ?? null);
  draftPosts = computed(() => this.posts().filter(p => p.status === 'draft'));
  publishedPosts = computed(() => this.posts().filter(p => p.status === 'published'));
  pendingApproval = computed(() => this.posts().filter(p => p.aiGenerated && !p.providerApproved));

  loadPosts() {
    this.loading.set(true);
    return this.http.get<ProviderBlogPost[]>(this.baseUrl).pipe(
      tap({
        next: posts => {
          this.posts.set(posts);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }

  getPost(id: string) {
    return this.http.get<ProviderBlogPost>(`${this.baseUrl}/${id}`).pipe(
      tap(post => this.posts.update(ps => {
        const exists = ps.some(p => p._id === id);
        return exists ? ps.map(p => p._id === id ? post : p) : [post, ...ps];
      }))
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
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.posts.update(ps => ps.filter(p => p._id !== id)))
    );
  }

  generateContent(id: string) {
    this.generating.set(true);
    return this.http.post<GenerateContentResponse>(`${this.baseUrl}/${id}/generate`, {}).pipe(
      tap({
        next: ({ post, socialCaption }) => {
          this.posts.update(ps => ps.map(p => p._id === id ? post : p));
          this.lastSocialCaption.set(socialCaption);
          this.generating.set(false);
        },
        error: () => this.generating.set(false),
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

  uploadFeaturedImage(id: string, file: File) {
    const body = new FormData();
    body.append('image', file);
    return this.http.post<ProviderBlogPost>(`${this.baseUrl}/${id}/image`, body).pipe(
      tap(updated => this.posts.update(ps => ps.map(p => p._id === id ? updated : p)))
    );
  }

  removeFeaturedImage(id: string) {
    return this.http.delete<ProviderBlogPost>(`${this.baseUrl}/${id}/image`).pipe(
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
