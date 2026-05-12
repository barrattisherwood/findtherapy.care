import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Landing } from './landing';
import { CitiesService, CityResult } from '../../services/cities.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({ selector: 'app-navbar', template: '', standalone: true })
class StubNavbar {}

@Component({ selector: 'app-footer', template: '', standalone: true })
class StubFooter {}

const capeTown: CityResult = {
  slug: 'cape-town',
  name: 'Cape Town',
  displayName: 'Cape Town',
  province: 'western-cape',
  provinceDisplay: 'Western Cape',
  fullName: 'Cape Town, Western Cape',
};

describe('Landing Component', () => {
  let component: Landing;
  let fixture: ComponentFixture<Landing>;
  let router: Router;
  let mockCitiesService: { searchCities: ReturnType<typeof vi.fn> };

  // 30s timeout — Angular template compilation is slow on the first run
  beforeEach(async () => {
    mockCitiesService = {
      searchCities: vi.fn().mockReturnValue(of([capeTown])),
    };

    await TestBed.configureTestingModule({
      imports: [Landing, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: CitiesService, useValue: mockCitiesService },
      ],
    })
      .overrideComponent(Landing, {
        remove: { imports: [Navbar, Footer] },
        add: { imports: [StubNavbar, StubFooter] },
      })
      .compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Landing);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }, 30000);

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  describe('initial state', () => {
    it('starts with an empty city input', () => {
      expect(component.heroCity).toBe('');
    });

    it('starts with no selected city', () => {
      expect(component.heroSelectedCity).toBeNull();
    });

    it('starts with no suggestions visible', () => {
      expect(component.heroShowSuggestions).toBe(false);
    });

    it('starts with empty suggestions list', () => {
      expect(component.heroCitySuggestions).toEqual([]);
    });

    it('starts with no specialty selected', () => {
      expect(component.heroSelectedSpecialty).toBe('');
    });

    it('has a populated specialties list', () => {
      expect(component.specialties.length).toBeGreaterThan(0);
    });

    it('derives trialMonths from shared TRIAL_PERIOD_DAYS', () => {
      expect(component.trialMonths).toBeGreaterThan(0);
    });
  });

  describe('onHeroCityChange', () => {
    it('updates heroCity', () => {
      component.onHeroCityChange('jo');
      expect(component.heroCity).toBe('jo');
    });

    it('clears heroSelectedCity when the user retypes', () => {
      component.heroSelectedCity = capeTown;
      component.onHeroCityChange('cape');
      expect(component.heroSelectedCity).toBeNull();
    });

    it('hides suggestions and clears list for query shorter than 2 chars', () => {
      component.heroShowSuggestions = true;
      component.heroCitySuggestions = [capeTown];
      component.onHeroCityChange('j');
      expect(component.heroShowSuggestions).toBe(false);
      expect(component.heroCitySuggestions).toEqual([]);
    });

    it('triggers city search after 300ms debounce for query >= 2 chars', () => {
      vi.useFakeTimers();
      component.onHeroCityChange('ca');
      vi.advanceTimersByTime(300);
      expect(mockCitiesService.searchCities).toHaveBeenCalledWith('ca');
      expect(component.heroCitySuggestions).toEqual([capeTown]);
      expect(component.heroShowSuggestions).toBe(true);
    });

    it('does not fire search before debounce delay elapses', () => {
      vi.useFakeTimers();
      component.onHeroCityChange('ca');
      vi.advanceTimersByTime(100);
      expect(mockCitiesService.searchCities).not.toHaveBeenCalled();
    });

    it('hides suggestions when search returns empty results', () => {
      vi.useFakeTimers();
      mockCitiesService.searchCities = vi.fn().mockReturnValue(of([]));
      component.onHeroCityChange('xyz');
      vi.advanceTimersByTime(300);
      expect(component.heroShowSuggestions).toBe(false);
      expect(component.heroCitySuggestions).toEqual([]);
    });
  });

  describe('selectHeroCity', () => {
    it('sets heroSelectedCity to the chosen city', () => {
      component.selectHeroCity(capeTown);
      expect(component.heroSelectedCity).toEqual(capeTown);
    });

    it('sets heroCity to displayName', () => {
      component.selectHeroCity(capeTown);
      expect(component.heroCity).toBe('Cape Town');
    });

    it('falls back to name when displayName is absent', () => {
      const { displayName, ...noDisplay } = capeTown;
      component.selectHeroCity(noDisplay as CityResult);
      expect(component.heroCity).toBe('Cape Town');
    });

    it('hides the suggestions dropdown', () => {
      component.heroShowSuggestions = true;
      component.selectHeroCity(capeTown);
      expect(component.heroShowSuggestions).toBe(false);
    });
  });

  describe('onHeroSearch', () => {
    it('navigates to /providers with no params when nothing is selected', () => {
      const spy = vi.spyOn(router, 'navigate');
      component.onHeroSearch();
      expect(spy).toHaveBeenCalledWith(['/providers'], { queryParams: {} });
    });

    it('includes city and cityName when a city is selected', () => {
      const spy = vi.spyOn(router, 'navigate');
      component.heroSelectedCity = capeTown;
      component.onHeroSearch();
      expect(spy).toHaveBeenCalledWith(['/providers'], {
        queryParams: { city: 'cape-town', cityName: 'Cape Town' },
      });
    });

    it('includes specialty when one is selected', () => {
      const spy = vi.spyOn(router, 'navigate');
      component.heroSelectedSpecialty = 'Anxiety & Stress';
      component.onHeroSearch();
      expect(spy).toHaveBeenCalledWith(['/providers'], {
        queryParams: { specialty: 'Anxiety & Stress' },
      });
    });

    it('includes city, cityName and specialty when both are selected', () => {
      const spy = vi.spyOn(router, 'navigate');
      component.heroSelectedCity = capeTown;
      component.heroSelectedSpecialty = 'Depression';
      component.onHeroSearch();
      expect(spy).toHaveBeenCalledWith(['/providers'], {
        queryParams: { city: 'cape-town', cityName: 'Cape Town', specialty: 'Depression' },
      });
    });

    it('uses name as cityName fallback when displayName is absent', () => {
      const spy = vi.spyOn(router, 'navigate');
      const { displayName, ...noDisplay } = capeTown;
      component.heroSelectedCity = noDisplay as CityResult;
      component.onHeroSearch();
      expect(spy).toHaveBeenCalledWith(['/providers'], {
        queryParams: { city: 'cape-town', cityName: 'Cape Town' },
      });
    });
  });
});
