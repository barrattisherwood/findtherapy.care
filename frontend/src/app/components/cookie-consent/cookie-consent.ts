import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cookie-consent.html',
  styleUrl: './cookie-consent.scss',
})
export class CookieConsent implements OnInit {
  private readonly CONSENT_KEY = 'cookie_consent';
  showBanner = signal(false);

  ngOnInit(): void {
    const consent = localStorage.getItem(this.CONSENT_KEY);
    if (!consent) {
      this.showBanner.set(true);
    }
  }

  accept(): void {
    localStorage.setItem(this.CONSENT_KEY, JSON.stringify({
      accepted: true,
      timestamp: new Date().toISOString(),
    }));
    this.showBanner.set(false);
  }
}
