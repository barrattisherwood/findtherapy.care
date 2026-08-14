import mongoose, { Document, Schema } from 'mongoose';
import { Provider as SharedProvider, ProviderType, CounsellorType, SubscriptionStatus, VettingStatus, SA_CITIES, SA_PROVINCES } from '@findlocal/shared';

export interface IProvider extends Omit<SharedProvider, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
  blogBetaEnabled: boolean;
}

const providerSchema = new Schema<IProvider>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['psychologist', 'counsellor', 'social-worker', 'coach', 'psychometrist'] as ProviderType[],
      required: true,
    },
    counsellorTypes: [{
      type: String,
      enum: ['registered', 'wellness', 'other-registrations', 'specialist-wellness', 'specialist-other-registrations'] as CounsellorType[],
    }],
    displayName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    bio: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    // Professional credentials
    degrees: [{
      type: String,
      trim: true,
    }],
    professionalBodies: [{
      body: {
        type: String,
        enum: ['HPCSA', 'SACSSP', 'ASCHP', 'CCSA', 'Counselling-SA', 'SAAC', 'Other'],
        required: true,
      },
      otherBodyName: {
        type: String,
        trim: true,
      },
      registrationNumber: {
        type: String,
        required: true,
        trim: true,
      },
    }],
    certifications: [{
      certificationName: {
        type: String,
        required: true,
        trim: true,
      },
      institution: {
        type: String,
        required: true,
        trim: true,
      },
      yearCompleted: {
        type: Number,
        min: 1900,
        max: new Date().getFullYear() + 1,
      },
    }],
    // NEW FIELD - Pricing
    pricing: {
      individualCounsellingRate: {
        type: Number,
        min: 0,
      },
      couplesCounsellingRate: {
        type: Number,
        min: 0,
      },
      familyCounsellingRate: {
        type: Number,
        min: 0,
      },
      onlineCounsellingRate: {
        type: Number,
        min: 0,
      },
      offersIntroductoryConsultation: {
        type: Boolean,
        default: false,
      },
    },
    specialties: [{
      type: String,
      trim: true,
    }],
    location: {
      type: {
        type: String,
        enum: ['physical', 'online-only'],
        required: true,
        trim: true,
      },
      // Physical location fields
      province: { type: String, trim: true },
      provinceDisplay: { type: String, trim: true },
      city: { type: String, required: true, trim: true },
      cityDisplay: { type: String, required: true, trim: true },
      suburb: { type: String, trim: true },
      // Computed display fields (set by pre-save hook)
      fullLocation: { type: String, required: true, trim: true },
      shortLocation: { type: String, required: true, trim: true },
      searchTerms: [{ type: String, trim: true }],
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    sessionFormats: {
      inPerson: { type: Boolean, default: false },
      online: { type: Boolean, default: false },
    },
    servesNationwide: { type: Boolean, default: false },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    // Vetting
    vettingStatus: {
      type: String,
      enum: ['unverified', 'pending', 'approved', 'rejected'] as VettingStatus[],
      default: 'unverified',
    },
    vettingNotes: {
      type: String,
      trim: true,
    },
    vettedAt: {
      type: Date,
    },
    vettedBy: {
      type: String,
    },
    // Suspension
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionReason: {
      type: String,
      trim: true,
    },
    suspendedAt: {
      type: Date,
    },
    suspendedBy: {
      type: String,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Profile image (Cloudinary URL)
    profileImage: {
      type: String,
      trim: true,
    },
    profileImagePublicId: {
      type: String,
      trim: true,
    },
    // Trial period (set on registration if trial enabled)
    trialEndsAt: {
      type: Date,
    },
    trialEndingReminderSent: {
      type: Boolean,
      default: false,
    },
    // PayFast subscription fields
    payfastPaymentId: {
      type: String,
    },
    payfastSubscriptionToken: {
      type: String,
    },
    subscriptionStatus: {
      type: String,
      enum: ['none', 'active', 'past_due', 'canceled', 'paused'] as SubscriptionStatus[],
      default: 'none',
    },
    subscriptionEndsAt: {
      type: Date,
    },
    // Founders deal fields
    isFounder: {
      type: Boolean,
      default: false,
    },
    founderNumber: {
      type: Number,
    },
    founderSince: {
      type: Date,
    },
    blogBetaEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
providerSchema.index({ type: 1, 'location.city': 1, subscriptionStatus: 1 });
providerSchema.index({ 'location.city': 1, 'sessionFormats.inPerson': 1 });
providerSchema.index({ 'location.province': 1, 'sessionFormats.inPerson': 1 });
providerSchema.index({ 'sessionFormats.online': 1 });
providerSchema.index({ 'location.searchTerms': 1 });
providerSchema.index({ specialties: 1 });
providerSchema.index({ vettingStatus: 1 });

// Pre-save hook — compute fullLocation, shortLocation, servesNationwide, searchTerms
providerSchema.pre('save', function (next) {
  const loc = this.location as any;
  const fmt = this.sessionFormats as any;

  if (loc) {
    if (loc.type === 'online-only') {
      loc.fullLocation = 'Online Only';
      loc.shortLocation = 'Online';
      loc.searchTerms = ['online', 'nationwide', 'virtual', 'teletherapy'];
    } else {
      const suburb = loc.suburb ? `${loc.suburb}, ` : '';
      loc.fullLocation = `${suburb}${loc.cityDisplay}${loc.provinceDisplay ? `, ${loc.provinceDisplay}` : ''}`;
      loc.shortLocation = loc.cityDisplay;

      // Build searchTerms from city aliases in shared data
      const cityData = SA_CITIES.find(c => c.slug === loc.city);
      loc.searchTerms = [
        loc.city,
        ...(loc.province ? [loc.province] : []),
        ...(cityData?.aliases ?? []),
      ].filter(Boolean);
    }
  }

  if (fmt) {
    (this as any).servesNationwide = fmt.online === true;
  }

  next();
});

export const Provider = mongoose.model<IProvider>('Provider', providerSchema);
