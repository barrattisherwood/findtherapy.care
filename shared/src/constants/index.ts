export const APP_NAME = 'findtherapy.care';

// ===========================================
// SUBSCRIPTION & TRIAL CONFIGURATION
// ===========================================
// Set to 0 to disable free trial
export const TRIAL_PERIOD_DAYS = 60;

// Monthly subscription price in Rands
export const SUBSCRIPTION_PRICE_ZAR = 150;

// ===========================================
// FOUNDERS DEAL CONFIGURATION
// ===========================================
// First 50 sign-ups get grandfathered pricing
export const FOUNDERS_MAX_SPOTS = 50;
export const FOUNDERS_PRICE_ZAR = 99;
export const FOUNDERS_TRIAL_DAYS = 180; // 6 months free
export const FOUNDERS_PROMO_CODE = 'FOUNDER50';

// Helper to check if trial is enabled
export const isTrialEnabled = () => TRIAL_PERIOD_DAYS > 0;

// Provider degrees (academic qualifications)
export const PROVIDER_DEGREES = [
  'BA',
  'BSc',
  'BSoSci (Hons)',
  'BPsych (Hons)',
  'MA',
  'MSocSci',
  'MHSc',
  'MEdPsych',
  'MSc',
  'Masters in Psychology (Int.)',
  'BA (Hons) Social Work',
  'BSoSci (Hons) Social',
  'MA Social Work',
  'MSW',
] as const;

// Professional registrations
export const PROVIDER_REGISTRATIONS = [
  'HPCSA',
  'SACSSP',
  'ASCHP',
  'CCSA',
  'Counselling-SA',
  'SAAC',
] as const;

// Provider specialties (expanded list)
export const PROVIDER_SPECIALTIES = [
  'Abortion & Miscarriage',
  'Abuse',
  'Addiction & Recovery',
  'ADHD',
  'Anger',
  'Anxiety & Stress',
  'Autism Spectrum',
  'Bullying',
  'Burnout & Chronic Fatigue',
  'Child & Adolescent counselling',
  'Chronic illness/pain',
  'Codependency',
  'Depression',
  'Divorce',
  'Eating disorders & Body Image',
  'Family counselling',
  'First Responder issues',
  'Grief & Loss',
  'Job loss / Unemployment',
  'LGBTQ issues',
  'Gender identity & Sexual orientation',
  'Marriage / Couples counselling',
  'Paranoia & Phobias',
  'Relationship issues',
  'Self-criticism & self-doubt',
  'Self-harm',
  'Self-esteem & confidence',
  'Sleep issues',
  'Suicide & Suicidal ideation',
  'Trauma, PTSD & Complex PTSD',
  'Workplace issues & Employee wellness',
] as const;

export type ProviderSpecialty = typeof PROVIDER_SPECIALTIES[number];

// Support group categories
export const SUPPORT_GROUP_CATEGORIES = [
  'Addiction Recovery',
  'Anxiety & Panic',
  'Bereavement & Grief',
  'Bipolar Disorder',
  'Cancer Support',
  'Caregivers',
  'Chronic Illness',
  'Depression',
  'Divorce & Separation',
  'Domestic Violence',
  'Eating Disorders',
  'HIV/AIDS',
  'LGBTQ+',
  'Mental Health',
  'New Parents',
  'PTSD & Trauma',
  'Relationship Support',
  'Single Parents',
  'Substance Abuse',
  'Suicide Loss Survivors',
] as const;

export type SupportGroupCategory = typeof SUPPORT_GROUP_CATEGORIES[number];

// City configurations for regional landing pages
export * from './cities.js';
