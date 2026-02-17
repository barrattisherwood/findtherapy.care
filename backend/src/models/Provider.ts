import mongoose, { Document, Schema } from 'mongoose';
import { Provider as SharedProvider, ProviderType, SubscriptionStatus, VettingStatus } from '@findlocal/shared';

export interface IProvider extends Omit<SharedProvider, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
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
      enum: ['psychologist', 'counsellor', 'social-worker'] as ProviderType[],
      required: true,
    },
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
      address: String,
      city: {
        type: String,
        required: true,
        trim: true,
      },
      postcode: {
        type: String,
        required: true,
        trim: true,
      },
    },
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
      default: true,
    },
    // Vetting
    vettingStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'] as VettingStatus[],
      default: 'pending',
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
      enum: ['none', 'active', 'past_due', 'canceled'] as SubscriptionStatus[],
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
  },
  {
    timestamps: true,
  }
);

// Index for searching
providerSchema.index({ type: 1, 'location.city': 1, subscriptionStatus: 1 });
providerSchema.index({ specialties: 1 });
providerSchema.index({ vettingStatus: 1 });

export const Provider = mongoose.model<IProvider>('Provider', providerSchema);
