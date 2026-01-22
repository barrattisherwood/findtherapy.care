import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.scss',
})
export class ForgotPassword {
  email = '';
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  loading = signal(false);

  constructor(private authService: AuthService) {}

  onSubmit(): void {
    if (!this.email) {
      this.error.set('Please enter your email address');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(null);

    this.authService.forgotPassword(this.email)
      .subscribe({
        next: (response: { message: string }) => {
          this.loading.set(false);
          this.success.set(response.message);
          this.email = '';
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Failed to send reset email');
        }
      });
  }
}
