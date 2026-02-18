import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, AdminLog, SentryIssue } from '../../services/admin.service';
import { BlogService } from '../../services/blog.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { DashboardMetrics, BlogMetrics } from '@findlocal/shared';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, Navbar, Footer],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit {
  private adminService = inject(AdminService);
  private blogService = inject(BlogService);

  metrics = signal<DashboardMetrics | null>(null);
  blogMetrics = signal<BlogMetrics | null>(null);
  recentLogs = signal<AdminLog[]>([]);
  sentryIssues = signal<SentryIssue[]>([]);
  sentryConfigured = signal(true);
  loading = this.adminService.loading;
  blogLoading = this.blogService.loading;
  errorMessage = signal('');
  selectedDays = signal(30);
  pendingVettingCount = this.adminService.pendingCount;

  timeRangeOptions = [
    { value: 7, label: 'Last 7 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 90, label: 'Last 90 days' }
  ];

  ngOnInit(): void {
    this.loadMetrics();
    this.loadBlogMetrics();
    this.adminService.getPendingCount().subscribe();
    this.loadRecentLogs();
    this.loadSentryIssues();
  }

  loadMetrics(): void {
    this.errorMessage.set('');
    this.adminService.getDashboardMetrics(this.selectedDays()).subscribe({
      next: (data) => this.metrics.set(data),
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to load dashboard metrics');
      }
    });
  }

  loadBlogMetrics(): void {
    this.blogService.getBlogMetrics().subscribe({
      next: (data) => this.blogMetrics.set(data),
      error: (error) => {
        console.error('Failed to load blog metrics:', error);
      }
    });
  }

  loadRecentLogs(): void {
    this.adminService.getAdminLogs(1, '').subscribe({
      next: (res) => this.recentLogs.set(res.logs.slice(0, 5)),
      error: () => {}
    });
  }

  loadSentryIssues(): void {
    this.adminService.getSentryIssues().subscribe({
      next: (res) => {
        this.sentryIssues.set(res.issues);
        this.sentryConfigured.set(res.configured);
      },
      error: () => {}
    });
  }

  getLogBadgeClasses(log: AdminLog): string {
    switch (log.action) {
      case 'vet_provider':
        return log.details?.['vettingStatus'] === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
      case 'suspend_provider': return 'bg-orange-100 text-orange-800';
      case 'unsuspend_provider': return 'bg-blue-100 text-blue-800';
      case 'delete_provider': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  }

  getLogBadgeLabel(log: AdminLog): string {
    switch (log.action) {
      case 'vet_provider': return log.details?.['vettingStatus'] === 'approved' ? 'Approved' : 'Rejected';
      case 'suspend_provider': return 'Suspended';
      case 'unsuspend_provider': return 'Unsuspended';
      case 'delete_provider': return 'Deleted';
      default: return 'Read';
    }
  }

  getSentryLevelClasses(level: string): string {
    switch (level) {
      case 'error': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-ZA', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  onTimeRangeChange(days: number): void {
    this.selectedDays.set(days);
    this.loadMetrics();
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-ZA').format(value);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0
    }).format(value);
  }

  formatPercentage(value: number): string {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  objectKeys(obj: Record<string, number> | undefined): string[] {
    return obj ? Object.keys(obj) : [];
  }
}
