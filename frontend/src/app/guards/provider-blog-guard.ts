import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { FeatureFlagService } from '../services/feature-flag.service';

export const providerBlogGuard: CanActivateFn = () => {
  const featureFlagService = inject(FeatureFlagService);
  const router = inject(Router);

  return featureFlagService.isEnabled$('provider_blog').pipe(
    map(enabled => enabled ? true : router.createUrlTree(['/provider/profile']))
  );
};
