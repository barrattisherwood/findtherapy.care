import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Provider } from '../models/Provider';
import { SupportGroup } from '../models/SupportGroup';
import { PaymentEvent } from '../models/PaymentEvent';
import { SUBSCRIPTION_PRICE_ZAR, VetProviderRequest, ProviderAccessStatus } from '@findlocal/shared';
import {
  DashboardMetrics,
  UserMetrics,
  ProviderMetrics,
  RevenueMetrics,
  SupportGroupMetrics,
} from '@findlocal/shared';

// ============================================
// Provider Management (full list, suspend, delete)
// ============================================

// Helper to determine provider access status
function getProviderAccessStatus(provider: any): ProviderAccessStatus {
  const now = new Date();
  if (provider.subscriptionStatus === 'active') return 'active';
  if (provider.trialEndsAt && new Date(provider.trialEndsAt) > now) return 'trial';
  if (provider.trialEndsAt && new Date(provider.trialEndsAt) <= now) return 'expired';
  return 'none';
}

// List all providers with filtering, sorting, search
export const getAllProviders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Status filter
    const status = req.query.status as string;
    if (status === 'published') filter.isPublished = true;
    if (status === 'unpublished') filter.isPublished = false;
    if (status === 'suspended') filter.isSuspended = true;

    // Vetting filter
    const vetting = req.query.vetting as string;
    if (['pending', 'approved', 'rejected'].includes(vetting)) {
      filter.vettingStatus = vetting;
    }

    // Type filter
    const type = req.query.type as string;
    if (['psychologist', 'counsellor', 'social-worker', 'coach'].includes(type)) {
      filter.type = type;
    }

    // Search by name or email
    const search = req.query.search as string;
    if (search?.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { displayName: searchRegex },
        { contactEmail: searchRegex },
      ];
    }

    // Sort
    const sortField = req.query.sortBy as string || 'createdAt';
    const sortDir = req.query.sortDir === 'asc' ? 1 : -1;
    const allowedSorts = ['createdAt', 'displayName', 'type', 'vettingStatus', 'viewCount'];
    const sort: any = {};
    sort[allowedSorts.includes(sortField) ? sortField : 'createdAt'] = sortDir;

    const [providers, total] = await Promise.all([
      Provider.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('displayName type contactEmail vettingStatus isPublished isSuspended subscriptionStatus trialEndsAt viewCount isFounder founderNumber createdAt profileImage userId'),
      Provider.countDocuments(filter),
    ]);

    // Look up isAdmin status for each provider's user account
    const userIds = providers.map(p => p.userId).filter(Boolean);
    const adminUsers = await User.find({ _id: { $in: userIds }, isAdmin: true }).select('_id');
    const adminUserIdSet = new Set(adminUsers.map(u => u._id.toString()));

    res.json({
      providers: providers.map(p => ({
        id: p._id.toString(),
        displayName: p.displayName,
        type: p.type,
        contactEmail: p.contactEmail,
        vettingStatus: p.vettingStatus,
        isPublished: p.isPublished,
        isSuspended: p.isSuspended || false,
        subscriptionStatus: p.subscriptionStatus,
        accessStatus: getProviderAccessStatus(p),
        trialEndsAt: p.trialEndsAt,
        viewCount: p.viewCount,
        isFounder: p.isFounder || false,
        founderNumber: p.founderNumber,
        profileImage: p.profileImage,
        createdAt: p.createdAt,
        isAdmin: adminUserIdSet.has(p.userId),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching all providers:', error);
    res.status(500).json({ message: 'Failed to fetch providers' });
  }
};

// Suspend / unsuspend a provider
export const suspendProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { suspended, reason } = req.body;

    if (typeof suspended !== 'boolean') {
      res.status(400).json({ message: 'suspended must be a boolean' });
      return;
    }

    const update = suspended
      ? {
          $set: {
            isSuspended: true,
            isPublished: false,
            suspensionReason: reason || 'Suspended by admin',
            suspendedAt: new Date(),
            suspendedBy: req.userId!,
          },
        }
      : {
          $set: { isSuspended: false },
          $unset: { suspensionReason: '', suspendedAt: '', suspendedBy: '' },
        };

    const provider = await Provider.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: false,
      select: 'displayName isSuspended isPublished',
    });

    if (!provider) {
      res.status(404).json({ message: 'Provider not found' });
      return;
    }

    res.json({
      message: `Provider ${suspended ? 'suspended' : 'unsuspended'} successfully`,
      provider: {
        id: provider._id.toString(),
        displayName: provider.displayName,
        isSuspended: provider.isSuspended,
        isPublished: provider.isPublished,
      },
    });
  } catch (error) {
    console.error('Error suspending provider:', error);
    res.status(500).json({ message: 'Failed to suspend provider' });
  }
};

// Delete a provider and their associated user account
export const deleteProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const provider = await Provider.findById(id);
    if (!provider) {
      res.status(404).json({ message: 'Provider not found' });
      return;
    }

    const userId = provider.userId;
    const displayName = provider.displayName;

    // Delete the provider profile
    await Provider.findByIdAndDelete(id);

    // Delete the associated user account
    await User.findByIdAndDelete(userId);

    res.json({
      message: `Provider "${displayName}" and associated user account deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting provider:', error);
    res.status(500).json({ message: 'Failed to delete provider' });
  }
};

// ============================================
// Provider Vetting
// ============================================

// List providers pending vetting
export const getPendingProviders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // Optional status filter (default: pending)
    const status = req.query.status as string || 'pending';
    const validStatuses = ['pending', 'approved', 'rejected'];
    const filter: any = {};
    if (validStatuses.includes(status)) {
      filter.vettingStatus = status;
    }

    const [providers, total] = await Promise.all([
      Provider.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('displayName type professionalBodies vettingStatus vettingNotes vettedAt createdAt contactEmail'),
      Provider.countDocuments(filter),
    ]);

    res.json({
      providers: providers.map(p => ({
        id: p._id.toString(),
        displayName: p.displayName,
        type: p.type,
        professionalBodies: p.professionalBodies,
        vettingStatus: p.vettingStatus,
        vettingNotes: p.vettingNotes,
        vettedAt: p.vettedAt,
        contactEmail: p.contactEmail,
        createdAt: p.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching providers for vetting:', error);
    res.status(500).json({ message: 'Failed to fetch providers' });
  }
};

// Vet (approve/reject) a provider
export const vetProvider = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes }: VetProviderRequest = req.body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(400).json({ message: 'Status must be "approved" or "rejected"' });
      return;
    }

    const provider = await Provider.findById(id);
    if (!provider) {
      res.status(404).json({ message: 'Provider not found' });
      return;
    }

    provider.vettingStatus = status;
    provider.vettingNotes = notes || undefined;
    provider.vettedAt = new Date();
    provider.vettedBy = req.userId!;

    // Start trial on approval — founders get extended trial
    if (status === 'approved' && !provider.trialEndsAt) {
      const { TRIAL_PERIOD_DAYS, FOUNDERS_TRIAL_DAYS, isTrialEnabled } = await import('@findlocal/shared');
      if (isTrialEnabled()) {
        const trialDays = provider.isFounder ? FOUNDERS_TRIAL_DAYS : TRIAL_PERIOD_DAYS;
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + trialDays);
        provider.trialEndsAt = trialEnd;
      }
    }

    await provider.save();

    // Send email notification to the provider
    try {
      const { sendVettingApprovedEmail, sendVettingRejectedEmail } = await import('../services/emailService');
      if (status === 'approved') {
        await sendVettingApprovedEmail(provider.contactEmail, provider.displayName);
      } else {
        await sendVettingRejectedEmail(provider.contactEmail, provider.displayName, notes);
      }
    } catch (emailErr) {
      console.error('Failed to send vetting notification email:', emailErr);
    }

    res.json({
      message: `Provider ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      provider: {
        id: provider._id.toString(),
        displayName: provider.displayName,
        vettingStatus: provider.vettingStatus,
        vettedAt: provider.vettedAt,
      },
    });
  } catch (error) {
    console.error('Error vetting provider:', error);
    res.status(500).json({ message: 'Failed to vet provider' });
  }
};

// Get count of pending providers (for badge in admin nav)
export const getPendingCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await Provider.countDocuments({ vettingStatus: 'pending' });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching pending count:', error);
    res.status(500).json({ message: 'Failed to fetch pending count' });
  }
};

export const getDashboardMetrics = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Parse days parameter (default to 30 days)
    const days = parseInt(req.query.days as string) || 30;

    // Calculate date ranges
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // For growth percentage comparison
    const compareStartDate = new Date(startDate);
    compareStartDate.setDate(compareStartDate.getDate() - days);

    // Fetch all metrics in parallel
    const [users, providers, revenue, supportGroups] = await Promise.all([
      getUserMetrics(startDate, endDate, compareStartDate),
      getProviderMetrics(),
      getRevenueMetrics(startDate, endDate),
      getSupportGroupMetrics(),
    ]);

    const metrics: DashboardMetrics = {
      dateRange: {
        startDate,
        endDate,
        label: `Last ${days} days`,
      },
      users,
      providers,
      revenue,
      supportGroups,
    };

    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      message: 'Failed to fetch dashboard metrics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// User Metrics
async function getUserMetrics(
  startDate: Date,
  endDate: Date,
  compareStartDate: Date
): Promise<UserMetrics> {
  const [totalUsers, newUsers, previousPeriodUsers, timeSeries] = await Promise.all([
    // Total users
    User.countDocuments(),

    // New users in period
    User.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    }),

    // Previous period users (for growth %)
    User.countDocuments({
      createdAt: { $gte: compareStartDate, $lt: startDate },
    }),

    // Time series data (group by day)
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const growthPercentage =
    previousPeriodUsers > 0
      ? ((newUsers - previousPeriodUsers) / previousPeriodUsers) * 100
      : newUsers > 0
        ? 100
        : 0;

  return {
    totalUsers,
    newUsers,
    growthPercentage: Math.round(growthPercentage * 10) / 10,
    registrationTimeSeries: timeSeries.map((t) => ({
      date: new Date(t._id),
      count: t.count,
    })),
  };
}

// Provider Metrics
async function getProviderMetrics(): Promise<ProviderMetrics> {
  const now = new Date();

  const [totalProviders, activeSubscriptions, trialsActive, typeBreakdown] =
    await Promise.all([
      // Total providers
      Provider.countDocuments(),

      // Active subscriptions (status = 'active')
      Provider.countDocuments({
        subscriptionStatus: 'active',
      }),

      // Active trials (trialEndsAt > now AND subscriptionStatus = 'none')
      Provider.countDocuments({
        trialEndsAt: { $gt: now },
        subscriptionStatus: 'none',
      }),

      // Provider type breakdown
      Provider.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  // Trial conversion rate (providers who had trial and now have subscription)
  const totalTrialUsers = await Provider.countDocuments({
    trialEndsAt: { $exists: true },
  });

  const convertedUsers = await Provider.countDocuments({
    trialEndsAt: { $exists: true },
    subscriptionStatus: 'active',
  });

  const trialConversionRate =
    totalTrialUsers > 0 ? (convertedUsers / totalTrialUsers) * 100 : 0;

  const providerTypeBreakdownObj = typeBreakdown.reduce(
    (acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalProviders,
    activeSubscriptions,
    trialsActive,
    trialConversionRate: Math.round(trialConversionRate * 10) / 10,
    providerTypeBreakdown: providerTypeBreakdownObj,
  };
}

// Revenue Metrics
async function getRevenueMetrics(
  startDate: Date,
  endDate: Date
): Promise<RevenueMetrics> {
  const [activeSubscriptionCount, recentPayments] = await Promise.all([
    // Active subscriptions
    Provider.countDocuments({
      subscriptionStatus: 'active',
    }),

    // Total revenue from PaymentEvents in period
    PaymentEvent.aggregate([
      {
        $match: {
          paymentStatus: 'COMPLETE',
          processedAt: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: { $toDouble: '$amountGross' },
          },
        },
      },
    ]),
  ]);

  const monthlyRecurringRevenue = activeSubscriptionCount * SUBSCRIPTION_PRICE_ZAR;
  const totalRevenueCollected = recentPayments[0]?.totalRevenue || 0;
  const averageRevenuePerProvider =
    activeSubscriptionCount > 0 ? monthlyRecurringRevenue / activeSubscriptionCount : 0;

  return {
    monthlyRecurringRevenue,
    totalRevenueCollected: Math.round(totalRevenueCollected * 100) / 100,
    activeSubscriptionCount,
    averageRevenuePerProvider: Math.round(averageRevenuePerProvider * 100) / 100,
  };
}

// Support Group Metrics
async function getSupportGroupMetrics(): Promise<SupportGroupMetrics> {
  const [totalGroups, activeGroups, categoryBreakdown, meetingTypeBreakdown] =
    await Promise.all([
      // Total support groups
      SupportGroup.countDocuments(),

      // Active support groups
      SupportGroup.countDocuments({
        isActive: true,
      }),

      // Category breakdown
      SupportGroup.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Meeting type breakdown
      SupportGroup.aggregate([
        {
          $group: {
            _id: '$meetingType',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  return {
    totalGroups,
    activeGroups,
    categoryBreakdown: categoryBreakdown.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {} as Record<string, number>
    ),
    meetingTypeBreakdown: meetingTypeBreakdown.reduce(
      (acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}
