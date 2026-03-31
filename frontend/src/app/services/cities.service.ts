import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SAProvince } from '@findlocal/shared';
import { environment } from '../../environments/environment';

export interface CityResult {
  slug: string;
  name: string;
  displayName?: string;
  province: string;
  provinceDisplay: string;
  fullName: string;
  isMetro?: boolean;
  suburbs?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CitiesService {
  private apiUrl = `${environment.apiUrl}/cities`;

  constructor(private http: HttpClient) {}

  getProvinces(): Observable<SAProvince[]> {
    return this.http.get<{ provinces: SAProvince[] }>(`${this.apiUrl}/provinces`).pipe(
      map(r => r.provinces),
      catchError(() => of([]))
    );
  }

  searchCities(query: string): Observable<CityResult[]> {
    if (!query || query.length < 2) return of([]);

    return this.http.get<{ results: CityResult[] }>(`${this.apiUrl}/search`, {
      params: { q: query }
    }).pipe(
      map(r => r.results ?? []),
      catchError(() => of([]))
    );
  }
}
