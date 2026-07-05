import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ProviderBlogService } from './provider-blog.service';
import { environment } from '../../environments/environment';
import { ProviderBlogPost, GenerateContentResponse } from '@findlocal/shared';

const baseUrl = `${environment.apiUrl}/provider/blog`;

const makePost = (overrides: Partial<ProviderBlogPost> = {}): ProviderBlogPost => ({
  _id: 'post-1',
  title: 'Test Post',
  slug: 'test-post-ab12',
  brief: 'A test brief',
  content: '',
  excerpt: '',
  categories: [],
  tags: [],
  status: 'draft',
  authorType: 'provider',
  aiGenerated: false,
  generationCount: 0,
  providerApproved: false,
  socialQueue: [],
  createdAt: '2026-06-01T00:00:00Z',
  updatedAt: '2026-06-01T00:00:00Z',
  ...overrides,
});

describe('ProviderBlogService', () => {
  let service: ProviderBlogService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProviderBlogService],
    });
    service = TestBed.inject(ProviderBlogService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  // ── loadPosts ────────────────────────────────────────────────────────────────

  describe('loadPosts', () => {
    it('makes GET /provider/blog and sets posts signal', () => {
      const posts = [makePost({ _id: '1' }), makePost({ _id: '2' })];
      service.loadPosts().subscribe();

      const req = http.expectOne(baseUrl);
      expect(req.request.method).toBe('GET');
      req.flush(posts);

      expect(service.posts()).toHaveLength(2);
    });

    it('sets loading to false after response', () => {
      service.loadPosts().subscribe();
      const req = http.expectOne(baseUrl);
      req.flush([]);
      expect(service.loading()).toBe(false);
    });
  });

  // ── getPost ──────────────────────────────────────────────────────────────────

  describe('getPost', () => {
    it('makes GET /provider/blog/:id and updates post in list with full content', () => {
      const cached = makePost({ _id: 'p1', content: '' });
      service.posts.set([cached]);

      const full = makePost({ _id: 'p1', content: '## Hello\n\nFull content here.' });
      service.getPost('p1').subscribe();

      const req = http.expectOne(`${baseUrl}/p1`);
      expect(req.request.method).toBe('GET');
      req.flush(full);

      expect(service.posts()[0].content).toBe('## Hello\n\nFull content here.');
    });

    it('prepends post to list when not already cached', () => {
      service.posts.set([]);

      const post = makePost({ _id: 'new', content: 'Some content.' });
      service.getPost('new').subscribe();

      const req = http.expectOne(`${baseUrl}/new`);
      req.flush(post);

      expect(service.posts()).toHaveLength(1);
      expect(service.posts()[0]._id).toBe('new');
    });
  });

  // ── createDraft ──────────────────────────────────────────────────────────────

  describe('createDraft', () => {
    it('makes POST /provider/blog and prepends to posts signal', () => {
      const existing = makePost({ _id: 'old' });
      service.posts.set([existing]);

      const newPost = makePost({ _id: 'new', title: 'New Draft' });
      service.createDraft({ title: 'New Draft', brief: 'A brief' }).subscribe();

      const req = http.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ title: 'New Draft', brief: 'A brief' });
      req.flush(newPost);

      expect(service.posts()[0]._id).toBe('new');
      expect(service.posts()).toHaveLength(2);
    });
  });

  // ── updatePost ───────────────────────────────────────────────────────────────

  describe('updatePost', () => {
    it('makes PATCH /provider/blog/:id and updates post in list', () => {
      const post = makePost({ _id: 'post-1', title: 'Old' });
      service.posts.set([post]);

      const updated = makePost({ _id: 'post-1', title: 'Updated' });
      service.updatePost('post-1', { title: 'Updated' }).subscribe();

      const req = http.expectOne(`${baseUrl}/post-1`);
      expect(req.request.method).toBe('PATCH');
      req.flush(updated);

      expect(service.posts()[0].title).toBe('Updated');
    });
  });

  // ── deletePost ───────────────────────────────────────────────────────────────

  describe('deletePost', () => {
    it('makes DELETE /provider/blog/:id and removes from posts signal', () => {
      service.posts.set([makePost({ _id: 'del' }), makePost({ _id: 'keep' })]);

      service.deletePost('del').subscribe();
      const req = http.expectOne(`${baseUrl}/del`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Post deleted' });

      expect(service.posts()).toHaveLength(1);
      expect(service.posts()[0]._id).toBe('keep');
    });
  });

  // ── generateContent ──────────────────────────────────────────────────────────

  describe('generateContent', () => {
    it('makes POST /provider/blog/:id/generate and updates post + caption', () => {
      const original = makePost({ _id: 'gen' });
      service.posts.set([original]);

      const response: GenerateContentResponse = {
        post: makePost({ _id: 'gen', aiGenerated: true, content: '# Generated' }),
        socialCaption: 'New post alert!',
      };

      service.generateContent('gen').subscribe();
      const req = http.expectOne(`${baseUrl}/gen/generate`);
      expect(req.request.method).toBe('POST');
      req.flush(response);

      expect(service.posts()[0].aiGenerated).toBe(true);
      expect(service.lastSocialCaption()).toBe('New post alert!');
      expect(service.generating()).toBe(false);
    });

    it('sets generating to true while in flight', () => {
      service.posts.set([makePost({ _id: 'g2' })]);
      service.generateContent('g2').subscribe();
      expect(service.generating()).toBe(true);
      http.expectOne(`${baseUrl}/g2/generate`).flush({
        post: makePost({ _id: 'g2' }),
        socialCaption: '',
      });
    });
  });

  // ── approvePost ──────────────────────────────────────────────────────────────

  describe('approvePost', () => {
    it('makes PATCH /provider/blog/:id/approve and updates post in list', () => {
      service.posts.set([makePost({ _id: 'ap' })]);
      const approved = makePost({ _id: 'ap', providerApproved: true });

      service.approvePost('ap').subscribe();
      const req = http.expectOne(`${baseUrl}/ap/approve`);
      expect(req.request.method).toBe('PATCH');
      req.flush(approved);

      expect(service.posts()[0].providerApproved).toBe(true);
    });
  });

  // ── publishPost ──────────────────────────────────────────────────────────────

  describe('publishPost', () => {
    it('makes PATCH /provider/blog/:id/publish and updates status', () => {
      service.posts.set([makePost({ _id: 'pub', providerApproved: true })]);
      const pending = makePost({ _id: 'pub', status: 'pending_review' });

      service.publishPost('pub').subscribe();
      const req = http.expectOne(`${baseUrl}/pub/publish`);
      expect(req.request.method).toBe('PATCH');
      req.flush(pending);

      expect(service.posts()[0].status).toBe('pending_review');
    });
  });

  // ── social queue ─────────────────────────────────────────────────────────────

  describe('addToSocialQueue', () => {
    it('makes POST /provider/blog/:id/social-queue with platform payload', () => {
      service.posts.set([makePost({ _id: 'sq' })]);
      const withQueue = makePost({ _id: 'sq', socialQueue: [{ platform: 'instagram', status: 'pending' }] });

      service.addToSocialQueue('sq', 'instagram').subscribe();
      const req = http.expectOne(`${baseUrl}/sq/social-queue`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.platform).toBe('instagram');
      req.flush(withQueue);

      expect(service.posts()[0].socialQueue).toHaveLength(1);
    });
  });

  describe('removeFromSocialQueue', () => {
    it('makes DELETE /provider/blog/:id/social-queue/:platform', () => {
      service.posts.set([makePost({ _id: 'rq', socialQueue: [{ platform: 'instagram', status: 'pending' }] })]);
      const cleared = makePost({ _id: 'rq', socialQueue: [] });

      service.removeFromSocialQueue('rq', 'instagram').subscribe();
      const req = http.expectOne(`${baseUrl}/rq/social-queue/instagram`);
      expect(req.request.method).toBe('DELETE');
      req.flush(cleared);

      expect(service.posts()[0].socialQueue).toHaveLength(0);
    });
  });

  // ── computed signals ─────────────────────────────────────────────────────────

  describe('computed signals', () => {
    it('draftPosts filters to status=draft', () => {
      service.posts.set([
        makePost({ _id: '1', status: 'draft' }),
        makePost({ _id: '2', status: 'pending_review' }),
        makePost({ _id: '3', status: 'draft' }),
      ]);
      expect(service.draftPosts()).toHaveLength(2);
    });

    it('pendingApproval returns aiGenerated posts without providerApproved', () => {
      service.posts.set([
        makePost({ _id: '1', aiGenerated: true, providerApproved: false }),
        makePost({ _id: '2', aiGenerated: true, providerApproved: true }),
        makePost({ _id: '3', aiGenerated: false, providerApproved: false }),
      ]);
      expect(service.pendingApproval()).toHaveLength(1);
      expect(service.pendingApproval()[0]._id).toBe('1');
    });

    it('selectedPost returns the post matching selectedPostId', () => {
      service.posts.set([makePost({ _id: 'x' }), makePost({ _id: 'y' })]);
      service.selectedPostId.set('y');
      expect(service.selectedPost()?._id).toBe('y');
    });

    it('selectedPost returns null when id is not found', () => {
      service.posts.set([makePost({ _id: 'x' })]);
      service.selectedPostId.set('missing');
      expect(service.selectedPost()).toBeNull();
    });
  });
});
