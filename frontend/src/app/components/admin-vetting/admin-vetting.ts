import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AdminService, PendingProvider, PendingProviderDocument } from '../../services/admin.service';
import { ToastService } from '../../services/toast';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-admin-vetting',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar, Footer],
  templateUrl: './admin-vetting.html',
  styleUrl: './admin-vetting.scss'
})
export class AdminVetting implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private sanitizer = inject(DomSanitizer);

  providers = signal<PendingProvider[]>([]);
  loading = signal(true);
  total = signal(0);
  page = signal(1);
  totalPages = signal(1);

  statusFilter = signal<string>('pending');
  statusOptions = ['unverified', 'pending', 'approved', 'rejected'];
  expandedDocumentsId = signal<string | null>(null);

  // Track which provider has the notes input open
  activeNotesId = signal<string | null>(null);
  vetNotes = signal('');

  // Document viewer modal
  viewerSafeUrl = signal<SafeResourceUrl | null>(null);
  viewerFileName = signal<string>('');
  viewerFileType = signal<string>('');
  private viewerObjectUrl: string | null = null;

  ngOnInit(): void {
    this.loadProviders();
  }

  loadProviders(): void {
    this.loading.set(true);
    this.adminService.getVettingProviders(this.statusFilter(), this.page()).subscribe({
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

  onStatusFilterChange(status: string): void {
    this.statusFilter.set(status);
    this.page.set(1);
    this.loadProviders();
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    this.loadProviders();
  }

  approve(provider: PendingProvider): void {
    this.adminService.vetProvider(provider.id, { status: 'approved' }).subscribe({
      next: () => {
        this.toast.success('Approved', `${provider.displayName} has been approved.`);
        this.loadProviders();
        this.adminService.getPendingCount().subscribe();
      },
      error: (err) => {
        this.toast.error('Error', err.error?.message || 'Failed to approve provider');
      }
    });
  }

  openRejectNotes(providerId: string): void {
    this.activeNotesId.set(providerId);
    this.vetNotes.set('');
  }

  cancelReject(): void {
    this.activeNotesId.set(null);
    this.vetNotes.set('');
  }

  confirmReject(provider: PendingProvider): void {
    this.adminService.vetProvider(provider.id, {
      status: 'rejected',
      notes: this.vetNotes() || undefined,
    }).subscribe({
      next: () => {
        this.toast.success('Rejected', `${provider.displayName} has been rejected.`);
        this.activeNotesId.set(null);
        this.vetNotes.set('');
        this.loadProviders();
        this.adminService.getPendingCount().subscribe();
      },
      error: (err) => {
        this.toast.error('Error', err.error?.message || 'Failed to reject provider');
      }
    });
  }

  formatProviderType(type: string): string {
    return type.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  toggleDocuments(providerId: string): void {
    this.expandedDocumentsId.set(
      this.expandedDocumentsId() === providerId ? null : providerId
    );
  }

  formatDocumentType(type: string): string {
    const labels: Record<string, string> = {
      hpcsa_registration: 'HPCSA Registration',
      aschp_registration: 'ASCHP Registration',
      qualification: 'Qualification',
      other: 'Other',
    };
    return labels[type] ?? type;
  }

  viewDocument(doc: { id: string; fileName: string; fileType: string }): void {
    this.adminService.getDocumentBlob(doc.id).subscribe({
      next: (blob) => {
        if (this.viewerObjectUrl) {
          URL.revokeObjectURL(this.viewerObjectUrl);
        }
        this.viewerObjectUrl = URL.createObjectURL(blob);
        this.viewerSafeUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.viewerObjectUrl));
        this.viewerFileName.set(doc.fileName);
        this.viewerFileType.set(doc.fileType);
      },
      error: () => this.toast.error('Error', 'Could not retrieve document'),
    });
  }

  closeViewer(): void {
    this.viewerSafeUrl.set(null);
    this.viewerFileName.set('');
    this.viewerFileType.set('');
    if (this.viewerObjectUrl) {
      URL.revokeObjectURL(this.viewerObjectUrl);
      this.viewerObjectUrl = null;
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
