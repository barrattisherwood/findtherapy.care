import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { MarkdownService } from '../../services/markdown.service';
import { ToastService } from '../../services/toast';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { SafeHtml } from '@angular/platform-browser';

interface PopulatedProvider { _id: string; displayName: string; contactEmail: string; }

interface PendingPost {
  _id: string;
  title: string;
  brief?: string;
  excerpt?: string;
  content?: string;
  tags?: string[];
  publishedAt?: string;
  authorDisplayName?: string;
  authorProviderId?: PopulatedProvider | string | null;
}

@Component({
  selector: 'app-admin-blog-pending',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar, Footer],
  templateUrl: './admin-blog-pending.html',
})
export class AdminBlogPending implements OnInit {
  private adminService = inject(AdminService);
  private markdownService = inject(MarkdownService);
  private toast = inject(ToastService);

  posts = signal<PendingPost[]>([]);
  loading = signal(true);
  rejectingId = signal<string | null>(null);
  rejectionReason = signal('');
  actioning = signal<string | null>(null);
  expandedId = signal<string | null>(null);

  ngOnInit() {
    this.loadPosts();
  }

  loadPosts() {
    this.loading.set(true);
    this.adminService.getPendingBlogPosts().subscribe({
      next: (res) => {
        this.posts.set(res.posts as PendingPost[]);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.show({ type: 'error', title: 'Error', message: 'Failed to load pending posts.' });
      }
    });
  }

  approve(id: string) {
    this.actioning.set(id);
    this.adminService.reviewBlogPost(id, 'approve').subscribe({
      next: () => {
        this.posts.update(posts => posts.filter(p => p._id !== id));
        this.adminService.pendingBlogCount.update(n => Math.max(0, n - 1));
        this.actioning.set(null);
        this.toast.show({ type: 'success', title: 'Published', message: 'Post is now live on the blog.' });
      },
      error: () => {
        this.actioning.set(null);
        this.toast.show({ type: 'error', title: 'Error', message: 'Failed to approve post.' });
      }
    });
  }

  startReject(id: string) {
    this.rejectingId.set(id);
    this.rejectionReason.set('');
  }

  cancelReject() {
    this.rejectingId.set(null);
    this.rejectionReason.set('');
  }

  confirmReject(id: string) {
    if (!this.rejectionReason().trim()) return;
    this.actioning.set(id);
    this.adminService.reviewBlogPost(id, 'reject', this.rejectionReason().trim()).subscribe({
      next: () => {
        this.posts.update(posts => posts.filter(p => p._id !== id));
        this.adminService.pendingBlogCount.update(n => Math.max(0, n - 1));
        this.actioning.set(null);
        this.rejectingId.set(null);
        this.rejectionReason.set('');
        this.toast.show({ type: 'info', title: 'Returned', message: 'Post sent back to provider as draft.' });
      },
      error: () => {
        this.actioning.set(null);
        this.toast.show({ type: 'error', title: 'Error', message: 'Failed to reject post.' });
      }
    });
  }

  toggleExpand(id: string) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  renderContent(content: string): SafeHtml {
    return this.markdownService.render(content);
  }

  authorName(post: PendingPost): string {
    if (post.authorProviderId && typeof post.authorProviderId === 'object') {
      return post.authorProviderId.displayName;
    }
    return post.authorDisplayName ?? 'Unknown';
  }

  authorEmail(post: PendingPost): string {
    if (post.authorProviderId && typeof post.authorProviderId === 'object') {
      return post.authorProviderId.contactEmail;
    }
    return '';
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }
}
