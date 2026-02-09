import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { SupportGroup } from '@findlocal/shared';
import { SupportGroupService } from '../../services/support-group.service';

@Component({
  selector: 'app-support-group-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './support-group-card.html',
  styleUrl: './support-group-card.scss'
})
export class SupportGroupCard {
  private router = inject(Router);
  private supportGroupService = inject(SupportGroupService);

  @Input({ required: true }) supportGroup!: SupportGroup;
  @Input() isAdmin = false;
  @Output() deleted = new EventEmitter<string>();

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

  onEdit(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(['/support-groups', this.supportGroup.id, 'edit']);
  }

  onDelete(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!confirm(`Are you sure you want to delete "${this.supportGroup.name}"?`)) {
      return;
    }

    this.supportGroupService.delete(this.supportGroup.id).subscribe({
      next: () => {
        this.deleted.emit(this.supportGroup.id);
      },
      error: (error) => {
        alert(error.error?.message || 'Failed to delete support group');
      }
    });
  }
}
