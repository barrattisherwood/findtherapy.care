import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { PromoService, FoundersDealStatus } from '../../services/promo.service';
import { FOUNDERS_PROMO_CODE } from '@findlocal/shared';

@Component({
  selector: 'app-founders',
  standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './founders.html',
  styleUrls: ['./founders.scss']
})
export class Founders implements OnInit {
  private promoService = inject(PromoService);
  private router = inject(Router);

  dealStatus = signal<FoundersDealStatus | null>(null);
  loading = signal(true);
  promoCode = FOUNDERS_PROMO_CODE;

  ngOnInit(): void {
    this.promoService.getFoundersDealStatus().subscribe({
      next: (status) => {
        this.dealStatus.set(status);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  claimFounderSpot(): void {
    this.promoService.setPromoCode(this.promoCode);
    this.router.navigate(['/register'], { queryParams: { promo: this.promoCode } });
  }

  get spotsPercentage(): number {
    const status = this.dealStatus();
    if (!status) return 0;
    return Math.round((status.spotsTaken / status.totalSpots) * 100);
  }
}
