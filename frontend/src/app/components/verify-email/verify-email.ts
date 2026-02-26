import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [Navbar, Footer, RouterLink],
  templateUrl: './verify-email.html',
})
export class VerifyEmail implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  state = signal<'verifying' | 'success' | 'error'>('verifying');
  resending = signal<boolean>(false);
  resendSuccess = signal<boolean>(false);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.state.set('error');
      return;
    }
    this.authService.verifyEmail(token).subscribe({
      next: () => this.state.set('success'),
      error: () => this.state.set('error'),
    });
  }

  resendEmail(): void {
    this.resending.set(true);
    this.authService.resendVerification().subscribe({
      next: () => {
        this.resending.set(false);
        this.resendSuccess.set(true);
      },
      error: () => {
        this.resending.set(false);
      }
    });
  }
}
