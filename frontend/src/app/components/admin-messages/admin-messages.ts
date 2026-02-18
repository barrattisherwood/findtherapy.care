import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ToastService } from '../../services/toast';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { environment } from '../../environments/environment';

export interface AdminMessage {
  id: string;
  type: 'provider' | 'site';
  providerId?: string;
  providerName?: string;
  providerContactEmail?: string;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  subject?: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar, Footer],
  templateUrl: './admin-messages.html',
})
export class AdminMessages implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private apiUrl = `${environment.apiUrl}/admin/messages`;

  messages = signal<AdminMessage[]>([]);
  loading = signal(true);
  total = signal(0);
  unreadCount = signal(0);
  page = signal(1);
  totalPages = signal(1);

  typeFilter = signal('');
  readFilter = signal('');
  expandedId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(): void {
    this.loading.set(true);
    let params = new HttpParams()
      .set('page', this.page().toString())
      .set('limit', '25');
    if (this.typeFilter()) params = params.set('type', this.typeFilter());
    if (this.readFilter() !== '') params = params.set('read', this.readFilter());

    this.http.get<any>(this.apiUrl, { params }).subscribe({
      next: (res) => {
        this.messages.set(res.messages);
        this.total.set(res.total);
        this.unreadCount.set(res.unreadCount);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: (err) => {
        this.toast.error('Error', err.error?.message || 'Failed to load messages');
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.page.set(1);
    this.loadMessages();
  }

  toggleExpand(id: string): void {
    const current = this.expandedId();
    this.expandedId.set(current === id ? null : id);
    // Auto-mark as read when opening
    const msg = this.messages().find(m => m.id === id);
    if (msg && !msg.isRead && current !== id) {
      this.markRead(msg, true);
    }
  }

  markRead(msg: AdminMessage, isRead: boolean): void {
    this.http.patch(`${this.apiUrl}/${msg.id}/read`, { isRead }).subscribe({
      next: () => {
        this.messages.set(
          this.messages().map(m => m.id === msg.id ? { ...m, isRead } : m)
        );
        const delta = isRead ? -1 : 1;
        this.unreadCount.set(Math.max(0, this.unreadCount() + delta));
      },
      error: () => {}
    });
  }

  onPageChange(p: number): void {
    this.page.set(p);
    this.loadMessages();
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
