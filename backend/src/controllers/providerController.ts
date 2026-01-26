import { Response } from 'express';
import { Provider } from '../models/Provider';
import { AuthRequest } from '../middleware/auth';
import {
  CreateProviderRequest,
  UpdateProviderRequest,
  ProviderSearchParams,
  Provider as ProviderType,
  ProviderAccessStatus,
  TRIAL_PERIOD_DAYS,
  isTrialEnabled,
} from '@findlocal/shared';

// Helper to calculate trial end date
const getTrialEndDate = (): Date | undefined => {
  if (!isTrialEnabled()) return undefined;
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_PERIOD_DAYS);
  return trialEnd;
};

// Helper to check provider's access status
export const getProviderAccessStatus = (provider: any): ProviderAccessStatus => {
  const now = new Date();

  // Check if on active trial
  if (provider.trialEndsAt && new Date(provider.trialEndsAt) > now) {
    return 'trial';
  }

  // Check if has active subscription
  if (provider.subscriptionStatus === 'active') {
    return 'active';
  }

  // Trial expired and no subscription
  if (provider.trialEndsAt && new Date(provider.trialEndsAt) <= now) {
    return 'expired';
  }

  return 'none';
};

// Helper to check if provider has access (trial or subscription)
export const hasProviderAccess = (provider: any): boolean => {
  const status = getProviderAccessStatus(provider);
  return status === 'trial' || status === 'active';
};

// Helper to transform provider document to response
const toProviderResponse = (doc: any): ProviderType => ({
  id: doc._id.toString(),
  userId: doc.userId,
  type: doc.type,
  displayName: doc.displayName,
  bio: doc.bio,
  qualifications: doc.qualifications,
  specialties: doc.specialties,
  location: doc.location,
  contactEmail: doc.contactEmail,
  contactPhone: doc.contactPhone,
  website: doc.website,
  hourlyRate: doc.hourlyRate,
  offersFreeConsultation: doc.offersFreeConsultation,
  isPublished: doc.isPublished,
  viewCount: doc.viewCount || 0,
  stripeCustomerId: doc.stripeCustomerId,
  stripeSubscriptionId: doc.stripeSubscriptionId,
  payfastSubscriptionToken: doc.payfastSubscriptionToken,
  subscriptionStatus: doc.subscriptionStatus,
  subscriptionEndsAt: doc.subscriptionEndsAt,
  trialEndsAt: doc.trialEndsAt,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt,
});

// Create provider profile
export const createProvider = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data: CreateProviderRequest = req.body;

    // Check if user already has a provider profile
    const existingProvider = await Provider.findOne({ userId });
    if (existingProvider) {
      return res.status(400).json({ message: 'You already have a provider profile' });
    }

    // Validate required fields
    if (!data.type || !data.displayName || !data.bio || !data.location?.city || !data.location?.postcode || !data.contactEmail) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Set trial end date if trial is enabled
    const trialEndsAt = getTrialEndDate();

    const provider = await Provider.create({
      userId,
      type: data.type,
      displayName: data.displayName,
      bio: data.bio,
      qualifications: data.qualifications || [],
      specialties: data.specialties || [],
      location: data.location,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      website: data.website,
      hourlyRate: data.hourlyRate,
      offersFreeConsultation: data.offersFreeConsultation || false,
      isPublished: true,
      subscriptionStatus: 'none',
      trialEndsAt,
    });

    res.status(201).json({ provider: toProviderResponse(provider) });
  } catch (error: any) {
    console.error('Create provider error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get current user's provider profile
export const getMyProvider = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const provider = await Provider.findOne({ userId });

    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    res.json({ provider: toProviderResponse(provider) });
  } catch (error: any) {
    console.error('Get my provider error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update current user's provider profile
export const updateProvider = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const data: UpdateProviderRequest = req.body;

    const provider = await Provider.findOne({ userId });
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    // Update fields
    if (data.type !== undefined) provider.type = data.type;
    if (data.displayName !== undefined) provider.displayName = data.displayName;
    if (data.bio !== undefined) provider.bio = data.bio;
    if (data.qualifications !== undefined) provider.qualifications = data.qualifications;
    if (data.specialties !== undefined) provider.specialties = data.specialties;
    if (data.location !== undefined) provider.location = data.location;
    if (data.contactEmail !== undefined) provider.contactEmail = data.contactEmail;
    if (data.contactPhone !== undefined) provider.contactPhone = data.contactPhone;
    if (data.website !== undefined) provider.website = data.website;
    if (data.hourlyRate !== undefined) provider.hourlyRate = data.hourlyRate;
    if (data.offersFreeConsultation !== undefined) provider.offersFreeConsultation = data.offersFreeConsultation;
    if (data.isPublished !== undefined) provider.isPublished = data.isPublished;

    await provider.save();

    res.json({ provider: toProviderResponse(provider) });
  } catch (error: any) {
    console.error('Update provider error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete current user's provider profile
export const deleteProvider = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const provider = await Provider.findOneAndDelete({ userId });

    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    res.json({ message: 'Provider profile deleted' });
  } catch (error: any) {
    console.error('Delete provider error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Search/list providers (public)
export const searchProviders = async (req: AuthRequest, res: Response) => {
  try {
    const params: ProviderSearchParams = {
      type: req.query.type as any,
      city: req.query.city as string,
      specialty: req.query.specialty as string,
      maxRate: req.query.maxRate ? Number(req.query.maxRate) : undefined,
      freeConsultation: req.query.freeConsultation === 'true',
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
    };

    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    // Build query - show providers with active trial OR active subscription
    const now = new Date();
    const query: any = {
      isPublished: true,
      $or: [
        { subscriptionStatus: 'active' },
        { trialEndsAt: { $gt: now } },
      ],
    };

    if (params.type) {
      query.type = params.type;
    }
    if (params.city) {
      query['location.city'] = new RegExp(params.city, 'i');
    }
    if (params.specialty) {
      query.specialties = params.specialty;
    }
    if (params.maxRate !== undefined) {
      query.hourlyRate = { $lte: params.maxRate };
    }
    if (params.freeConsultation) {
      query.offersFreeConsultation = true;
    }

    const [providers, total] = await Promise.all([
      Provider.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Provider.countDocuments(query),
    ]);

    res.json({
      providers: providers.map(toProviderResponse),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Search providers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get provider by ID (public)
export const getProviderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const now = new Date();

    // Increment view count and return the updated provider
    const provider = await Provider.findOneAndUpdate(
      {
        _id: id,
        isPublished: true,
        $or: [
          { subscriptionStatus: 'active' },
          { trialEndsAt: { $gt: now } },
        ],
      },
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json({ provider: toProviderResponse(provider) });
  } catch (error: any) {
    console.error('Get provider by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
