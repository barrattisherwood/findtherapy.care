import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FoundersDealStatus {
  totalSpots: number;
  spotsTaken: number;
  spotsRemaining: number;
  isAvailable: boolean;
  trialDays: number;
  trialMonths: number;
  monthlyPrice: number;
  regularPrice: number;
}

export interface PromoValidation {
  valid: boolean;
  message?: string;
  deal?: {
    name: string;
    trialDays: number;
    trialMonths: number;
    monthlyPrice: number;
    regularPrice: number;
    spotsRemaining: number;
    totalSpots: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PromoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/promo`;

  activePromoCode = signal<string | null>(null);
  isFounderDeal = signal(false);

  getFoundersDealStatus(): Observable<FoundersDealStatus> {
    return this.http.get<FoundersDealStatus>(`${this.apiUrl}/founders-deal`);
  }

  validatePromoCode(code: string): Observable<PromoValidation> {
    return this.http.get<PromoValidation>(`${this.apiUrl}/validate/${encodeURIComponent(code)}`);
  }

  setPromoCode(code: string): void {
    this.activePromoCode.set(code);
    this.isFounderDeal.set(true);
    // Store in sessionStorage so it persists through registration flow
    sessionStorage.setItem('promoCode', code);
  }

  getStoredPromoCode(): string | null {
    return this.activePromoCode() || sessionStorage.getItem('promoCode');
  }

  clearPromoCode(): void {
    this.activePromoCode.set(null);
    this.isFounderDeal.set(false);
    sessionStorage.removeItem('promoCode');
  }
}
