import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProviderService } from '../../services/provider.service';
import { ContactService } from '../../services/contact.service';
import { ToastService } from '../../services/toast';
import { SeoService } from '../../services/seo.service';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton';
import { Provider, ContactProviderRequest } from '@findlocal/shared';

@Component({
  selector: 'app-provider-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, Navbar, Footer, LoadingSkeleton],
  templateUrl: './provider-detail.html',
  styleUrl: './provider-detail.scss'
})
export class ProviderDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private providerService = inject(ProviderService);
  private contactService = inject(ContactService);
  private toast = inject(ToastService);
  private seo = inject(SeoService);

  provider = signal<Provider | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Contact form fields
  contactName = signal<string>('');
  contactEmail = signal<string>('');
  contactPhone = signal<string>('');
  contactMessage = signal<string>('');
  submitting = signal<boolean>(false);
  showContactForm = signal<boolean>(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadProvider(id);
    }
  }

  private loadProvider(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.providerService.getById(id).subscribe({
      next: (response) => {
        this.provider.set(response.provider);
        this.loading.set(false);
        const p = response.provider;
        const type = p.type === 'therapist' ? 'Therapist' : 'Counsellor';
        this.seo.update({
          title: `${p.displayName} — ${type} in ${p.location.city}`,
          description: `${p.displayName} is a ${type.toLowerCase()} in ${p.location.city}. Specialties: ${p.specialties.slice(0, 4).join(', ')}. View profile and get in touch.`,
          url: `/providers/${p.id}`,
        });
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load provider');
        this.loading.set(false);
      }
    });
  }

  get providerTypeLabel(): string {
    return this.provider()?.type === 'therapist' ? 'Therapist' : 'Counsellor';
  }

  get locationDisplay(): string {
    const p = this.provider();
    if (!p) return '';
    const parts = [p.location.address, p.location.city, p.location.postcode].filter(Boolean);
    return parts.join(', ');
  }

  toggleContactForm(): void {
    this.showContactForm.set(!this.showContactForm());
    if (!this.showContactForm()) {
      // Reset form when hiding
      this.contactName.set('');
      this.contactEmail.set('');
      this.contactPhone.set('');
      this.contactMessage.set('');
    }
  }

  submitContactForm(): void {
    const name = this.contactName().trim();
    const email = this.contactEmail().trim();
    const message = this.contactMessage().trim();

    if (!name || !email || !message) {
      this.toast.error('Missing Fields', 'Please fill in all required fields.');
      return;
    }

    if (message.length < 10) {
      this.toast.error('Message Too Short', 'Please write a message of at least 10 characters.');
      return;
    }

    const providerId = this.provider()?.id;
    if (!providerId) return;

    this.submitting.set(true);

    const data: ContactProviderRequest = {
      name,
      email,
      phone: this.contactPhone().trim() || undefined,
      message,
    };

    this.contactService.contactProvider(providerId, data).subscribe({
      next: () => {
        this.toast.success('Message Sent', 'Your message has been sent successfully. The provider will contact you soon.');
        this.toggleContactForm();
        this.submitting.set(false);
      },
      error: (err) => {
        this.toast.error('Error', err.error?.message || 'Failed to send message. Please try again.');
        this.submitting.set(false);
      }
    });
  }
}
