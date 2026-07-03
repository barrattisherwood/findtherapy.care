import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FeatureFlagService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/feature-flags/mine`;

  private flagsCache: Record<string, boolean> | null = null;
  private loading$: Observable<Record<string, boolean>> | null = null;

  private ensureLoaded(): Observable<Record<string, boolean>> {
    if (this.flagsCache !== null) {
      return of(this.flagsCache);
    }
    if (!this.loading$) {
      this.loading$ = this.http
        .get<{ flags: Record<string, boolean> }>(this.apiUrl)
        .pipe(
          map(r => r.flags),
          catchError(() => of({} as Record<string, boolean>)),
          tap(flags => {
            this.flagsCache = flags;
            this.loading$ = null;
          }),
          shareReplay(1)
        );
    }
    return this.loading$;
  }

  isEnabled$(key: string): Observable<boolean> {
    return this.ensureLoaded().pipe(map(flags => flags[key] ?? false));
  }

  refresh(): void {
    this.flagsCache = null;
    this.loading$ = null;
  }
}
