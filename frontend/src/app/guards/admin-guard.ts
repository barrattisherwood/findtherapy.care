import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check authentication first
  if (!authService.isLoggedIn() && !authService.getToken()) {
    router.navigate(['/login']);
    return false;
  }

  // Check admin status
  const user = authService.currentUser();
  if (!user?.isAdmin) {
    router.navigate(['/']);
    return false;
  }

  return true;
};
