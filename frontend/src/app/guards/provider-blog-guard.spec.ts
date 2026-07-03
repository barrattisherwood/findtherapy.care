import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { providerBlogGuard } from './provider-blog-guard';
import { FeatureFlagService } from '../services/feature-flag.service';

const mockRoute = {} as ActivatedRouteSnapshot;
const mockState = {} as RouterStateSnapshot;

describe('providerBlogGuard', () => {
  let router: Router;
  let flagEnabled: boolean;

  beforeEach(() => {
    flagEnabled = true;

    TestBed.configureTestingModule({
      providers: [
        {
          provide: FeatureFlagService,
          useValue: { isEnabled$: (_key: string) => of(flagEnabled) },
        },
      ],
    });
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('allows navigation (returns true) when provider_blog flag is enabled', () => {
    flagEnabled = true;
    let result: boolean | UrlTree | undefined;

    TestBed.runInInjectionContext(() => {
      (providerBlogGuard(mockRoute, mockState) as Observable<boolean | UrlTree>)
        .subscribe(val => (result = val));
    });

    expect(result).toBe(true);
  });

  it('redirects to /provider/profile (UrlTree) when flag is disabled', () => {
    flagEnabled = false;
    let result: boolean | UrlTree | undefined;

    TestBed.runInInjectionContext(() => {
      (providerBlogGuard(mockRoute, mockState) as Observable<boolean | UrlTree>)
        .subscribe(val => (result = val));
    });

    expect(result instanceof UrlTree).toBe(true);
    expect(router.serializeUrl(result as UrlTree)).toBe('/provider/profile');
  });
});
