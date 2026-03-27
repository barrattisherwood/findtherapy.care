import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService, AdminProvider } from '../../services/admin.service';
import { ToastService } from '../../services/toast';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-admin-providers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar, Footer],
  templateUrl: './admin-providers.html',
  styleUrl: './admin-providers.scss'
})
export class AdminProviders implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  providers = signal<AdminProvider[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  totalPages = signal(1);

  // Filters
  searchQuery = signal('');
  typeFilter = signal('');
  vettingFilter = signal('');
  statusFilter = signal('');
  sortBy = signal('createdAt');
  sortDir = signal<'asc' | 'desc'>('desc');

  // Confirm delete modal
  deleteConfirmId = signal<string | null>(null);
  deleteConfirmName = signal('');

  // Suspend modal
  suspendId = signal<string | null>(null);
  suspendName = signal('');
  suspendReason = signal('');
  suspendAction = signal<'suspend' | 'unsuspend'>('suspend');

  typeOptions = [
    { value: '', label: 'All Types' },
    { value: 'psychologist', label: 'Psychologist' },
    { value: 'counsellor', label: 'Counsellor' },
    { value: 'social-worker', label: 'Social Worker' },
    { value: 'coach', label: 'Coach' },
    { value: 'psychometrist', label: 'Psychometrist' },
  ];

  vettingOptions = [
    { value: '', label: 'All Vetting' },
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'published', label: 'Published' },
    { value: 'unpublished', label: 'Unpublished' },
    { value: 'suspended', label: 'Suspended' },
  ];

  ngOnInit(): void {
    this.loadProviders();
  }

  loadProviders(): void {
    this.loading.set(true);
    this.adminService.getAllProviders({
      page: this.page(),
      search: this.searchQuery() || undefined,
      type: this.typeFilter() || undefined,
      vetting: this.vettingFilter() || undefined,
      status: this.statusFilter() || undefined,
      sortBy: this.sortBy(),
      sortDir: this.sortDir(),
    }).subscribe({
      next: (response) => {
        this.providers.set(response.providers);
        this.total.set(response.total);
        this.page.set(response.page);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Error', err.error?.message || 'Failed to load providers');
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.page.set(1);
    this.loadProviders();
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadProviders();
  }

  onSort(field: string): void {
    if (this.sortBy() === field) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortDir.set('asc');
    }
    this.loadProviders();
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadProviders();
  }

  // Suspend / unsuspend
  openSuspend(provider: AdminProvider): void {
    this.suspendId.set(provider.id);
    this.suspendName.set(provider.displayName);
    this.suspendReason.set('');
    this.suspendAction.set(provider.isSuspended ? 'unsuspend' : 'suspend');
  }

  cancelSuspend(): void {
    this.suspendId.set(null);
  }

  confirmSuspend(): void {
    const id = this.suspendId();
    if (!id) return;

    const isSuspending = this.suspendAction() === 'suspend';
    this.adminService.suspendProvider(id, isSuspending, this.suspendReason() || undefined).subscribe({
      next: () => {
        this.toast.success(
          isSuspending ? 'Suspended' : 'Unsuspended',
          `${this.suspendName()} has been ${isSuspending ? 'suspended' : 'unsuspended'}.`
        );
        this.suspendId.set(null);
        this.loadProviders();
      },
      error: (err) => {
        this.toast.error('Error', err.error?.message || 'Failed to update provider');
      }
    });
  }

  // Delete
  openDelete(provider: AdminProvider): void {
    this.deleteConfirmId.set(provider.id);
    this.deleteConfirmName.set(provider.displayName);
  }

  cancelDelete(): void {
    this.deleteConfirmId.set(null);
  }

  confirmDelete(): void {
    const id = this.deleteConfirmId();
    if (!id) return;

    this.adminService.deleteProvider(id).subscribe({
      next: () => {
        this.toast.success('Deleted', `${this.deleteConfirmName()} has been deleted.`);
        this.deleteConfirmId.set(null);
        this.loadProviders();
      },
      error: (err) => {
        this.toast.error('Error', err.error?.message || 'Failed to delete provider');
      }
    });
  }

  toggleFounder(provider: AdminProvider): void {
    const newStatus = !provider.isFounder;
    this.adminService.setFounderStatus(provider.id, newStatus).subscribe({
      next: () => {
        this.toast.success(
          newStatus ? 'Founder Added' : 'Founder Removed',
          `${provider.displayName} ${newStatus ? 'is now a founding supporter' : 'is no longer a founding supporter'}.`
        );
        this.loadProviders();
      },
      error: (err) => {
        this.toast.error('Error', err.error?.message || 'Failed to update founder status');
      }
    });
  }

  formatProviderType(type: string): string {
    return type.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  getAccessBadgeClass(status: string): string {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getVettingBadgeClass(status: string): string {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
