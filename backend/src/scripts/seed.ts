import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Provider } from '../models/Provider';
import { SupportGroup } from '../models/SupportGroup';
import { TRIAL_PERIOD_DAYS, isTrialEnabled } from '@findlocal/shared';

dotenv.config();

// Helper to get trial end date for seed data
const getTrialEndDate = (): Date | undefined => {
  if (!isTrialEnabled()) return undefined;
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_PERIOD_DAYS);
  return trialEnd;
};

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findlocal';

// Seed data for providers (users + provider profiles)
const providerSeedData = [
  {
    user: {
      email: 'dr.sarah.nkosi@findtherapy.care',
      username: 'dr_sarah_nkosi',
      password: 'password123',
    },
    provider: {
      type: 'psychologist' as const,
      displayName: 'Dr. Sarah Nkosi',
      bio: `I am a clinical psychologist with over 15 years of experience helping individuals navigate life's challenges. My approach is warm, empathetic, and evidence-based, drawing primarily from Cognitive Behavioural Therapy (CBT) and mindfulness practices.

I believe that everyone has the capacity for growth and healing. My role is to provide a safe, non-judgmental space where you can explore your thoughts and feelings, develop new coping strategies, and work towards meaningful change.

I have particular expertise in treating anxiety disorders, depression, and trauma. I also work extensively with professionals experiencing burnout and work-related stress.`,
      degrees: ['MA', 'MSc'],
      professionalBodies: [{ body: 'HPCSA', registrationNumber: 'PS 0123456' }],
      vettingStatus: 'approved' as const,
      certifications: [
        {
          certificationName: 'Cognitive Behavioural Therapy (CBT)',
          institution: 'South African Institute of Cognitive Therapy',
          yearCompleted: 2012,
        },
        {
          certificationName: 'EMDR Level 2',
          institution: 'EMDR Association of South Africa',
          yearCompleted: 2015,
        },
      ],
      specialties: ['Anxiety & Stress', 'Depression', 'Trauma, PTSD & Complex PTSD', 'Burnout & Chronic Fatigue'],
      location: {
        address: '45 Oxford Road, Rosebank',
        city: 'Johannesburg',
        postcode: '2196',
      },
      contactEmail: 'dr.sarah.nkosi@findtherapy.care',
      contactPhone: '+27 11 447 5890',
      website: 'https://drsarahnkosi.co.za',
      pricing: {
        individualCounsellingRate: 1500,
        onlineCounsellingRate: 1300,
        offersIntroductoryConsultation: true,
      },
      subscriptionStatus: 'none' as const,
      trialEndsAt: getTrialEndDate(),
    },
  },
  {
    user: {
      email: 'michael.van.der.merwe@findtherapy.care',
      username: 'michael_vdm_counselling',
      password: 'password123',
    },
    provider: {
      type: 'counsellor' as const,
      displayName: 'Michael van der Merwe',
      bio: `As a registered counsellor with a passion for helping people through difficult times, I specialise in relationship counselling and family therapy. I work with individuals, couples, and families to improve communication, resolve conflicts, and build stronger connections.

My approach is collaborative and solution-focused. I believe that you are the expert on your own life, and my job is to help you find your own answers and develop the skills you need to create the relationships you want.

I have extensive experience working with blended families, couples facing infidelity, and parents navigating the challenges of raising teenagers.`,
      degrees: ['MA'],
      professionalBodies: [
        { body: 'SACSSP', registrationNumber: 'SW 0012345' },
        { body: 'CCSA', registrationNumber: 'CC 0012345' },
      ],
      vettingStatus: 'approved' as const,
      certifications: [
        {
          certificationName: 'Solution-Focused Brief Therapy',
          institution: 'South African Family Practice Institute',
          yearCompleted: 2018,
        },
      ],
      specialties: ['Relationship issues', 'Marriage / Couples counselling', 'Family counselling'],
      location: {
        address: '12 Kloof Street, Gardens',
        city: 'Cape Town',
        postcode: '8001',
      },
      contactEmail: 'michael.van.der.merwe@findtherapy.care',
      contactPhone: '+27 21 424 5678',
      pricing: {
        individualCounsellingRate: 950,
        couplesCounsellingRate: 1400,
        familyCounsellingRate: 1600,
        offersIntroductoryConsultation: true,
      },
      subscriptionStatus: 'none' as const,
      trialEndsAt: getTrialEndDate(),
    },
  },
  {
    user: {
      email: 'thandiwe.dlamini@findtherapy.care',
      username: 'thandiwe_dlamini',
      password: 'password123',
    },
    provider: {
      type: 'psychologist' as const,
      displayName: 'Thandiwe Dlamini',
      bio: `I am a clinical psychologist specialising in trauma therapy and PTSD treatment. Having worked extensively with survivors of violence and abuse, I understand the profound impact that trauma can have on every aspect of a person's life.

I use evidence-based approaches including EMDR (Eye Movement Desensitisation and Reprocessing) and trauma-focused CBT to help clients process traumatic experiences and reclaim their lives. I also incorporate culturally sensitive practices that honour each client's background and beliefs.

My practice is a safe haven where healing can begin. I am committed to walking alongside you on your journey to recovery.`,
      degrees: ['MA'],
      professionalBodies: [{ body: 'HPCSA', registrationNumber: 'PS 0234567' }],
      vettingStatus: 'approved' as const,
      certifications: [
        {
          certificationName: 'EMDR Level 1 & 2',
          institution: 'EMDR Association of South Africa',
          yearCompleted: 2017,
        },
        {
          certificationName: 'Trauma-Focused CBT',
          institution: 'University of KwaZulu-Natal',
          yearCompleted: 2019,
        },
      ],
      specialties: ['Trauma, PTSD & Complex PTSD', 'Grief & Loss', 'Anxiety & Stress', 'Depression'],
      location: {
        address: '78 Peter Mokaba Road, Morningside',
        city: 'Durban',
        postcode: '4001',
      },
      contactEmail: 'thandiwe.dlamini@findtherapy.care',
      contactPhone: '+27 31 312 4567',
      website: 'https://thandiwedlamini.co.za',
      pricing: {
        individualCounsellingRate: 1200,
        onlineCounsellingRate: 1000,
        offersIntroductoryConsultation: false,
      },
      subscriptionStatus: 'none' as const,
      trialEndsAt: getTrialEndDate(),
    },
  },
  {
    user: {
      email: 'johan.pretorius@findtherapy.care',
      username: 'johan_pretorius',
      password: 'password123',
    },
    provider: {
      type: 'social-worker' as const,
      displayName: 'Johan Pretorius',
      bio: `I am a registered social worker with a focus on addiction recovery and substance abuse treatment. Having worked in rehabilitation centres for over a decade, I understand the complexities of addiction and the courage it takes to seek help.

My approach combines motivational interviewing, CBT, and 12-step facilitation. I believe in treating the whole person, not just the addiction, and I work with clients to address underlying issues and build a sustainable recovery.

Whether you're taking your first steps towards sobriety or working to maintain long-term recovery, I'm here to support you with compassion and without judgment.`,
      degrees: ['BA (Hons) Social Work'],
      professionalBodies: [{ body: 'SACSSP', registrationNumber: 'SW 0023456' }],
      vettingStatus: 'approved' as const,
      certifications: [
        {
          certificationName: 'Motivational Interviewing',
          institution: 'South African Addiction Medicine Society',
          yearCompleted: 2016,
        },
        {
          certificationName: '12-Step Facilitation Therapy',
          institution: 'Recovery Training Institute',
          yearCompleted: 2018,
        },
      ],
      specialties: ['Addiction & Recovery', 'Anger', 'Self-esteem & confidence'],
      location: {
        address: '234 Lynnwood Road, Brooklyn',
        city: 'Pretoria',
        postcode: '0181',
      },
      contactEmail: 'johan.pretorius@findtherapy.care',
      contactPhone: '+27 12 460 7890',
      pricing: {
        individualCounsellingRate: 850,
        onlineCounsellingRate: 750,
        offersIntroductoryConsultation: true,
      },
      subscriptionStatus: 'none' as const,
      trialEndsAt: getTrialEndDate(),
    },
  },
  {
    user: {
      email: 'priya.pillay@findtherapy.care',
      username: 'priya_pillay',
      password: 'password123',
    },
    provider: {
      type: 'psychologist' as const,
      displayName: 'Dr. Priya Pillay',
      bio: `I am a clinical psychologist specialising in child and adolescent mental health. I work with young people aged 5-18 and their families to address a wide range of emotional and behavioural challenges.

My therapy room is a creative, welcoming space where children and teens can express themselves through play, art, and conversation. I use age-appropriate techniques to help young people understand their feelings, develop coping skills, and build resilience.

I also offer parent guidance sessions to help families support their children's mental health at home. I believe that when we invest in the mental wellbeing of young people, we're investing in a healthier future for all.`,
      degrees: ['MA', 'MSc'],
      professionalBodies: [{ body: 'HPCSA', registrationNumber: 'PS 0345678' }],
      vettingStatus: 'approved' as const,
      certifications: [
        {
          certificationName: 'Play Therapy',
          institution: 'The Play Therapy Institute of South Africa',
          yearCompleted: 2014,
        },
        {
          certificationName: 'CBT for Children and Adolescents',
          institution: 'Beck Institute',
          yearCompleted: 2016,
        },
      ],
      specialties: ['Child & Adolescent counselling', 'Anxiety & Stress', 'ADHD', 'Autism Spectrum'],
      location: {
        address: '56 Florida Road, Morningside',
        city: 'Durban',
        postcode: '4001',
      },
      contactEmail: 'priya.pillay@findtherapy.care',
      contactPhone: '+27 31 303 2345',
      website: 'https://drpriyapillay.co.za',
      pricing: {
        individualCounsellingRate: 1400,
        familyCounsellingRate: 1700,
        onlineCounsellingRate: 1200,
        offersIntroductoryConsultation: true,
      },
      subscriptionStatus: 'none' as const,
      trialEndsAt: getTrialEndDate(),
    },
  },
  {
    user: {
      email: 'nomsa.khumalo@findtherapy.care',
      username: 'nomsa_khumalo',
      password: 'password123',
    },
    provider: {
      type: 'social-worker' as const,
      displayName: 'Nomsa Khumalo',
      bio: `I am a social worker passionate about supporting the LGBTQ+ community. As a queer woman myself, I understand the unique challenges faced by LGBTQ+ individuals, including coming out, identity exploration, discrimination, and family acceptance issues.

My practice is an affirming space where you can be your authentic self without fear of judgment. I work with clients on a range of issues including anxiety, depression, relationship challenges, and life transitions.

I also offer support for partners and family members of LGBTQ+ individuals who are navigating their own journey of understanding and acceptance.`,
      degrees: ['MA Social Work'],
      professionalBodies: [{ body: 'SACSSP', registrationNumber: 'SW 0034567' }],
      vettingStatus: 'approved' as const,
      certifications: [
        {
          certificationName: 'LGBTQ+ Affirmative Therapy',
          institution: 'Out Wellbeing Centre',
          yearCompleted: 2019,
        },
      ],
      specialties: ['LGBTQ issues', 'Gender identity & Sexual orientation', 'Self-esteem & confidence', 'Relationship issues'],
      location: {
        address: '89 Long Street',
        city: 'Cape Town',
        postcode: '8000',
      },
      contactEmail: 'nomsa.khumalo@findtherapy.care',
      contactPhone: '+27 21 422 8901',
      pricing: {
        individualCounsellingRate: 800,
        couplesCounsellingRate: 1100,
        onlineCounsellingRate: 700,
        offersIntroductoryConsultation: true,
      },
      subscriptionStatus: 'none' as const,
      trialEndsAt: getTrialEndDate(),
    },
  },
  {
    user: {
      email: 'david.goldstein@findtherapy.care',
      username: 'david_goldstein',
      password: 'password123',
    },
    provider: {
      type: 'psychologist' as const,
      displayName: 'Dr. David Goldstein',
      bio: `I am a clinical psychologist with expertise in eating disorders and body image issues. For over 20 years, I have helped individuals recover from anorexia, bulimia, binge eating disorder, and other disordered eating patterns.

My approach integrates CBT, DBT, and family-based treatment. I work closely with dietitians, doctors, and psychiatrists to provide comprehensive care. I believe that recovery is possible for everyone, and I'm committed to supporting you every step of the way.

I also offer support groups and workshops on body positivity and intuitive eating.`,
      degrees: ['MA', 'MSc'],
      professionalBodies: [{ body: 'HPCSA', registrationNumber: 'PS 0456789' }],
      vettingStatus: 'approved' as const,
      certifications: [
        {
          certificationName: 'Dialectical Behavior Therapy (DBT)',
          institution: 'Linehan Institute',
          yearCompleted: 2010,
        },
        {
          certificationName: 'Family-Based Treatment for Eating Disorders',
          institution: 'Maudsley Centre',
          yearCompleted: 2012,
        },
      ],
      specialties: ['Eating disorders & Body Image', 'Self-esteem & confidence', 'Anxiety & Stress', 'Paranoia & Phobias'],
      location: {
        address: '123 Jan Smuts Avenue, Parkwood',
        city: 'Johannesburg',
        postcode: '2193',
      },
      contactEmail: 'david.goldstein@findtherapy.care',
      contactPhone: '+27 11 880 3456',
      website: 'https://drdavidgoldstein.co.za',
      pricing: {
        individualCounsellingRate: 1600,
        familyCounsellingRate: 2000,
        offersIntroductoryConsultation: false,
      },
      subscriptionStatus: 'none' as const,
      trialEndsAt: getTrialEndDate(),
    },
  },
  {
    user: {
      email: 'lindiwe.mthembu@findtherapy.care',
      username: 'lindiwe_mthembu',
      password: 'password123',
    },
    provider: {
      type: 'counsellor' as const,
      displayName: 'Lindiwe Mthembu',
      bio: `I am a career counsellor helping professionals navigate career transitions, workplace challenges, and work-life balance issues. In today's rapidly changing job market, I understand the anxiety and uncertainty that can come with career decisions.

My approach combines practical career planning with emotional support. I help clients identify their strengths, explore their options, and develop actionable plans to achieve their professional goals while maintaining their wellbeing.

I have particular expertise in supporting women in leadership and professionals experiencing burnout or workplace stress.`,
      degrees: ['MA'],
      professionalBodies: [
        { body: 'SACSSP', registrationNumber: 'SW 0045678' },
        { body: 'Counselling-SA', registrationNumber: 'CSA 0045678' },
      ],
      vettingStatus: 'approved' as const,
      certifications: [
        {
          certificationName: 'Career Development Facilitation',
          institution: 'Career Development SA',
          yearCompleted: 2017,
        },
      ],
      specialties: ['Workplace issues & Employee wellness', 'Anxiety & Stress', 'Self-esteem & confidence', 'Burnout & Chronic Fatigue'],
      location: {
        address: '67 Sandton Drive, Sandton',
        city: 'Johannesburg',
        postcode: '2196',
      },
      contactEmail: 'lindiwe.mthembu@findtherapy.care',
      contactPhone: '+27 11 783 4567',
      pricing: {
        individualCounsellingRate: 1100,
        onlineCounsellingRate: 950,
        offersIntroductoryConsultation: true,
      },
      subscriptionStatus: 'none' as const,
      trialEndsAt: getTrialEndDate(),
    },
  },
];

// Seed data for support groups
const supportGroupSeedData = [
  // ── ADDICTION & SUBSTANCE ABUSE ──────────────────────────────────────────
  {
    name: 'Alcoholics Anonymous Johannesburg Central',
    description: 'AA is a fellowship of people who share their experience, strength and hope with each other to solve their common problem and help others recover from alcoholism. Meetings are held in English and Afrikaans. Open to anyone struggling with alcohol addiction. Anonymous and confidential support in a welcoming environment.',
    category: 'Addiction Recovery',
    meetingType: 'in-person' as const,
    location: {
      city: 'Johannesburg',
      address: 'Various locations across Johannesburg CBD and suburbs',
    },
    meetingSchedule: 'Daily meetings at various times. Check website for specific location schedules. Morning, afternoon, and evening options available throughout the week.',
    contactPhone: '011 683 1110',
    website: 'https://www.aasouthafrica.org.za',
  },
  {
    name: 'Narcotics Anonymous Western Cape',
    description: 'NA is a global community-based organization for recovering addicts. We offer a safe, judgment-free space where members support each other in staying clean from all drugs. Meetings follow the 12-step program and are open to anyone who wants to stop using. All meetings are free and anonymous.',
    category: 'Addiction Recovery',
    meetingType: 'hybrid' as const,
    location: {
      city: 'Cape Town',
      address: 'Multiple venues across Cape Town, CBD, Southern Suburbs, and Northern Suburbs',
    },
    meetingSchedule: 'Multiple meetings daily across Cape Town. Online meetings available Monday-Sunday at 7:30 PM. Check website for in-person meeting locations and times.',
    contactPhone: '079 770 3326',
    website: 'https://www.na.org.za',
  },
  {
    name: 'Al-Anon Family Groups Pretoria',
    description: 'Al-Anon is a mutual support group for families and friends of alcoholics. Whether the alcoholic is still drinking or not, you are welcome. We share our experience, strength, and hope to help each other cope with the effects of living with or caring for someone with an alcohol problem. Meetings provide emotional support and practical strategies.',
    category: 'Addiction Recovery',
    meetingType: 'in-person' as const,
    location: {
      city: 'Pretoria',
      address: 'Various churches and community centers in Pretoria East, Central, and West',
    },
    meetingSchedule: 'Weekly meetings on Tuesdays at 7:30 PM and Saturdays at 10:00 AM. Multiple locations available. Check website for specific venues.',
    contactPhone: '012 333 2294',
    website: 'https://www.alanon.org.za',
  },
  {
    name: 'SANCA Durban',
    description: 'SANCA provides professional addiction counselling, rehabilitation services, and peer support groups for individuals struggling with substance abuse. We offer free support groups for recovering addicts and their families. Groups focus on relapse prevention, coping strategies, and building a drug-free life. Facilitated by trained counsellors.',
    category: 'Substance Abuse',
    meetingType: 'in-person' as const,
    location: {
      city: 'Durban',
      address: '35 Warwick Avenue, Durban Central',
      postcode: '4001',
    },
    meetingSchedule: 'Support groups every Wednesday at 6:00 PM and Saturday at 10:00 AM. Drop-in welcome, no appointment needed.',
    contactPhone: '031 304 5991',
    contactEmail: 'info@sancadurban.co.za',
    website: 'https://www.sanca.org.za',
  },

  // ── DEPRESSION & ANXIETY ─────────────────────────────────────────────────
  {
    name: 'SADAG Depression Support Group Johannesburg',
    description: 'Peer-led support group for individuals living with depression. Share experiences, coping strategies, and emotional support in a safe, non-judgmental environment. Facilitated by trained volunteers who have personal experience with depression. Open to anyone struggling with depressive symptoms, whether diagnosed or not. No referral needed.',
    category: 'Depression',
    meetingType: 'hybrid' as const,
    location: {
      city: 'Johannesburg',
      address: 'Various locations in Johannesburg North, including Sandton and Rosebank',
    },
    meetingSchedule: 'Weekly meetings every Thursday at 7:00 PM. Online option available via Zoom. Contact SADAG for current meeting link and in-person locations.',
    contactPhone: '011 234 4837',
    website: 'https://www.sadag.org',
  },
  {
    name: 'SADAG Anxiety & Panic Disorder Support Group Cape Town',
    description: 'Support group specifically for individuals dealing with anxiety disorders, panic attacks, social anxiety, and generalized anxiety. Learn coping mechanisms, share experiences, and receive support from others who understand. Facilitated sessions include breathing exercises, grounding techniques, and peer support. Welcoming and confidential environment.',
    category: 'Anxiety & Panic',
    meetingType: 'in-person' as const,
    location: {
      city: 'Cape Town',
      address: 'Multiple venues across Southern Suburbs and CBD',
    },
    meetingSchedule: 'Fortnightly meetings on alternate Tuesdays at 6:30 PM. Call SADAG office for current venue and to confirm attendance.',
    contactPhone: '011 234 4837',
    website: 'https://www.sadag.org',
  },
  {
    name: 'Bipolar Life Johannesburg Support Group',
    description: 'Peer support group for individuals living with bipolar disorder and their families. Discussion topics include managing mood swings, medication challenges, work-life balance, and building healthy relationships. Group provides education, emotional support, and practical strategies for living well with bipolar disorder. Facilitated by psychologist and peer supporters.',
    category: 'Bipolar Disorder',
    meetingType: 'in-person' as const,
    location: {
      city: 'Johannesburg',
      address: 'Contact organization for venue details',
    },
    meetingSchedule: 'Monthly meetings on the third Saturday at 10:00 AM. RSVP required.',
    contactPhone: '082 882 7509',
    contactEmail: 'info@bipolarlife.co.za',
    website: 'https://www.bipolarlife.co.za',
  },

  // ── GRIEF & BEREAVEMENT ──────────────────────────────────────────────────
  {
    name: 'The Compassionate Friends Pretoria',
    description: 'Support group for parents who have lost a child of any age, from any cause. A safe space to share grief, find understanding from others who have experienced child loss, and work through the bereavement process. Meetings are facilitated by bereaved parents. Siblings and grandparents also welcome. No judgment, just compassion and understanding.',
    category: 'Bereavement & Grief',
    meetingType: 'in-person' as const,
    location: {
      city: 'Pretoria',
      address: 'Various churches in Pretoria East',
    },
    meetingSchedule: 'Monthly meetings on the second Tuesday at 7:00 PM. Contact for specific venue information.',
    contactPhone: '012 667 5800',
    website: 'https://www.compassionatefriends.co.za',
  },
  {
    name: 'Bereaved Families of Southern Africa - Cape Town',
    description: 'Support for families who have lost loved ones to murder, culpable homicide, or other traumatic deaths. Professional counsellors and peer supporters help members process trauma, navigate the justice system, and find healing. Group provides emotional support, practical advice, and advocacy. Open to all family members affected by violent loss.',
    category: 'Bereavement & Grief',
    meetingType: 'in-person' as const,
    location: {
      city: 'Cape Town',
      address: 'Contact organization for current meeting venue',
    },
    meetingSchedule: 'Monthly support groups on last Saturday at 2:00 PM. Additional one-on-one support available by appointment.',
    contactPhone: '021 422 4105',
    contactEmail: 'capetown@bfsa.co.za',
    website: 'https://www.bfsa.co.za',
  },
  {
    name: 'Widows & Widowers Support Network Durban',
    description: "Peer support group for men and women who have lost their spouses. Share experiences of grief, loneliness, practical challenges, and rebuilding life after loss. Discussion topics include managing finances, solo parenting, dating again, and honoring your spouse's memory while moving forward. Warm, understanding environment facilitated by trained peer supporters.",
    category: 'Bereavement & Grief',
    meetingType: 'in-person' as const,
    location: {
      city: 'Durban',
      address: 'Community center in Durban North',
    },
    meetingSchedule: 'Meets on the first and third Wednesday of each month at 6:00 PM. Tea and light refreshments provided.',
    contactPhone: '031 563 3104',
  },

  // ── TRAUMA & PTSD ────────────────────────────────────────────────────────
  {
    name: 'Rape Crisis Cape Town Support Group',
    description: 'Safe, confidential support groups for survivors of sexual violence and rape. Facilitated by trained counsellors, groups provide emotional support, trauma processing, and empowerment. Topics include healing from trauma, rebuilding self-esteem, and navigating relationships. Women-only groups available. Free services for all survivors regardless of when assault occurred.',
    category: 'PTSD & Trauma',
    meetingType: 'in-person' as const,
    location: {
      city: 'Cape Town',
      address: 'Observatory office and various community centers',
      postcode: '7925',
    },
    meetingSchedule: 'Weekly groups on Tuesdays and Thursdays. Morning and evening options. Call to book intake appointment before joining group.',
    contactPhone: '021 447 9762',
    contactEmail: 'info@rapecrisis.org.za',
    website: 'https://rapecrisis.org.za',
  },
  {
    name: 'Trauma Centre Support Group Johannesburg',
    description: 'Support groups for survivors of violent crime, assault, hijacking, armed robbery, and other traumatic events. Professional trauma counsellors facilitate processing of PTSD symptoms, anxiety, and fear. Group provides tools for managing flashbacks, nightmares, and hypervigilance. Safe space to share experiences with others who understand trauma impact.',
    category: 'PTSD & Trauma',
    meetingType: 'hybrid' as const,
    location: {
      city: 'Johannesburg',
      address: 'Braamfontein office and online via Zoom',
    },
    meetingSchedule: 'Weekly groups on Wednesdays at 6:00 PM (in-person) and Saturdays at 10:00 AM (online). 8-week structured program, rolling intake.',
    contactPhone: '011 403 4315',
    contactEmail: 'info@trauma.org.za',
    website: 'https://www.trauma.org.za',
  },

  // ── CANCER SUPPORT ───────────────────────────────────────────────────────
  {
    name: 'CANSA Pretoria Cancer Support Group',
    description: 'Support group for cancer patients, survivors, and their families. Share experiences of diagnosis, treatment, side effects, and survivorship. Topics include managing treatment side effects, emotional wellbeing, communicating with medical teams, and life after cancer. Facilitated by social workers and attended by oncology nurses. Open to all cancer types and stages.',
    category: 'Cancer Support',
    meetingType: 'in-person' as const,
    location: {
      city: 'Pretoria',
      address: 'CANSA Pretoria Care Centre, Brooklyn',
      postcode: '0181',
    },
    meetingSchedule: 'Monthly meetings on the second Thursday at 10:00 AM and 6:00 PM (two sessions to accommodate different schedules).',
    contactPhone: '012 460 3832',
    contactEmail: 'pretoria@cansa.org.za',
    website: 'https://www.cansa.org.za',
  },
  {
    name: 'People Living with Cancer Support Group Cape Town',
    description: 'Peer-led support group for people currently living with cancer. Focus on quality of life, staying positive during treatment, managing pain and symptoms, and connecting with others on similar journeys. Group welcomes patients at all stages - newly diagnosed, in active treatment, or managing metastatic disease. Caregivers welcome at designated sessions.',
    category: 'Cancer Support',
    meetingType: 'in-person' as const,
    location: {
      city: 'Cape Town',
      address: 'Various hospitals and community centers in Southern Suburbs',
    },
    meetingSchedule: 'Fortnightly meetings on alternate Saturdays at 2:00 PM. Contact for current venue.',
    contactPhone: '021 689 5347',
    website: 'https://www.plwc.org.za',
  },
  {
    name: 'Breast Health Foundation Support Group Johannesburg',
    description: 'Support specifically for women with breast cancer at any stage. Discuss surgery decisions, chemotherapy, radiation, hormone therapy, reconstruction, and survivorship. Group provides emotional support, practical advice on wigs and prosthetics, and information on breast cancer resources. Led by breast cancer survivors and attended by breast care nurse. Partners/families welcome at quarterly meetings.',
    category: 'Cancer Support',
    meetingType: 'hybrid' as const,
    location: {
      city: 'Johannesburg',
      address: 'Sandton area, specific venue confirmed on RSVP',
    },
    meetingSchedule: 'Monthly meetings on third Wednesday at 6:30 PM (in-person). Online support available via WhatsApp group and monthly Zoom call.',
    contactPhone: '011 482 9492',
    contactEmail: 'info@bhi.org.za',
    website: 'https://www.bhi.org.za',
  },

  // ── HIV/AIDS SUPPORT ─────────────────────────────────────────────────────
  {
    name: 'Treatment Action Campaign Durban Support Group',
    description: 'Support group for people living with HIV/AIDS. Focus on treatment adherence, managing side effects, disclosure, stigma reduction, and living positively with HIV. Group provides education on latest treatments, peer support, and advocacy training. Safe space to discuss challenges and celebrate successes. Facilitated by peer educators living with HIV.',
    category: 'HIV/AIDS',
    meetingType: 'in-person' as const,
    location: {
      city: 'Durban',
      address: 'TAC Durban office, Point Road area',
      postcode: '4001',
    },
    meetingSchedule: 'Weekly meetings every Thursday at 5:00 PM. Drop-in welcome, confidential attendance.',
    contactPhone: '031 301 7640',
    contactEmail: 'durban@tac.org.za',
    website: 'https://www.tac.org.za',
  },
  {
    name: "Positive Women's Network Johannesburg",
    description: "Support group specifically for women living with HIV. Safe space to discuss pregnancy, breastfeeding, disclosure to partners and children, relationships, and living positively. Group addresses unique challenges women face, including gender-based violence, reproductive health, and motherhood with HIV. Peer-led with guidance from healthcare professionals. Children's activities available during meetings.",
    category: 'HIV/AIDS',
    meetingType: 'in-person' as const,
    location: {
      city: 'Johannesburg',
      address: 'Hillbrow community center',
    },
    meetingSchedule: 'Monthly meetings on second Saturday at 10:00 AM. Includes lunch and childcare.',
    contactPhone: '011 339 6082',
  },

  // ── LGBTQ+ SUPPORT ───────────────────────────────────────────────────────
  {
    name: 'OUT LGBT Well-being Support Group Pretoria',
    description: 'Support group for LGBTQ+ individuals dealing with mental health challenges, family rejection, discrimination, or identity struggles. Safe, affirming space facilitated by LGBTQ+ peer counsellors. Topics include coming out, family relationships, workplace discrimination, dating, and building community. Open to all sexual orientations and gender identities. Confidential and judgment-free.',
    category: 'LGBTQ+',
    meetingType: 'hybrid' as const,
    location: {
      city: 'Pretoria',
      address: 'OUT Pretoria office, Hatfield area',
    },
    meetingSchedule: 'Weekly meetings every Tuesday at 6:00 PM (in-person) and Wednesday at 7:00 PM (online via Zoom).',
    contactPhone: '012 430 3272',
    contactEmail: 'info@out.org.za',
    website: 'https://www.out.org.za',
  },
  {
    name: 'Triangle Project LGBTQ+ Support Group Cape Town',
    description: 'Peer support for lesbian, gay, bisexual, transgender, queer, and intersex individuals. Discussion topics include mental health, relationships, family acceptance, gender transition support, and dealing with homophobia/transphobia. Group provides community connection, resources, and emotional support. Facilitators include therapists and trained peer supporters. Trans-specific groups available.',
    category: 'LGBTQ+',
    meetingType: 'in-person' as const,
    location: {
      city: 'Cape Town',
      address: 'Observatory office',
      postcode: '7925',
    },
    meetingSchedule: 'General LGBTQ+ group: First Friday monthly at 6:00 PM. Trans support group: Third Saturday monthly at 2:00 PM. Youth group (18-25): Weekly Thursdays at 5:00 PM.',
    contactPhone: '021 422 0255',
    contactEmail: 'info@triangle.org.za',
    website: 'https://www.triangle.org.za',
  },

  // ── EATING DISORDERS ─────────────────────────────────────────────────────
  {
    name: 'EDEN Support Group Johannesburg',
    description: 'Support group for individuals recovering from eating disorders including anorexia, bulimia, binge eating disorder, and ARFID. Facilitated by recovered individuals and clinical psychologists. Focus on body image, food relationships, recovery challenges, and relapse prevention. Safe, judgment-free environment. Family support groups also available separately. Evidence-based recovery approach.',
    category: 'Eating Disorders',
    meetingType: 'hybrid' as const,
    location: {
      city: 'Johannesburg',
      address: 'Norwood/Oaklands area',
    },
    meetingSchedule: 'Weekly meetings on Mondays at 6:30 PM (in-person for clients in treatment). Online support group Sundays at 7:00 PM (open to all). Family group monthly on first Thursday.',
    contactPhone: '011 027 2984',
    contactEmail: 'info@eatingdisorders.org.za',
    website: 'https://www.eatingdisorders.org.za',
  },
  {
    name: 'Cape Town Eating Disorder Recovery Group',
    description: 'Peer-led recovery group for adults with current or past eating disorders. Group follows 12-step principles adapted for eating disorder recovery. Topics include meal planning, coping with triggers, managing emotions without food behaviors, and building self-esteem. Meetings include check-ins, topic discussion, and mutual support. Open format - share as much or little as comfortable.',
    category: 'Eating Disorders',
    meetingType: 'in-person' as const,
    location: {
      city: 'Cape Town',
      address: 'Claremont community center',
    },
    meetingSchedule: 'Weekly meetings every Wednesday at 7:00 PM. Drop-in welcome, no RSVP required.',
    contactPhone: '082 377 4144',
  },

  // ── PARENTING & FAMILY ───────────────────────────────────────────────────
  {
    name: 'La Leche League Pretoria Breastfeeding Support',
    description: 'Support group for breastfeeding mothers. Share experiences, get advice on latch issues, supply concerns, returning to work, and weaning. Led by accredited La Leche League leaders who are experienced breastfeeding mothers. Topics include nursing in public, pumping, combination feeding, and breastfeeding toddlers. Pregnant women welcome. Babies and children welcome at meetings.',
    category: 'Parenting & Family',
    meetingType: 'in-person' as const,
    location: {
      city: 'Pretoria',
      address: 'Various homes in Pretoria East suburbs - rotating locations',
    },
    meetingSchedule: 'Monthly meetings on second Saturday at 10:00 AM. Check Facebook page for current host location.',
    contactEmail: 'lllpretoria@gmail.com',
    website: 'https://www.llli.org',
  },
  {
    name: 'Autism South Africa Johannesburg Parent Support',
    description: 'Support group for parents and caregivers of children with autism spectrum disorder. Share experiences, strategies, and resources. Topics include navigating diagnosis, accessing therapies, schooling options, managing meltdowns, sibling relationships, and self-care for parents. Guest speakers include occupational therapists, educational psychologists, and autism advocates. Facilitated by parent volunteers.',
    category: 'Parenting & Family',
    meetingType: 'hybrid' as const,
    location: {
      city: 'Johannesburg',
      address: 'Autism SA office, Gallo Manor',
    },
    meetingSchedule: 'Monthly meetings on third Saturday at 9:00 AM (in-person). Online support via WhatsApp group and monthly Zoom meeting first Tuesday at 7:30 PM.',
    contactPhone: '011 484 9909',
    contactEmail: 'info@autismsouthafrica.org',
    website: 'https://www.autismsouthafrica.org',
  },
  {
    name: 'Single Parents Support Group Cape Town',
    description: "Support and social network for single parents raising children alone. Discuss co-parenting challenges, financial stress, dating, time management, and self-care. Group provides emotional support, practical advice, and social connections. Occasional family social events and kids' activities. Open to divorced, widowed, and never-married single parents. Judgment-free zone.",
    category: 'Single Parents',
    meetingType: 'in-person' as const,
    location: {
      city: 'Cape Town',
      address: 'Rondebosch community hall',
    },
    meetingSchedule: 'Monthly meetings on last Friday at 7:00 PM (adults only). Quarterly family picnics on Sunday afternoons.',
    contactEmail: 'ctsingleparents@gmail.com',
  },
  {
    name: 'Fertility Support Group Durban',
    description: 'Emotional support for individuals and couples struggling with infertility. Safe space to share grief, frustration, and hope during fertility treatments or pregnancy loss. Topics include IVF, adoption, surrogacy, accepting childlessness, and relationship strain. Group includes members at all stages - trying to conceive, in treatment, post-loss, and resolved. Facilitated by social worker specializing in reproductive health.',
    category: 'Parenting & Family',
    meetingType: 'in-person' as const,
    location: {
      city: 'Durban',
      address: 'Private venue in Durban North (address provided on RSVP for confidentiality)',
    },
    meetingSchedule: 'Monthly meetings on first Wednesday at 6:30 PM. RSVP required via email.',
    contactEmail: 'dbnfertility@gmail.com',
  },

  // ── DOMESTIC VIOLENCE ────────────────────────────────────────────────────
  {
    name: 'POWA Domestic Violence Support Group',
    description: 'Support for women experiencing or recovering from domestic violence and intimate partner abuse. Facilitated by trained counsellors, group provides emotional support, safety planning, legal information, and empowerment. Topics include recognizing abuse patterns, building self-esteem, co-parenting with abusive ex-partner, and healing from trauma. Confidential, safe environment. Childcare available.',
    category: 'Domestic Violence',
    meetingType: 'in-person' as const,
    location: {
      city: 'Johannesburg',
      address: 'POWA offices, Johannesburg CBD (confidential location)',
      postcode: '2001',
    },
    meetingSchedule: 'Weekly groups on Tuesdays and Thursdays at 10:00 AM and 5:00 PM. Drop-in welcome, intake appointment recommended.',
    contactPhone: '011 642 4345',
    contactEmail: 'info@powa.co.za',
    website: 'https://www.powa.co.za',
  },
  {
    name: 'Safeline Cape Town Abuse Survivors Group',
    description: 'Support for adult survivors of childhood abuse (physical, sexual, emotional, neglect). Facilitated by professional therapists, group helps members process trauma, build healthy relationships, and develop coping skills. Safe, confidential environment to share experiences with others who understand. Topics include family dynamics, boundaries, flashbacks, and self-compassion. Long-term and short-term groups available.',
    category: 'Domestic Violence',
    meetingType: 'in-person' as const,
    location: {
      city: 'Cape Town',
      address: 'Claremont area, specific address provided at intake',
    },
    meetingSchedule: '12-week closed group programs starting quarterly. Open drop-in group monthly on second Monday at 6:00 PM. Contact for next intake.',
    contactPhone: '021 447 0067',
    contactEmail: 'info@safeline.org.za',
    website: 'https://www.safeline.org.za',
  },

  // ── YOUTH & TEEN SUPPORT ─────────────────────────────────────────────────
  {
    name: 'Teen SADAG Support Group Johannesburg',
    description: 'Peer support group specifically for teenagers (13-18 years) dealing with depression, anxiety, self-harm, or suicidal thoughts. Safe space facilitated by clinical psychologist and peer supporters. Discuss school pressure, social media, friendships, family relationships, and mental health stigma. Learn coping skills and connect with others who understand. Parental consent required for under 18s.',
    category: 'Youth & Teen Support',
    meetingType: 'in-person' as const,
    location: {
      city: 'Johannesburg',
      address: 'Sandton area, rotating between schools and community centers',
    },
    meetingSchedule: 'Fortnightly on alternate Saturdays at 2:00 PM during school terms. Contact SADAG to register and get current location.',
    contactPhone: '011 234 4837',
    website: 'https://www.sadag.org',
  },
  {
    name: 'Triangle Project Youth Group Cape Town',
    description: 'Social and support group for LGBTQ+ youth aged 14-25. Safe, affirming space to explore identity, make friends, and get support. Activities include discussions, workshops, social events, and advocacy projects. Topics include coming out, family acceptance, school bullying, dating, and building confidence. Facilitated by LGBTQ+ youth workers. Parental consent not required for 18+.',
    category: 'Youth & Teen Support',
    meetingType: 'in-person' as const,
    location: {
      city: 'Cape Town',
      address: 'Triangle Project office, Observatory',
      postcode: '7925',
    },
    meetingSchedule: 'Weekly meetings every Thursday at 4:30 PM during school terms. Holiday programs also available.',
    contactPhone: '021 422 0255',
    contactEmail: 'youth@triangle.org.za',
    website: 'https://www.triangle.org.za',
  },

  // ── CHRONIC ILLNESS ──────────────────────────────────────────────────────
  {
    name: 'Diabetes SA Pretoria Support Group',
    description: 'Support for individuals living with Type 1 or Type 2 diabetes. Share experiences managing blood sugar, medication, diet, exercise, and complications. Group provides education on latest treatments, motivation for lifestyle changes, and peer support. Guest speakers include dietitians, endocrinologists, and diabetes educators. Family members welcome. Learn from others successfully managing diabetes.',
    category: 'Chronic Illness',
    meetingType: 'in-person' as const,
    location: {
      city: 'Pretoria',
      address: 'Various clinics and community centers in Pretoria suburbs',
    },
    meetingSchedule: 'Monthly meetings on third Thursday at 6:00 PM. Check website for current venue and topic.',
    contactPhone: '012 460 1838',
    contactEmail: 'pretoria@diabetessa.org.za',
    website: 'https://www.diabetessa.org.za',
  },
  {
    name: 'Arthritis Foundation KZN Support Group',
    description: 'Support for people living with rheumatoid arthritis, osteoarthritis, lupus, and other autoimmune conditions. Discuss pain management, medication side effects, maintaining mobility, and emotional impact of chronic illness. Group includes education on exercises, assistive devices, and treatment options. Facilitated by occupational therapist and rheumatology nurse. Share tips and encouragement.',
    category: 'Chronic Illness',
    meetingType: 'in-person' as const,
    location: {
      city: 'Durban',
      address: 'Arthritis Foundation offices, Westville',
      postcode: '3629',
    },
    meetingSchedule: 'Monthly meetings on second Wednesday at 10:00 AM. Gentle chair exercises included.',
    contactPhone: '031 202 9825',
    contactEmail: 'kzn@arthritis.org.za',
    website: 'https://www.arthritis.org.za',
  },
  {
    name: 'Fibromyalgia Support Group Western Cape',
    description: 'Peer support for individuals living with fibromyalgia and chronic fatigue syndrome. Safe space to discuss chronic pain, fatigue, brain fog, sleep issues, and invisible illness challenges. Share coping strategies, treatment experiences, and emotional support. Group validates experiences often dismissed by others. Topics include pacing, flare management, working with chronic illness, and self-advocacy with doctors.',
    category: 'Chronic Illness',
    meetingType: 'hybrid' as const,
    location: {
      city: 'Cape Town',
      address: 'Southern Suburbs location, address on RSVP',
    },
    meetingSchedule: 'Monthly meetings on last Saturday at 10:00 AM (in-person). Online WhatsApp support group active daily.',
    contactEmail: 'fibrocapetown@gmail.com',
  },

  // ── CAREGIVER SUPPORT ────────────────────────────────────────────────────
  {
    name: "Alzheimer's South Africa Caregiver Support Johannesburg",
    description: "Support for family caregivers of people living with Alzheimer's disease and other dementias. Share challenges, get practical advice, and receive emotional support. Topics include managing behavioral changes, communication strategies, respite care, guilt, grief, and self-care. Facilitated by social worker specializing in dementia care. Understanding environment where caregivers' feelings are validated.",
    category: 'Caregivers',
    meetingType: 'in-person' as const,
    location: {
      city: 'Johannesburg',
      address: "Alzheimer's SA office, Parktown",
    },
    meetingSchedule: 'Monthly meetings on first Thursday at 10:00 AM and 6:00 PM (two sessions). RSVP helpful but not required.',
    contactPhone: '011 792 2511',
    contactEmail: 'jhb@alzheimers.org.za',
    website: 'https://www.alzheimers.org.za',
  },

  // ── SENIORS SUPPORT ──────────────────────────────────────────────────────
  {
    name: 'Active Aging Support Group Cape Town',
    description: 'Social and emotional support group for seniors dealing with aging challenges including loneliness, loss of independence, health issues, and life transitions. Group provides connection, purpose, and community. Activities include discussions, gentle exercise, creative activities, and guest speakers on senior health topics. Welcoming environment for older adults to share experiences and build friendships.',
    category: 'Seniors Support',
    meetingType: 'in-person' as const,
    location: {
      city: 'Cape Town',
      address: 'Various senior centers and retirement villages in Southern Suburbs',
    },
    meetingSchedule: 'Weekly meetings every Wednesday at 2:00 PM. Tea and snacks provided. Transport can be arranged.',
    contactPhone: '021 762 3144',
  },

  // ── PARENTING & FAMILY (DISABILITIES) ───────────────────────────────────
  {
    name: 'Down Syndrome SA Pretoria Parent Group',
    description: 'Support for parents and families of children with Down syndrome. Share experiences, resources, and encouragement. Topics include early intervention, speech therapy, inclusive education, medical concerns, and celebrating milestones. Group provides hope, practical advice, and community. Guest speakers include therapists, educators, and adults with Down syndrome. Siblings welcome at designated meetings.',
    category: 'Parenting & Family',
    meetingType: 'in-person' as const,
    location: {
      city: 'Pretoria',
      address: 'Community center in Pretoria East',
    },
    meetingSchedule: 'Quarterly meetings on second Saturday at 10:00 AM. Family fun days twice yearly. WhatsApp support group active daily.',
    contactPhone: '012 751 4345',
    contactEmail: 'info@downsyndrome.org.za',
    website: 'https://www.downsyndrome.org.za',
  },

  // ── PERINATAL & POSTPARTUM ───────────────────────────────────────────────
  {
    name: 'Postpartum Support Group Johannesburg',
    description: 'Support for mothers experiencing postpartum depression, anxiety, or psychosis. Safe, judgment-free space facilitated by perinatal mental health specialist. Discuss overwhelming feelings, bonding difficulties, scary thoughts, and recovery. Group provides validation, coping strategies, and hope. Partners welcome at monthly partner sessions. Babies welcome. No pressure to participate if having difficult day.',
    category: 'Parenting & Family',
    meetingType: 'hybrid' as const,
    location: {
      city: 'Johannesburg',
      address: 'Parkhurst area, baby-friendly venue',
    },
    meetingSchedule: 'Weekly meetings every Tuesday at 10:00 AM (in-person, babies welcome). Online option Thursday evenings at 8:00 PM via Zoom.',
    contactPhone: '082 886 0690',
    contactEmail: 'ppdsupport@gmail.com',
  },
  {
    name: 'Cape Town Pregnancy Loss Support Group',
    description: 'Compassionate support for individuals and couples who have experienced miscarriage, stillbirth, or infant loss. Safe space to grieve, share memories, and find understanding from others who have experienced similar loss. Group validates grief regardless of gestational age. Facilitated by trained bereavement counsellor. Partners encouraged to attend. Subsequent pregnancy support also available.',
    category: 'Bereavement & Grief',
    meetingType: 'in-person' as const,
    location: {
      city: 'Cape Town',
      address: 'Private venue in Rondebosch (address provided on RSVP)',
    },
    meetingSchedule: 'Monthly meetings on third Monday at 6:30 PM. Memorial events quarterly.',
    contactEmail: 'ctpregnancyloss@gmail.com',
  },

  // ── MEN'S MENTAL HEALTH ──────────────────────────────────────────────────
  {
    name: "Men's Circle Mental Health Support Durban",
    description: 'Support group specifically for men dealing with depression, anxiety, stress, or life challenges. Safe, judgment-free masculine space to discuss mental health without stigma. Topics include work stress, relationship issues, fatherhood, identity, suicide prevention, and expressing emotions. Facilitated by male clinical psychologist. Group breaks isolation and provides peer support and practical coping strategies.',
    category: "Men's Support",
    meetingType: 'in-person' as const,
    location: {
      city: 'Durban',
      address: 'Community center in Umhlanga',
    },
    meetingSchedule: 'Fortnightly meetings on alternate Wednesday evenings at 7:00 PM. Check-in calls available between meetings.',
    contactPhone: '083 654 8899',
  },

  // ── NATIONAL ONLINE GROUPS ───────────────────────────────────────────────
  {
    name: 'SADAG National Online Support Groups',
    description: 'Virtual support groups covering various mental health conditions including depression, anxiety, bipolar disorder, OCD, and more. Accessible to anyone in South Africa with internet connection. Facilitated by trained peer supporters and mental health professionals. Groups provide education, coping strategies, and peer support in safe online environment. Multiple time slots available to accommodate different schedules.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: {
      city: 'National (Online)',
    },
    meetingSchedule: 'Multiple groups weekly at various times. Visit website for full schedule and Zoom links. Depression group: Mondays 7 PM. Anxiety group: Wednesdays 7 PM. Bipolar group: First Saturday monthly 10 AM.',
    contactPhone: '011 234 4837',
    website: 'https://www.sadag.org',
  },
  {
    name: 'SADAG WhatsApp Support Communities',
    description: 'Peer-to-peer mental health support via WhatsApp groups for various conditions. Moderated by SADAG volunteers. Groups provide daily encouragement, resource sharing, and connection with others experiencing similar challenges. Strict confidentiality rules enforced. Multiple groups available for different conditions including depression, anxiety, bipolar, OCD, and more. Join via SADAG website or helpline.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: {
      city: 'National (Online)',
    },
    meetingSchedule: 'Continuous support available 24/7 via WhatsApp. Active daily conversations. Moderated to ensure supportive environment.',
    contactPhone: '011 234 4837',
    website: 'https://www.sadag.org',
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Skip clearing - append seed data alongside existing records
    console.log('Appending seed data (existing data will be preserved)...');

    // Create admin user (skip if exists)
    console.log('Creating admin user...');
    let adminUser = await User.findOne({ email: 'admin@findtherapy.care' });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'admin@findtherapy.care',
        username: 'admin',
        password: 'admin123',
        isAdmin: true,
      });
      console.log('Admin user created:', adminUser.email);
    } else {
      console.log('Admin user already exists, skipping');
    }

    // Create providers (skip existing by email)
    console.log('Creating providers...');
    let providersCreated = 0;
    for (const data of providerSeedData) {
      const existingUser = await User.findOne({ email: data.user.email });
      if (existingUser) {
        console.log(`Skipping existing provider: ${data.provider.displayName}`);
        continue;
      }
      const user = await User.create(data.user);
      await Provider.create({
        ...data.provider,
        userId: user._id.toString(),
        isPublished: true,
      });
      providersCreated++;
      console.log(`Created provider: ${data.provider.displayName}`);
    }

    // Create support groups (skip existing by name)
    console.log('Creating support groups...');
    let groupsCreated = 0;
    for (const data of supportGroupSeedData) {
      const existingGroup = await SupportGroup.findOne({ name: data.name });
      if (existingGroup) {
        console.log(`Skipping existing group: ${data.name}`);
        continue;
      }
      await SupportGroup.create({
        ...data,
        createdBy: adminUser._id.toString(),
        isActive: true,
      });
      groupsCreated++;
      console.log(`Created support group: ${data.name}`);
    }

    console.log('\n=================================');
    console.log('Database seeded successfully!');
    console.log('=================================');
    console.log(`Created ${providersCreated} providers (${providerSeedData.length - providersCreated} skipped)`);
    console.log(`Created ${groupsCreated} support groups (${supportGroupSeedData.length - groupsCreated} skipped)`);
    console.log('\nTrial period:', isTrialEnabled() ? `${TRIAL_PERIOD_DAYS} days` : 'Disabled');
    console.log('\nAdmin credentials:');
    console.log('  Email: admin@findtherapy.care');
    console.log('  Password: admin123');
    console.log('\nAll seed users use password: password123');
    console.log('=================================\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
