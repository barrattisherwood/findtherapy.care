import { Component, signal, computed } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { BlogEditor } from './blog-editor';
import { BlogService } from '../../services/blog.service';
import { MarkdownService } from '../../services/markdown.service';
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
  title: 'Existing Post',
  slug: 'existing-post',
  content: 'Content',
  excerpt: 'Excerpt',
  author: { _id: 'user-1', name: 'Admin', email: 'admin@test.com' },
  status: 'draft',
  categories: ['health'],
  tags: ['wellbeing'],
  readingTime: 2,
  views: 0,
  likes: 0,
  commentsEnabled: true,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  ...overrides,
});

describe('BlogEditor Component - authorDisplayName', () => {
  let component: BlogEditor;
  let fixture: ComponentFixture<BlogEditor>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogEditor, HttpClientTestingModule],
      providers: [
        {
          provide: BlogService,
          useValue: {
            loading: signal(false),
            getAdminBlogPosts: vi.fn().mockReturnValue(of({ posts: [] })),
            createBlogPost: vi.fn().mockReturnValue(of({})),
            updateBlogPost: vi.fn().mockReturnValue(of({})),
            uploadFeaturedImage: vi.fn().mockReturnValue(of({ url: '' })),
          },
        },
        {
          provide: MarkdownService,
          useValue: {
            render: vi.fn().mockReturnValue('<p>Preview</p>'),
            generateExcerpt: vi.fn().mockReturnValue('Generated excerpt'),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: {} } }, // No id = create mode
        },
        {
          provide: AuthService,
          useValue: { currentUser: signal(null), isLoggedIn: computed(() => false) },
        },
        provideRouter([]),
      ],
    })
      .overrideComponent(BlogEditor, {
        remove: { imports: [Navbar, Footer] },
        add: { imports: [StubNavbar, StubFooter] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(BlogEditor);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('form defaults', () => {
    it('defaults authorDisplayName to "Staff writer"', () => {
      expect(component.blogForm.get('authorDisplayName')?.value).toBe('Staff writer');
    });

    it('includes authorDisplayName control in the form', () => {
      expect(component.blogForm.contains('authorDisplayName')).toBe(true);
    });
  });

  describe('populateForm', () => {
    it('populates authorDisplayName from the post', () => {
      component.populateForm(makePost({ authorDisplayName: 'Dr. Jane Smith' }));

      expect(component.blogForm.get('authorDisplayName')?.value).toBe('Dr. Jane Smith');
    });

    it('falls back to "Staff writer" when post has no authorDisplayName', () => {
      component.populateForm(makePost({ authorDisplayName: undefined }));

      expect(component.blogForm.get('authorDisplayName')?.value).toBe('Staff writer');
    });

    it('preserves empty string when post authorDisplayName is empty (uses ?? not ||)', () => {
      // populateForm uses ?? (null/undefined check), so '' passes through unchanged
      component.populateForm(makePost({ authorDisplayName: '' }));

      expect(component.blogForm.get('authorDisplayName')?.value).toBe('');
    });

    it('preserves other form fields when populating', () => {
      component.populateForm(makePost({
        title: 'My Post',
        authorDisplayName: 'Guest Author',
      }));

      expect(component.blogForm.get('title')?.value).toBe('My Post');
      expect(component.blogForm.get('authorDisplayName')?.value).toBe('Guest Author');
    });
  });

  describe('form input rendering', () => {
    it('renders an author name input in the template', () => {
      const input = fixture.nativeElement.querySelector('#authorDisplayName');
      expect(input).not.toBeNull();
    });

    it('author name input has placeholder "Staff writer"', () => {
      const input = fixture.nativeElement.querySelector('#authorDisplayName');
      expect(input?.placeholder).toBe('Staff writer');
    });
  });
});
