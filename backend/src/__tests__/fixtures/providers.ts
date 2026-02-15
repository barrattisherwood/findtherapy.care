import { Provider } from '../../models/Provider';
import mongoose from 'mongoose';

export interface TestProviderOptions {
  _id?: mongoose.Types.ObjectId;
  userId?: string;
  displayName?: string;
  type?: string;
  bio?: string;
  location?: {
    city: string;
    postcode: string;
    province?: string;
  };
  contactEmail?: string;
  contactPhone?: string;
  subscriptionStatus?: 'none' | 'active' | 'past_due' | 'canceled';
  subscriptionEndsAt?: Date;
  trialEndsAt?: Date;
  payfastPaymentId?: string;
  payfastSubscriptionToken?: string;
  isPublished?: boolean;
  viewCount?: number;
  isFounder?: boolean;
  founderNumber?: number;
  founderSince?: Date;
}

export const createTestProvider = async (options: TestProviderOptions = {}): Promise<any> => {
  const providerId = options._id || new mongoose.Types.ObjectId();
  const userId = options.userId || new mongoose.Types.ObjectId().toString();

  const providerData = {
    _id: providerId,
    userId,
    type: options.type || 'psychologist',
    displayName: options.displayName || 'Test Provider',
    bio: options.bio || 'A test provider bio that is at least 50 characters long for validation purposes.',
    degrees: ['PhD Psychology'],
    registrations: ['HPCSA'],
    certifications: [],
    specialties: ['Anxiety & Stress', 'Depression'],
    pricing: {
      individualCounsellingRate: 800,
      offersIntroductoryConsultation: false,
    },
    location: options.location || {
      city: 'Cape Town',
      postcode: '8001',
      province: 'Western Cape',
    },
    contactEmail: options.contactEmail || 'provider@example.com',
    contactPhone: options.contactPhone || '+27123456789',
    isPublished: options.isPublished ?? true,
    viewCount: options.viewCount ?? 0,
    subscriptionStatus: options.subscriptionStatus || 'none',
    subscriptionEndsAt: options.subscriptionEndsAt,
    trialEndsAt: options.trialEndsAt,
    payfastPaymentId: options.payfastPaymentId,
    payfastSubscriptionToken: options.payfastSubscriptionToken,
    isFounder: options.isFounder ?? false,
    founderNumber: options.founderNumber,
    founderSince: options.founderSince,
  };

  const provider = await Provider.create(providerData);
  return provider;
};

export const createProviderWithActiveTrial = async (
  userId: string,
  daysRemaining: number = 30
): Promise<any> => {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + daysRemaining);

  return createTestProvider({
    userId,
    trialEndsAt,
    subscriptionStatus: 'none',
  });
};

export const createProviderWithExpiredTrial = async (userId: string): Promise<any> => {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() - 1); // Yesterday

  return createTestProvider({
    userId,
    trialEndsAt,
    subscriptionStatus: 'none',
  });
};

export const createProviderWithActiveSubscription = async (userId: string): Promise<any> => {
  const subscriptionEndsAt = new Date();
  subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + 1);

  return createTestProvider({
    userId,
    subscriptionStatus: 'active',
    subscriptionEndsAt,
    payfastPaymentId: 'payment_123',
    payfastSubscriptionToken: 'token_123',
  });
};

export const createProviderWithCanceledSubscription = async (userId: string): Promise<any> => {
  return createTestProvider({
    userId,
    subscriptionStatus: 'canceled',
  });
};

export const createFounderProvider = async (
  userId: string,
  founderNumber: number = 1,
  trialDaysRemaining: number = 180
): Promise<any> => {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + trialDaysRemaining);

  return createTestProvider({
    userId,
    trialEndsAt,
    subscriptionStatus: 'none',
    isFounder: true,
    founderNumber,
    founderSince: new Date(),
  });
};
