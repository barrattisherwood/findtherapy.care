import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import Provider from '../models/Provider';
import SupportGroup from '../models/SupportGroup';
import PaymentEvent from '../models/PaymentEvent';
import { SUBSCRIPTION_PRICE_ZAR } from '@findlocal/shared';
import {
  DashboardMetrics,
  UserMetrics,
  ProviderMetrics,
  RevenueMetrics,
  SupportGroupMetrics,
} from '@findlocal/shared';

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
