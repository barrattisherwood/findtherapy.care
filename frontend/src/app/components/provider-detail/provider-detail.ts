import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProviderService } from '../../services/provider.service';
import { Navbar } from '../navbar/navbar';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton';
import { Provider } from '@findlocal/shared';

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar, LoadingSkeleton],
  templateUrl: './provider-detail.html',
  styleUrl: './provider-detail.scss'
})
export class ProviderDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private providerService = inject(ProviderService);

  provider = signal<Provider | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProvider(id);
    }
  }

  private loadProvider(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.providerService.getById(id).subscribe({
      next: (response) => {
        this.provider.set(response.provider);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load provider');
        this.loading.set(false);
      }
    });
  }

  get providerTypeLabel(): string {
    return this.provider()?.type === 'therapist' ? 'Therapist' : 'Counsellor';
  }

  get locationDisplay(): string {
    const p = this.provider();
    if (!p) return '';
    const parts = [p.location.address, p.location.city, p.location.postcode].filter(Boolean);
    return parts.join(', ');
  }
}
