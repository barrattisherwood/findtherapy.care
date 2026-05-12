import { Component, Input, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Provider } from '@findlocal/shared';
import { ProviderList } from './provider-list';
import { ProviderService } from '../../services/provider.service';
import { SeoService } from '../../services/seo.service';
import { AnalyticsService } from '../../services/analytics.service';
import { CitiesService } from '../../services/cities.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { ProviderCard } from '../provider-card/provider-card';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class StubNavbar {}

@Component({ selector: 'app-footer', template: '', standalone: true })
class StubFooter {}

@Component({ selector: 'app-provider-card', template: '', standalone: true })
class StubProviderCard {
  @Input() provider: Provider | null = null;
}

@Component({ selector: 'app-loading-skeleton', template: '', standalone: true })
class StubLoadingSkeleton {}

function mockProviderService() {
  return {
    providers: signal<Provider[]>([]),
    loading: signal(false),
    totalProviders: signal(0),
    currentPage: signal(1),
    totalPages: signal(1),
    search: vi.fn().mockReturnValue(of({ providers: [], total: 0, page: 1, totalPages: 1 })),
  };
}

async function createComponent(
  queryParams: Record<string, string> = {},
  cityFilter?: string,
): Promise<{ component: ProviderList; fixture: ComponentFixture<ProviderList> }> {
  await TestBed.configureTestingModule({
    imports: [ProviderList, HttpClientTestingModule],
    providers: [
      provideRouter([]),
      { provide: ProviderService, useValue: mockProviderService() },
      { provide: SeoService, useValue: { update: vi.fn() } },
      { provide: AnalyticsService, useValue: { trackSearch: vi.fn() } },
      { provide: CitiesService, useValue: { searchCities: vi.fn().mockReturnValue(of([])) } },
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { queryParamMap: convertToParamMap(queryParams) } },
      },
    ],
  })
    .overrideComponent(ProviderList, {
      remove: { imports: [Navbar, Footer, ProviderCard, LoadingSkeleton] },
      add: { imports: [StubNavbar, StubFooter, StubProviderCard, StubLoadingSkeleton] },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(ProviderList);
  const component = fixture.componentInstance;
  if (cityFilter !== undefined) {
    component.cityFilter = cityFilter;
  }
  fixture.detectChanges();
  return { component, fixture };
}

describe('ProviderList Component — hero search query param pre-population', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('with no query params', () => {
    it('starts with no city selected', async () => {
      const { component } = await createComponent();
      expect(component.selectedCity()).toBe('');
      expect(component.cityQuery()).toBe('');
    });

    it('starts with no specialties selected', async () => {
      const { component } = await createComponent();
      expect(component.selectedSpecialties()).toEqual([]);
    });
  });

  describe('with city and cityName query params', () => {
    it('pre-selects the city slug', async () => {
      const { component } = await createComponent({ city: 'cape-town', cityName: 'Cape Town' });
      expect(component.selectedCity()).toBe('cape-town');
    });

    it('sets city display text from cityName param', async () => {
      const { component } = await createComponent({ city: 'cape-town', cityName: 'Cape Town' });
      expect(component.cityQuery()).toBe('Cape Town');
    });
  });

  describe('with city param but no cityName', () => {
    it('falls back to CITY_CONFIGS display name for known major cities', async () => {
      const { component } = await createComponent({ city: 'johannesburg' });
      expect(component.selectedCity()).toBe('johannesburg');
      expect(component.cityQuery()).toBeTruthy();
    });

    it('falls back to the slug itself for unknown cities', async () => {
      const { component } = await createComponent({ city: 'kleinmond' });
      expect(component.selectedCity()).toBe('kleinmond');
      expect(component.cityQuery()).toBe('kleinmond');
    });
  });

  describe('with a valid specialty query param', () => {
    it('pre-selects the specialty', async () => {
      const { component } = await createComponent({ specialty: 'Anxiety & Stress' });
      expect(component.selectedSpecialties()).toEqual(['Anxiety & Stress']);
    });
  });

  describe('with an invalid specialty query param', () => {
    it('ignores values not in PROVIDER_SPECIALTIES', async () => {
      const { component } = await createComponent({ specialty: 'Not A Real Specialty' });
      expect(component.selectedSpecialties()).toEqual([]);
    });
  });

  describe('with both city and specialty params', () => {
    it('pre-populates city and specialty together', async () => {
      const { component } = await createComponent({
        city: 'durban',
        cityName: 'Durban',
        specialty: 'Depression',
      });
      expect(component.selectedCity()).toBe('durban');
      expect(component.cityQuery()).toBe('Durban');
      expect(component.selectedSpecialties()).toEqual(['Depression']);
    });
  });

  describe('cityFilter Input takes precedence over query params', () => {
    it('uses cityFilter when both cityFilter and city query param are present', async () => {
      const { component } = await createComponent(
        { city: 'cape-town', cityName: 'Cape Town' },
        'johannesburg',
      );
      expect(component.selectedCity()).toBe('johannesburg');
    });

    it('does not apply city query param when cityFilter is set', async () => {
      const { component } = await createComponent(
        { city: 'cape-town', cityName: 'Cape Town' },
        'johannesburg',
      );
      expect(component.cityQuery()).not.toBe('Cape Town');
    });
  });

  describe('search is called on init', () => {
    it('calls providerService.search during ngOnInit', async () => {
      await TestBed.configureTestingModule({
        imports: [ProviderList, HttpClientTestingModule],
        providers: [
          provideRouter([]),
          { provide: ProviderService, useValue: mockProviderService() },
          { provide: SeoService, useValue: { update: vi.fn() } },
          { provide: AnalyticsService, useValue: { trackSearch: vi.fn() } },
          { provide: CitiesService, useValue: { searchCities: vi.fn().mockReturnValue(of([])) } },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
          },
        ],
      })
        .overrideComponent(ProviderList, {
          remove: { imports: [Navbar, Footer, ProviderCard, LoadingSkeleton] },
          add: { imports: [StubNavbar, StubFooter, StubProviderCard, StubLoadingSkeleton] },
        })
        .compileComponents();

      const mockService = TestBed.inject(ProviderService) as any;
      const fixture = TestBed.createComponent(ProviderList);
      fixture.detectChanges();

      expect(mockService.search).toHaveBeenCalled();
    });

    it('passes pre-populated city to the first search call', async () => {
      await TestBed.configureTestingModule({
        imports: [ProviderList, HttpClientTestingModule],
        providers: [
          provideRouter([]),
          { provide: ProviderService, useValue: mockProviderService() },
          { provide: SeoService, useValue: { update: vi.fn() } },
          { provide: AnalyticsService, useValue: { trackSearch: vi.fn() } },
          { provide: CitiesService, useValue: { searchCities: vi.fn().mockReturnValue(of([])) } },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                queryParamMap: convertToParamMap({ city: 'pretoria', cityName: 'Pretoria' }),
              },
            },
          },
        ],
      })
        .overrideComponent(ProviderList, {
          remove: { imports: [Navbar, Footer, ProviderCard, LoadingSkeleton] },
          add: { imports: [StubNavbar, StubFooter, StubProviderCard, StubLoadingSkeleton] },
        })
        .compileComponents();

      const mockService = TestBed.inject(ProviderService) as any;
      const fixture = TestBed.createComponent(ProviderList);
      fixture.detectChanges();

      expect(mockService.search).toHaveBeenCalledWith(
        expect.objectContaining({ city: 'pretoria' }),
      );
    });
  });
});
