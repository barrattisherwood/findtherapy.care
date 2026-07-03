import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FeatureFlagService } from '../../services/feature-flag.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar {
  private authService = inject(AuthService);
  private featureFlagService = inject(FeatureFlagService);

  currentUser = this.authService.currentUser;
  providerBlogEnabled = toSignal(this.featureFlagService.isEnabled$('provider_blog'), { initialValue: false });
  isAuthenticated = this.authService.isLoggedIn;
  userInitial = computed(() => {
    const email = this.currentUser()?.email;
    return email ? email.charAt(0).toUpperCase() : '?';
  });
  userName = computed(() => {
    const email = this.currentUser()?.email;
    return email ? email.split('@')[0] : 'User';
  });
  showMobileMenu = false;
  showUserMenu = signal(false);
  isScrolled = signal(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 10);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-trigger')) {
      this.showMobileMenu = false;
    }
    if (!target.closest('.user-menu') && !target.closest('.user-menu-trigger')) {
      this.showUserMenu.set(false);
    }
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  toggleUserMenu(): void {
    this.showUserMenu.set(!this.showUserMenu());
  }

  logout(): void {
    this.showUserMenu.set(false);
    this.authService.logout();
  }
}
