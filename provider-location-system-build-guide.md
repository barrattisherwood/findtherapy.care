# Build Guide: Provider Location System Refactor
## findtherapy.care - Standardized Location & Service Area

**Project:** Provider Location System Refactor  
**Platform:** findtherapy.care  
**Date:** March 2026  
**Version:** 1.0

---

## Executive Summary

**Objective:** Replace open text location input with structured province-based system + autocomplete city search.

**Why:** Current system allows inconsistent entries ("Jhb" vs "Johannesburg"), doesn't handle edge cases (Stellenbosch, Mbombela/Nelspruit), and makes search/filtering difficult.

**Solution:** Province dropdown + city autocomplete + session format selection that handles:
- Major metros (Johannesburg, Cape Town, etc.)
- Secondary cities (Stellenbosch, Mbombela/Nelspruit, George, etc.)
- Online-only providers (serve nationwide)
- Hybrid providers (in-person + online)

**Tech Stack:**
- Frontend: Angular 21
- Backend: Node.js + Express
- Database: MongoDB
- Search: Autocomplete with fuzzy matching

**Estimated Time:** 2-3 days for full implementation

---

## 1. Database Schema Updates

### Provider Model (MongoDB)

Update the Provider model with the following schema:

```typescript
// models/provider.model.ts

interface Location {
  type: 'physical' | 'online-only';
  
  // Physical location fields:
  province?: string;           // "western-cape", "gauteng", "mpumalanga"
  provinceDisplay?: string;    // "Western Cape", "Gauteng"
  city: string;                // "stellenbosch", "johannesburg", "mbombela"
  cityDisplay: string;         // "Stellenbosch", "Johannesburg", "Mbombela (Nelspruit)"
  suburb?: string;             // Optional: "Die Boord", "Sandton"
  
  // Auto-generated display fields:
  fullLocation: string;        // "Stellenbosch, Western Cape" or "Online Only"
  shortLocation: string;       // "Stellenbosch" or "Online"
  
  // For search optimization:
  searchTerms: string[];       // ["stellenbosch", "western-cape", "cape-winelands", "nelspruit", "mbombela"]
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface SessionFormats {
  inPerson: boolean;
  online: boolean;
}

interface Provider {
  // ... existing fields ...
  
  location: Location;
  sessionFormats: SessionFormats;
  
  // Computed fields (virtual or set via pre-save hook):
  servesNationwide: boolean;   // true if sessionFormats.online === true
  
  // ... existing fields ...
}

// Mongoose Schema
const LocationSchema = new Schema({
  type: { 
    type: String, 
    enum: ['physical', 'online-only'], 
    required: true 
  },
  province: String,
  provinceDisplay: String,
  city: { type: String, required: true },
  cityDisplay: { type: String, required: true },
  suburb: String,
  fullLocation: { type: String, required: true },
  shortLocation: { type: String, required: true },
  searchTerms: [String],
  coordinates: {
    lat: Number,
    lng: Number
  }
});

const SessionFormatsSchema = new Schema({
  inPerson: { type: Boolean, default: false },
  online: { type: Boolean, default: false }
});

const ProviderSchema = new Schema({
  // ... existing fields ...
  
  location: { type: LocationSchema, required: true },
  sessionFormats: { type: SessionFormatsSchema, required: true },
  servesNationwide: { type: Boolean, default: false },
  
  // ... existing fields ...
});

// Pre-save hook to compute fields
ProviderSchema.pre('save', function(next) {
  // Set servesNationwide
  this.servesNationwide = this.sessionFormats.online === true;
  
  // Generate fullLocation
  if (this.location.type === 'online-only') {
    this.location.fullLocation = 'Online Only';
    this.location.shortLocation = 'Online';
  } else {
    const suburb = this.location.suburb ? `${this.location.suburb}, ` : '';
    this.location.fullLocation = `${suburb}${this.location.cityDisplay}, ${this.location.provinceDisplay}`;
    this.location.shortLocation = this.location.cityDisplay;
  }
  
  next();
});
```

### Database Indexes

Add these indexes for optimal search performance:

```typescript
// In provider.model.ts

ProviderSchema.index({ 'location.city': 1, 'sessionFormats.inPerson': 1 });
ProviderSchema.index({ 'location.province': 1, 'sessionFormats.inPerson': 1 });
ProviderSchema.index({ 'sessionFormats.online': 1 });
ProviderSchema.index({ 'location.searchTerms': 1 });
ProviderSchema.index({ 'location.coordinates': '2dsphere' }); // For geo queries
```

---

## 2. Cities Master Data

### Create: `data/south-africa-cities.json`

This file contains all provinces and cities for autocomplete.

**Location:** `/data/south-africa-cities.json`

**Content:** See attached `south-africa-cities.json` file

**Key features:**
- 9 provinces with proper slugs
- ~50 cities/towns including metros and secondary cities
- City aliases (e.g., "nelspruit" → "mbombela")
- Suburb lists for major metros
- Coordinates for future geo search
- Display names for proper formatting

**Important cities included:**
- Major metros: Johannesburg, Cape Town, Pretoria, Durban, etc.
- Secondary cities: Stellenbosch, Mbombela (Nelspruit), George, Knysna, Paarl, etc.
- Handles name changes: Port Elizabeth (Gqeberha), Nelspruit (Mbombela), Witbank (eMalahleni)

---

## 3. Backend API Endpoints

### 3.1 City Routes

**File:** `routes/cities.routes.ts`

```typescript
import express from 'express';
import citiesData from '../data/south-africa-cities.json';

const router = express.Router();

// GET /api/cities/search?q=stel
router.get('/search', (req, res) => {
  const query = req.query.q?.toString().toLowerCase() || '';
  
  if (query.length < 2) {
    return res.json({ results: [] });
  }
  
  const results = citiesData.cities
    .filter(city => {
      // Match city name
      if (city.name.toLowerCase().includes(query)) return true;
      
      // Match aliases (nelspruit, jhb, etc.)
      if (city.aliases?.some(alias => alias.includes(query))) return true;
      
      // Match suburbs for metro cities
      if (city.suburbs?.some(suburb => suburb.toLowerCase().includes(query))) return true;
      
      return false;
    })
    .map(city => ({
      name: city.displayName || city.name,
      slug: city.slug,
      province: city.province,
      provinceDisplay: citiesData.provinces.find(p => p.slug === city.province)?.name,
      fullName: `${city.displayName || city.name}, ${citiesData.provinces.find(p => p.slug === city.province)?.name}`,
      suburbs: city.suburbs || [],
      isMetro: city.isMetro
    }))
    .slice(0, 10); // Limit results
  
  res.json({ results });
});

// GET /api/cities/provinces
router.get('/provinces', (req, res) => {
  res.json({ provinces: citiesData.provinces });
});

// GET /api/cities/:citySlug
router.get('/:citySlug', (req, res) => {
  const city = citiesData.cities.find(c => c.slug === req.params.citySlug);
  
  if (!city) {
    return res.status(404).json({ error: 'City not found' });
  }
  
  const province = citiesData.provinces.find(p => p.slug === city.province);
  
  res.json({
    ...city,
    provinceDisplay: province?.name
  });
});

export default router;
```

**Register in main app:**

```typescript
// app.ts or server.ts
import citiesRouter from './routes/cities.routes';

app.use('/api/cities', citiesRouter);
```

### 3.2 Provider Search Updates

**File:** `routes/providers.routes.ts`

Update the provider search endpoint to handle new location structure:

```typescript
// GET /api/providers/search
router.get('/search', async (req, res) => {
  const { 
    city, 
    province, 
    online, 
    inPerson,
    lat,
    lng,
    radius = 50 // km
  } = req.query;
  
  let query: any = { isActive: true };
  
  // Online-only search
  if (online === 'true' && inPerson !== 'true') {
    query['sessionFormats.online'] = true;
  }
  
  // In-person search
  else if (inPerson === 'true' && online !== 'true') {
    query['sessionFormats.inPerson'] = true;
    
    if (city) {
      query['location.city'] = city;
    } else if (province) {
      query['location.province'] = province;
    }
  }
  
  // Both or either
  else {
    if (city) {
      query.$or = [
        { 'location.city': city, 'sessionFormats.inPerson': true },
        { 'sessionFormats.online': true }
      ];
    } else if (province) {
      query.$or = [
        { 'location.province': province, 'sessionFormats.inPerson': true },
        { 'sessionFormats.online': true }
      ];
    }
  }
  
  // Geo search if coordinates provided
  if (lat && lng && radius) {
    const radiusInRadians = Number(radius) / 6371; // Earth radius in km
    
    query['location.coordinates'] = {
      $geoWithin: {
        $centerSphere: [[Number(lng), Number(lat)], radiusInRadians]
      }
    };
  }
  
  const providers = await Provider.find(query)
    .select('name qualifications specializations location sessionFormats profilePhoto')
    .limit(50);
  
  // Sort: local in-person first, then hybrid, then online-only
  const sorted = providers.sort((a, b) => {
    const aLocal = a.sessionFormats.inPerson && a.location.city === city;
    const bLocal = b.sessionFormats.inPerson && b.location.city === city;
    
    if (aLocal && !bLocal) return -1;
    if (!aLocal && bLocal) return 1;
    
    const aHybrid = a.sessionFormats.inPerson && a.sessionFormats.online;
    const bHybrid = b.sessionFormats.inPerson && b.sessionFormats.online;
    
    if (aHybrid && !bHybrid) return -1;
    if (!aHybrid && bHybrid) return 1;
    
    return 0;
  });
  
  res.json({ 
    providers: sorted,
    count: sorted.length,
    filters: { city, province, online, inPerson }
  });
});
```

---

## 4. Frontend Components (Angular)

### 4.1 Cities Service

**File:** `src/app/services/cities.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CitiesService {
  private apiUrl = '/api/cities';
  
  constructor(private http: HttpClient) {}
  
  getProvinces(): Observable<any> {
    return this.http.get(`${this.apiUrl}/provinces`);
  }
  
  searchCities(query: string): Observable<any[]> {
    if (!query || query.length < 2) {
      return of([]);
    }
    
    return this.http.get(`${this.apiUrl}/search`, {
      params: { q: query }
    }).pipe(
      map((response: any) => response.results || [])
    );
  }
  
  getCityBySlug(slug: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${slug}`);
  }
}
```

### 4.2 Location Input Component

**File:** `src/app/components/location-input/location-input.component.ts`

```typescript
import { Component, forwardRef, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { CitiesService } from '../../services/cities.service';

interface LocationValue {
  type: 'physical' | 'online-only';
  province?: string;
  provinceDisplay?: string;
  city: string;
  cityDisplay: string;
  suburb?: string;
}

@Component({
  selector: 'app-location-input',
  templateUrl: './location-input.component.html',
  styleUrls: ['./location-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LocationInputComponent),
      multi: true
    }
  ]
})
export class LocationInputComponent implements ControlValueAccessor, OnInit {
  locationType: 'physical' | 'online-only' = 'physical';
  provinces: any[] = [];
  selectedProvince: string = '';
  selectedCity: any = null;
  suburb: string = '';
  
  citySearchControl = new FormControl('');
  citySuggestions: any[] = [];
  showCitySuggestions = false;
  
  value: LocationValue | null = null;
  
  onChange: any = () => {};
  onTouched: any = () => {};
  
  constructor(private citiesService: CitiesService) {}
  
  ngOnInit() {
    // Load provinces
    this.citiesService.getProvinces().subscribe(data => {
      this.provinces = data.provinces;
    });
    
    // Setup city autocomplete
    this.citySearchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(query => {
          if (!query || query.length < 2) {
            return [];
          }
          return this.citiesService.searchCities(query);
        })
      )
      .subscribe(results => {
        this.citySuggestions = results;
      });
  }
  
  onLocationTypeChange() {
    if (this.locationType === 'online-only') {
      this.value = {
        type: 'online-only',
        city: 'online',
        cityDisplay: 'Online Only'
      };
      this.onChange(this.value);
    } else {
      this.value = null;
      this.selectedProvince = '';
      this.selectedCity = null;
      this.suburb = '';
      this.onChange(null);
    }
  }
  
  onProvinceChange() {
    this.selectedCity = null;
    this.citySearchControl.setValue('');
    this.updateValue();
  }
  
  selectCity(city: any) {
    this.selectedCity = city;
    this.citySearchControl.setValue(city.name);
    this.showCitySuggestions = false;
    
    // Auto-set province if not already set
    if (!this.selectedProvince && city.province) {
      this.selectedProvince = city.province;
    }
    
    this.updateValue();
  }
  
  updateValue() {
    if (this.locationType === 'online-only') {
      this.value = {
        type: 'online-only',
        city: 'online',
        cityDisplay: 'Online Only'
      };
    } else if (this.selectedCity) {
      const province = this.provinces.find(p => p.slug === this.selectedProvince);
      
      this.value = {
        type: 'physical',
        province: this.selectedProvince,
        provinceDisplay: province?.name,
        city: this.selectedCity.slug,
        cityDisplay: this.selectedCity.name,
        suburb: this.suburb || undefined
      };
    } else {
      this.value = null;
    }
    
    this.onChange(this.value);
  }
  
  getLocationDisplay(): string {
    if (!this.value) return '';
    
    if (this.value.type === 'online-only') {
      return 'Online Only';
    }
    
    const parts = [];
    if (this.value.suburb) parts.push(this.value.suburb);
    parts.push(this.value.cityDisplay);
    parts.push(this.value.provinceDisplay);
    
    return parts.join(', ');
  }
  
  // ControlValueAccessor methods
  writeValue(value: LocationValue): void {
    this.value = value;
    
    if (value) {
      this.locationType = value.type;
      
      if (value.type === 'physical') {
        this.selectedProvince = value.province || '';
        this.selectedCity = {
          name: value.cityDisplay,
          slug: value.city
        };
        this.suburb = value.suburb || '';
        this.citySearchControl.setValue(value.cityDisplay);
      }
    }
  }
  
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
}
```

**Template:** `src/app/components/location-input/location-input.component.html`

```html
<div class="location-input">
  <!-- Location Type -->
  <div class="form-group">
    <label>Where do you practice?</label>
    <div class="radio-group">
      <label>
        <input 
          type="radio" 
          [value]="'online-only'"
          [(ngModel)]="locationType"
          (change)="onLocationTypeChange()"
        />
        Online Only (No Physical Location)
      </label>
      <label>
        <input 
          type="radio" 
          [value]="'physical'"
          [(ngModel)]="locationType"
          (change)="onLocationTypeChange()"
        />
        Physical Location
      </label>
    </div>
  </div>

  <!-- Physical Location Fields -->
  <ng-container *ngIf="locationType === 'physical'">
    
    <!-- Province Dropdown -->
    <div class="form-group">
      <label>Province *</label>
      <select 
        [(ngModel)]="selectedProvince"
        (change)="onProvinceChange()"
        required
      >
        <option value="">Select province</option>
        <option 
          *ngFor="let province of provinces" 
          [value]="province.slug"
        >
          {{ province.name }}
        </option>
      </select>
    </div>

    <!-- City Autocomplete -->
    <div class="form-group">
      <label>City or Town *</label>
      <input
        type="text"
        [formControl]="citySearchControl"
        placeholder="Start typing your city or town..."
        (focus)="showCitySuggestions = true"
        required
      />
      
      <!-- Autocomplete Dropdown -->
      <div 
        class="autocomplete-dropdown" 
        *ngIf="showCitySuggestions && citySuggestions.length > 0"
      >
        <div 
          class="suggestion-item"
          *ngFor="let city of citySuggestions"
          (click)="selectCity(city)"
        >
          <strong>{{ city.name }}</strong>
          <span class="province-tag">{{ city.provinceDisplay }}</span>
        </div>
      </div>

      <small class="help-text">
        Examples: Stellenbosch, Mbombela (Nelspruit), Johannesburg
      </small>
    </div>

    <!-- Suburb (Optional) -->
    <div class="form-group" *ngIf="selectedCity">
      <label>Suburb or Area (Optional)</label>
      <input
        type="text"
        [(ngModel)]="suburb"
        placeholder="e.g., Die Boord, Sandton"
        (ngModelChange)="updateValue()"
      />
      <small class="help-text">
        This helps clients find you more easily if you're in a specific area
      </small>
    </div>

  </ng-container>

  <!-- Display Summary -->
  <div class="location-summary" *ngIf="value">
    <strong>Your location will show as:</strong>
    <p class="location-preview">
      {{ getLocationDisplay() }}
    </p>
  </div>
</div>
```

### 4.3 Session Formats Component

**File:** `src/app/components/session-formats-input/session-formats-input.component.ts`

```typescript
import { Component, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface SessionFormatsValue {
  inPerson: boolean;
  online: boolean;
}

@Component({
  selector: 'app-session-formats-input',
  templateUrl: './session-formats-input.component.html',
  styleUrls: ['./session-formats-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SessionFormatsInputComponent),
      multi: true
    }
  ]
})
export class SessionFormatsInputComponent implements ControlValueAccessor {
  value: SessionFormatsValue = {
    inPerson: false,
    online: false
  };
  
  showError = false;
  onChange: any = () => {};
  onTouched: any = () => {};
  
  writeValue(value: SessionFormatsValue): void {
    if (value) {
      this.value = value;
    }
  }
  
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  
  validate(): boolean {
    this.showError = !this.value.inPerson && !this.value.online;
    return !this.showError;
  }
}
```

**Template:** `src/app/components/session-formats-input/session-formats-input.component.html`

```html
<div class="session-formats">
  <label class="section-label">How do you offer sessions? *</label>
  <p class="help-text">You can select both options</p>
  
  <div class="checkbox-group">
    <label class="checkbox-label">
      <input 
        type="checkbox" 
        [(ngModel)]="value.inPerson"
        (change)="onChange(value)"
      />
      <span class="checkbox-text">
        <strong>In-person at my practice</strong>
        <small>Face-to-face sessions at your office</small>
      </span>
    </label>
    
    <label class="checkbox-label">
      <input 
        type="checkbox" 
        [(ngModel)]="value.online"
        (change)="onChange(value)"
      />
      <span class="checkbox-text">
        <strong>Online (video/telehealth)</strong>
        <small>Available to clients across South Africa</small>
      </span>
    </label>
  </div>
  
  <div class="error-message" *ngIf="showError">
    Please select at least one session format
  </div>
</div>
```

### 4.4 Search Bar Component

**File:** `src/app/components/search-bar/search-bar.component.ts`

```typescript
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CitiesService } from '../../services/cities.service';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent implements OnInit {
  searchControl = new FormControl('');
  citySuggestions: any[] = [];
  recentSearches: any[] = [];
  showSuggestions = false;
  
  constructor(
    private router: Router,
    private citiesService: CitiesService
  ) {}
  
  ngOnInit() {
    // Load recent searches from localStorage
    this.loadRecentSearches();
    
    // Setup autocomplete
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(query => {
        if (query && query.length >= 2) {
          this.citiesService.searchCities(query).subscribe(results => {
            this.citySuggestions = results;
          });
        } else {
          this.citySuggestions = [];
        }
      });
  }
  
  selectCity(city: any) {
    this.saveRecentSearch({
      type: 'city',
      city: city.slug,
      display: city.fullName
    });
    
    this.router.navigate(['/search'], {
      queryParams: { city: city.slug }
    });
    
    this.showSuggestions = false;
  }
  
  searchOnline() {
    this.saveRecentSearch({
      type: 'online',
      display: 'Online therapists (nationwide)'
    });
    
    this.router.navigate(['/search'], {
      queryParams: { online: 'true' }
    });
  }
  
  useCurrentLocation() {
    // Request geolocation
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          this.router.navigate(['/search'], {
            queryParams: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          });
        },
        error => {
          console.error('Geolocation error:', error);
          alert('Unable to get your location. Please search manually.');
        }
      );
    }
  }
  
  onSearch() {
    const query = this.searchControl.value;
    if (query) {
      this.router.navigate(['/search'], {
        queryParams: { q: query }
      });
    }
  }
  
  selectSearch(search: any) {
    if (search.type === 'city') {
      this.router.navigate(['/search'], {
        queryParams: { city: search.city }
      });
    } else if (search.type === 'online') {
      this.searchOnline();
    }
    this.showSuggestions = false;
  }
  
  loadRecentSearches() {
    const stored = localStorage.getItem('recentSearches');
    this.recentSearches = stored ? JSON.parse(stored) : [];
  }
  
  saveRecentSearch(search: any) {
    // Remove duplicates
    this.recentSearches = this.recentSearches.filter(
      s => s.display !== search.display
    );
    
    // Add to front
    this.recentSearches.unshift(search);
    
    // Keep only last 5
    this.recentSearches = this.recentSearches.slice(0, 5);
    
    // Save to localStorage
    localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
  }
}
```

**Template:** `src/app/components/search-bar/search-bar.component.html`

```html
<div class="search-bar">
  <div class="search-input-wrapper">
    <input
      type="text"
      [formControl]="searchControl"
      placeholder="Find therapists in..."
      class="search-input"
      (focus)="showSuggestions = true"
    />
    <button class="search-button" (click)="onSearch()">
      <i class="icon-search"></i>
    </button>
  </div>
  
  <!-- Quick Filters -->
  <div class="quick-filters">
    <button 
      class="filter-chip"
      (click)="searchOnline()"
    >
      🌐 Online therapists
    </button>
    <button 
      class="filter-chip"
      (click)="useCurrentLocation()"
    >
      📍 Near me
    </button>
  </div>
  
  <!-- Autocomplete Suggestions -->
  <div 
    class="search-suggestions" 
    *ngIf="showSuggestions && (citySuggestions.length > 0 || recentSearches.length > 0)"
  >
    <!-- Recent Searches -->
    <div class="suggestion-group" *ngIf="recentSearches.length > 0">
      <div class="suggestion-header">Recent searches</div>
      <div 
        class="suggestion-item recent"
        *ngFor="let search of recentSearches"
        (click)="selectSearch(search)"
      >
        <i class="icon-history"></i>
        {{ search.display }}
      </div>
    </div>
    
    <!-- City Suggestions -->
    <div class="suggestion-group" *ngIf="citySuggestions.length > 0">
      <div class="suggestion-header">Cities & towns</div>
      <div 
        class="suggestion-item"
        *ngFor="let city of citySuggestions"
        (click)="selectCity(city)"
      >
        <i class="icon-location"></i>
        <strong>{{ city.name }}</strong>
        <span class="province">{{ city.provinceDisplay }}</span>
      </div>
    </div>
  </div>
</div>
```

---

## 5. Data Migration Script

**File:** `scripts/migrate-provider-locations.ts`

This script migrates existing provider location data to the new structure.

```typescript
import mongoose from 'mongoose';
import Provider from '../models/provider.model';
import citiesData from '../data/south-africa-cities.json';

async function migrateLocations() {
  await mongoose.connect(process.env.MONGODB_URI!);
  
  console.log('Starting location migration...');
  
  const providers = await Provider.find({});
  
  for (const provider of providers) {
    try {
      // Skip if already migrated
      if (provider.location?.type) {
        console.log(`Skipping ${provider.name} - already migrated`);
        continue;
      }
      
      // Get old location field (assuming it exists as 'region' or similar)
      const oldLocation = provider.region || provider.location || '';
      
      let newLocation: any;
      
      // Parse old location
      if (oldLocation.toLowerCase().includes('online')) {
        // Online-only provider
        newLocation = {
          type: 'online-only',
          city: 'online',
          cityDisplay: 'Online Only',
          fullLocation: 'Online Only',
          shortLocation: 'Online',
          searchTerms: ['online', 'nationwide', 'virtual', 'teletherapy']
        };
      } else {
        // Physical location - attempt to parse
        const parsed = parseLocation(oldLocation);
        
        if (parsed) {
          newLocation = {
            type: 'physical',
            province: parsed.province,
            provinceDisplay: parsed.provinceDisplay,
            city: parsed.city,
            cityDisplay: parsed.cityDisplay,
            suburb: parsed.suburb,
            fullLocation: parsed.fullLocation,
            shortLocation: parsed.cityDisplay,
            searchTerms: [
              parsed.city,
              parsed.province,
              ...(parsed.cityAliases || [])
            ]
          };
        } else {
          console.warn(`Could not parse location for ${provider.name}: "${oldLocation}"`);
          // Skip or flag for manual review
          continue;
        }
      }
      
      // Update provider
      provider.location = newLocation;
      
      // Set session formats (default to both if unknown)
      if (!provider.sessionFormats) {
        provider.sessionFormats = {
          inPerson: newLocation.type === 'physical',
          online: true // Default to offering online
        };
      }
      
      await provider.save();
      console.log(`✓ Migrated ${provider.name}`);
      
    } catch (error) {
      console.error(`Error migrating ${provider.name}:`, error);
    }
  }
  
  console.log('Migration complete!');
  await mongoose.disconnect();
}

function parseLocation(locationString: string): any | null {
  // Normalize string
  const normalized = locationString.toLowerCase().trim();
  
  // Try to match against cities in database
  for (const city of citiesData.cities) {
    // Check city name
    if (normalized.includes(city.slug) || normalized.includes(city.name.toLowerCase())) {
      const province = citiesData.provinces.find(p => p.slug === city.province);
      
      return {
        city: city.slug,
        cityDisplay: city.displayName || city.name,
        cityAliases: city.aliases || [],
        province: city.province,
        provinceDisplay: province?.name,
        suburb: extractSuburb(normalized, city),
        fullLocation: `${city.displayName || city.name}, ${province?.name}`
      };
    }
    
    // Check aliases
    if (city.aliases) {
      for (const alias of city.aliases) {
        if (normalized.includes(alias)) {
          const province = citiesData.provinces.find(p => p.slug === city.province);
          
          return {
            city: city.slug,
            cityDisplay: city.displayName || city.name,
            cityAliases: city.aliases,
            province: city.province,
            provinceDisplay: province?.name,
            suburb: extractSuburb(normalized, city),
            fullLocation: `${city.displayName || city.name}, ${province?.name}`
          };
        }
      }
    }
  }
  
  return null;
}

function extractSuburb(locationString: string, city: any): string | undefined {
  if (!city.suburbs) return undefined;
  
  for (const suburb of city.suburbs) {
    if (locationString.includes(suburb.toLowerCase())) {
      return suburb;
    }
  }
  
  return undefined;
}

// Run migration
migrateLocations().catch(console.error);
```

**Add to package.json:**

```json
{
  "scripts": {
    "migrate:locations": "ts-node scripts/migrate-provider-locations.ts"
  }
}
```

---

## 6. Testing Checklist

### Backend Tests

- [ ] City autocomplete returns correct results for "stel" → Stellenbosch
- [ ] City autocomplete handles aliases ("nelspruit" → Mbombela)
- [ ] Province endpoint returns all 9 provinces
- [ ] Provider search by city returns local + online providers
- [ ] Provider search by province works
- [ ] Online-only filter works correctly
- [ ] In-person filter works correctly
- [ ] Hybrid providers appear in both search types
- [ ] Search sorting: local first, hybrid second, online-only last

### Frontend Tests

- [ ] Location input validates (requires either online-only or physical)
- [ ] Session formats requires at least one option selected
- [ ] Autocomplete dropdown appears when typing
- [ ] Autocomplete works for "stel" → "Stellenbosch"
- [ ] Autocomplete works for aliases: "nelspruit" → "Mbombela (Nelspruit)"
- [ ] Selecting city auto-populates province if not set
- [ ] Form submission sends correct data structure
- [ ] Location display shows correctly formatted address
- [ ] Recent searches persist in localStorage
- [ ] "Near me" button requests geolocation
- [ ] Search bar navigates to search results page with correct params

### Migration Tests

- [ ] Run migration script on test database
- [ ] Verify all providers have location.type field
- [ ] Check online-only providers set correctly
- [ ] Verify city parsing worked for major cities (JHB, CPT, etc.)
- [ ] Verify edge cases handled (Stellenbosch, Nelspruit, etc.)
- [ ] Flag any providers needing manual review
- [ ] Verify searchTerms arrays populated correctly

### Integration Tests

- [ ] Provider can onboard with new location fields
- [ ] Client can search and find providers
- [ ] Provider profiles display location correctly
- [ ] Search results show appropriate distance/availability info
- [ ] Mobile responsive (all components)

---

## 7. Deployment Steps

### Pre-Deployment

1. **Backup Database:**
   ```bash
   mongodump --uri="mongodb://..." --out=backup-$(date +%Y%m%d)
   ```

2. **Test Migration on Staging:**
   ```bash
   # On staging environment
   npm run migrate:locations
   # Verify results
   ```

### Deployment Sequence

**Step 1: Deploy Backend**
1. Upload `south-africa-cities.json` to server
2. Deploy updated provider model/schema
3. Deploy cities routes
4. Deploy updated provider search routes
5. Add database indexes
6. Restart backend server

**Step 2: Run Migration**
```bash
# On production
npm run migrate:locations
# Monitor logs for errors
# Flag providers needing manual review
```

**Step 3: Deploy Frontend**
1. Deploy Angular components (location-input, session-formats-input, search-bar)
2. Deploy cities service
3. Update provider profile form
4. Update search interface
5. Build and deploy Angular app

**Step 4: Notify Existing Providers**

Email template:

```
Subject: Update Your Practice Location - findtherapy.care

Hi [Provider Name],

We've upgraded how location works on findtherapy.care to make it easier 
for clients to find you.

Please verify your location settings:
1. Log in to your dashboard
2. Go to Profile Settings
3. Confirm your location and session format

This takes 2 minutes and ensures clients can find you accurately.

[Update Profile Button]

Thank you for being a valued member!

The findtherapy.care Team
```

**Step 5: Monitor**
- Check error logs for migration issues
- Monitor search queries for missing cities
- Track provider profile completion rates
- Watch for support tickets related to location

---

## 8. Future Enhancements

### Phase 2 (Post-Launch)
- Distance-based search ("within 10km of me")
- Map view of providers
- Multiple office locations per provider
- Service area radius selector for mobile therapists

### Phase 3 (Long-term)
- Automated geocoding (get lat/lng from addresses)
- "Nearby cities" suggestions on search
- Travel radius for providers who visit clients
- Integration with Google Maps API
- Real-time availability indicators

---

## 9. File Structure Summary

```
findtherapy.care/
├── backend/
│   ├── data/
│   │   └── south-africa-cities.json          [NEW]
│   ├── models/
│   │   └── provider.model.ts                  [UPDATE]
│   ├── routes/
│   │   ├── cities.routes.ts                   [NEW]
│   │   └── providers.routes.ts                [UPDATE]
│   └── scripts/
│       └── migrate-provider-locations.ts      [NEW]
│
├── frontend/src/app/
│   ├── components/
│   │   ├── location-input/
│   │   │   ├── location-input.component.ts    [NEW]
│   │   │   ├── location-input.component.html  [NEW]
│   │   │   └── location-input.component.scss  [NEW]
│   │   ├── session-formats-input/
│   │   │   ├── session-formats-input.component.ts    [NEW]
│   │   │   ├── session-formats-input.component.html  [NEW]
│   │   │   └── session-formats-input.component.scss  [NEW]
│   │   └── search-bar/
│   │       ├── search-bar.component.ts        [UPDATE]
│   │       ├── search-bar.component.html      [UPDATE]
│   │       └── search-bar.component.scss      [UPDATE]
│   └── services/
│       └── cities.service.ts                  [NEW]
│
└── package.json                               [UPDATE - add migration script]
```

---

## 10. Key Technical Decisions

### Why Province + City (Not Free Text)?
- **Standardization:** Prevents "JHB" vs "Johannesburg" vs "Jhb" 
- **Searchability:** Clean data enables accurate filtering
- **Scalability:** Easy to add new cities without data cleanup
- **Autocomplete:** Fuzzy matching works better with structured data

### Why Session Formats Separate from Location?
- **Flexibility:** Provider can be in Stellenbosch but serve online nationwide
- **Search Logic:** Enables "online-only" vs "in-person" vs "hybrid" filtering
- **User Experience:** Clear to clients what's available

### Why Store Both Slug and Display Name?
- **Slug:** URL-friendly, consistent (`stellenbosch`, `mbombela`)
- **Display Name:** User-friendly, handles special cases ("Mbombela (Nelspruit)")
- **Search:** Use slugs internally, show display names to users

### Why Pre-save Hooks for Computed Fields?
- **Consistency:** `fullLocation` and `searchTerms` always up-to-date
- **Performance:** No need to compute on every search
- **Data Integrity:** Single source of truth (location object)

---

## 11. Common Issues & Solutions

### Issue: "City not found in autocomplete"
**Solution:** Add city to `south-africa-cities.json` with proper province and slug

### Issue: "Provider location not migrating correctly"
**Solution:** Check original location string format, update `parseLocation()` logic

### Issue: "Search returns no results for valid city"
**Solution:** Verify database indexes are created, check query logic in search route

### Issue: "Autocomplete too slow"
**Solution:** Implement client-side caching of cities data, reduce debounce time

### Issue: "Mobile keyboard covers autocomplete dropdown"
**Solution:** Add scroll-into-view logic, adjust dropdown positioning CSS

---

## 12. Contact & Support

**Project Owner:** Barratt (Machinum.io)  
**Platform:** findtherapy.care  
**Tech Stack:** Angular 21, Node.js/Express, MongoDB  

**Questions during build:**
- Check this document first
- Review existing codebase for patterns
- Flag ambiguities for clarification

---

## Appendix A: south-africa-cities.json

See attached file: `south-africa-cities.json`

This file contains:
- 9 provinces with slugs and codes
- 50+ cities including metros and secondary cities
- City aliases for search matching
- Suburb lists for major metros
- Coordinates for future geo features
- Display names for proper formatting

---

## Appendix B: Example API Responses

### City Search Response
```json
{
  "results": [
    {
      "name": "Stellenbosch",
      "slug": "stellenbosch",
      "province": "western-cape",
      "provinceDisplay": "Western Cape",
      "fullName": "Stellenbosch, Western Cape",
      "suburbs": [],
      "isMetro": false
    }
  ]
}
```

### Provider Search Response
```json
{
  "providers": [
    {
      "name": "Dr. Sarah Thompson",
      "qualifications": "Clinical Psychologist",
      "location": {
        "type": "physical",
        "cityDisplay": "Stellenbosch",
        "provinceDisplay": "Western Cape",
        "fullLocation": "Stellenbosch, Western Cape"
      },
      "sessionFormats": {
        "inPerson": true,
        "online": true
      }
    }
  ],
  "count": 1,
  "filters": {
    "city": "stellenbosch"
  }
}
```

---

**End of Build Guide**

**Version:** 1.0  
**Last Updated:** March 2026  
**Status:** Ready for Implementation
