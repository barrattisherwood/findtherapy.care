import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Footer],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  email = '';
  password = '';
  error = signal<string | null>(null);
  loading = signal(false);
  unverified = signal(false);
  resendLoading = signal(false);
  resendSent = signal(false);

  private destroy$ = takeUntilDestroyed();
  private analytics = inject(AnalyticsService);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error.set('Please fill in all fields');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.unverified.set(false);
    this.resendSent.set(false);

    this.authService.login(this.email, this.password)
      .pipe(this.destroy$)
      .subscribe({
      next: () => {
        this.analytics.trackLogin();
        const user = this.authService.currentUser();
        if (user?.isAdmin) {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/provider/profile']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        if (err.status === 403) {
          this.unverified.set(true);
        } else {
          this.error.set(err.error?.message || 'Login failed');
        }
      }
    });
  }

  resendVerification(): void {
    this.resendLoading.set(true);
    this.authService.resendVerification(this.email)
      .pipe(this.destroy$)
      .subscribe({
        next: () => {
          this.resendLoading.set(false);
          this.resendSent.set(true);
        },
        error: () => {
          this.resendLoading.set(false);
        }
      });
  }
}
