// Provider Types
export type ProviderType = 'psychologist' | 'counsellor' | 'social-worker';

// Certification for additional training/certifications
export interface Certification {
  certificationName: string;
  institution: string;
  yearCompleted: number | null;
}

// Pricing structure for different service types
export interface ProviderPricing {
  individualCounsellingRate?: number;
  couplesCounsellingRate?: number;
  familyCounsellingRate?: number;
  onlineCounsellingRate?: number;
  offersIntroductoryConsultation: boolean;
}

export type SubscriptionStatus = 'none' | 'active' | 'past_due' | 'canceled';

export interface ProviderLocation {
  address?: string;
  city: string;
  postcode: string;
}

export interface Provider {
  id: string;
  userId: string;
  type: ProviderType;
  displayName: string;
  bio: string;

  // NEW FIELDS - Professional credentials
  degrees: string[];
  registrations: string[];
  certifications: Certification[];

  // NEW FIELD - Pricing
  pricing: ProviderPricing;

  specialties: string[];
  location: ProviderLocation;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  isPublished: boolean;
  viewCount: number;
  profileImage?: string;
  profileImagePublicId?: string;
  payfastPaymentId?: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt?: Date;
  trialEndsAt?: Date;
  trialEndingReminderSent?: boolean;
  payfastSubscriptionToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper type for checking if provider has active access (trial or subscription)
export type ProviderAccessStatus = 'trial' | 'active' | 'expired' | 'none';

export interface CreateProviderRequest {
  type: ProviderType;
  displayName: string;
  bio: string;
  degrees: string[];
  registrations: string[];
  certifications: Certification[];
  specialties: string[];
  pricing: ProviderPricing;
  location: ProviderLocation;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
}

export interface UpdateProviderRequest extends Partial<CreateProviderRequest> {
  isPublished?: boolean;
}

export interface ProviderSearchParams {
  type?: ProviderType;
  city?: string;
  specialty?: string;
  maxRate?: number;
  freeConsultation?: boolean;
  page?: number;
  limit?: number;
}

export interface ProviderListResponse {
  providers: Provider[];
  total: number;
  page: number;
  totalPages: number;
}

// Support Group Types
export type MeetingType = 'in-person' | 'online' | 'hybrid';

export interface SupportGroupLocation {
  address?: string;
  city: string;
  postcode?: string;
}

export interface SupportGroup {
  id: string;
  name: string;
  description: string;
  category: string;
  meetingType: MeetingType;
  location?: SupportGroupLocation;
  meetingSchedule?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSupportGroupRequest {
  name: string;
  description: string;
  category: string;
  meetingType: MeetingType;
  location?: SupportGroupLocation;
  meetingSchedule?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
}

export interface UpdateSupportGroupRequest extends Partial<CreateSupportGroupRequest> {
  isActive?: boolean;
}

export interface SupportGroupSearchParams {
  category?: string;
  city?: string;
  meetingType?: MeetingType;
  page?: number;
  limit?: number;
}

export interface SupportGroupListResponse {
  supportGroups: SupportGroup[];
  total: number;
  page: number;
  totalPages: number;
}
