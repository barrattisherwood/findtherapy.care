import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../services/blog.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { BlogPost, BlogPostsResponse } from '@findlocal/shared';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, Navbar, Footer],
  templateUrl: './blog-list.html',
  styleUrl: './blog-list.scss'
})
export class BlogList implements OnInit {
  private blogService = inject(BlogService);
  private route = inject(ActivatedRoute);

  posts = signal<BlogPost[]>([]);
  totalCount = signal(0);
  currentPage = signal(1);
  totalPages = signal(0);
  loading = this.blogService.loading;
  errorMessage = signal('');

  // Filters
  categories = signal<string[]>([]);
  tags = signal<string[]>([]);
  selectedCategory = signal<string | null>(null);
  selectedTag = signal<string | null>(null);
  searchQuery = signal('');

  featuredPosts = computed(() => 
    this.posts().slice(0, 3)
  );

  ngOnInit(): void {
    this.loadFilters();
    this.route.queryParams.subscribe(params => {
      this.currentPage.set(parseInt(params['page']) || 1);
      this.selectedCategory.set(params['category'] || null);
      this.selectedTag.set(params['tag'] || null);
      this.searchQuery.set(params['search'] || '');
      this.loadPosts();
    });
  }

  loadFilters(): void {
    this.blogService.getBlogFilters().subscribe({
      next: (data) => {
        this.categories.set(data.categories);
        this.tags.set(data.tags);
      },
      error: (error) => {
        console.error('Failed to load filters:', error);
      }
    });
  }

  loadPosts(): void {
    this.errorMessage.set('');

    const filters: any = {};
    if (this.selectedCategory()) filters.category = this.selectedCategory();
    if (this.selectedTag()) filters.tag = this.selectedTag();

    this.blogService.getBlogPosts(this.currentPage(), 9, filters).subscribe({
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

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.updateUrl();
  }

  onCategoryChange(category: string | null): void {
    this.selectedCategory.set(category);
    this.currentPage.set(1);
    this.updateUrl();
  }

  onTagChange(tag: string | null): void {
    this.selectedTag.set(tag);
    this.currentPage.set(1);
    this.updateUrl();
  }

  onSearchSubmit(): void {
    this.currentPage.set(1);
    this.updateUrl();
  }

  clearFilters(): void {
    this.selectedCategory.set(null);
    this.selectedTag.set(null);
    this.searchQuery.set('');
    this.currentPage.set(1);
    this.updateUrl();
  }

  private updateUrl(): void {
    const queryParams: any = {};
    
    if (this.currentPage() > 1) queryParams.page = this.currentPage();
    if (this.selectedCategory()) queryParams.category = this.selectedCategory();
    if (this.selectedTag()) queryParams.tag = this.selectedTag();
    if (this.searchQuery()) queryParams.search = this.searchQuery();

    // Use router navigation to update URL
    window.history.replaceState({}, '', '/blog' + (Object.keys(queryParams).length ? '?' + new URLSearchParams(queryParams).toString() : ''));
    this.loadPosts();
  }

  formatDate(date: Date | string): string {
    return this.blogService.formatDate(date);
  }

  formatReadingTime(minutes: number): string {
    return this.blogService.formatReadingTime(minutes);
  }

  formatCategory(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
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