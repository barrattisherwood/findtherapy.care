import mongoose, { Document, Schema } from 'mongoose';
import { Provider as SharedProvider, ProviderType, SubscriptionStatus } from '@findlocal/shared';

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
      enum: ['therapist', 'counsellor'] as ProviderType[],
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
    qualifications: [{
      type: String,
      trim: true,
    }],
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
    hourlyRate: {
      type: Number,
      min: 0,
    },
    offersFreeConsultation: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Trial period (set on registration if trial enabled)
    trialEndsAt: {
      type: Date,
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
  },
  {
    timestamps: true,
  }
);

// Index for searching
providerSchema.index({ type: 1, 'location.city': 1, subscriptionStatus: 1 });
providerSchema.index({ specialties: 1 });

export const Provider = mongoose.model<IProvider>('Provider', providerSchema);
