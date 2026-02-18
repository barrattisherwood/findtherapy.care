import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast';
import * as Sentry from '@sentry/angular';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Error: ${error.error.message}`;
      } else {
        switch (error.status) {
          case 0:
            errorMessage = 'Unable to connect to server. Please check your internet connection.';
            toastService.error('Connection Error', errorMessage);
            break;
          case 400:
            errorMessage = error.error?.message || 'Invalid request';
            break;
          case 401:
            errorMessage = 'Your session has expired. Please login again.';
            toastService.warning('Session Expired', errorMessage);
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            router.navigate(['/login']);
            break;
          case 403:
            errorMessage = 'You do not have permission to perform this action';
            toastService.error('Access Denied', errorMessage);
            break;
          case 404:
            errorMessage = error.error?.message || 'Resource not found';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            toastService.error('Server Error', errorMessage);
            break;
          case 503:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            toastService.error('Service Unavailable', errorMessage);
            break;
          default:
            errorMessage = error.error?.message || `Error: ${error.status}`;
        }
      }

      // Send server errors and network failures to Sentry
      if (error.status === 0 || error.status >= 500) {
        Sentry.captureException(error);
      }
      console.error('HTTP Error:', error);
      return throwError(() => new Error(errorMessage));
    })
  );
};
