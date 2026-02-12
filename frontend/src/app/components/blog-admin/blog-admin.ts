import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../services/blog.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { BlogPost, BlogPostsResponse, BlogPostFilters } from '@findlocal/shared';

@Component({
  selector: 'app-blog-admin',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, Navbar, Footer],
  templateUrl: './blog-admin.html',
  styleUrl: './blog-admin.scss'
})
export class BlogAdmin implements OnInit {
  private blogService = inject(BlogService);

  posts = signal<BlogPost[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  totalPages = signal(0);
  loading = this.blogService.loading;
  errorMessage = signal('');

  // Filters
  statusFilter = signal<string>('all');
  searchQuery = signal('');
  
  // Filter options
  statusOptions = [
    { value: 'all', label: 'All Posts' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Drafts' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'archived', label: 'Archived' }
  ];

  filteredPosts = computed(() => {
    let filtered = this.posts();
    
    if (this.searchQuery()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.categories.some((cat: string) => cat.toLowerCase().includes(query)) ||
        post.tags.some((tag: string) => tag.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  });

  publishedCount = computed(() => this.posts().filter(p => p.status === 'published').length);
  draftCount = computed(() => this.posts().filter(p => p.status === 'draft').length);
  scheduledCount = computed(() => this.posts().filter(p => p.status === 'scheduled').length);
  
  // Make Math available in template
  Math = Math;

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.errorMessage.set('');
    
    const filters: BlogPostFilters = {};
    if (this.statusFilter() !== 'all') {
      filters.status = this.statusFilter() as any;
    }

    this.blogService.getAdminBlogPosts(this.currentPage(), 20, filters).subscribe({
      next: (response: BlogPostsResponse) => {
        this.posts.set(response.posts);
        this.totalCount.set(response.totalCount);
        this.totalPages.set(response.totalPages);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to load blog posts');
      }
    });
  }

  onStatusFilterChange(): void {
    this.currentPage.set(1);
    this.loadPosts();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadPosts();
  }

  deleteBlogPost(post: BlogPost): void {
    if (!confirm(`Are you sure you want to delete "${post.title}"?`)) {
      return;
    }

    this.blogService.deleteBlogPost(post._id).subscribe({
      next: () => {
        this.loadPosts(); // Reload the list
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to delete blog post');
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(date: Date | string): string {
    return this.blogService.formatDate(date);
  }

  formatReadingTime(minutes: number): string {
    return this.blogService.formatReadingTime(minutes);
  }

  getPageNumbers(): number[] {
    const pages = [];
    const start = Math.max(1, this.currentPage() - 2);
    const end = Math.min(this.totalPages(), this.currentPage() + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }
}