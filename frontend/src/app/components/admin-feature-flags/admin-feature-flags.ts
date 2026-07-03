import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService, FeatureFlag } from '../../services/admin.service';

@Component({
  selector: 'app-admin-feature-flags',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin-feature-flags.html',
})
export class AdminFeatureFlags implements OnInit {
  private adminService = inject(AdminService);

  flags = signal<FeatureFlag[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  toggling = signal<string | null>(null);

  ngOnInit() {
    this.loading.set(true);
    this.adminService.getFeatureFlags().subscribe({
      next: ({ flags }) => {
        this.flags.set(flags);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load feature flags.');
        this.loading.set(false);
      },
    });
  }

  toggle(key: string, currentEnabled: boolean) {
    const newEnabled = !currentEnabled;
    this.toggling.set(key);
    this.error.set(null);

    // Optimistic update
    this.flags.update(flags =>
      flags.map(f => f.key === key ? { ...f, enabled: newEnabled } : f)
    );

    this.adminService.toggleFeatureFlag(key, newEnabled).subscribe({
      next: ({ flag }) => {
        this.flags.update(flags =>
          flags.map(f => f.key === key ? flag : f)
        );
        this.toggling.set(null);
      },
      error: () => {
        // Revert optimistic update
        this.flags.update(flags =>
          flags.map(f => f.key === key ? { ...f, enabled: currentEnabled } : f)
        );
        this.error.set(`Failed to update "${key}". Please try again.`);
        this.toggling.set(null);
      },
    });
  }
}
