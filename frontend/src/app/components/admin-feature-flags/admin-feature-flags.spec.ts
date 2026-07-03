import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminFeatureFlags } from './admin-feature-flags';
import { environment } from '../../../environments/environment';

const apiUrl = `${environment.apiUrl}/admin/feature-flags`;

const makeFlag = (overrides: Partial<any> = {}) => ({
  key: 'provider_blog',
  description: 'Provider-written blog submissions',
  enabled: false,
  allowlistedAdminIds: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('AdminFeatureFlags', () => {
  let component: AdminFeatureFlags;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminFeatureFlags, HttpClientTestingModule, RouterTestingModule],
    });
    component = TestBed.createComponent(AdminFeatureFlags).componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('fetches and displays all flags on init', () => {
    const flags = [
      makeFlag({ key: 'provider_blog', enabled: false }),
      makeFlag({ key: 'other_flag', enabled: true }),
    ];

    component.ngOnInit();

    http.expectOne(apiUrl).flush({ flags });
    expect(component.flags()).toHaveLength(2);
    expect(component.flags()[0].key).toBe('provider_blog');
    expect(component.flags()[1].key).toBe('other_flag');
  });

  it('calls PATCH /admin/feature-flags/:key when toggle is clicked', () => {
    component.flags.set([makeFlag({ key: 'provider_blog', enabled: false })]);

    component.toggle('provider_blog', false);

    const req = http.expectOne(`${apiUrl}/provider_blog`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ enabled: true });
    req.flush({ flag: makeFlag({ enabled: true }) });
  });

  it('applies optimistic update before server responds', () => {
    component.flags.set([makeFlag({ key: 'provider_blog', enabled: false })]);

    component.toggle('provider_blog', false);

    // Before flush, optimistic update should be applied
    expect(component.flags()[0].enabled).toBe(true);
    http.expectOne(`${apiUrl}/provider_blog`).flush({ flag: makeFlag({ enabled: true }) });
  });

  it('reverts the optimistic update when the PATCH call fails', () => {
    component.flags.set([makeFlag({ key: 'provider_blog', enabled: false })]);

    component.toggle('provider_blog', false);

    expect(component.flags()[0].enabled).toBe(true); // optimistic
    http.expectOne(`${apiUrl}/provider_blog`).flush(null, { status: 500, statusText: 'Server Error' });
    expect(component.flags()[0].enabled).toBe(false); // reverted
    expect(component.error()).toBeTruthy();
  });
});
