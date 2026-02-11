export interface DashboardMetrics {
  dateRange: {
    startDate: Date;
    endDate: Date;
    label: string;
  };
  users: UserMetrics;
  providers: ProviderMetrics;
  revenue: RevenueMetrics;
  supportGroups: SupportGroupMetrics;
}

export interface UserMetrics {
  totalUsers: number;
  newUsers: number;
  growthPercentage: number;
  registrationTimeSeries: TimeSeriesPoint[];
}

export interface ProviderMetrics {
  totalProviders: number;
  activeSubscriptions: number;
  trialsActive: number;
  trialConversionRate: number;
  providerTypeBreakdown: Record<string, number>;
}

export interface RevenueMetrics {
  monthlyRecurringRevenue: number;
  totalRevenueCollected: number;
  activeSubscriptionCount: number;
  averageRevenuePerProvider: number;
}

export interface SupportGroupMetrics {
  totalGroups: number;
  activeGroups: number;
  categoryBreakdown: Record<string, number>;
  meetingTypeBreakdown: Record<string, number>;
}

export interface TimeSeriesPoint {
  date: Date;
  count: number;
}

export interface DashboardRequest {
  days?: number; // 7, 30, or 90
}
