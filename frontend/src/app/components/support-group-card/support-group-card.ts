import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupportGroup } from '@findlocal/shared';

@Component({
  selector: 'app-support-group-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './support-group-card.html',
  styleUrl: './support-group-card.scss'
})
export class SupportGroupCard {
  @Input({ required: true }) supportGroup!: SupportGroup;

  get meetingTypeLabel(): string {
    switch (this.supportGroup.meetingType) {
      case 'in-person':
        return 'In Person';
      case 'online':
        return 'Online';
      case 'hybrid':
        return 'Hybrid';
      default:
        return this.supportGroup.meetingType;
    }
  }

  get meetingTypeColor(): string {
    switch (this.supportGroup.meetingType) {
      case 'in-person':
        return 'bg-green-100 text-green-800';
      case 'online':
        return 'bg-blue-100 text-blue-800';
      case 'hybrid':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  get locationDisplay(): string {
    if (!this.supportGroup.location) return '';
    return this.supportGroup.location.city;
  }
}
