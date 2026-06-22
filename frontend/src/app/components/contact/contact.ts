import { Component, signal, inject, ViewChild, ElementRef, OnInit, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { AnalyticsService } from '../../services/analytics.service';
import { FormsService } from '../../services/forms.service';
import { SeoService } from '../../services/seo.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, Navbar, Footer, FormsModule, RouterModule],
  templateUrl: './contact.html',
})
export class ContactComponent implements OnInit, AfterViewInit {
  private analytics = inject(AnalyticsService);
  private formsService = inject(FormsService);
  private seo = inject(SeoService);

  @ViewChild('turnstileWidget') turnstileWidget!: ElementRef;
  private turnstileWidgetId: string | null = null;

  name = signal('');
  email = signal('');
  subject = signal('');
  message = signal('');
  submitted = signal(false);
  loading = signal(false);
  error = signal('');

  ngOnInit(): void {
    this.seo.update({
      title: 'Contact Us',
      description: 'Get in touch with the findtherapy.care team. We\'re here to help you find the right mental health support in South Africa.',
      url: '/contact',
    });
  }

  ngAfterViewInit(): void {
    const checkTurnstile = setInterval(() => {
      if (typeof (window as any).turnstile !== 'undefined' && this.turnstileWidget?.nativeElement) {
        clearInterval(checkTurnstile);
        this.turnstileWidgetId = (window as any).turnstile.render(this.turnstileWidget.nativeElement, {
          sitekey: environment.turnstile.siteKey,
          theme: 'light',
          size: 'normal',
        });
      }
    }, 100);
    setTimeout(() => clearInterval(checkTurnstile), 10000);
  }

  private getTurnstileToken(): string | null {
    if (this.turnstileWidgetId === null) return null;
    try {
      return (window as any).turnstile.getResponse(this.turnstileWidgetId) || null;
    } catch {
      return null;
    }
  }

  async submitForm() {
    if (!this.name() || !this.email() || !this.subject() || !this.message()) {
      return;
    }

    const token = this.getTurnstileToken();
    if (!token) {
      this.error.set('Please complete the security verification.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.formsService.submit(environment.siteContactProxyUrl, {
      name: this.name(),
      email: this.email(),
      subject: this.subject(),
      message: this.message(),
      'cf-turnstile-response': token,
    }).subscribe({
      next: () => {
        this.analytics.trackSiteContactSubmit();
        this.submitted.set(true);
      },
      error: (err: Error) => {
        this.error.set(err.message);
        if (this.turnstileWidgetId !== null) {
          (window as any).turnstile.reset(this.turnstileWidgetId);
        }
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }
}
