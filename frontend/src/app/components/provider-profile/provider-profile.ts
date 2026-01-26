import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProviderService } from '../../services/provider.service';
import { SubscriptionService } from '../../services/subscription.service';
import { ToastService } from '../../services/toast';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { SubscriptionStatus } from '../subscription-status/subscription-status';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton';
import { CreateProviderRequest, ProviderType } from '@findlocal/shared';
import { PROVIDER_SPECIALTIES, PROVIDER_QUALIFICATIONS } from '@findlocal/shared';

@Component({
  selector: 'app-provider-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Footer, SubscriptionStatus, LoadingSkeleton],
  templateUrl: './provider-profile.html',
  styleUrl: './provider-profile.scss'
})
export class ProviderProfile implements OnInit {
  private route = inject(ActivatedRoute);
  private providerService = inject(ProviderService);
  private subscriptionService = inject(SubscriptionService);
  private toast = inject(ToastService);

  myProvider = this.providerService.myProvider;
  subscriptionStatus = this.subscriptionService.subscriptionStatus;
  subscriptionEndsAt = this.subscriptionService.subscriptionEndsAt;
  trialEndsAt = this.subscriptionService.trialEndsAt;
  accessStatus = this.subscriptionService.accessStatus;

  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  hasProfile = signal<boolean>(false);
  viewCount = signal<number>(0);

  // Validation errors
  displayNameError = signal<string>('');
  bioError = signal<string>('');
  cityError = signal<string>('');
  postcodeError = signal<string>('');
  contactEmailError = signal<string>('');
  contactPhoneError = signal<string>('');
  websiteError = signal<string>('');

  // Form fields
  type = signal<ProviderType>('therapist');
  displayName = signal<string>('');
  bio = signal<string>('');
  qualifications = signal<string[]>([]);
  specialties = signal<string[]>([]);
  city = signal<string>('');
  postcode = signal<string>('');
  address = signal<string>('');
  contactEmail = signal<string>('');
  contactPhone = signal<string>('');
  website = signal<string>('');
  hourlyRate = signal<number | undefined>(undefined);
  offersFreeConsultation = signal<boolean>(false);
  isPublished = signal<boolean>(true);

  availableSpecialties = PROVIDER_SPECIALTIES;
  availableQualifications = PROVIDER_QUALIFICATIONS;

  ngOnInit(): void {
    this.loadProfile();

    // Check for checkout result
    const checkoutResult = this.route.snapshot.queryParamMap.get('checkout');
    if (checkoutResult === 'success') {
      this.toast.success('Success', 'Subscription activated! Your profile is now visible.');
      this.subscriptionService.getStatus().subscribe();
    } else if (checkoutResult === 'canceled') {
      this.toast.info('Canceled', 'Checkout was canceled.');
    }
  }

  private loadProfile(): void {
    this.loading.set(true);

    this.providerService.getMyProvider().subscribe({
      next: (response) => {
        const p = response.provider;
        this.hasProfile.set(true);
        this.type.set(p.type);
        this.displayName.set(p.displayName);
        this.bio.set(p.bio);
        this.qualifications.set([...p.qualifications]);
        this.specialties.set([...p.specialties]);
        this.city.set(p.location.city);
        this.postcode.set(p.location.postcode);
        this.address.set(p.location.address || '');
        this.contactEmail.set(p.contactEmail);
        this.contactPhone.set(p.contactPhone || '');
        this.website.set(p.website || '');
        this.hourlyRate.set(p.hourlyRate);
        this.offersFreeConsultation.set(p.offersFreeConsultation);
        this.isPublished.set(p.isPublished);
        this.viewCount.set(p.viewCount || 0);

        this.subscriptionService.getStatus().subscribe();
        this.loading.set(false);
      },
      error: () => {
        this.hasProfile.set(false);
        this.loading.set(false);
      }
    });
  }

  save(): void {
    if (!this.validateAllFields()) {
      this.toast.error('Validation Error', 'Please fix the errors in the form before saving.');
      return;
    }

    this.saving.set(true);

    const data: CreateProviderRequest = {
      type: this.type(),
      displayName: this.displayName(),
      bio: this.bio(),
      qualifications: this.qualifications(),
      specialties: this.specialties(),
      location: {
        city: this.city(),
        postcode: this.postcode(),
        address: this.address() || undefined,
      },
      contactEmail: this.contactEmail(),
      contactPhone: this.contactPhone() || undefined,
      website: this.website() || undefined,
      hourlyRate: this.hourlyRate(),
      offersFreeConsultation: this.offersFreeConsultation(),
    };

    if (this.hasProfile()) {
      this.providerService.update({ ...data, isPublished: this.isPublished() }).subscribe({
        next: () => {
          this.toast.success('Success', 'Profile updated successfully.');
          this.saving.set(false);
        },
        error: (err) => {
          this.toast.error('Error', err.error?.message || 'Failed to update profile.');
          this.saving.set(false);
        }
      });
    } else {
      this.providerService.create(data).subscribe({
        next: () => {
          this.hasProfile.set(true);
          this.toast.success('Success', 'Profile created successfully.');
          this.saving.set(false);
        },
        error: (err) => {
          this.toast.error('Error', err.error?.message || 'Failed to create profile.');
          this.saving.set(false);
        }
      });
    }
  }

  toggleQualification(qual: string): void {
    const current = this.qualifications();
    if (current.includes(qual)) {
      this.qualifications.set(current.filter(q => q !== qual));
    } else {
      this.qualifications.set([...current, qual]);
    }
  }

  toggleSpecialty(specialty: string): void {
    const current = this.specialties();
    if (current.includes(specialty)) {
      this.specialties.set(current.filter(s => s !== specialty));
    } else {
      this.specialties.set([...current, specialty]);
    }
  }

  isQualificationSelected(qual: string): boolean {
    return this.qualifications().includes(qual);
  }

  isSpecialtySelected(specialty: string): boolean {
    return this.specialties().includes(specialty);
  }

  validateDisplayName(): boolean {
    const value = this.displayName().trim();
    if (!value) {
      this.displayNameError.set('Display name is required');
      return false;
    }
    if (value.length > 100) {
      this.displayNameError.set('Display name must be 100 characters or less');
      return false;
    }
    this.displayNameError.set('');
    return true;
  }

  validateBio(): boolean {
    const value = this.bio().trim();
    if (!value) {
      this.bioError.set('Bio is required');
      return false;
    }
    if (value.length < 50) {
      this.bioError.set(`Bio must be at least 50 characters (currently ${value.length})`);
      return false;
    }
    if (value.length > 2000) {
      this.bioError.set(`Bio must be 2000 characters or less (currently ${value.length})`);
      return false;
    }
    this.bioError.set('');
    return true;
  }

  validateCity(): boolean {
    const value = this.city().trim();
    if (!value) {
      this.cityError.set('City is required');
      return false;
    }
    this.cityError.set('');
    return true;
  }

  validatePostcode(): boolean {
    const value = this.postcode().trim();
    if (!value) {
      this.postcodeError.set('Postcode is required');
      return false;
    }
    if (!/^\d{4}$/.test(value)) {
      this.postcodeError.set('Postcode must be 4 digits');
      return false;
    }
    this.postcodeError.set('');
    return true;
  }

  validateContactEmail(): boolean {
    const value = this.contactEmail().trim();
    if (!value) {
      this.contactEmailError.set('Contact email is required');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      this.contactEmailError.set('Please enter a valid email address');
      return false;
    }
    this.contactEmailError.set('');
    return true;
  }

  validateContactPhone(): boolean {
    const value = this.contactPhone().trim();
    if (!value) {
      this.contactPhoneError.set('');
      return true; // Optional field
    }
    // Allow various formats: +27 21 123 4567, 021 123 4567, 0211234567, etc.
    const phoneRegex = /^[\+\d][\d\s\-\(\)]{8,}$/;
    if (!phoneRegex.test(value)) {
      this.contactPhoneError.set('Please enter a valid phone number');
      return false;
    }
    this.contactPhoneError.set('');
    return true;
  }

  validateWebsite(): boolean {
    const value = this.website().trim();
    if (!value) {
      this.websiteError.set('');
      return true; // Optional field
    }
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) {
        this.websiteError.set('Website must start with http:// or https://');
        return false;
      }
      this.websiteError.set('');
      return true;
    } catch {
      this.websiteError.set('Please enter a valid URL (e.g., https://example.com)');
      return false;
    }
  }

  validateAllFields(): boolean {
    const displayNameValid = this.validateDisplayName();
    const bioValid = this.validateBio();
    const cityValid = this.validateCity();
    const postcodeValid = this.validatePostcode();
    const emailValid = this.validateContactEmail();
    const phoneValid = this.validateContactPhone();
    const websiteValid = this.validateWebsite();

    return displayNameValid && bioValid && cityValid && postcodeValid && emailValid && phoneValid && websiteValid;
  }

  formatViewCount(): string {
    const count = this.viewCount();
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'm';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
  }
}
