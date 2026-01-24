import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Provider } from '@findlocal/shared';

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
    return this.provider.type === 'therapist' ? 'Therapist' : 'Counsellor';
  }

  get locationDisplay(): string {
    return `${this.provider.location.city}, ${this.provider.location.postcode}`;
  }
}
