import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../services/blog.service';
import { SeoService } from '../../services/seo.service';
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
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);

  private readonly PAGE_SIZE = 9;

  private allPosts = signal<BlogPost[]>([]);

  loading = this.blogService.loading;
  errorMessage = signal('');

  // Filter state
  selectedCategory = signal<string | null>(null);
  selectedTag = signal<string | null>(null);
  searchQuery = '';          // plain string — bound via ngModel
  activeSearch = signal(''); // drives computed filtering on submit

  // Pagination
  currentPage = signal(1);

  // Derived filter options
  categories = computed(() =>
    [...new Set(this.allPosts().flatMap(p => p.categories))].sort()
  );
  tags = computed(() =>
    [...new Set(this.allPosts().flatMap(p => p.tags))].sort()
  );

  // Filtered (all pages)
  filteredPosts = computed(() => {
    let posts = this.allPosts();
    const cat = this.selectedCategory();
    const tag = this.selectedTag();
    const q = this.activeSearch().toLowerCase().trim();

    if (cat) posts = posts.filter(p => p.categories.includes(cat));
    if (tag) posts = posts.filter(p => p.tags.includes(tag));
    if (q) posts = posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.excerpt.toLowerCase().includes(q) ||
      p.categories.some(c => c.toLowerCase().includes(q)) ||
      p.tags.some(t => t.toLowerCase().includes(q))
    );
    return posts;
  });

  // Paginated slice
  posts = computed(() => {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this.filteredPosts().slice(start, start + this.PAGE_SIZE);
  });

  totalPages = computed(() => Math.ceil(this.filteredPosts().length / this.PAGE_SIZE));

  // Only shown on page 1 with no filters active
  featuredPosts = computed(() => {
    if (this.selectedCategory() || this.selectedTag() || this.activeSearch() || this.currentPage() > 1) {
      return [];
    }
    return this.allPosts().slice(0, 3);
  });

  ngOnInit(): void {
    this.seo.update({
      title: 'Mental Health Blog',
      description: 'Articles, guides, and insights on mental health, therapy, and wellbeing from South African therapists and counsellors.',
      url: '/blog',
    });

    this.route.queryParams.subscribe(params => {
      this.currentPage.set(parseInt(params['page']) || 1);
      this.selectedCategory.set(params['category'] || null);
      this.selectedTag.set(params['tag'] || null);
      const search = params['search'] || '';
      this.searchQuery = search;
      this.activeSearch.set(search);
    });

    this.loadAllPosts();
  }

  private loadAllPosts(): void {
    this.errorMessage.set('');
    this.blogService.getBlogPosts(1, 50).subscribe({
      next: (response: BlogPostsResponse) => {
        this.allPosts.set(response.posts);
      },
      error: () => {
        this.errorMessage.set('Failed to load blog posts');
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
    this.activeSearch.set(this.searchQuery.trim());
    this.currentPage.set(1);
    this.updateUrl();
  }

  clearFilters(): void {
    this.selectedCategory.set(null);
    this.selectedTag.set(null);
    this.searchQuery = '';
    this.activeSearch.set('');
    this.currentPage.set(1);
    this.updateUrl();
  }

  private updateUrl(): void {
    const queryParams: Record<string, string> = {};
    if (this.currentPage() > 1) queryParams['page'] = String(this.currentPage());
    if (this.selectedCategory()) queryParams['category'] = this.selectedCategory()!;
    if (this.selectedTag()) queryParams['tag'] = this.selectedTag()!;
    if (this.activeSearch()) queryParams['search'] = this.activeSearch();
    window.history.replaceState({}, '', '/blog' + (Object.keys(queryParams).length ? '?' + new URLSearchParams(queryParams).toString() : ''));
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
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage() - 2);
    const end = Math.min(this.totalPages(), this.currentPage() + 2);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
