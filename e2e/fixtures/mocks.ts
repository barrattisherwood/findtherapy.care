/**
 * Mock API response fixtures for the founder E2E flow.
 * These match the real response shapes from the backend.
 */

// GET /api/promo/founders-deal
export const foundersDealStatus = {
  totalSpots: 50,
  spotsTaken: 23,
  spotsRemaining: 27,
  isAvailable: true,
  trialDays: 180,
  trialMonths: 6,
  monthlyPrice: 99,
  regularPrice: 150,
};

// POST /api/auth/register + GET /api/auth/me
export const authResponse = {
  token: 'mock-jwt-token-for-e2e',
  user: { id: 'user-e2e-001', email: 'founder@test.com', isAdmin: false },
};

// POST /api/providers — profile created, awaiting vetting
export const pendingFounderProvider = {
  _id: 'provider-e2e-001',
  displayName: 'Dr. Jane Founder',
  type: 'psychologist',
  bio: 'Experienced psychologist specialising in anxiety and depression.',
  vettingStatus: 'pending',
  isFounder: true,
  founderNumber: 24,
  founderSince: new Date().toISOString(),
  subscriptionStatus: 'none',
  isPublished: false,
  location: { city: 'Cape Town', postcode: '8001' },
  specialties: ['Anxiety', 'Depression'],
  pricing: { individual: 900 },
  contactEmail: 'founder@test.com',
  degrees: ['MA'],
  professionalBodies: [{ body: 'HPCSA', registrationNumber: 'PS12345' }],
  certifications: [],
};

// GET /api/providers/me — after vetting approval, trial active
export const approvedFounderProvider = {
  ...pendingFounderProvider,
  vettingStatus: 'approved',
  isPublished: true,
  trialEndsAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
};

// GET /api/subscriptions/status — trial active
export const trialActiveStatus = {
  subscriptionStatus: 'none',
  accessStatus: 'trial',
  trialEndsAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
  isFounder: true,
  daysRemaining: 180,
  subscriptionPrice: 99,
};

// GET /api/providers — public search results including our founder
export const providerSearchResults = {
  providers: [
    {
      _id: 'provider-e2e-001',
      id: 'provider-e2e-001',
      displayName: 'Dr. Jane Founder',
      type: 'psychologist',
      bio: 'Experienced psychologist specialising in anxiety and depression.',
      location: { city: 'Cape Town', postcode: '8001' },
      specialties: ['Anxiety', 'Depression'],
      pricing: { individual: 900 },
      isFounder: true,
      vettingStatus: 'approved',
      isPublished: true,
    },
  ],
  total: 1,
  page: 1,
  totalPages: 1,
};
