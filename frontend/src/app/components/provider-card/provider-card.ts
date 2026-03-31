import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Provider, ProviderType } from '@findlocal/shared';

@Component({
  selector: 'app-provider-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './provider-card.html',
  styleUrl: './provider-card.scss'
})
export class ProviderCard {
  @Input({ required: true }) provider!: Provider;

  get providerTypeLabel(): string {
    const labels: Record<ProviderType, string> = {
      'psychologist': 'Psychologist',
      'counsellor': 'Counsellor',
      'social-worker': 'Social Worker',
      'coach': 'Coach',
      'psychometrist': 'Psychometrist',
    };
    return labels[this.provider.type] || this.provider.type;
  }

  get locationDisplay(): string {
    const loc = this.provider.location;
    return loc?.shortLocation ?? loc?.cityDisplay ?? '';
  }

  getLowestRate(): number | null {
    const rates = [
      this.provider.pricing.individualCounsellingRate,
      this.provider.pricing.couplesCounsellingRate,
      this.provider.pricing.familyCounsellingRate,
      this.provider.pricing.onlineCounsellingRate,
    ].filter(r => r !== undefined && r !== null) as number[];

    return rates.length > 0 ? Math.min(...rates) : null;
  }
}
