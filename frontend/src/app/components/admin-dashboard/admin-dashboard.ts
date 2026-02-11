import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { DashboardMetrics } from '@findlocal/shared';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, Navbar, Footer],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit {
  private adminService = inject(AdminService);

  metrics = signal<DashboardMetrics | null>(null);
  loading = this.adminService.loading;
  errorMessage = signal('');
  selectedDays = signal(30);

  timeRangeOptions = [
    { value: 7, label: 'Last 7 days' },
    { value: 30, label: 'Last 30 days' },
    { value: 90, label: 'Last 90 days' }
  ];

  ngOnInit(): void {
    this.loadMetrics();
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
