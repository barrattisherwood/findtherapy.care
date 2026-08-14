import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProviderDocumentService } from '../../services/provider-document.service';
import { ToastService } from '../../services/toast';
import { ProviderDocumentType, ProviderDocumentSummary } from '@findlocal/shared';

const DOCUMENT_TYPE_LABELS: Record<ProviderDocumentType, string> = {
  hpcsa_registration: 'HPCSA Registration',
  aschp_registration: 'ASCHP Registration',
  qualification: 'Qualification / Degree',
  other: 'Other',
};

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_MB = 10;

@Component({
  selector: 'app-provider-verification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './provider-verification.html',
  styleUrl: './provider-verification.scss',
})
export class ProviderVerification implements OnInit {
  private docService = inject(ProviderDocumentService);
  private toast = inject(ToastService);

  status = this.docService.status;
  loading = this.docService.loading;
  uploading = this.docService.uploading;

  selectedDocumentType = signal<ProviderDocumentType>('hpcsa_registration');
  selectedFile = signal<File | null>(null);
  fileError = signal<string>('');

  documentTypeOptions: { value: ProviderDocumentType; label: string }[] = [
    { value: 'hpcsa_registration', label: DOCUMENT_TYPE_LABELS.hpcsa_registration },
    { value: 'aschp_registration', label: DOCUMENT_TYPE_LABELS.aschp_registration },
    { value: 'qualification', label: DOCUMENT_TYPE_LABELS.qualification },
    { value: 'other', label: DOCUMENT_TYPE_LABELS.other },
  ];

  ngOnInit(): void {
    this.docService.loadStatus().subscribe();
  }

  get statusLabel(): string {
    const s = this.status()?.vettingStatus;
    if (s === 'unverified') return 'Not yet verified';
    if (s === 'pending') return 'Under review';
    if (s === 'approved') return 'Verified';
    if (s === 'rejected') return 'Action required';
    return '';
  }

  get statusColor(): string {
    const s = this.status()?.vettingStatus;
    if (s === 'approved') return 'green';
    if (s === 'rejected') return 'red';
    if (s === 'pending') return 'yellow';
    return 'gray';
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.fileError.set('Only PDF, JPG, and PNG files are accepted.');
      this.selectedFile.set(null);
      input.value = '';
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      this.fileError.set(`File must be under ${MAX_SIZE_MB}MB.`);
      this.selectedFile.set(null);
      input.value = '';
      return;
    }

    this.fileError.set('');
    this.selectedFile.set(file);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file) {
      this.fileError.set('Please select a file to upload.');
      return;
    }

    this.docService.upload(file, this.selectedDocumentType()).subscribe({
      next: () => {
        this.toast.success('Uploaded', 'Document submitted for review.');
        this.selectedFile.set(null);
        this.fileError.set('');
      },
      error: (err) => {
        this.toast.error('Upload failed', err.error?.message || 'Please try again.');
      },
    });
  }

  formatDocumentType(type: ProviderDocumentType): string {
    return DOCUMENT_TYPE_LABELS[type] ?? type;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  trackByDocId(_: number, doc: ProviderDocumentSummary): string {
    return doc.id;
  }
}
