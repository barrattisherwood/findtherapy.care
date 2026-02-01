import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupportGroupService } from '../../services/support-group.service';
import { SeoService } from '../../services/seo.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton';
import { SupportGroup } from '@findlocal/shared';

@Component({
  selector: 'app-support-group-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar, Footer, LoadingSkeleton],
  templateUrl: './support-group-detail.html',
  styleUrl: './support-group-detail.scss'
})
export class SupportGroupDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private supportGroupService = inject(SupportGroupService);
  private seo = inject(SeoService);

  supportGroup = signal<SupportGroup | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadSupportGroup(id);
    }
  }

  private loadSupportGroup(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.supportGroupService.getById(id).subscribe({
      next: (response) => {
        this.supportGroup.set(response.supportGroup);
        this.loading.set(false);
        const g = response.supportGroup;
        const location = g.location?.city ? ` in ${g.location.city}` : '';
        this.seo.update({
          title: `${g.name} — Support Group${location}`,
          description: `${g.name} is a ${g.category.toLowerCase()} support group${location}. ${g.description.slice(0, 120)}`,
          url: `/support-groups/${g.id}`,
        });
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load support group');
        this.loading.set(false);
      }
    });
  }

  get meetingTypeLabel(): string {
    switch (this.supportGroup()?.meetingType) {
      case 'in-person':
        return 'In Person';
      case 'online':
        return 'Online';
      case 'hybrid':
        return 'Hybrid';
      default:
        return '';
    }
  }

  get locationDisplay(): string {
    const g = this.supportGroup();
    if (!g?.location) return '';
    const parts = [g.location.address, g.location.city, g.location.postcode].filter(Boolean);
    return parts.join(', ');
  }
}
