// Provider Types
export type ProviderType = 'psychologist' | 'counsellor' | 'social-worker' | 'coach' | 'psychometrist';

// Counsellor sub-types (only applicable when type === 'counsellor')
export type CounsellorType =
  | 'registered'
  | 'wellness'
  | 'other-registrations'
  | 'specialist-wellness'
  | 'specialist-other-registrations';

// Professional body names
export type ProfessionalBodyName =
  | 'HPCSA'
  | 'SACSSP'
  | 'ASCHP'
  | 'CCSA'
  | 'Counselling-SA'
  | 'SAAC'
  | 'Other';

// Professional body membership entry (repeatable)
export interface ProfessionalBodyMembership {
  body: ProfessionalBodyName;
  otherBodyName?: string;        // required when body === 'Other'
  registrationNumber: string;    // member/reg number
}

// Vetting status for provider approval
export type VettingStatus = 'pending' | 'approved' | 'rejected';

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

export type SubscriptionStatus = 'none' | 'active' | 'past_due' | 'canceled' | 'paused';

// DEPRECATED — kept for backward compat during migration
export interface ProviderLocation {
  address?: string;
  city: string;
  postcode: string;
}

// NEW — structured location
export interface StructuredLocation {
  type: 'physical' | 'online-only';
  // Physical fields (required when type === 'physical')
  province?: string;          // slug e.g. "western-cape"
  provinceDisplay?: string;   // e.g. "Western Cape"
  city: string;               // slug e.g. "stellenbosch" | "online"
  cityDisplay: string;        // e.g. "Stellenbosch" | "Online Only"
  suburb?: string;            // optional e.g. "Die Boord"
  // Auto-computed display strings (set by backend pre-save hook)
  fullLocation: string;       // e.g. "Die Boord, Stellenbosch, Western Cape" | "Online Only"
  shortLocation: string;      // e.g. "Stellenbosch" | "Online"
  searchTerms?: string[];     // slugs for indexed search
  coordinates?: { lat: number; lng: number };
}

export interface SessionFormats {
  inPerson: boolean;
  online: boolean;
}

export interface Provider {
  id: string;
  userId: string;
  type: ProviderType;
  counsellorTypes?: CounsellorType[];
  displayName: string;
  bio: string;

  // Professional credentials
  degrees: string[];
  professionalBodies: ProfessionalBodyMembership[];
  certifications: Certification[];

  // Vetting
  vettingStatus: VettingStatus;
  vettingNotes?: string;
  vettedAt?: Date;
  vettedBy?: string;

  // NEW FIELD - Pricing
  pricing: ProviderPricing;

  specialties: string[];
  location: StructuredLocation;
  sessionFormats: SessionFormats;
  servesNationwide: boolean;
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
  // Suspension
  isSuspended?: boolean;
  suspensionReason?: string;
  suspendedAt?: Date;
  suspendedBy?: string;

  isFounder?: boolean;
  founderNumber?: number;
  founderSince?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Helper type for checking if provider has active access (trial or subscription)
export type ProviderAccessStatus = 'trial' | 'active' | 'expired' | 'none';

export interface CreateProviderRequest {
  type: ProviderType;
  counsellorTypes?: CounsellorType[];
  displayName: string;
  bio: string;
  degrees: string[];
  professionalBodies: ProfessionalBodyMembership[];
  certifications: Certification[];
  specialties: string[];
  pricing: ProviderPricing;
  location: StructuredLocation;
  sessionFormats: SessionFormats;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
}

export interface UpdateProviderRequest extends Partial<CreateProviderRequest> {
  isPublished?: boolean;
}

export interface VetProviderRequest {
  status: 'approved' | 'rejected';
  notes?: string;
}

export interface ProviderSearchParams {
  type?: ProviderType;
  city?: string;       // city slug
  province?: string;   // province slug
  online?: boolean;
  inPerson?: boolean;
  specialties?: string[];
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
  query?: string;
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
