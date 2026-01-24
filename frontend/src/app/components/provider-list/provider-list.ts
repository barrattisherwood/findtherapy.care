import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProviderService } from '../../services/provider.service';
import { ProviderCard } from '../provider-card/provider-card';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton';
import { Navbar } from '../navbar/navbar';
import { ProviderType, ProviderSearchParams } from '@findlocal/shared';
import { PROVIDER_SPECIALTIES } from '@findlocal/shared';

@Component({
  selector: 'app-provider-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ProviderCard, LoadingSkeleton, Navbar],
  templateUrl: './provider-list.html',
  styleUrl: './provider-list.scss'
})
export class ProviderList implements OnInit {
  private providerService = inject(ProviderService);

  providers = this.providerService.providers;
  loading = this.providerService.loading;
  totalProviders = this.providerService.totalProviders;
  currentPage = this.providerService.currentPage;
  totalPages = this.providerService.totalPages;

  // Filter values
  selectedType = signal<ProviderType | ''>('');
  selectedCity = signal<string>('');
  selectedSpecialty = signal<string>('');
  freeConsultation = signal<boolean>(false);

  specialties = PROVIDER_SPECIALTIES;

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    const params: ProviderSearchParams = {
      page: 1,
      limit: 12,
    };

    if (this.selectedType()) params.type = this.selectedType() as ProviderType;
    if (this.selectedCity()) params.city = this.selectedCity();
    if (this.selectedSpecialty()) params.specialty = this.selectedSpecialty();
    if (this.freeConsultation()) params.freeConsultation = true;

    this.providerService.search(params).subscribe();
  }

  loadPage(page: number): void {
    const params: ProviderSearchParams = {
      page,
      limit: 12,
    };

    if (this.selectedType()) params.type = this.selectedType() as ProviderType;
    if (this.selectedCity()) params.city = this.selectedCity();
    if (this.selectedSpecialty()) params.specialty = this.selectedSpecialty();
    if (this.freeConsultation()) params.freeConsultation = true;

    this.providerService.search(params).subscribe();
  }

  clearFilters(): void {
    this.selectedType.set('');
    this.selectedCity.set('');
    this.selectedSpecialty.set('');
    this.freeConsultation.set(false);
    this.search();
  }

  onTypeChange(value: string): void {
    this.selectedType.set(value as ProviderType | '');
    this.search();
  }

  onCityChange(value: string): void {
    this.selectedCity.set(value);
  }

  onSpecialtyChange(value: string): void {
    this.selectedSpecialty.set(value);
    this.search();
  }

  onFreeConsultationChange(value: boolean): void {
    this.freeConsultation.set(value);
    this.search();
  }
}
