import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../services/auth.service';
import { AnalyticsService } from '../../services/analytics.service';
import { PromoService } from '../../services/promo.service';
import { Footer } from '../footer/footer';
import { TRIAL_PERIOD_DAYS, SUBSCRIPTION_PRICE_ZAR, FOUNDERS_PRICE_ZAR, FOUNDERS_TRIAL_DAYS } from '@findlocal/shared';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, Footer],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register implements OnInit {
  email = '';
  password = '';
  confirmPassword = '';
  error = signal<string | null>(null);
  loading = signal(false);
  trialMonths = Math.round(TRIAL_PERIOD_DAYS / 30);
  subscriptionPrice = SUBSCRIPTION_PRICE_ZAR;
  
  // Founders deal
  isFounderDeal = signal(false);
  founderTrialMonths = Math.round(FOUNDERS_TRIAL_DAYS / 30);
  founderPrice = FOUNDERS_PRICE_ZAR;

  private destroy$ = takeUntilDestroyed();
  private analytics = inject(AnalyticsService);
  private promoService = inject(PromoService);
  private route = inject(ActivatedRoute);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Check for promo code in query params or session storage
    const promoFromUrl = this.route.snapshot.queryParamMap.get('promo');
    const storedPromo = this.promoService.getStoredPromoCode();
    
    if (promoFromUrl) {
      this.promoService.setPromoCode(promoFromUrl);
      this.isFounderDeal.set(true);
    } else if (storedPromo) {
      this.isFounderDeal.set(true);
    }
  }

  onSubmit(): void {
    if (!this.email || !this.password || !this.confirmPassword) {
      this.error.set('Please fill in all fields');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error.set('Passwords do not match');
      return;
    }

    if (this.password.length < 6) {
      this.error.set('Password must be at least 6 characters');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.register(this.email, this.password)
      .pipe(this.destroy$)
      .subscribe({
      next: () => {
        this.analytics.trackRegistration('provider');
        this.router.navigate(['/provider/profile']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Registration failed');
      }
    });
  }
}
