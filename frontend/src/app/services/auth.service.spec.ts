import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('AuthService - Email Verification', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/auth`;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    // Flush any /me request triggered during construction
    const pending = httpMock.match(`${apiUrl}/me`);
    pending.forEach(req => req.flush({ user: null }, { status: 401, statusText: 'Unauthorized' }));
  });

  afterEach(() => {
    httpMock.verify();
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  // ─── verifyEmail ─────────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('posts token to verify-email endpoint', () => {
      service.verifyEmail('abc123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/verify-email`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ token: 'abc123' });
      req.flush({ message: 'Email verified successfully' });
    });

    it('updates currentUser signal to isEmailVerified true on success', () => {
      service.currentUser.set({
        id: '1',
        email: 'test@example.com',
        isEmailVerified: false,
      });

      service.verifyEmail('abc123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/verify-email`);
      req.flush({ message: 'Email verified successfully' });

      expect(service.currentUser()?.isEmailVerified).toBe(true);
    });

    it('does not update currentUser if no user is logged in', () => {
      service.currentUser.set(null);

      service.verifyEmail('abc123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/verify-email`);
      req.flush({ message: 'Email verified successfully' });

      expect(service.currentUser()).toBeNull();
    });

    it('propagates errors from the API', () => {
      let errorReceived = false;

      service.verifyEmail('badtoken').subscribe({
        error: () => { errorReceived = true; },
      });

      const req = httpMock.expectOne(`${apiUrl}/verify-email`);
      req.flush({ message: 'Invalid or expired verification link' }, { status: 400, statusText: 'Bad Request' });

      expect(errorReceived).toBe(true);
    });
  });

  // ─── resendVerification ───────────────────────────────────────────────────────

  describe('resendVerification', () => {
    it('posts to resend-verification endpoint', () => {
      service.resendVerification().subscribe();

      const req = httpMock.expectOne(`${apiUrl}/resend-verification`);
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Verification email sent' });
    });

    it('propagates errors from the API', () => {
      let errorReceived = false;

      service.resendVerification().subscribe({
        error: () => { errorReceived = true; },
      });

      const req = httpMock.expectOne(`${apiUrl}/resend-verification`);
      req.flush({ message: 'Email is already verified' }, { status: 400, statusText: 'Bad Request' });

      expect(errorReceived).toBe(true);
    });
  });

  // ─── register ────────────────────────────────────────────────────────────────

  describe('register - isEmailVerified', () => {
    it('sets currentUser with isEmailVerified false after registration', () => {
      service.register('new@example.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/register`);
      req.flush({
        token: 'jwt.token.here',
        user: { id: '1', email: 'new@example.com', isAdmin: false, isEmailVerified: false },
      });

      expect(service.currentUser()?.isEmailVerified).toBe(false);
    });
  });
});
