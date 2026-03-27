import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { AdminService, AdminLog } from '../../services/admin.service';
import { ToastService } from '../../services/toast';

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar, Footer],
  templateUrl: './admin-logs.html',
})
export class AdminLogs implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  logs = signal<AdminLog[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  totalPages = signal(1);
  actionFilter = signal('');

  readonly actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'vet_provider', label: 'Provider Vetted' },
    { value: 'suspend_provider', label: 'Provider Suspended' },
    { value: 'unsuspend_provider', label: 'Provider Unsuspended' },
    { value: 'delete_provider', label: 'Provider Deleted' },
    { value: 'mark_message_read', label: 'Message Read' },
  ];

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.adminService.getAdminLogs(this.page(), this.actionFilter()).subscribe({
      next: (res) => {
        this.logs.set(res.logs);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Error', err.error?.message || 'Failed to load logs');
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadLogs();
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadLogs();
  }

  getBadgeClasses(log: AdminLog): string {
    switch (log.action) {
      case 'vet_provider':
        return log.details?.['vettingStatus'] === 'approved'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800';
      case 'suspend_provider':
        return 'bg-orange-100 text-orange-800';
      case 'unsuspend_provider':
        return 'bg-blue-100 text-blue-800';
      case 'delete_provider':
        return 'bg-red-100 text-red-800';
      case 'set_founder':
        return 'bg-amber-100 text-amber-800';
      case 'remove_founder':
        return 'bg-gray-100 text-gray-700';
      case 'mark_message_read':
        return 'bg-gray-100 text-gray-700';
    }
  }

  getBadgeLabel(log: AdminLog): string {
    switch (log.action) {
      case 'vet_provider':
        return log.details?.['vettingStatus'] === 'approved' ? 'Approved' : 'Rejected';
      case 'suspend_provider': return 'Suspended';
      case 'unsuspend_provider': return 'Unsuspended';
      case 'delete_provider': return 'Deleted';
      case 'set_founder': return 'Founder';
      case 'remove_founder': return 'Unfounder';
      case 'mark_message_read': return 'Message read';
    }
  }

  getDetailsSummary(log: AdminLog): string {
    if (!log.details) return '';
    if (log.action === 'vet_provider' && log.details['vettingNotes']) {
      return `Notes: ${log.details['vettingNotes']}`;
    }
    if (log.action === 'suspend_provider' && log.details['reason']) {
      return `Reason: ${log.details['reason']}`;
    }
    return '';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
