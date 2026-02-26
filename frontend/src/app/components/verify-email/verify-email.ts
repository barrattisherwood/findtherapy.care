import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Footer],
  templateUrl: './verify-email.html',
})
export class VerifyEmail implements OnInit {
  state = signal<'verifying' | 'success' | 'error'>('verifying');
  resendEmail = '';
  resendLoading = signal(false);
  resendSent = signal(false);
  resendError = signal<string | null>(null);

  private destroy$ = takeUntilDestroyed();
  private route = inject(ActivatedRoute);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.state.set('error');
      return;
    }

    this.authService.verifyEmail(token)
      .pipe(this.destroy$)
      .subscribe({
        next: () => {
          this.state.set('success');
          setTimeout(() => this.router.navigate(['/provider/profile']), 2000);
        },
        error: () => {
          this.state.set('error');
        }
      });
  }

  onResend(): void {
    if (!this.resendEmail) return;

    this.resendLoading.set(true);
    this.resendError.set(null);

    this.authService.resendVerification(this.resendEmail)
      .pipe(this.destroy$)
      .subscribe({
        next: () => {
          this.resendLoading.set(false);
          this.resendSent.set(true);
        },
        error: () => {
          this.resendLoading.set(false);
          this.resendError.set('Something went wrong. Please try again.');
        }
      });
  }
}
