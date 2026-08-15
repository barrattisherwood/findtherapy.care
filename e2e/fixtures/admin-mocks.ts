/**
 * Mock API response fixtures for admin E2E tests.
 */

export const adminAuthResponse = {
  token: 'mock-admin-jwt-token',
  user: { id: 'admin-001', email: 'admin@findtherapy.care', isAdmin: true, name: 'Admin' },
};

// Matches the DashboardMetrics interface exactly (nested structure)
export const dashboardMetrics = {
  dateRange: {
    startDate: new Date('2026-05-25').toISOString(),
    endDate: new Date('2026-06-24').toISOString(),
    label: 'Last 30 days',
  },
  users: {
    totalUsers: 387,
    newUsers: 12,
    growthPercentage: 8.3,
    registrationTimeSeries: [],
  },
  providers: {
    totalProviders: 142,
    activeSubscriptions: 89,
    trialsActive: 23,
    trialConversionRate: 45.2,
    providerTypeBreakdown: {
      psychologist: 48,
      counsellor: 61,
      'social-worker': 15,
      coach: 12,
      psychometrist: 6,
    },
  },
  revenue: {
    monthlyRecurringRevenue: 13350,
    totalRevenueCollected: 89100,
    activeSubscriptionCount: 89,
    averageRevenuePerProvider: 150,
  },
  supportGroups: {
    totalGroups: 15,
    activeGroups: 12,
    categoryBreakdown: { anxiety: 3, depression: 5 },
    meetingTypeBreakdown: { 'in-person': 8, online: 7 },
  },
};

// Matches BlogMetrics interface
export const blogMetrics = {
  totalPosts: 24,
  publishedPosts: 18,
  draftPosts: 4,
  scheduledPosts: 2,
  totalViews: 9341,
  totalLikes: 214,
  avgReadingTime: 5,
  popularCategories: [
    { category: 'Anxiety', count: 6 },
    { category: 'Depression', count: 4 },
  ],
  popularTags: [
    { tag: 'mental-health', count: 12 },
    { tag: 'therapy', count: 8 },
  ],
  recentPosts: [
    { _id: 'post-001', title: 'Understanding Anxiety', slug: 'understanding-anxiety', views: 1240, publishedAt: new Date('2026-06-01').toISOString() },
    { _id: 'post-002', title: 'Signs of Burnout', slug: 'signs-of-burnout', views: 987, publishedAt: new Date('2026-05-20').toISOString() },
  ],
  monthlyStats: [
    { month: '2026-06', posts: 3, views: 2100 },
    { month: '2026-05', posts: 5, views: 3400 },
  ],
};

// Matches AdminLog interface (uses 'id' not '_id')
export const recentLogs = [
  { id: 'log-001', action: 'vet_provider', targetId: 'p-001', targetName: 'Dr. Smith', adminId: 'admin-001', adminEmail: 'admin@findtherapy.care', details: { vettingStatus: 'approved' }, createdAt: new Date('2026-06-20T10:30:00').toISOString() },
  { id: 'log-002', action: 'vet_provider', targetId: 'p-002', targetName: 'Ms. Jones', adminId: 'admin-001', adminEmail: 'admin@findtherapy.care', details: { vettingStatus: 'rejected', vettingNotes: 'Missing credentials' }, createdAt: new Date('2026-06-19T15:00:00').toISOString() },
  { id: 'log-003', action: 'suspend_provider', targetId: 'p-003', targetName: 'Mr. Brown', adminId: 'admin-001', adminEmail: 'admin@findtherapy.care', details: { reason: 'Code of conduct violation' }, createdAt: new Date('2026-06-18T09:00:00').toISOString() },
];

// Matches SentryIssue interface (count is string, includes userCount/firstSeen)
export const sentryIssues = {
  configured: true,
  issues: [
    { id: 'sentry-001', title: 'TypeError: Cannot read property', level: 'error', count: '12', userCount: 3, firstSeen: new Date('2026-06-01').toISOString(), lastSeen: new Date('2026-06-22').toISOString(), permalink: 'https://sentry.io/issues/1' },
    { id: 'sentry-002', title: 'Network request failed', level: 'warning', count: '3', userCount: 1, firstSeen: new Date('2026-06-10').toISOString(), lastSeen: new Date('2026-06-21').toISOString(), permalink: 'https://sentry.io/issues/2' },
  ],
};

// Matches PendingProviderListResponse
export const pendingProviders = {
  providers: [
    {
      id: 'p-pending-001',
      displayName: 'Dr. Amara Nkosi',
      type: 'psychologist',
      contactEmail: 'amara@example.com',
      location: { city: 'johannesburg', cityDisplay: 'Johannesburg' },
      vettingStatus: 'pending',
      isPublished: false,
      createdAt: new Date('2026-06-18').toISOString(),
      degrees: ['MA', 'PhD'],
      professionalBodies: [{ body: 'HPCSA', registrationNumber: 'PS067890' }],
      bio: 'Clinical psychologist with 8 years experience in trauma and PTSD.',
      documents: [
        {
          id: 'doc-admin-001',
          documentType: 'hpcsa_registration',
          fileName: 'hpcsa-cert.pdf',
          fileType: 'pdf',
          fileAvailable: true,
          reviewOutcome: null,
          uploadedAt: new Date('2026-06-18').toISOString(),
        },
      ],
    },
    {
      id: 'p-pending-002',
      displayName: 'Lindiwe Dlamini',
      type: 'counsellor',
      contactEmail: 'lindiwe@example.com',
      location: { city: 'cape-town', cityDisplay: 'Cape Town' },
      vettingStatus: 'pending',
      isPublished: false,
      createdAt: new Date('2026-06-19').toISOString(),
      degrees: ['BA'],
      professionalBodies: [{ body: 'ASCHP', registrationNumber: 'CH12345' }],
      bio: 'Registered counsellor specialising in grief and relationship issues.',
      documents: [
        {
          id: 'doc-admin-002',
          documentType: 'aschp_registration',
          fileName: 'aschp-cert.jpg',
          fileType: 'jpg',
          fileAvailable: false,
          reviewOutcome: null,
          uploadedAt: new Date('2026-06-19').toISOString(),
        },
      ],
    },
  ],
  total: 2,
  page: 1,
  totalPages: 1,
};

// Matches AdminProviderListResponse
export const allProviders = {
  providers: [
    {
      id: 'p-001',
      displayName: 'Dr. Sarah Mitchell',
      contactEmail: 'sarah@example.com',
      type: 'psychologist',
      vettingStatus: 'approved',
      isPublished: true,
      isSuspended: false,
      isFounder: true,
      accessStatus: 'trial',
      subscriptionStatus: 'none',
      viewCount: 0,
      isAdmin: false,
      location: { city: 'cape-town', cityDisplay: 'Cape Town' },
      createdAt: new Date('2026-01-15').toISOString(),
    },
    {
      id: 'p-002',
      displayName: 'James van der Berg',
      contactEmail: 'james@example.com',
      type: 'counsellor',
      vettingStatus: 'approved',
      isPublished: true,
      isSuspended: false,
      isFounder: false,
      accessStatus: 'active',
      subscriptionStatus: 'active',
      viewCount: 0,
      isAdmin: false,
      location: { city: 'johannesburg', cityDisplay: 'Johannesburg' },
      createdAt: new Date('2026-02-20').toISOString(),
    },
    {
      id: 'p-003',
      displayName: 'Fatima Osman',
      contactEmail: 'fatima@example.com',
      type: 'social-worker',
      vettingStatus: 'pending',
      isPublished: false,
      isSuspended: false,
      isFounder: false,
      accessStatus: 'expired',
      subscriptionStatus: 'expired',
      viewCount: 0,
      isAdmin: false,
      location: { city: 'durban', cityDisplay: 'Durban' },
      createdAt: new Date('2026-03-10').toISOString(),
    },
  ],
  total: 142,
  page: 1,
  totalPages: 15,
};

// Matches ContactMessage interface
export const adminMessages = {
  messages: [
    {
      id: 'msg-001',
      type: 'site',
      senderName: 'Thabo Mokoena',
      senderEmail: 'thabo@example.com',
      subject: 'Question about listing my practice',
      message: 'Hi, I am a registered psychologist in Johannesburg and would like to know more about how to get listed on your directory. What are the requirements and costs?',
      isRead: false,
      createdAt: new Date('2026-06-22T09:15:00').toISOString(),
    },
    {
      id: 'msg-002',
      type: 'provider',
      providerId: 'p-001',
      providerName: 'Dr. Sarah Mitchell',
      senderName: 'Nomsa Khumalo',
      senderEmail: 'nomsa@example.com',
      senderPhone: '071 234 5678',
      message: 'I would like to book an initial consultation. Are you available next week?',
      isRead: true,
      createdAt: new Date('2026-06-21T14:30:00').toISOString(),
    },
    {
      id: 'msg-003',
      type: 'site',
      senderName: 'Priya Naidoo',
      senderEmail: 'priya@example.com',
      subject: 'Incorrect information on profile',
      message: 'There seems to be an error in one of the provider profiles. The phone number listed appears to be incorrect.',
      isRead: false,
      createdAt: new Date('2026-06-20T11:00:00').toISOString(),
    },
  ],
  total: 3,
  unreadCount: 2,
  totalPages: 1,
};

// Matches AdminLogListResponse
export const adminLogs = {
  logs: recentLogs,
  total: 3,
  page: 1,
  totalPages: 1,
};

// Matches BlogPostsResponse (posts array with _id)
export const adminBlogPosts = {
  posts: [
    {
      _id: 'post-001',
      title: 'Understanding Anxiety: A Guide for South Africans',
      slug: 'understanding-anxiety',
      status: 'published',
      categories: ['Anxiety'],
      tags: ['mental-health', 'anxiety'],
      author: { _id: 'admin-001', name: 'Admin', email: 'admin@findtherapy.care' },
      authorDisplayName: 'Dr. Naledi Dlamini',
      views: 1240,
      likes: 34,
      readingTime: 6,
      createdAt: new Date('2026-06-01').toISOString(),
      updatedAt: new Date('2026-06-01').toISOString(),
      publishedAt: new Date('2026-06-01').toISOString(),
    },
    {
      _id: 'post-002',
      title: 'Signs of Burnout and How to Recover',
      slug: 'signs-of-burnout',
      status: 'published',
      categories: ['Burnout'],
      tags: ['burnout', 'wellbeing'],
      author: { _id: 'admin-001', name: 'Admin', email: 'admin@findtherapy.care' },
      authorDisplayName: 'Staff writer',
      views: 987,
      likes: 21,
      readingTime: 5,
      createdAt: new Date('2026-05-20').toISOString(),
      updatedAt: new Date('2026-05-20').toISOString(),
      publishedAt: new Date('2026-05-20').toISOString(),
    },
    {
      _id: 'post-003',
      title: 'Finding the Right Therapist',
      slug: 'finding-the-right-therapist',
      status: 'draft',
      categories: ['Therapy'],
      tags: ['therapy', 'mental-health'],
      author: { _id: 'admin-001', name: 'Admin', email: 'admin@findtherapy.care' },
      authorDisplayName: 'Staff writer',
      views: 0,
      likes: 0,
      readingTime: 4,
      createdAt: new Date('2026-06-22').toISOString(),
      updatedAt: new Date('2026-06-22').toISOString(),
    },
  ],
  totalCount: 3,
  currentPage: 1,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

export const adminFeatureFlags = {
  flags: [
    {
      _id: 'ff-001',
      key: 'provider_blog',
      description: 'Provider-written blog submissions (invitation campaigns, submission form, Claude review workflow)',
      enabled: false,
      allowlistedAdminIds: ['admin-001', 'admin-002'],
      createdAt: new Date('2026-07-01').toISOString(),
      updatedAt: new Date('2026-07-01').toISOString(),
    },
  ],
};
