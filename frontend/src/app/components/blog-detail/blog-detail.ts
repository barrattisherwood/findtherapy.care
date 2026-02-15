import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { SafeHtml } from '@angular/platform-browser';
import { BlogService } from '../../services/blog.service';
import { MarkdownService } from '../../services/markdown.service';
import { AnalyticsService } from '../../services/analytics.service';
import { BlogPost } from '@findlocal/shared';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar, Footer],
  templateUrl: './blog-detail.html',
  styleUrls: ['./blog-detail.scss']
})
export class BlogDetail implements OnInit {
  private blogService = inject(BlogService);
  private markdownService = inject(MarkdownService);
  private analyticsService = inject(AnalyticsService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private metaService = inject(Meta);

  post = signal<BlogPost | null>(null);
  renderedContent = signal<SafeHtml>('');
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const slug = params['slug'];
      if (slug) {
        this.loadPost(slug);
      }
    });
  }

  private loadPost(slug: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.blogService.getBlogPostBySlug(slug).subscribe({
      next: (post) => {
        this.post.set(post);
        this.renderedContent.set(this.markdownService.render(post.content));
        this.updateMetaTags(post);
        
        // Track blog post view
        this.analyticsService.trackEvent('view_blog_post', {
          blog_post_id: post._id,
          blog_post_title: post.title,
          blog_post_category: post.categories[0] || 'uncategorized'
        });

        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading blog post:', error);
        this.errorMessage.set('Failed to load article. Please try again later.');
        this.loading.set(false);
      }
    });
  }

  private updateMetaTags(post: BlogPost): void {
    // Set page title
    const pageTitle = post.seoTitle || post.title;
    this.titleService.setTitle(`${pageTitle} — findtherapy.care`);

    // Set meta description
    const description = post.seoDescription || post.excerpt;
    this.metaService.updateTag({ name: 'description', content: description });

    // Open Graph tags
    this.metaService.updateTag({ property: 'og:title', content: pageTitle });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:type', content: 'article' });
    this.metaService.updateTag({ property: 'og:url', content: `https://findtherapy.care/blog/${post.slug}` });
    
    if (post.featuredImage) {
      this.metaService.updateTag({ property: 'og:image', content: post.featuredImage });
    }

    // Twitter Card tags
    this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.metaService.updateTag({ name: 'twitter:title', content: pageTitle });
    this.metaService.updateTag({ name: 'twitter:description', content: description });
    
    if (post.featuredImage) {
      this.metaService.updateTag({ name: 'twitter:image', content: post.featuredImage });
    }

    // Article tags
    this.metaService.updateTag({ property: 'article:published_time', content: post.publishedAt?.toString() || '' });
    this.metaService.updateTag({ property: 'article:author', content: post.author.name });
    
    // Add tags for categories
    post.categories.forEach(category => {
      this.metaService.addTag({ property: 'article:tag', content: category });
    });
  }

  formatDate(date: Date | string): string {
    return this.blogService.formatDate(date);
  }

  formatReadingTime(minutes: number): string {
    return this.blogService.formatReadingTime(minutes);
  }

  shareOnTwitter(): void {
    const post = this.post();
    if (!post) return;

    const url = `https://findtherapy.care/blog/${post.slug}`;
    const text = post.title;
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
  }

  shareOnFacebook(): void {
    const post = this.post();
    if (!post) return;

    const url = `https://findtherapy.care/blog/${post.slug}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  }

  shareOnLinkedIn(): void {
    const post = this.post();
    if (!post) return;

    const url = `https://findtherapy.care/blog/${post.slug}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  }

  copyLink(): void {
    const post = this.post();
    if (!post) return;

    const url = `https://findtherapy.care/blog/${post.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      // Could add a toast notification here
      alert('Link copied to clipboard!');
    });
  }
}
