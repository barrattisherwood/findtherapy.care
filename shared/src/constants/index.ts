export const APP_NAME = 'findtherapy.care';

// ===========================================
// SUBSCRIPTION & TRIAL CONFIGURATION
// ===========================================
// Set to 0 to disable free trial
export const TRIAL_PERIOD_DAYS = 60;

// Monthly subscription price in Rands
export const SUBSCRIPTION_PRICE_ZAR = 150;

// Helper to check if trial is enabled
export const isTrialEnabled = () => TRIAL_PERIOD_DAYS > 0;

// Provider specialties
export const PROVIDER_SPECIALTIES = [
  'Anxiety',
  'Depression',
  'Trauma & PTSD',
  'Grief & Loss',
  'Relationship Issues',
  'Couples Therapy',
  'Family Therapy',
  'Addiction & Recovery',
  'Eating Disorders',
  'OCD',
  'ADHD',
  'Autism Spectrum',
  'Stress Management',
  'Self-Esteem',
  'Life Transitions',
  'Career Counselling',
  'Anger Management',
  'Parenting',
  'Child & Adolescent',
  'LGBTQ+',
] as const;

export type ProviderSpecialty = typeof PROVIDER_SPECIALTIES[number];

// Provider qualifications
export const PROVIDER_QUALIFICATIONS = [
  'HPCSA Registered',
  'SACSSP Registered',
  'BPsych',
  'MA Psychology',
  'MSc Psychology',
  'PhD Psychology',
  'BA Social Work',
  'MA Social Work',
  'Certified Counsellor',
  'EMDR Trained',
  'CBT Trained',
  'DBT Trained',
] as const;

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
