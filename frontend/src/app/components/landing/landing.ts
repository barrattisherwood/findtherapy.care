import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { Footer } from '../footer/footer';
import { Navbar } from '../navbar/navbar';
import { TRIAL_PERIOD_DAYS, SUBSCRIPTION_PRICE_ZAR, PROVIDER_SPECIALTIES } from '@findlocal/shared';
import { CitiesService, CityResult } from '../../services/cities.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, Footer, Navbar],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing implements OnInit, OnDestroy {
  private router = inject(Router);
  private citiesService = inject(CitiesService);
  private destroy$ = new Subject<void>();
  private citySearch$ = new Subject<string>();

  currentYear = new Date().getFullYear();
  trialMonths = Math.round(TRIAL_PERIOD_DAYS / 30);
  subscriptionPrice = SUBSCRIPTION_PRICE_ZAR;
  specialties = PROVIDER_SPECIALTIES;

  heroCity = '';
  heroSelectedCity: CityResult | null = null;
  heroCitySuggestions: CityResult[] = [];
  heroShowSuggestions = false;
  heroSelectedSpecialty = '';

  ngOnInit(): void {
    this.citySearch$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => this.citiesService.searchCities(q)),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.heroCitySuggestions = results;
      this.heroShowSuggestions = results.length > 0;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onHeroCityChange(q: string): void {
    this.heroCity = q;
    this.heroSelectedCity = null;
    if (q.length >= 2) {
      this.citySearch$.next(q);
    } else {
      this.heroCitySuggestions = [];
      this.heroShowSuggestions = false;
    }
  }

  selectHeroCity(city: CityResult): void {
    this.heroSelectedCity = city;
    this.heroCity = city.displayName ?? city.name;
    this.heroShowSuggestions = false;
  }

  onHeroSearch(): void {
    const params: Record<string, string> = {};
    if (this.heroSelectedCity) {
      params['city'] = this.heroSelectedCity.slug;
      params['cityName'] = this.heroSelectedCity.displayName ?? this.heroSelectedCity.name;
    }
    if (this.heroSelectedSpecialty) {
      params['specialty'] = this.heroSelectedSpecialty;
    }
    this.router.navigate(['/providers'], { queryParams: params });
  }
}
