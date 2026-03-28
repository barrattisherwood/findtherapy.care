import { Component, OnInit, Input, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProviderService } from '../../services/provider.service';
import { SeoService } from '../../services/seo.service';
import { AnalyticsService } from '../../services/analytics.service';
import { ProviderCard } from '../provider-card/provider-card';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { ProviderType, ProviderSearchParams, CITY_CONFIGS, MAJOR_CITIES } from '@findlocal/shared';
import { PROVIDER_SPECIALTIES } from '@findlocal/shared';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProviderCard, LoadingSkeleton, Navbar, Footer],
  templateUrl: './provider-list.html',
  styleUrl: './provider-list.scss'
})
export class ProviderList implements OnInit {
  @Input() cityFilter: string | undefined;
  @Input() embedded: boolean = false;
  @Input() showFilters: boolean = true;

  private providerService = inject(ProviderService);
  private seo = inject(SeoService);
  private analytics = inject(AnalyticsService);
  private elementRef = inject(ElementRef);

  providers = this.providerService.providers;
  loading = this.providerService.loading;
  totalProviders = this.providerService.totalProviders;
  currentPage = this.providerService.currentPage;
  totalPages = this.providerService.totalPages;

  // Filter values
  selectedType = signal<ProviderType | ''>('');
  selectedCity = signal<string>('');
  selectedSpecialties = signal<string[]>([]);
  specialtyDropdownOpen = signal<boolean>(false);
  freeConsultation = signal<boolean>(false);

  specialties = PROVIDER_SPECIALTIES;
  cities = MAJOR_CITIES.map(slug => CITY_CONFIGS[slug]);

  ngOnInit(): void {
    // Only update SEO if not embedded
    if (!this.embedded) {
      this.seo.update({
        title: 'Find Providers',
        description: 'Browse therapists and counsellors across South Africa. Filter by specialty, location, and type to find the right mental health professional for you.',
        url: '/providers',
      });
    }

    // Pre-populate city filter if provided via Input
    if (this.cityFilter) {
      this.selectedCity.set(this.cityFilter);
    }

    this.search();
  }

  search(): void {
    const params: ProviderSearchParams = {
      page: 1,
      limit: 12,
    };

    if (this.selectedType()) params.type = this.selectedType() as ProviderType;
    if (this.selectedCity()) params.city = this.selectedCity();
    if (this.selectedSpecialties().length) params.specialties = this.selectedSpecialties();
    if (this.freeConsultation()) params.freeConsultation = true;

    // Track search event
    this.analytics.trackSearch(
      this.selectedSpecialties(),
      this.selectedCity(),
      this.selectedType() || undefined,
      this.freeConsultation()
    );

    this.providerService.search(params).subscribe();
  }

  loadPage(page: number): void {
    const params: ProviderSearchParams = {
      page,
      limit: 12,
    };

    if (this.selectedType()) params.type = this.selectedType() as ProviderType;
    if (this.selectedCity()) params.city = this.selectedCity();
    if (this.selectedSpecialties().length) params.specialties = this.selectedSpecialties();
    if (this.freeConsultation()) params.freeConsultation = true;

    this.providerService.search(params).subscribe();
  }

  clearFilters(): void {
    this.selectedType.set('');
    this.selectedCity.set('');
    this.selectedSpecialties.set([]);
    this.specialtyDropdownOpen.set(false);
    this.freeConsultation.set(false);
    this.search();
  }

  onTypeChange(value: string): void {
    this.selectedType.set(value as ProviderType | '');
    this.search();
  }

  onCityChange(value: string): void {
    this.selectedCity.set(value);
    this.search();
  }

  toggleSpecialtyDropdown(event: Event): void {
    event.stopPropagation();
    this.specialtyDropdownOpen.update(v => !v);
  }

  toggleSpecialty(specialty: string): void {
    const current = this.selectedSpecialties();
    if (current.includes(specialty)) {
      this.selectedSpecialties.set(current.filter(s => s !== specialty));
    } else {
      this.selectedSpecialties.set([...current, specialty]);
    }
    this.search();
  }

  isSpecialtySelected(specialty: string): boolean {
    return this.selectedSpecialties().includes(specialty);
  }

  get specialtyButtonLabel(): string {
    const selected = this.selectedSpecialties();
    if (selected.length === 0) return 'All specialties';
    if (selected.length === 1) return selected[0];
    return `${selected.length} selected`;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.specialtyDropdownOpen.set(false);
    }
  }

  onFreeConsultationChange(value: boolean): void {
    this.freeConsultation.set(value);
    this.search();
  }
}
