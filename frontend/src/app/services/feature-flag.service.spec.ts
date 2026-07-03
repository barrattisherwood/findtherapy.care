import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { FeatureFlagService } from './feature-flag.service';
import { environment } from '../../environments/environment';

const flagsUrl = `${environment.apiUrl}/feature-flags/mine`;

describe('FeatureFlagService', () => {
  let service: FeatureFlagService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [FeatureFlagService],
    });
    service = TestBed.inject(FeatureFlagService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('isEnabled$(key) emits true when the API returns the flag as enabled', () => {
    let result: boolean | undefined;
    service.isEnabled$('provider_blog').subscribe(v => (result = v));
    http.expectOne(flagsUrl).flush({ flags: { provider_blog: true } });
    expect(result).toBe(true);
  });

  it('isEnabled$(key) emits false when the API returns the flag as disabled', () => {
    let result: boolean | undefined;
    service.isEnabled$('provider_blog').subscribe(v => (result = v));
    http.expectOne(flagsUrl).flush({ flags: { provider_blog: false } });
    expect(result).toBe(false);
  });

  it('isEnabled$(key) emits false for an unknown key not in the response', () => {
    let result: boolean | undefined;
    service.isEnabled$('nonexistent_flag').subscribe(v => (result = v));
    http.expectOne(flagsUrl).flush({ flags: { provider_blog: true } });
    expect(result).toBe(false);
  });

  it('makes only one HTTP call when isEnabled$ is subscribed multiple times before response', () => {
    service.isEnabled$('provider_blog').subscribe();
    service.isEnabled$('other_flag').subscribe();

    // expectOne throws if more than one request was made
    http.expectOne(flagsUrl).flush({ flags: { provider_blog: true, other_flag: false } });
  });

  it('does not re-fetch after the cache is populated', () => {
    let first: boolean | undefined;
    service.isEnabled$('provider_blog').subscribe(v => (first = v));
    http.expectOne(flagsUrl).flush({ flags: { provider_blog: true } });
    expect(first).toBe(true);

    // Second call within the same session — no new HTTP request
    let second: boolean | undefined;
    service.isEnabled$('provider_blog').subscribe(v => (second = v));
    http.expectNone(flagsUrl);
    expect(second).toBe(true);
  });

  it('refresh() causes the next isEnabled$ call to re-fetch from the API', () => {
    // Prime the cache
    let first: boolean | undefined;
    service.isEnabled$('provider_blog').subscribe(v => (first = v));
    http.expectOne(flagsUrl).flush({ flags: { provider_blog: true } });
    expect(first).toBe(true);

    service.refresh();

    // Next call should trigger a new HTTP request
    let second: boolean | undefined;
    service.isEnabled$('provider_blog').subscribe(v => (second = v));
    http.expectOne(flagsUrl).flush({ flags: { provider_blog: false } });
    expect(second).toBe(false);
  });

  it('isEnabled$(key) emits false when the API call fails (fail closed)', () => {
    let result: boolean | undefined;
    service.isEnabled$('provider_blog').subscribe(v => (result = v));
    http.expectOne(flagsUrl).flush(null, { status: 500, statusText: 'Server Error' });
    expect(result).toBe(false);
  });
});
