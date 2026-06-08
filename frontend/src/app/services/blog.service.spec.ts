import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BlogService } from './blog.service';
import { environment } from '../../environments/environment';

const uploadUrl = `${environment.apiUrl}/blog/admin/upload-image`;

describe('BlogService - uploadFeaturedImage', () => {
  let service: BlogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BlogService],
    });
    service = TestBed.inject(BlogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
  });

  it('makes a POST request to the upload-image endpoint', () => {
    const file = new File(['fake'], 'cover.jpg', { type: 'image/jpeg' });
    service.uploadFeaturedImage(file).subscribe();

    const req = httpMock.expectOne(uploadUrl);
    expect(req.request.method).toBe('POST');
    req.flush({ url: 'https://cdn.example.com/blog/cover.jpg' });
  });

  it('sends the file as FormData with key "image"', () => {
    const file = new File(['fake'], 'cover.jpg', { type: 'image/jpeg' });
    service.uploadFeaturedImage(file).subscribe();

    const req = httpMock.expectOne(uploadUrl);
    expect(req.request.body).toBeInstanceOf(FormData);
    expect((req.request.body as FormData).get('image')).toBe(file);
    req.flush({ url: 'https://cdn.example.com/blog/cover.jpg' });
  });

  it('returns the url from the response', () => {
    const file = new File(['fake'], 'cover.jpg', { type: 'image/jpeg' });
    const expectedUrl = 'https://res.cloudinary.com/demo/image/upload/blog/abc.jpg';
    let result: { url: string } | undefined;

    service.uploadFeaturedImage(file).subscribe(r => (result = r));

    const req = httpMock.expectOne(uploadUrl);
    req.flush({ url: expectedUrl });

    expect(result?.url).toBe(expectedUrl);
  });

  it('sets loading to false after a successful upload', () => {
    const file = new File(['fake'], 'cover.jpg', { type: 'image/jpeg' });
    service.uploadFeaturedImage(file).subscribe();

    const req = httpMock.expectOne(uploadUrl);
    req.flush({ url: 'https://cdn.example.com/blog/cover.jpg' });

    expect(service.loading()).toBe(false);
  });

  it('sets loading to false when the upload fails', () => {
    const file = new File(['fake'], 'cover.jpg', { type: 'image/jpeg' });
    service.uploadFeaturedImage(file).subscribe({ error: () => {} });

    const req = httpMock.expectOne(uploadUrl);
    req.error(new ErrorEvent('Network error'));

    expect(service.loading()).toBe(false);
  });
});
