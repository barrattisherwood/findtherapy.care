import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ProviderService } from '../../services/provider.service';
import { SubscriptionService } from '../../services/subscription.service';
import { AnalyticsService } from '../../services/analytics.service';
import { PromoService } from '../../services/promo.service';
import { ToastService } from '../../services/toast';
import { Navbar } from '../navbar/navbar';
import { Footer } from '../footer/footer';
import { SubscriptionStatus } from '../subscription-status/subscription-status';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton';
import { ImageUpload } from '../image-upload/image-upload';
import { CreateProviderRequest, ProviderType, CounsellorType, Certification, ProfessionalBodyMembership, ProfessionalBodyName, ProviderPricing, VettingStatus, SUBSCRIPTION_PRICE_ZAR, StructuredLocation, SessionFormats } from '@findlocal/shared';
import { PROVIDER_SPECIALTIES, PROVIDER_DEGREES, PROFESSIONAL_BODIES, COUNSELLOR_TYPES } from '@findlocal/shared';
import { LocationInput } from '../location-input/location-input';
import { SessionFormatsInput } from '../session-formats-input/session-formats-input';
import { ProviderVerification } from '../provider-verification/provider-verification';

@Component({
  selector: 'app-provider-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, Navbar, Footer, SubscriptionStatus, LoadingSkeleton, ImageUpload, LocationInput, SessionFormatsInput, ProviderVerification],
  templateUrl: './provider-profile.html',
  styleUrl: './provider-profile.scss'
})
export class ProviderProfile implements OnInit {
  private route = inject(ActivatedRoute);
  private providerService = inject(ProviderService);
  private subscriptionService = inject(SubscriptionService);
  private analytics = inject(AnalyticsService);
  private promoService = inject(PromoService);
  private toast = inject(ToastService);

  myProvider = this.providerService.myProvider;
  subscriptionStatus = this.subscriptionService.subscriptionStatus;
  subscriptionEndsAt = this.subscriptionService.subscriptionEndsAt;
  trialEndsAt = this.subscriptionService.trialEndsAt;
  accessStatus = this.subscriptionService.accessStatus;
  isFounder = this.subscriptionService.isFounder;

  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  hasProfile = signal<boolean>(false);
  viewCount = signal<number>(0);
  uploadingImage = signal<boolean>(false);

  // Validation errors
  counsellorTypesError = signal<string>('');
  displayNameError = signal<string>('');
  bioError = signal<string>('');
  locationError = signal<string>('');
  sessionFormatsError = signal<string>('');
  contactEmailError = signal<string>('');
  contactPhoneError = signal<string>('');
  websiteError = signal<string>('');
  certificationsError = signal<string>('');
  professionalBodiesError = signal<string>('');
  pricingError = signal<string>('');

  // Form fields
  type = signal<ProviderType>('psychologist');
  counsellorTypes = signal<CounsellorType[]>([]);
  displayName = signal<string>('');
  bio = signal<string>('');
  degrees = signal<string[]>([]);
  professionalBodies = signal<ProfessionalBodyMembership[]>([]);
  certifications = signal<Certification[]>([]);
  pricing = signal<ProviderPricing>({
    offersIntroductoryConsultation: false
  });
  specialties = signal<string[]>([]);
  location = signal<StructuredLocation | null>(null);
  sessionFormats = signal<SessionFormats>({ inPerson: false, online: false });
  contactEmail = signal<string>('');
  contactPhone = signal<string>('');
  website = signal<string>('');
  isPublished = signal<boolean>(true);
  vettingStatus = signal<VettingStatus>('pending');

  availableSpecialties = PROVIDER_SPECIALTIES;
  availableDegrees = PROVIDER_DEGREES;
  availableProfessionalBodies = PROFESSIONAL_BODIES;
  availableCounsellorTypes = COUNSELLOR_TYPES;

  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.loadProfile();

    // Check for checkout result
    const checkoutResult = this.route.snapshot.queryParamMap.get('checkout');
    if (checkoutResult === 'success') {
      this.analytics.trackSubscriptionComplete(`R${SUBSCRIPTION_PRICE_ZAR} Monthly Subscription`);
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
        this.counsellorTypes.set([...(p.counsellorTypes ?? [])]);
        this.displayName.set(p.displayName);
        this.bio.set(p.bio);
        this.degrees.set([...(p.degrees || [])]);
        this.professionalBodies.set([...(p.professionalBodies || [])]);
        this.certifications.set([...(p.certifications || [])]);
        this.pricing.set(p.pricing || { offersIntroductoryConsultation: false });
        this.specialties.set([...(p.specialties || [])]);
        this.location.set(p.location ?? null);
        this.sessionFormats.set(p.sessionFormats ?? { inPerson: false, online: false });
        this.contactEmail.set(p.contactEmail);
        this.contactPhone.set(p.contactPhone || '');
        this.website.set(p.website || '');
        this.isPublished.set(p.isPublished);
        this.vettingStatus.set(p.vettingStatus || 'pending');
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
      this.scrollToFirstError();
      this.toast.error('Validation Error', 'Please fix the errors in the form before saving.');
      return;
    }

    this.saving.set(true);

    const data: CreateProviderRequest = {
      type: this.type(),
      counsellorTypes: this.type() === 'counsellor' ? this.counsellorTypes() : undefined,
      displayName: this.displayName(),
      bio: this.bio(),
      degrees: this.degrees(),
      professionalBodies: this.professionalBodies(),
      certifications: this.certifications(),
      pricing: this.pricing(),
      specialties: this.specialties(),
      location: this.location()!,
      sessionFormats: this.sessionFormats(),
      contactEmail: this.contactEmail(),
      contactPhone: this.contactPhone() || undefined,
      website: this.website() || undefined,
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
      const promoCode = this.promoService.getStoredPromoCode() || undefined;
      this.providerService.create(data, promoCode).subscribe({
        next: () => {
          this.hasProfile.set(true);
          this.toast.success('Success', 'Profile created successfully.');
          this.saving.set(false);
          // Clear promo code after successful use
          this.promoService.clearPromoCode();
        },
        error: (err) => {
          this.toast.error('Error', err.error?.message || 'Failed to create profile.');
          this.saving.set(false);
        }
      });
    }
  }

  // Image upload
  onImageSelected(file: File): void {
    if (!this.hasProfile()) {
      this.toast.error('Error', 'Please create your profile before uploading an image.');
      return;
    }

    this.uploadingImage.set(true);

    this.providerService.uploadProfileImage(file).subscribe({
      next: () => {
        this.toast.success('Success', 'Profile image uploaded successfully.');
        this.uploadingImage.set(false);
      },
      error: (err) => {
        this.toast.error('Error', err.error?.message || 'Failed to upload image.');
        this.uploadingImage.set(false);
      }
    });
  }

  onImageRemoved(): void {
    if (!this.myProvider()?.profileImage) {
      return;
    }

    if (!confirm('Are you sure you want to remove your profile image?')) {
      return;
    }

    this.uploadingImage.set(true);

    this.providerService.deleteProfileImage().subscribe({
      next: () => {
        this.toast.success('Success', 'Profile image removed successfully.');
        this.uploadingImage.set(false);
      },
      error: (err) => {
        this.toast.error('Error', err.error?.message || 'Failed to remove image.');
        this.uploadingImage.set(false);
      }
    });
  }

  // Degree management
  toggleDegree(degree: string): void {
    const current = this.degrees();
    if (current.includes(degree)) {
      this.degrees.set(current.filter(d => d !== degree));
    } else {
      this.degrees.set([...current, degree]);
    }
  }

  isDegreeSelected(degree: string): boolean {
    return this.degrees().includes(degree);
  }

  // Professional body management
  addProfessionalBody(): void {
    this.professionalBodies.set([
      ...this.professionalBodies(),
      { body: '' as ProfessionalBodyName, otherBodyName: '', registrationNumber: '' }
    ]);
  }

  removeProfessionalBody(index: number): void {
    this.professionalBodies.set(
      this.professionalBodies().filter((_, i) => i !== index)
    );
    this.validateProfessionalBodies();
  }

  updateProfessionalBody(index: number, field: keyof ProfessionalBodyMembership, value: any): void {
    const updated = [...this.professionalBodies()];
    updated[index] = { ...updated[index], [field]: value };
    // Clear otherBodyName when switching away from 'Other'
    if (field === 'body' && value !== 'Other') {
      updated[index].otherBodyName = '';
    }
    this.professionalBodies.set(updated);
  }

  // Certification management
  addCertification(): void {
    const current = this.certifications();
    this.certifications.set([
      ...current,
      { certificationName: '', institution: '', yearCompleted: null }
    ]);
  }

  removeCertification(index: number): void {
    const current = this.certifications();
    this.certifications.set(current.filter((_, i) => i !== index));
    this.validateCertifications();
  }

  updateCertification(index: number, field: keyof Certification, value: any): void {
    const current = this.certifications();
    const updated = [...current];
    updated[index] = { ...updated[index], [field]: value };
    this.certifications.set(updated);
  }

  // Pricing management
  updatePricing(field: keyof ProviderPricing, value: any): void {
    this.pricing.set({ ...this.pricing(), [field]: value });
  }

  // Specialty management
  toggleSpecialty(specialty: string): void {
    const current = this.specialties();
    if (current.includes(specialty)) {
      this.specialties.set(current.filter(s => s !== specialty));
    } else {
      this.specialties.set([...current, specialty]);
    }
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

  validateLocation(): boolean {
    const loc = this.location();
    if (!loc) {
      this.locationError.set('Location is required');
      return false;
    }
    if (loc.type === 'physical' && !loc.province) {
      this.locationError.set('Please select a province');
      return false;
    }
    this.locationError.set('');
    return true;
  }

  validateSessionFormats(): boolean {
    const fmt = this.sessionFormats();
    if (!fmt.inPerson && !fmt.online) {
      this.sessionFormatsError.set('Please select at least one session format');
      return false;
    }
    this.sessionFormatsError.set('');
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

  validateCertifications(): boolean {
    const certs = this.certifications();

    // Empty array is valid
    if (certs.length === 0) {
      this.certificationsError.set('');
      return true;
    }

    // Check each certification
    for (let i = 0; i < certs.length; i++) {
      const cert = certs[i];
      if (!cert.certificationName?.trim()) {
        this.certificationsError.set('All certifications must have a name');
        return false;
      }
      if (!cert.institution?.trim()) {
        this.certificationsError.set('All certifications must have an institution');
        return false;
      }
      if (cert.yearCompleted && (cert.yearCompleted < 1900 || cert.yearCompleted > this.currentYear + 1)) {
        this.certificationsError.set('Invalid year for certification');
        return false;
      }
    }

    this.certificationsError.set('');
    return true;
  }

  validateProfessionalBodies(): boolean {
    const bodies = this.professionalBodies();

    if (bodies.length === 0) {
      this.professionalBodiesError.set('At least one professional body registration is required');
      return false;
    }

    for (const pb of bodies) {
      if (!pb.body) {
        this.professionalBodiesError.set('Please select a professional body for each entry');
        return false;
      }
      if (!pb.registrationNumber?.trim()) {
        this.professionalBodiesError.set('Each entry must have a registration/membership number');
        return false;
      }
      if (pb.body === 'Other' && !pb.otherBodyName?.trim()) {
        this.professionalBodiesError.set('Please specify the professional body name for "Other" entries');
        return false;
      }
    }

    // Check for duplicate body + registration number combinations
    const seen = new Set<string>();
    for (const pb of bodies) {
      const key = `${pb.body}:${pb.registrationNumber?.trim().toLowerCase()}`;
      if (seen.has(key)) {
        this.professionalBodiesError.set('Duplicate professional body registration detected — please remove the duplicate entry');
        return false;
      }
      seen.add(key);
    }

    this.professionalBodiesError.set('');
    return true;
  }

  validatePricing(): boolean {
    const p = this.pricing();
    const hasAnyRate = [
      p.individualCounsellingRate,
      p.couplesCounsellingRate,
      p.familyCounsellingRate,
      p.onlineCounsellingRate,
    ].some(rate => typeof rate === 'number' && rate > 0);

    if (!hasAnyRate) {
      this.pricingError.set('Please specify at least one service rate');
      return false;
    }

    this.pricingError.set('');
    return true;
  }

  private scrollToFirstError(): void {
    // Map each error signal to the id of the field/section to focus
    const errorMap: { error: () => string; id: string }[] = [
      { error: this.displayNameError, id: 'displayName' },
      { error: this.bioError, id: 'bio' },
      { error: this.counsellorTypesError, id: 'counsellor-type-section' },
      { error: this.professionalBodiesError, id: 'professional-bodies-section' },
      { error: this.certificationsError, id: 'certifications-section' },
      { error: this.locationError, id: 'location-section' },
      { error: this.sessionFormatsError, id: 'session-formats-section' },
      { error: this.contactEmailError, id: 'contactEmail' },
      { error: this.contactPhoneError, id: 'contactPhone' },
      { error: this.websiteError, id: 'website' },
      { error: this.pricingError, id: 'pricing-section' },
    ];

    for (const { error, id } of errorMap) {
      if (error()) {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (typeof (el as HTMLElement & { focus?: () => void }).focus === 'function') {
            (el as HTMLInputElement).focus();
          }
        }
        return;
      }
    }
  }

  validateCounsellorTypes(): boolean {
    if (this.type() !== 'counsellor') {
      this.counsellorTypesError.set('');
      return true;
    }
    if (this.counsellorTypes().length === 0) {
      this.counsellorTypesError.set('Please select at least one counsellor type');
      return false;
    }
    this.counsellorTypesError.set('');
    return true;
  }

  setType(value: ProviderType): void {
    this.type.set(value);
    if (value !== 'counsellor') {
      this.counsellorTypes.set([]);
      this.counsellorTypesError.set('');
    }
  }

  toggleCounsellorType(value: CounsellorType): void {
    const current = this.counsellorTypes();
    if (current.includes(value)) {
      this.counsellorTypes.set(current.filter(v => v !== value));
    } else {
      this.counsellorTypes.set([...current, value]);
    }
    this.counsellorTypesError.set('');
  }

  isCounsellorTypeSelected(value: CounsellorType): boolean {
    return this.counsellorTypes().includes(value);
  }

  validateAllFields(): boolean {
    const displayNameValid = this.validateDisplayName();
    const bioValid = this.validateBio();
    const counsellorTypesValid = this.validateCounsellorTypes();
    const locationValid = this.validateLocation();
    const sessionFormatsValid = this.validateSessionFormats();
    const emailValid = this.validateContactEmail();
    const phoneValid = this.validateContactPhone();
    const websiteValid = this.validateWebsite();
    const certificationsValid = this.validateCertifications();
    const professionalBodiesValid = this.validateProfessionalBodies();
    const pricingValid = this.validatePricing();

    return displayNameValid && bioValid && counsellorTypesValid && locationValid && sessionFormatsValid && emailValid && phoneValid && websiteValid && certificationsValid && professionalBodiesValid && pricingValid;
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
