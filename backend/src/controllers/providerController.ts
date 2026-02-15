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
  FOUNDERS_TRIAL_DAYS,
  FOUNDERS_MAX_SPOTS,
  FOUNDERS_PROMO_CODE,
  isTrialEnabled,
} from '@findlocal/shared';
import { uploadImage, deleteImage, isCloudinaryConfigured } from '../services/cloudinaryService';
import multer from 'multer';

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
  // NEW FIELDS
  degrees: doc.degrees || [],
  registrations: doc.registrations || [],
  certifications: doc.certifications || [],
  pricing: doc.pricing || {
    offersIntroductoryConsultation: false,
  },
  specialties: doc.specialties || [],
  location: doc.location,
  contactEmail: doc.contactEmail,
  contactPhone: doc.contactPhone,
  website: doc.website,
  isPublished: doc.isPublished,
  viewCount: doc.viewCount || 0,
  profileImage: doc.profileImage,
  profileImagePublicId: doc.profileImagePublicId,
  payfastPaymentId: doc.payfastPaymentId,
  payfastSubscriptionToken: doc.payfastSubscriptionToken,
  subscriptionStatus: doc.subscriptionStatus,
  subscriptionEndsAt: doc.subscriptionEndsAt,
  trialEndsAt: doc.trialEndsAt,
  isFounder: doc.isFounder || false,
  founderNumber: doc.founderNumber,
  founderSince: doc.founderSince,
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

    // Validate certifications
    if (data.certifications && data.certifications.length > 0) {
      for (const cert of data.certifications) {
        if (!cert.certificationName?.trim() || !cert.institution?.trim()) {
          return res.status(400).json({ message: 'Each certification must have a name and institution' });
        }
        if (cert.yearCompleted && (cert.yearCompleted < 1900 || cert.yearCompleted > new Date().getFullYear() + 1)) {
          return res.status(400).json({ message: 'Invalid year for certification' });
        }
      }
    }

    // Validate pricing - at least one rate should be specified
    if (data.pricing) {
      const hasAnyRate = [
        data.pricing.individualCounsellingRate,
        data.pricing.couplesCounsellingRate,
        data.pricing.familyCounsellingRate,
        data.pricing.onlineCounsellingRate,
      ].some(rate => typeof rate === 'number' && rate > 0);

      if (!hasAnyRate) {
        return res.status(400).json({ message: 'Please specify at least one service rate' });
      }
    }

    // Set trial end date if trial is enabled
    const trialEndsAt = getTrialEndDate();

    // Check if founder promo code was provided
    const promoCode = (req.body as any).promoCode;
    let isFounder = false;
    let founderNumber: number | undefined;
    let founderTrialEndsAt = trialEndsAt;

    if (promoCode && promoCode.toUpperCase() === FOUNDERS_PROMO_CODE) {
      const founderCount = await Provider.countDocuments({ isFounder: true });
      if (founderCount < FOUNDERS_MAX_SPOTS) {
        isFounder = true;
        founderNumber = founderCount + 1;
        // Override trial to 6 months for founders
        founderTrialEndsAt = new Date();
        founderTrialEndsAt.setDate(founderTrialEndsAt.getDate() + FOUNDERS_TRIAL_DAYS);
      }
    }

    const provider = await Provider.create({
      userId,
      type: data.type,
      displayName: data.displayName,
      bio: data.bio,
      degrees: data.degrees || [],
      registrations: data.registrations || [],
      certifications: data.certifications || [],
      pricing: data.pricing || { offersIntroductoryConsultation: false },
      specialties: data.specialties || [],
      location: data.location,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      website: data.website,
      isPublished: true,
      subscriptionStatus: 'none',
      trialEndsAt: founderTrialEndsAt,
      isFounder,
      founderNumber,
      founderSince: isFounder ? new Date() : undefined,
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

    // Validate certifications if provided
    if (data.certifications && data.certifications.length > 0) {
      for (const cert of data.certifications) {
        if (!cert.certificationName?.trim() || !cert.institution?.trim()) {
          return res.status(400).json({ message: 'Each certification must have a name and institution' });
        }
        if (cert.yearCompleted && (cert.yearCompleted < 1900 || cert.yearCompleted > new Date().getFullYear() + 1)) {
          return res.status(400).json({ message: 'Invalid year for certification' });
        }
      }
    }

    // Validate pricing if provided
    if (data.pricing) {
      const hasAnyRate = [
        data.pricing.individualCounsellingRate,
        data.pricing.couplesCounsellingRate,
        data.pricing.familyCounsellingRate,
        data.pricing.onlineCounsellingRate,
      ].some(rate => typeof rate === 'number' && rate > 0);

      if (!hasAnyRate) {
        return res.status(400).json({ message: 'Please specify at least one service rate' });
      }
    }

    // Update fields
    if (data.type !== undefined) provider.type = data.type;
    if (data.displayName !== undefined) provider.displayName = data.displayName;
    if (data.bio !== undefined) provider.bio = data.bio;
    if (data.degrees !== undefined) provider.degrees = data.degrees;
    if (data.registrations !== undefined) provider.registrations = data.registrations;
    if (data.certifications !== undefined) provider.certifications = data.certifications;
    if (data.pricing !== undefined) provider.pricing = data.pricing;
    if (data.specialties !== undefined) provider.specialties = data.specialties;
    if (data.location !== undefined) provider.location = data.location;
    if (data.contactEmail !== undefined) provider.contactEmail = data.contactEmail;
    if (data.contactPhone !== undefined) provider.contactPhone = data.contactPhone;
    if (data.website !== undefined) provider.website = data.website;
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
      query['pricing.individualCounsellingRate'] = { $lte: params.maxRate };
    }
    if (params.freeConsultation) {
      query['pricing.offersIntroductoryConsultation'] = true;
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

// Configure multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Middleware to handle single image upload
export const uploadImageMiddleware = upload.single('image');

// Upload profile image (authenticated users only)
export const uploadProfileImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(500).json({ message: 'Image upload is not configured' });
    }

    const userId = req.userId!;

    // Get user's provider profile
    const provider = await Provider.findOne({ userId });
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Delete old image from Cloudinary if exists
    if (provider.profileImagePublicId) {
      try {
        await deleteImage(provider.profileImagePublicId);
      } catch (error) {
        console.error('Failed to delete old image:', error);
        // Continue anyway
      }
    }

    // Upload new image to Cloudinary
    const result = await uploadImage(
      req.file.buffer,
      'providers',
      `provider_${provider._id.toString()}`
    );

    // Update provider with new image URL
    provider.profileImage = result.url;
    provider.profileImagePublicId = result.publicId;
    await provider.save();

    res.json({
      message: 'Profile image uploaded successfully',
      imageUrl: result.url,
    });
  } catch (error: any) {
    console.error('Upload profile image error:', error);
    res.status(500).json({ message: error.message || 'Failed to upload image' });
  }
};

// Delete profile image (authenticated users only)
export const deleteProfileImage = async (req: AuthRequest, res: Response) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(500).json({ message: 'Image service is not configured' });
    }

    const userId = req.userId!;

    // Get user's provider profile
    const provider = await Provider.findOne({ userId });
    if (!provider) {
      return res.status(404).json({ message: 'Provider profile not found' });
    }

    if (!provider.profileImagePublicId) {
      return res.status(404).json({ message: 'No profile image to delete' });
    }

    // Delete from Cloudinary
    await deleteImage(provider.profileImagePublicId);

    // Remove from database
    provider.profileImage = undefined;
    provider.profileImagePublicId = undefined;
    await provider.save();

    res.json({ message: 'Profile image deleted successfully' });
  } catch (error: any) {
    console.error('Delete profile image error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete image' });
  }
};
