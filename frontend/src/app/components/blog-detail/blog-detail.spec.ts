import { Component, signal, computed } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Title, Meta } from '@angular/platform-browser';
import { of } from 'rxjs';
import { BlogDetail } from './blog-detail';
import { BlogService } from '../../services/blog.service';
import { MarkdownService } from '../../services/markdown.service';
import { AnalyticsService } from '../../services/analytics.service';
import { AuthService } from '../../services/auth.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { BlogPost } from '@findlocal/shared';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class StubNavbar {}

@Component({ selector: 'app-footer', template: '', standalone: true })
class StubFooter {}

const makePost = (overrides: Partial<BlogPost> = {}): BlogPost => ({
  _id: 'post-1',
  title: 'Test Article',
  slug: 'test-article',
  content: '# Hello',
  excerpt: 'An excerpt',
  author: { _id: 'user-1', name: 'Admin User', email: 'admin@test.com' },
  status: 'published',
  categories: [],
  tags: [],
  readingTime: 3,
  views: 0,
  likes: 0,
  commentsEnabled: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

describe('BlogDetail Component - authorDisplayName', () => {
  let component: BlogDetail;
  let fixture: ComponentFixture<BlogDetail>;

  /**
   * Directly set signals and re-render, bypassing loadPost.
   * We're testing the template, not the service integration.
   */
  const showPost = (post: BlogPost) => {
    component.post.set(post);
    component.loading.set(false);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogDetail, HttpClientTestingModule],
      providers: [
        {
          provide: BlogService,
          useValue: {
            getBlogPostBySlug: vi.fn().mockReturnValue(of(makePost())),
            formatDate: vi.fn().mockReturnValue('1 Jan 2025'),
            formatReadingTime: vi.fn().mockReturnValue('3 min read'),
            loading: signal(false),
          },
        },
        { provide: MarkdownService, useValue: { render: vi.fn().mockReturnValue('<p>Content</p>') } },
        { provide: AnalyticsService, useValue: { trackEvent: vi.fn() } },
        { provide: ActivatedRoute, useValue: { params: of({}) } }, // no slug → loadPost never called
        { provide: AuthService, useValue: { currentUser: signal(null), isLoggedIn: computed(() => false) } },
        { provide: Title, useValue: { setTitle: vi.fn() } },
        { provide: Meta, useValue: { updateTag: vi.fn(), addTag: vi.fn() } },
        provideRouter([]),
      ],
    })
      .overrideComponent(BlogDetail, {
        remove: { imports: [Navbar, Footer] },
        add: { imports: [StubNavbar, StubFooter] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BlogDetail);
    component = fixture.componentInstance;
    fixture.detectChanges(); // initial render — loading state
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('author byline display', () => {
    it('shows authorDisplayName in the byline when set', () => {
      showPost(makePost({ authorDisplayName: 'Dr. Jane Smith' }));

      expect(fixture.nativeElement.textContent).toContain('Dr. Jane Smith');
    });

    it('falls back to "Staff writer" when authorDisplayName is undefined', () => {
      showPost(makePost({ authorDisplayName: undefined }));

      expect(fixture.nativeElement.textContent).toContain('Staff writer');
    });

    it('falls back to "Staff writer" when authorDisplayName is empty string', () => {
      showPost(makePost({ authorDisplayName: '' }));

      expect(fixture.nativeElement.textContent).toContain('Staff writer');
    });
  });

  describe('About the Author section', () => {
    it('shows authorDisplayName in the About the Author section', () => {
      showPost(makePost({ authorDisplayName: 'Dr. Jane Smith' }));

      const strongs = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('strong'));
      const authorStrong = strongs.find(el => el.textContent?.includes('Dr. Jane Smith'));
      expect(authorStrong).toBeDefined();
    });

    it('shows "Staff writer" in the About the Author section when not set', () => {
      showPost(makePost({ authorDisplayName: undefined }));

      const strongs = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('strong'));
      const staffWriterStrong = strongs.find(el => el.textContent?.includes('Staff writer'));
      expect(staffWriterStrong).toBeDefined();
    });
  });

  describe('direct signal update', () => {
    it('re-renders when authorDisplayName changes', () => {
      showPost(makePost({ authorDisplayName: 'First Author' }));
      expect(fixture.nativeElement.textContent).toContain('First Author');

      showPost(makePost({ authorDisplayName: 'Second Author' }));

      expect(fixture.nativeElement.textContent).toContain('Second Author');
      expect(fixture.nativeElement.textContent).not.toContain('First Author');
    });
  });
});
