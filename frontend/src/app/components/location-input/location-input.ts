import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';
import { StructuredLocation, SAProvince } from '@findlocal/shared';
import { CitiesService, CityResult } from '../../services/cities.service';

@Component({
  selector: 'app-location-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location-input.html',
})
export class LocationInput implements OnInit, OnDestroy {
  private citiesService = inject(CitiesService);
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  @Input() value: StructuredLocation | null = null;
  @Input() error: string = '';
  @Output() valueChange = new EventEmitter<StructuredLocation | null>();

  locationType = signal<'physical' | 'online-only'>('physical');
  provinces = signal<SAProvince[]>([]);
  selectedProvince = signal<string>('');
  selectedCity = signal<CityResult | null>(null);
  suburb = signal<string>('');
  cityQuery = signal<string>('');
  citySuggestions = signal<CityResult[]>([]);
  showSuggestions = signal<boolean>(false);

  ngOnInit() {
    this.citiesService.getProvinces().subscribe(p => this.provinces.set(p));

    // Populate from existing value
    if (this.value) {
      this.locationType.set(this.value.type);
      if (this.value.type === 'physical') {
        this.selectedProvince.set(this.value.province ?? '');
        this.suburb.set(this.value.suburb ?? '');
        this.cityQuery.set(this.value.cityDisplay);
        this.selectedCity.set({
          slug: this.value.city,
          name: this.value.cityDisplay,
          province: this.value.province ?? '',
          provinceDisplay: this.value.provinceDisplay ?? '',
          fullName: this.value.fullLocation,
        });
      }
    }

    // Autocomplete pipe
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => this.citiesService.searchCities(q)),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.citySuggestions.set(results);
      this.showSuggestions.set(results.length > 0);
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onLocationTypeChange() {
    this.selectedCity.set(null);
    this.selectedProvince.set('');
    this.suburb.set('');
    this.cityQuery.set('');
    this.citySuggestions.set([]);
    this.emit();
  }

  onCityQueryChange(q: string) {
    this.cityQuery.set(q);
    this.selectedCity.set(null);
    if (q.length >= 2) {
      this.searchSubject.next(q);
    } else {
      this.citySuggestions.set([]);
      this.showSuggestions.set(false);
    }
    this.emit();
  }

  selectCity(city: CityResult) {
    this.selectedCity.set(city);
    this.cityQuery.set(city.displayName ?? city.name);
    this.showSuggestions.set(false);
    if (!this.selectedProvince() && city.province) {
      this.selectedProvince.set(city.province);
    }
    this.emit();
  }

  onProvinceChange() {
    this.selectedCity.set(null);
    this.cityQuery.set('');
    this.emit();
  }

  onSuburbChange() {
    this.emit();
  }

  private emit() {
    if (this.locationType() === 'online-only') {
      this.valueChange.emit({
        type: 'online-only',
        city: 'online',
        cityDisplay: 'Online Only',
        fullLocation: 'Online Only',
        shortLocation: 'Online',
        searchTerms: ['online', 'nationwide'],
      });
      return;
    }

    const city = this.selectedCity();
    if (!city) {
      this.valueChange.emit(null);
      return;
    }

    const province = this.provinces().find(p => p.slug === this.selectedProvince());
    const sub = this.suburb().trim();
    const cityDisplay = city.displayName ?? city.name;
    const provinceDisplay = province?.name ?? city.provinceDisplay;
    const fullLocation = [sub, cityDisplay, provinceDisplay].filter(Boolean).join(', ');

    this.valueChange.emit({
      type: 'physical',
      province: this.selectedProvince() || city.province,
      provinceDisplay,
      city: city.slug,
      cityDisplay,
      suburb: sub || undefined,
      fullLocation,
      shortLocation: cityDisplay,
    });
  }

  get locationPreview(): string {
    if (this.locationType() === 'online-only') return 'Online Only';
    const city = this.selectedCity();
    if (!city) return '';
    const province = this.provinces().find(p => p.slug === this.selectedProvince());
    const parts = [this.suburb().trim(), city.displayName ?? city.name, province?.name ?? city.provinceDisplay].filter(Boolean);
    return parts.join(', ');
  }
}
