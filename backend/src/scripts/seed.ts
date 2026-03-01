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

  // ── ADHD ─────────────────────────────────────────────────────────────────
  {
    name: 'The Hout Bay AD/HD Support Group',
    description: 'Community support group for individuals living with ADHD and their families in the Hout Bay area. Provides peer support, practical strategies, and a welcoming space to share experiences of living with Attention Deficit/Hyperactivity Disorder. Suitable for adults with ADHD and parents of children with ADHD.',
    category: 'ADHD',
    meetingType: 'in-person' as const,
    location: {
      city: 'Hout Bay',
      address: 'Hout Bay, Western Cape',
    },
    contactPhone: '+27 21 790 4178',
  },

  // ── INTELLECTUAL DISABILITY ───────────────────────────────────────────────
  {
    name: 'Western Cape Forum for Intellectual Disability',
    description: 'The Western Cape Forum for Intellectual Disability (WCFID) is a network of organisations and individuals committed to supporting people with intellectual disabilities and their families across the Western Cape. Provides advocacy, information, and peer support for caregivers and family members.',
    category: 'Intellectual Disability',
    meetingType: 'in-person' as const,
    location: {
      city: 'Cape Town',
    },
    contactPhone: '+27 21 510 4686',
    website: 'https://www.wcfid.co.za',
  },

  // ── BIPOLAR & DEPRESSION ──────────────────────────────────────────────────
  {
    name: 'Bipolar & Depression Support Group Goodwood',
    description: 'Peer support group for people living with bipolar disorder and depression, as well as their family members and carers. Meetings provide a safe, confidential space to share experiences, discuss medication and treatment challenges, and learn coping skills from others who understand. Based in Goodwood, serving the Northern Suburbs of Cape Town.',
    category: 'Bipolar Disorder',
    meetingType: 'in-person' as const,
    location: {
      city: 'Goodwood',
      address: '19 Church Street, Goodwood, Western Cape',
    },
    contactPhone: '+27 72 359 2003',
  },

  // ── NEUROLOGICAL CONDITIONS ───────────────────────────────────────────────
  {
    name: 'Multiple Sclerosis South Africa',
    description: 'Multiple Sclerosis South Africa (MSSA) provides support, information, and advocacy for people living with MS and their families nationwide. Support groups offer peer connection, emotional support, and practical guidance on managing life with MS. Educational resources, helpline, and regular events available to members across South Africa.',
    category: 'Neurological Conditions',
    meetingType: 'hybrid' as const,
    location: {
      city: 'National',
    },
    website: 'https://www.multiplesclerosis.co.za',
  },

  // ── ADDICTION & RECOVERY ──────────────────────────────────────────────────
  {
    name: 'Relapse Prevention Support Group',
    description: 'Specialised support group focused on relapse prevention for individuals in recovery from addiction. Group sessions cover identifying triggers, building healthy coping mechanisms, and maintaining sobriety long-term. Peer-led with professional facilitation. Suitable for anyone in recovery from alcohol, drugs, or other addictive behaviours.',
    category: 'Addiction Recovery',
    meetingType: 'in-person' as const,
    location: {
      city: 'National',
    },
    website: 'https://www.relapseprevention.co.za',
  },
  {
    name: 'Gamblers Anonymous South Africa',
    description: 'Gamblers Anonymous is a fellowship of men and women who share their experience, strength, and hope with each other to recover from compulsive gambling. The only requirement for membership is a desire to stop gambling. Meetings are free, anonymous, and open to anyone affected by problem gambling. Follows the 12-step programme.',
    category: 'Addiction Recovery',
    meetingType: 'in-person' as const,
    location: {
      city: 'National',
      address: 'Multiple venues countrywide',
    },
    contactPhone: '078 789 0868',
  },

  // ── SUICIDE BEREAVEMENT & PREVENTION ─────────────────────────────────────
  {
    name: 'SOLOS – Suicide Survivors Support Group',
    description: 'SOLOS is a support group for people who have lost a loved one to suicide. The group provides a compassionate, understanding space where survivors of suicide loss can share their grief, find hope, and connect with others who truly understand their experience. Facilitated meetings focus on healing without judgment.',
    category: 'Suicide Bereavement',
    meetingType: 'in-person' as const,
    location: {
      city: 'Westville',
      address: 'Westville, Durban, KwaZulu-Natal',
    },
    contactPhone: '+27 82 659 7505',
  },

  // ── ANXIETY & DEPRESSION ──────────────────────────────────────────────────
  {
    name: 'Anxiety & Depression Support Group – PsychMatters',
    description: 'Support group for individuals living with anxiety and depression, hosted by PsychMatters Centre in Bedfordview, Johannesburg. Facilitated by mental health professionals, the group offers a structured, supportive environment to share experiences, learn evidence-based coping strategies, and reduce isolation. Suitable for adults with diagnosed or undiagnosed anxiety and mood disorders.',
    category: 'Anxiety & Panic',
    meetingType: 'in-person' as const,
    location: {
      city: 'Bedfordview',
      address: 'PsychMatters Centre, Bedfordview, Johannesburg',
    },
    contactPhone: '011 450 3676',
  },

  // ── CANCER SUPPORT ────────────────────────────────────────────────────────
  {
    name: 'CANSA Bereavement Support Group',
    description: 'CANSA (Cancer Association of South Africa) offers bereavement support groups for individuals who have lost a loved one to cancer. Groups provide a compassionate space to process grief, share memories, and receive support from others who have experienced cancer-related loss. Available at CANSA Care Centres nationwide.',
    category: 'Cancer Support',
    meetingType: 'in-person' as const,
    location: {
      city: 'National',
      address: 'Available at CANSA Care Centres nationwide',
    },
    contactPhone: '0800 22 6622',
    website: 'https://www.cansa.org.za',
  },
  {
    name: 'CANSA Caregiver Support Group',
    description: 'Support group specifically for people who are caring for a loved one with cancer. CANSA\'s caregiver groups address the unique emotional, physical, and practical challenges of being a cancer caregiver. Participants share coping strategies, access resources, and find connection with others in similar roles. Available at CANSA Care Centres across South Africa.',
    category: 'Cancer Support',
    meetingType: 'in-person' as const,
    location: {
      city: 'National',
      address: 'Available at CANSA Care Centres nationwide',
    },
    contactPhone: '0800 22 6622',
    website: 'https://www.cansa.org.za',
  },
  {
    name: 'CANSA Newly Diagnosed Support Group',
    description: 'Support group for individuals who have recently received a cancer diagnosis. CANSA\'s newly diagnosed groups help people navigate the shock and uncertainty of a new cancer diagnosis, providing information, emotional support, and connection with others at a similar stage of their cancer journey. Available at CANSA Care Centres nationwide.',
    category: 'Cancer Support',
    meetingType: 'in-person' as const,
    location: {
      city: 'National',
      address: 'Available at CANSA Care Centres nationwide',
    },
    contactPhone: '0800 22 6622',
    website: 'https://www.cansa.org.za',
  },

  // ── SADAG PEER-LED SUPPORT GROUPS ─────────────────────────────────────────
  // The following groups are peer-led support groups listed on the SADAG directory.

  // Depression & Anxiety
  {
    name: 'Depression and Anxiety Support Group – Fourways JHB',
    description: 'Peer support group for depression and anxiety, meeting at The Indaba Hotel, William Nicol Drive, Fourways. Facilitated by Rupa. Contact 073 606 1968 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Johannesburg', address: 'The Indaba Hotel, William Nicol Drive, Fourways' },
    meetingSchedule: 'Second and last Thursday of the month',
    contactPhone: '073 606 1968',
  },
  {
    name: 'All Mental Illnesses Support Group – Fairlands JHB',
    description: 'Support group open to people living with any mental illness. Meeting in-person in Fairlands, Johannesburg and online. Facilitated by Megan. Contact 073 173 5391 to join.',
    category: 'Mental Health',
    meetingType: 'hybrid' as const,
    location: { city: 'Johannesburg', address: 'Fairlands, Johannesburg' },
    meetingSchedule: 'Tuesday and Thursday evenings at 18:30 for 40 minutes',
    contactPhone: '0731735391',
  },
  {
    name: 'Anxiety, Depression and Bipolar Support Group – Online (Vuyo)',
    description: 'Online peer support group for anxiety, depression and bipolar disorder via Zoom or WhatsApp. Facilitated by Vuyo. Contact 071 421 4615 to join and discuss meeting frequency.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Frequency discussed with group — every Friday or every second Friday',
    contactPhone: '071 421 4615',
  },
  {
    name: 'Depression and Anxiety Support Group – WhatsApp (Lorna)',
    description: 'WhatsApp-based peer support group for depression and anxiety. Facilitated by Lorna. Contact 081 306 6647 on WhatsApp for support.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Contact Lorna on WhatsApp for support',
    contactPhone: '081 306 6647',
  },
  {
    name: 'Depression and Anxiety Support Group – WhatsApp (Lauren)',
    description: 'WhatsApp-based peer support group for depression and anxiety. Facilitated by Lauren. Contact 072 728 3404 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Mondays 10am',
    contactPhone: '072 728 3404',
  },
  {
    name: 'Depression & Anxiety Support Group – Zoom/WhatsApp (Zandile)',
    description: 'Online peer support group for depression and anxiety via Zoom and WhatsApp. Facilitated by Zandile. Contact 074 341 5114 for information.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Contact for info',
    contactPhone: '074 341 5114',
  },
  {
    name: 'Depression and Anxiety Support Group – Online (Loide)',
    description: 'WhatsApp-based peer support group for depression and anxiety. Facilitated by Loide. Contact +2681 6672601 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Contact for info',
    contactPhone: '+2681 6672601',
  },
  {
    name: 'Depression and Anxiety Support Group – Young Adults 18-35 (Lulama)',
    description: 'Online peer support group for young adults aged 18-35 living with depression and anxiety. Facilitated by Lulama. Contact 067 748 9008 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Wednesday, twice a month',
    contactPhone: '067 748 9008',
  },
  {
    name: 'Depression, Anxiety & Bipolar Support Group – Kyalami Estate',
    description: 'In-person support group for depression, anxiety and bipolar disorder in Kyalami Estate. Facilitated by Marianna. Contact 083 271 4782 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Johannesburg', address: '23 Pamona Crescent, Kyalami Estate' },
    meetingSchedule: 'Tuesday, twice a month',
    contactPhone: '083 271 4782',
  },
  {
    name: 'Depression, Anxiety and Bipolar Support Group – Online (Ann Douglas)',
    description: 'Online peer support group for depression, anxiety and bipolar disorder via Zoom. Facilitated by Ann Douglas. Contact 081 895 2878 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Tuesday, twice a month',
    contactPhone: '081 895 2878',
  },
  {
    name: 'Mental Health Support Group for Pregnancy and Stress – Diepsloot',
    description: 'Support group for people dealing with mental health challenges related to pregnancy and stress. Meeting at God\'s Will Church, Diepsloot. Facilitated by Thandiwe. Contact 073 767 0042 to join.',
    category: 'Parenting & Family',
    meetingType: 'in-person' as const,
    location: { city: 'Johannesburg', address: "God's Will Church, Ext 6, Diepsloot" },
    meetingSchedule: 'Every Tuesday',
    contactPhone: '073 767 0042',
  },
  {
    name: 'Depression, Panic & Bipolar Support Group – eMalahleni',
    description: 'In-person support group for depression, panic disorder and bipolar disorder. Meeting at Faith Baptist Church, eMalahleni/Witbank. Facilitated by Clive. Contact 083 609 9480 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'eMalahleni', address: 'Faith Baptist Church, 64 Andromeda Ave, Reyno Ridge, eMalahleni' },
    meetingSchedule: 'First Tuesday of the month',
    contactPhone: '083 609 9480',
  },
  {
    name: 'Depression/Stress/Anxiety Support Group – Online Zoom (Kayleigh & Jessica)',
    description: 'Online peer support group for depression, stress and anxiety via Zoom. Facilitated by Kayleigh and Jessica. Contact 011 450 3576 to RSVP.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '2pm, contact to confirm',
    contactPhone: '011 450 3576',
  },
  {
    name: '\'Mind your Health\' Depression & Anxiety Support Group – Chatsworth Durban',
    description: '\'Mind your Health\' support group for depression and anxiety. Meeting at Nelson Mandela Community Youth Centre, Chatsworth, Durban. Facilitated by Aimee. Contact 067 005 1325 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Durban', address: 'Nelson Mandela Community Youth Centre, RK Khan Circle, Chatsworth' },
    meetingSchedule: 'Saturday, twice a month',
    contactPhone: '067 005 1325',
  },
  {
    name: 'Depression, Anxiety & Bipolar Support Group – Online (Ruleen)',
    description: 'Online peer support group for depression, anxiety and bipolar disorder. Facilitated by Ruleen. Contact 082 782 0287 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Third Monday of the month',
    contactPhone: '082 782 0287',
  },
  {
    name: 'Depression & Anxiety Support Group – Thaba Nchu Free State',
    description: 'In-person peer support group for depression and anxiety in Thaba Nchu, Free State. Facilitated by Lebogang. Contact 082 228 9627 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Thaba Nchu', address: '18329 Seroalo, Thaba Nchu, Free State' },
    meetingSchedule: 'Friday, twice a month',
    contactPhone: '082 228 9627',
  },
  {
    name: 'Mental Health Support Group – Venue on Request (Melissa)',
    description: 'Mental health peer support group. Venue provided on contact. Facilitated by Melissa. Contact 072 577 4348 for details on venue and meeting dates.',
    category: 'Mental Health',
    meetingType: 'in-person' as const,
    location: { city: 'National' },
    meetingSchedule: 'One Saturday a month',
    contactPhone: '072 577 4348',
  },
  {
    name: 'Depression & Anxiety Support Group – Hybrid (Annezka/Mike)',
    description: 'Hybrid support group for depression and anxiety, meeting both online and in-person at The Glen Pastoral Care Centre, Garsfontein, Pretoria. Facilitated by Annezka and Mike. Contact 082 875 4805 to join.',
    category: 'Depression',
    meetingType: 'hybrid' as const,
    location: { city: 'Pretoria', address: 'The Glen Pastoral Care Centre, Cnr Keeshond & Hilda Botha Streets, Garsfontein' },
    meetingSchedule: 'Every Second Thursday',
    contactPhone: '082 875 4805',
  },
  {
    name: 'Depression & Anxiety Women\'s Support Group – Newcastle KZN',
    description: 'Women\'s support group for depression and anxiety. Meeting at Mediclinic Kintsugi Centre, Newcastle, KZN. Facilitated by Farzanah. Contact 084 786 1135 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Newcastle', address: 'Mediclinic Kintsugi Centre, Cnr Hospital & Bird St, Newcastle, KZN' },
    meetingSchedule: 'Wednesday, once a month',
    contactPhone: '084 786 1135',
  },
  {
    name: 'Depression & Anxiety Support Group – Young Adults 18-35 Online (Jenna)',
    description: 'Online peer support group for young adults aged 18-35 dealing with depression and anxiety via Zoom. Facilitated by Jenna. Contact 074 691 7233 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Second Saturday',
    contactPhone: '074 691 7233',
  },
  {
    name: 'Depression & Anxiety Support Group – Mossel Bay',
    description: 'In-person support group for depression and anxiety. Meeting at CBS Café, Mossel Bay. Facilitated by Thandokazi. Contact 069 538 2343 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Mossel Bay', address: 'CBS Café, 38 Mayikhale St, KwaNongaba, Mossel Bay' },
    meetingSchedule: 'First and third Monday of the month',
    contactPhone: '069 538 2343',
  },
  {
    name: 'Depression, Anxiety and Bipolar Support Group – East London',
    description: 'In-person support group for depression, anxiety and bipolar disorder. Meeting at Vincent Methodist Church, East London. Facilitated by Vuyo. Contact 078 567 5060 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'East London', address: 'Vincent Methodist Church, Preston Ave, Vincent, East London' },
    meetingSchedule: 'Friday, twice a month',
    contactPhone: '078 567 5060',
  },
  {
    name: 'Depression and Anxiety Support Group – Northdene Durban',
    description: 'In-person support group for depression and anxiety in Northdene, Durban. Facilitated by Tina, Angelique, and Nevil. Contact Tina on 066 202 9252, Angelique on 083 788 9989, or Nevil on 073 255 3737.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Durban', address: 'Northdene, Durban' },
    meetingSchedule: '2nd and 4th Thursday of the month',
    contactPhone: '066 202 9252',
  },
  {
    name: 'Depression & Anxiety Women\'s Support Group – Eldorado Park',
    description: 'Women\'s support group for depression and anxiety in Eldorado Park. Facilitated by Lorna. Contact 071 896 0216 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Johannesburg', address: '35 Roggeveld Street, Ext 2, Eldorado Park' },
    meetingSchedule: 'Saturday, twice a month',
    contactPhone: '071 896 0216',
  },
  {
    name: 'Depression & Anxiety Support Group – Sedgefield Garden Route',
    description: 'Support group for depression and anxiety in the Sedgefield and Garden Route area. Facilitated by Shane. Contact 084 580 3167 for venue details.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Sedgefield', address: 'Sedgefield and Garden Route area' },
    meetingSchedule: 'Every Wednesday',
    contactPhone: '084 580 3167',
  },
  {
    name: 'Depression Support Group – Sundumbili KZN',
    description: 'In-person support group for depression. Meeting at New loveLife Trust Youth Center, Sundumbili, KZN. Facilitated by Londy. Contact 063 477 0720 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Sundumbili', address: 'New loveLife Trust Youth Center, Thokoza Road, Sibusiziwe, Sundumbili, KZN' },
    meetingSchedule: 'Last Saturday of the month (1:30pm to 3pm)',
    contactPhone: '063 477 0720',
  },
  {
    name: 'Post Traumatic Stress Support Group – Online (Sinenhlanhla)',
    description: 'Online peer support group for post-traumatic stress. Facilitated by Sinenhlanhla. Contact 064 780 4990 to join.',
    category: 'PTSD & Trauma',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Saturday, weekly',
    contactPhone: '064 780 4990',
  },
  {
    name: 'Depression, Anxiety and Panic Support Group – Young Adults 18-35 (Karla)',
    description: 'Online support group for young adults aged 18-35 dealing with depression, anxiety and panic attacks via Zoom. Facilitated by Karla. Contact 072 788 6685 to join.',
    category: 'Anxiety & Panic',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Thursday, twice a month',
    contactPhone: '072 788 6685',
  },
  {
    name: 'Mental Health Support Group – Fairland JHB (Megan)',
    description: 'Weekly mental health support group meeting at Mosaiek Church, Fairland, Johannesburg. Facilitated by Megan. Contact 073 173 5391 to join.',
    category: 'Mental Health',
    meetingType: 'in-person' as const,
    location: { city: 'Johannesburg', address: 'Mosaiek Church, Cnr Davidson and Danielle Streets, Fairland' },
    meetingSchedule: 'Thursday, weekly',
    contactPhone: '073 173 5391',
  },
  {
    name: 'Women\'s Mental Health Support Group – Online (Sharon)',
    description: 'Online women\'s mental health support group via Microsoft Teams. Facilitated by Sharon. Contact ShazzaMK@outlook.com to join.',
    category: 'Women\'s Support',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Second Wednesday',
    contactEmail: 'ShazzaMK@outlook.com',
  },
  {
    name: 'Depression, Anxiety & PTSD Support Group – Online (Marelize)',
    description: 'Online peer support group for depression, anxiety and PTSD via Zoom. Facilitated by Marelize and Mychaela. Contact Marelize on 071 342 9810 or Mychaela on 082 659 2096 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Second Wednesday',
    contactPhone: '071 342 9810',
  },
  {
    name: 'Depression, Anxiety and Bipolar Support Group – Online (Anthony)',
    description: 'Online peer support group for depression, anxiety and bipolar disorder via Google Meet. Facilitated by Anthony. Contact 065 683 2358 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Wednesday, twice a month',
    contactPhone: '065 683 2358',
  },
  {
    name: 'Depression and Loneliness Support Group – Murraysburg CPT',
    description: 'In-person support group for depression and loneliness. Meeting at UCCSA Church Hall, Kanarie Street, Murraysburg, Western Cape. Facilitated by Julian. Contact 063 145 7677 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Murraysburg', address: 'UCCSA Church Hall, Kanarie St, Murraysburg' },
    meetingSchedule: 'Friday, weekly',
    contactPhone: '063 145 7677',
  },
  {
    name: 'Bipolar Disorder, Anxiety & Panic Support Group – Online (Sisonke)',
    description: 'Online peer support group for bipolar disorder, anxiety and panic. Facilitated by Sisonke. Contact 072 015 8384 to join.',
    category: 'Bipolar Disorder',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'First and last Wednesday of the month',
    contactPhone: '072 015 8384',
  },
  {
    name: 'Bipolar Disorder Support Group – Online (Mogamad)',
    description: 'Online peer support group for bipolar disorder via Google Meet. Facilitated by Mogamad. Contact nackerdienm@gmail.com to join.',
    category: 'Bipolar Disorder',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Wednesday',
    contactEmail: 'nackerdienm@gmail.com',
  },
  {
    name: 'Bipolar Disorder Support Group – Online (Richard)',
    description: 'Online peer support group for people living with bipolar disorder. Facilitated by Richard. Contact 082 423 7167 to join.',
    category: 'Bipolar Disorder',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Second Wednesday',
    contactPhone: '082 423 7167',
  },
  {
    name: 'Depression, Anxiety, Bipolar & ADHD Support Group – Strandfontein Cape Town',
    description: 'Support group for depression, anxiety, bipolar disorder and ADHD. Meeting at AFM Strandfontein Church, Cape Town. Facilitated by Taswill. Contact 072 7007 254 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Cape Town', address: 'AFM Strandfontein, Cnr Play Street & Dennegeur Ave, Strandfontein' },
    meetingSchedule: 'Saturday, twice a month',
    contactPhone: '072 7007 254',
  },
  {
    name: 'Depression & Anxiety Support Group – Online (Kgothatso)',
    description: 'Online peer support group for depression and anxiety via Zoom. Facilitated by Kgothatso. Contact 065 134 0050 or SADAG on 012 344 4000 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'First Wednesday of each month',
    contactPhone: '065 134 0050',
  },
  {
    name: 'Depression, Anxiety and PTSD Support Group – Ferndale Randburg',
    description: 'Support group for depression, anxiety and PTSD. Meeting at Hamadi Clinical Laboratories, 121 Bram Fischer Drive, Ferndale, Randburg. Facilitated by Lee. Contact 084 400 3226 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Randburg', address: 'Hamadi Clinical Laboratories, 121 Bram Fischer Drive, Ferndale, Randburg' },
    meetingSchedule: 'Wednesday, weekly',
    contactPhone: '084 400 3226',
  },
  {
    name: 'Depression, Anxiety & PTSD Support Group – Diepkloof Soweto',
    description: 'In-person support group for depression, anxiety and PTSD. Meeting at Lillian Ngoyi Community Clinic, Diepkloof, Soweto. Facilitated by Lindiwe. Contact 082 960 0789 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Soweto', address: 'Lillian Ngoyi Community Clinic (Koos Beukes Clinic), 26 Chris Hani Road, Zone 6, Diepkloof, Soweto' },
    meetingSchedule: 'Third Saturday of the month',
    contactPhone: '082 960 0789',
  },
  {
    name: 'Stress & Anxiety Support Group – Bedford Gardens JHB',
    description: 'In-person support group for stress and anxiety. Meeting at 7 Kirkby Road Southport Activity Centre, Bedford Gardens. Facilitated by Paula. Contact 079 125 5233 to join.',
    category: 'Anxiety & Panic',
    meetingType: 'in-person' as const,
    location: { city: 'Johannesburg', address: '7 Kirkby Road, Southport Activity Centre, Bedford Gardens' },
    meetingSchedule: 'Saturday, bi-monthly',
    contactPhone: '079 125 5233',
  },
  {
    name: 'Mental Health & Self-Care Support Group – Newcastle KZN',
    description: 'Support group for mental health and self-care. Meeting at Dr E Y Vahed\'s Medical Practice, Newcastle, KZN. Facilitated by Rashida. Contact 065 522 5840 to join.',
    category: 'Mental Health',
    meetingType: 'in-person' as const,
    location: { city: 'Newcastle', address: '@28 Jordan Street, Newcastle, KZN' },
    meetingSchedule: 'First Tuesday of the month',
    contactPhone: '065 522 5840',
  },
  {
    name: 'Mental Health Support Group – Online (Lisa)',
    description: 'Online peer support group for mental health. Facilitated by Lisa. Contact 078 937 9834 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Wednesday, weekly',
    contactPhone: '078 937 9834',
  },
  {
    name: 'Depression Support Group – Soweto',
    description: 'In-person support group for depression in Soweto. Meeting at 3115 Emdeni Ext 1, Qdabi Street, Soweto. Facilitated by Valky. Contact 082 433 5920 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Soweto', address: '3115 Emdeni Ext 1, Qdabi Street, Soweto' },
    meetingSchedule: 'Every second Thursday',
    contactPhone: '082 433 5920',
  },
  {
    name: 'Depression & Anxiety Support Group – WhatsApp (Daleen)',
    description: 'WhatsApp-based support group for depression and anxiety. Facilitated by Daleen. Contact 071 213 3780 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Thursday',
    contactPhone: '071 213 3780',
  },
  {
    name: 'Mental Health Support Group – Lydenburg',
    description: 'In-person mental health support group. Meeting at Imbali Garden Centre, 39 Church Street, Lydenburg. Facilitated by Annette. Contact 079 493 3073 to join.',
    category: 'Mental Health',
    meetingType: 'in-person' as const,
    location: { city: 'Lydenburg', address: 'Imbali Garden Centre, 39 Church Street, Lydenburg' },
    meetingSchedule: 'Thursday, weekly',
    contactPhone: '079 493 3073',
  },
  {
    name: 'Anxiety, Depression & Trauma Support Group – Somerset West',
    description: 'Support group for anxiety, depression and trauma, meeting alternately online and in-person at Methodist Church, 15 Coronation Street, Somerset West. Facilitated by Tosha. Contact 082 789 2911 to join.',
    category: 'Depression',
    meetingType: 'hybrid' as const,
    location: { city: 'Somerset West', address: 'Methodist Church, 15 Coronation Street, Somerset West' },
    meetingSchedule: 'Monday\'s, bi-weekly',
    contactPhone: '082 789 2911',
  },
  {
    name: 'Depression, Panic & Anxiety Support Group – Young Adults 18-35 (Kaylynn)',
    description: 'Online peer support group for young adults aged 18-35 dealing with depression, panic and anxiety. Facilitated by Kaylynn. Contact 067 997 4059 to join.',
    category: 'Anxiety & Panic',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Wednesday, twice a month',
    contactPhone: '067 997 4059',
  },
  {
    name: 'Depression Support Group – Sterkstroom Eastern Cape',
    description: 'In-person support group for depression. Meeting at Community Church Centre, Sterkstroom, Chris Hani District Municipality, Eastern Cape. Facilitated by Frikkie. Contact WhatsApp 084 036 0045 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Sterkstroom', address: 'Community Church Centre, Sterkstroom, Chris Hani District Municipality, Eastern Cape' },
    meetingSchedule: 'First Friday of the month',
    contactPhone: '084 036 0045',
  },
  {
    name: 'Depression, Anxiety & Bipolar Support Group – Qumbu Eastern Cape',
    description: 'In-person support group for depression, anxiety and bipolar disorder. Meeting at Qumbu Town Hall, OR Tambo District Municipality, Eastern Cape. Facilitated by Anathi. Contact 073 685 8333 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Qumbu', address: 'Qumbu Town Hall, OR Tambo District Municipality, Eastern Cape' },
    meetingSchedule: 'Every second Friday',
    contactPhone: '073 685 8333',
  },
  {
    name: 'Anxiety, Loneliness and Everyday Stress Support Group – Online',
    description: 'Online support group for anxiety, loneliness and everyday stress via Google Meet. Facilitated by Sharon. Contact 083 283 2226 to join.',
    category: 'Anxiety & Panic',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '1st and 3rd Wednesday, twice a month',
    contactPhone: '083 283 2226',
  },
  {
    name: 'Support Group for Grief and Trauma – Online',
    description: 'Online peer support group for grief and trauma. Facilitated by Zama. Contact 083 701 9465 to join.',
    category: 'Bereavement & Grief',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Tuesday, weekly',
    contactPhone: '083 701 9465',
  },
  {
    name: 'Panic and Depression Support Group – Online Zoom (Liat Segall)',
    description: 'Online peer support group for panic disorder and depression via Zoom. Facilitated by Liat Segall. Contact 076 902 8873 to join.',
    category: 'Anxiety & Panic',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Wednesday, twice a month',
    contactPhone: '076 902 8873',
  },
  {
    name: 'Depression and Anxiety Support Group – Estcourt KZN',
    description: 'In-person support group for depression and anxiety. Meeting at Gallop Café, 18 Power Crescent, Estcourt. Facilitated by Nadia. Contact 072 617 8305 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Estcourt', address: 'Gallop Café, 18 Power Crescent, Estcourt' },
    meetingSchedule: 'Saturday, once a month',
    contactPhone: '072 617 8305',
  },
  {
    name: 'Depression, Panic, Bipolar and Anxiety Support Group – Orange Farm',
    description: 'In-person support group for depression, panic disorder, bipolar disorder and anxiety. Meeting in Orange Farm. Facilitated by Eva. Contact 073 086 5148 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Johannesburg', address: 'Plot no. 15573, Extension 2, Stretford, Orange Farm' },
    meetingSchedule: 'Tuesday, twice a month',
    contactPhone: '073 086 5148',
  },
  {
    name: 'Depression, Bipolar and Trauma Support Group – Online (Happy)',
    description: 'Online peer support group for depression, bipolar disorder and trauma. Facilitated by Happy. Contact 076 813 7640 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Tuesday, once a month',
    contactPhone: '076 813 7640',
  },
  {
    name: 'Depression Support Group – Young Adults 18-35 Online (Pinkie)',
    description: 'Online peer support group for young adults aged 18-35 dealing with depression via Zoom. Facilitated by Pinkie. Contact Pinkie on 076 728 9949 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'First Thursday of the month',
    contactPhone: '076 728 9949',
  },
  {
    name: 'Depression and Anxiety Support Group – Fish Hoek Cape Town',
    description: 'In-person support group for depression and anxiety. Meeting at the Main Boardroom, False Bay Hospital, Fish Hoek. Facilitated by Lauren. Contact 072 728 3404 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Cape Town', address: 'Main Boardroom, False Bay Hospital, 17th Avenue, Fish Hoek' },
    meetingSchedule: 'Every Monday',
    contactPhone: '072 728 3404',
  },
  {
    name: 'Depression, Anxiety and Bipolar Support Group – Kempton Park',
    description: 'In-person support group for depression, anxiety and bipolar disorder (meetings conducted in English). Meeting in Kempton Park. Facilitated by Annemi. Contact 082 774 2813 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Kempton Park', address: '24 Antbear St, Esther Park, Kempton Park' },
    meetingSchedule: 'Last Thursday of the month',
    contactPhone: '082 774 2813',
  },
  {
    name: 'Depression and Anxiety Support Group – Crestholme Durban',
    description: 'In-person support group for depression and anxiety. Meeting at Crest Community Centre, Crestholme, Durban. Facilitated by Anne. Contact 066 440 7537 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Durban', address: 'Crest Community Centre, 85 River View Drive, Crestholme, Durban' },
    meetingSchedule: '2nd and 4th Saturday of the month',
    contactPhone: '066 440 7537',
  },
  {
    name: 'Depression, Anxiety & Trauma Support Group – Cape Town (Daniella)',
    description: 'In-person support group for depression, anxiety and trauma. Meeting at Hellenic Community Centre, Cape Town. Facilitated by Daniella. Contact 079 842 5044 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Cape Town', address: 'Hellenic Community Centre, 24 Bay Road, Mobile Point, Cape Town' },
    meetingSchedule: 'Every Monday',
    contactPhone: '079 842 5044',
  },
  {
    name: 'Depression and Anxiety Support Group – Houghton House',
    description: 'In-person support group for depression and anxiety at Houghton House. Facilitated by Lara. Contact 076 149 5830 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Johannesburg', address: 'Houghton House' },
    meetingSchedule: 'Every 2nd Friday of the month',
    contactPhone: '076 149 5830',
  },
  {
    name: 'Depression, Anxiety and Burnout Support Group – Online (Lindsey)',
    description: 'Online peer support group for depression, anxiety and burnout. Facilitated by Lindsey. Contact 063 901 6088 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Second Sunday',
    contactPhone: '063 901 6088',
  },
  {
    name: 'Depression & Anxiety Support Group – PsychMatters Bedfordview',
    description: 'In-person support group for depression and anxiety at PsychMatters, Bedfordview, Johannesburg. Facilitated by Felicia and Danielle. Contact 079 494 9682 to join.',
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: { city: 'Bedfordview', address: 'PsychMatters, 9 Park Street, Bedfordview, Johannesburg' },
    meetingSchedule: 'Saturday, once a month',
    contactPhone: '079 494 9682',
  },
  {
    name: 'Depression Support Group – Online (Turnelo)',
    description: 'Online peer support group for depression. Facilitated by Turnelo. Contact 060 307 9381 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Saturday, twice a month',
    contactPhone: '060 307 9381',
  },
  {
    name: 'Depression Support Group – Online Zoom (Zukie)',
    description: 'Online peer support group for depression via Zoom. Facilitated by Zukie. Contact 078 386 2750 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Tuesday, twice a month',
    contactPhone: '078 386 2750',
  },
  {
    name: 'Depression & Anxiety Support Group – Online Google Meet (Danielle)',
    description: 'Online peer support group for depression and anxiety via Google Meet. Facilitated by Danielle. Contact 082 779 3542 to join.',
    category: 'Depression',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Tuesday',
    contactPhone: '082 779 3542',
  },

  // Perinatal, Postpartum & Parenting
  {
    name: 'Support Group for First Time Moms – Online',
    description: 'Online support group for first time mothers. Facilitated by Kopano. Contact 081 458 8861 to join.',
    category: 'Parenting & Family',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Saturday, once a month',
    contactPhone: '081 458 8861',
  },
  {
    name: 'Support Group for Mums with Depression and Postnatal Depression – WhatsApp',
    description: 'WhatsApp support group for mothers suffering from depression including postnatal depression. Facilitated by Aadila. Contact 079 252 1087 to join.',
    category: 'Parenting & Family',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Depending on need',
    contactPhone: '079 252 1087',
  },
  {
    name: 'Mums Support Network for Perinatal Mental Health – La Lucia Durban',
    description: 'Perinatal mental health support network for mothers, meeting at La Lucia library and via Zoom. Facilitated by Alex. Contact 083 788 0689 or alexandra@mumsupport.co.za to join.',
    category: 'Parenting & Family',
    meetingType: 'hybrid' as const,
    location: { city: 'Durban', address: 'La Lucia Library, La Lucia' },
    meetingSchedule: 'Every Thursday at La Lucia library 9:30-11; Zoom every other Saturday',
    contactPhone: '083 788 0689',
    contactEmail: 'alexandra@mumsupport.co.za',
  },
  {
    name: 'Support Group for Parents & Loved Ones of Those Living with ADHD – Online',
    description: 'Online support group for parents and loved ones of people living with ADHD via Zoom. Facilitated by Ilhaam. Contact ilhaamk@gmail.com to join.',
    category: 'ADHD',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Third Wednesday of the month',
    contactEmail: 'ilhaamk@gmail.com',
  },
  {
    name: 'Support Group for Loved Ones of Children with Mental Health Conditions – Online',
    description: 'Online support group for caregivers and loved ones of children with depression, anxiety, ADHD and other mental health conditions. Facilitated by Illiana. Contact 083 392 0458 to join.',
    category: 'Parenting & Family',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Sunday, twice a month',
    contactPhone: '083 392 0458',
  },
  {
    name: 'Mental Health Support Group for Mothers of Children with Learning Difficulties – Online',
    description: 'Online support group for mothers and carers of children with mental health challenges resulting in learning difficulties. Facilitated by Nombuso. Contact 071 328 7699 to join.',
    category: 'Parenting & Family',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'First Thursday of every month',
    contactPhone: '071 328 7699',
  },
  {
    name: 'Support Group for New Parents and Caregivers – Online',
    description: 'Online support group for new parents and caregivers. Facilitated by Gabi. Contact gabi@pmhnest.org to join.',
    category: 'Parenting & Family',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every second Friday',
    contactEmail: 'gabi@pmhnest.org',
  },
  {
    name: 'Postpartum Depression Support Group – Katlehong',
    description: 'In-person support group for postpartum depression. Meeting at Katlehong Resource Centre, 824 Sontonga Road, Katlehong. Facilitated by Phindile. Contact 067 177 9879 to join.',
    category: 'Parenting & Family',
    meetingType: 'in-person' as const,
    location: { city: 'Katlehong', address: 'Katlehong Resource Centre, 824 Sontonga Road, Katlehong, Gauteng' },
    meetingSchedule: 'Friday, twice a month',
    contactPhone: '067 177 9879',
  },
  {
    name: 'Support Group for Postnatal/Postpartum Depression – Online',
    description: 'Online support group for postnatal and postpartum depression. Facilitated by Sanele. Contact 082 624 1925 on WhatsApp to join.',
    category: 'Parenting & Family',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Last Friday of the month',
    contactPhone: '082 624 1925',
  },
  {
    name: 'Mental Health Support Group for Mothers – East Rand (Lebohang)',
    description: 'Online mental health support group for mothers in the East Rand area via Zoom. Facilitated by Lebohang. Contact 061 812 3617 to join.',
    category: 'Parenting & Family',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Thursday, weekly',
    contactPhone: '061 812 3617',
  },
  {
    name: 'Support Group for Single Parents – Online WhatsApp',
    description: 'Online WhatsApp-based support group for single parents. Facilitated by Zandile. Contact 074 341 5114 to join.',
    category: 'Single Parents',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Third Thursday of the month',
    contactPhone: '074 341 5114',
  },
  {
    name: 'Support Group for Parents of Neurodivergent Children – Vanderbijlpark',
    description: 'In-person support group for parents of neurodivergent children (ADHD, Autism, Dyslexia). Meeting at Eat Right Offices, Vanderbijlpark. Facilitated by Casey. Contact 071 362 6120 to join.',
    category: 'Parenting & Family',
    meetingType: 'in-person' as const,
    location: { city: 'Vanderbijlpark', address: 'Eat Right Offices, 34 Hendrik van Eck Street, SE 3, Vanderbijlpark, Gauteng' },
    meetingSchedule: 'Every two weeks',
    contactPhone: '071 362 6120',
  },
  {
    name: 'Parents of Teenagers with Behavioural Issues – Online',
    description: 'Online support group for parents of teenagers with behavioural issues. Facilitated by Tselane. Contact 065 929 6242 to join.',
    category: 'Parenting & Family',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '1st and 3rd Monday of the month',
    contactPhone: '065 929 6242',
  },
  {
    name: 'Mental Health Support for Parents & Loved Ones of Children with Special Needs – Online',
    description: 'Online support group for parents and loved ones of children with special needs. Facilitated by Justine. Contact 065 955 5143 to join.',
    category: 'Parenting & Family',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Last Saturday of the month',
    contactPhone: '065 955 5143',
  },
  {
    name: 'Support Group for Parents & Caregivers of Children – Online (Isabel)',
    description: 'Online support group for parents and caregivers of children. Facilitated by Isabel. Contact 064 181 6817 to join.',
    category: 'Parenting & Family',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Tuesday, twice a month',
    contactPhone: '064 181 6817',
  },
  {
    name: 'Parents & Guardians of Children with Special Needs – Online (Nelly)',
    description: 'Online support group for parents and guardians of children with special needs. Facilitated by Nelly. Contact 068 080 7630 to join.',
    category: 'Parenting & Family',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Last Sunday of the month',
    contactPhone: '068 080 7630',
  },
  {
    name: 'Peer Support Group for Tertiary Students – Zoom (Esethu)',
    description: 'Online peer support group for tertiary students. Facilitated by Esethu. Contact 083 941 6003 to join.',
    category: 'Youth & Teen Support',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Thursday, weekly',
    contactPhone: '083 941 6003',
  },
  {
    name: 'Peer Support Group for Tertiary Students – Teams (Charlize)',
    description: 'Online peer support group for tertiary students via Microsoft Teams. Facilitated by Charlize. Contact 064 054 8560 to join.',
    category: 'Youth & Teen Support',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every second Wednesday',
    contactPhone: '064 054 8560',
  },
  {
    name: 'Peer Support Group for Tertiary Students – Zoom (Lerato/Mbalentle/Paballo)',
    description: 'Online peer support group for tertiary students via Zoom. Facilitated by Lerato, Mbalentle and Paballo. Contact 072 389 3663 to join.',
    category: 'Youth & Teen Support',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every second Thursday',
    contactPhone: '072 389 3663',
  },
  {
    name: 'Support Group for Parents of Children who Abuse Substances – Benoni',
    description: 'In-person support group for parents of children who abuse substances. Meeting at St. Lukes Methodist Church, Wattville, Benoni. Facilitated by Monde. Contact 081 424 7135 to join.',
    category: 'Addiction Recovery',
    meetingType: 'in-person' as const,
    location: { city: 'Benoni', address: 'St. Lukes Methodist Church, 1903B Xhuma Street, Wattville, Benoni, Gauteng' },
    meetingSchedule: 'Thursday, weekly',
    contactPhone: '081 424 7135',
  },

  // Mental Health – Family Support
  {
    name: 'Support Group for Family Members Supporting Someone with Mental Illness – Online',
    description: 'Online support group for family members and loved ones supporting someone with a mental illness via Zoom. Facilitated through SADAG. Contact SADAG on 0800 21 22 23 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every 4th Thursday of the month',
    contactPhone: '0800 21 22 23',
    website: 'https://www.sadag.org',
  },
  {
    name: 'Support Group for Family Members of Those with Borderline Personality Disorder – Online',
    description: 'Online support group via Google Meet for family members and loved ones of people living with Borderline Personality Disorder. Facilitated through SADAG. Contact SADAG on 0800 21 22 23 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Second Thursday of the month',
    contactPhone: '0800 21 22 23',
    website: 'https://www.sadag.org',
  },
  {
    name: 'Support Group for Family Members & Caregivers of Those with Schizophrenia – Online',
    description: 'Online support group for family members and caregivers of those diagnosed with schizophrenia and schizo-affective disorder. Facilitated by Tina. Contact 082 460 7915 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every 2nd and 4th Tuesday',
    contactPhone: '082 460 7915',
  },
  {
    name: 'Mental Health Support Group for Parents/Caregivers of Children with Mental Illness or Disabilities – Online',
    description: 'Online support group via Google Meet for parents and caregivers of children with mental illness or disabilities. Facilitated by Nelly. Contact 072 348 1903 to join.',
    category: 'Parenting & Family',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Second Sunday',
    contactPhone: '072 348 1903',
  },

  // Substance Abuse & Addiction
  {
    name: 'Support Group for Families & Friends of People Who Use Substances – Eersterust Pretoria',
    description: 'In-person support group for families and friends of people who use substances. Meeting at St. Joseph\'s Catholic Church, Eersterust, Pretoria. Facilitated by Byron and Raylene. Contact Byron on 066 589 7439 or Raylene on 082 546 2368.',
    category: 'Addiction Recovery',
    meetingType: 'in-person' as const,
    location: { city: 'Pretoria', address: 'St. Joseph\'s Catholic Church, 404 St. Joseph Street, Eersterust, Pretoria' },
    meetingSchedule: 'Every second Thursday',
    contactPhone: '066 589 7439',
  },
  {
    name: 'Support Group for Loved Ones Supporting Someone in Addiction – Online',
    description: 'Free online support group via Google Meet for loved ones supporting someone in addiction or substance use. Facilitated by Ruth. Contact mail@lifepillars.co.ke to join.',
    category: 'Addiction Recovery',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Thursday',
    contactEmail: 'mail@lifepillars.co.ke',
  },
  {
    name: 'Support Group for Recovering Substance Users – Online',
    description: 'Online peer support group for recovering substance users. Facilitated by Eugene. Contact 072 309 6586 to join.',
    category: 'Addiction Recovery',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Wednesday, weekly',
    contactPhone: '072 309 6586',
  },
  {
    name: 'Addiction & Substance Abuse Support Group – Online (Megan)',
    description: 'Online peer support group for addiction and substance abuse. Facilitated by Megan. Contact 073 173 5391 to join.',
    category: 'Addiction Recovery',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Wednesday, weekly',
    contactPhone: '073 173 5391',
  },
  {
    name: 'Substance Abuse Support Group – Young Adults Online (Donald)',
    description: 'Online support group for young adults dealing with substance abuse via Zoom. Facilitated by Donald. Contact 068 029 3352 to join.',
    category: 'Addiction Recovery',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Saturday',
    contactPhone: '068 029 3352',
  },
  {
    name: 'Support Group for Substance Use Recovery After Rehab – Benoni',
    description: 'In-person support group for individuals recovering from substance use after completing rehabilitation. Meeting at St. Lukes Methodist Church, Benoni. Facilitated by Mamelete. Contact 081 313 4299 to join.',
    category: 'Addiction Recovery',
    meetingType: 'in-person' as const,
    location: { city: 'Benoni', address: 'St. Lukes Methodist Church, 1903B Xuma Street, Wattville, Benoni, Gauteng' },
    meetingSchedule: '2nd and 4th Tuesday of every month',
    contactPhone: '081 313 4299',
  },
  {
    name: 'Substance Abuse and Depression Support Group – Online Skype',
    description: 'Online support group for substance abuse and depression via Skype. Facilitated by Laura. Contact 071 753 3612 to join.',
    category: 'Addiction Recovery',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Last Tuesday of the month',
    contactPhone: '071 753 3612',
  },
  {
    name: 'Depression / Substance Abuse Support Group – Kareedouw',
    description: 'Support group for depression and substance abuse. Meeting at Mooiuitzicht Treatment Centre, Kareedouw. Facilitated by George. Contact 079 490 5042 to join.',
    category: 'Addiction Recovery',
    meetingType: 'in-person' as const,
    location: { city: 'Kareedouw', address: 'Mooiuitzicht Treatment Centre, Kareedouw' },
    meetingSchedule: 'Weekly',
    contactPhone: '079 490 5042',
  },

  // OCD
  {
    name: 'OCD Support Group – Online Zoom',
    description: 'Online peer support group for people living with OCD (Obsessive Compulsive Disorder) via Zoom. Facilitated by Tish. Contact 082 788 6108 to join.',
    category: 'OCD',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every second Monday',
    contactPhone: '082 788 6108',
  },

  // Hospital & Medical Recovery
  {
    name: 'Hospital Recovery Support Group (Injuries/Operations) – Microsoft Teams',
    description: 'Online support group via Microsoft Teams for people recovering from injuries and operations. Facilitated by Roxanne. Contact via WhatsApp on 076 275 6053 to join.',
    category: 'Chronic Illness',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'First Tuesday of the month',
    contactPhone: '076 275 6053',
  },

  // Trans & Gender Diverse
  {
    name: 'Support Group for Parents & Caregivers of Trans and Gender-Diverse Youth – Online',
    description: 'Online support group via WhatsApp for trans teens, kids, parents and caregivers of trans and gender-diverse youth. Facilitated by Matimba. RSVP to akani@matimba.org.za to join.',
    category: 'LGBTQ+',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Contact to inquire',
    contactEmail: 'akani@matimba.org.za',
  },
  {
    name: 'Support Group for Issues Faced by Transgender People – Young Adults 18-35',
    description: 'Online support group via WhatsApp for issues faced by transgender people, for young adults aged 18-35. Facilitated by Pranav. Contact WhatsApp 081 215 3334 to join.',
    category: 'LGBTQ+',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every second Monday',
    contactPhone: '081 215 3334',
  },

  // LGBTQ+
  {
    name: 'LGBTQIA+ Support Group – Young Adults 18-35 (Will)',
    description: 'Online support group via Zoom for LGBTQIA+ young adults aged 18-35. Facilitated by Will. Contact 074 057 1780 to join.',
    category: 'LGBTQ+',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every second Wednesday',
    contactPhone: '074 057 1780',
  },
  {
    name: 'LGBTQIA+ Identifying or Questioning Support Group – Online',
    description: 'Online support group for individuals who are LGBTQIA+ identifying or questioning. Facilitated by Tris. Contact 061 601 5242 to join.',
    category: 'LGBTQ+',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every second Thursday',
    contactPhone: '061 601 5242',
  },
  {
    name: 'LGBTQIA+ Community Support Group – 18-35 Online Zoom (Nicoleen)',
    description: 'Online support group via Zoom for the LGBTQIA+ community, aged 18-35. Facilitated by Nicoleen. Contact 084 270 5667 to join.',
    category: 'LGBTQ+',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Wednesday, twice a month',
    contactPhone: '084 270 5667',
  },

  // Gender-Based Violence
  {
    name: 'Women\'s Support Group for Gender Based Violence – Garsfontein Pretoria',
    description: 'In-person women\'s support group for those dealing with gender-based violence and its effects. Meeting at The Glen Methodist Church, Garsfontein, Pretoria. Facilitated by Renee. Contact 082 897 0593 to join.',
    category: 'Domestic Violence',
    meetingType: 'in-person' as const,
    location: { city: 'Pretoria', address: 'The Glen Methodist Church, Cnr Keeshond & Hilda Botha Streets, Garsfontein, Pretoria' },
    meetingSchedule: 'Every second Saturday',
    contactPhone: '082 897 0593',
  },
  {
    name: 'Women\'s Support Group for Gender Based Violence – Florida Park JHB',
    description: 'Confidential women\'s support group dealing with gender-based violence and its effects. Meeting at Hoërskool Florida, Florida Park, Johannesburg. Facilitated by Jessica. Contact 082 337 9801 to join.',
    category: 'Domestic Violence',
    meetingType: 'in-person' as const,
    location: { city: 'Johannesburg', address: 'Hoërskool Florida, 74 Louis Botha Dr, Florida Park, Johannesburg' },
    meetingSchedule: 'First Saturday of every month',
    contactPhone: '082 337 9801',
  },
  {
    name: 'Women\'s Support Group for Gender Based Violence – Limpopo',
    description: 'Confidential women\'s support group dealing with gender-based violence and its effects in Limpopo. Meeting at Exihlobyeni Worship And Miracle Centre, Mabiligwe. Facilitated by Yvonne. Contact 078 991 3294 to join.',
    category: 'Domestic Violence',
    meetingType: 'in-person' as const,
    location: { city: 'Mabiligwe', address: 'Exihlobyeni Worship And Miracle Centre, Ntlhaveni Block J, 0928 Mabiligwe, Limpopo' },
    meetingSchedule: 'Monday, weekly',
    contactPhone: '078 991 3294',
  },
  {
    name: 'Support Group for Women of Childhood Trauma & Family Toxicity – Online',
    description: 'Online support group via WhatsApp for women of childhood trauma and family toxicity. Facilitated by Dianne Kendall. Contact WhatsApp 082 662 6659 to join.',
    category: 'Domestic Violence',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Last Friday of the month',
    contactPhone: '082 662 6659',
  },

  // Bereavement & Grief
  {
    name: 'Pet Bereavement Support Group – Online',
    description: 'Online support group via WhatsApp for people who have lost a pet. Facilitated by Dianne. Contact WhatsApp 082 662 6659 to join.',
    category: 'Bereavement & Grief',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'First Monday of the month',
    contactPhone: '082 662 6659',
  },
  {
    name: 'Women\'s Grief & Bereavement Support Group – Online Zoom',
    description: 'Online women\'s grief and bereavement support group via Zoom. Facilitated by Masulumane. Contact WhatsApp 072 600 7456 to join.',
    category: 'Bereavement & Grief',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every second Tuesday',
    contactPhone: '072 600 7456',
  },
  {
    name: 'Women\'s Support Group for Grief – Table View Cape Town',
    description: 'In-person women\'s support group for grief. Meeting at Coastlands Community Church, Table View, Cape Town. Facilitated by Sandra. Contact 082 819 9374 to join.',
    category: 'Bereavement & Grief',
    meetingType: 'in-person' as const,
    location: { city: 'Cape Town', address: 'Coastlands Community Church, 82 Jansen Road, Table View, Cape Town' },
    meetingSchedule: 'Wednesday, weekly',
    contactPhone: '082 819 9374',
  },
  {
    name: 'Support Group for Women Dealing with Loss of a Spouse – Rustenburg',
    description: 'In-person support group for women dealing with the loss of a spouse. Meeting at Fields College, Rustenburg, North West. Facilitated by Mildred. Contact 079 442 6900 to join.',
    category: 'Bereavement & Grief',
    meetingType: 'in-person' as const,
    location: { city: 'Rustenburg', address: 'Fields College, 226 Klopper Street, Rustenburg, North West' },
    meetingSchedule: 'Saturday, twice a month',
    contactPhone: '079 442 6900',
  },
  {
    name: 'Grief, Depression and Anxiety Support Group – Young Adults 18-35 Online',
    description: 'Online support group via Zoom for grief, depression and anxiety for young adults aged 18-35. Facilitated by Sonali and Anele. Contact Sonali on 060 980 0167 or Anele on 076 643 7613 to join.',
    category: 'Bereavement & Grief',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Wednesday, twice a month',
    contactPhone: '060 980 0167',
  },
  {
    name: 'Processing Bereavement Support Group – Online',
    description: 'Online support group for processing bereavement. Facilitated by Lea and Dee. Contact Lea on WhatsApp 074 050 8242 or Dee on 084 999 1599 to join.',
    category: 'Bereavement & Grief',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '1st Tuesday, monthly',
    contactPhone: '074 050 8242',
  },
  {
    name: 'Support Group for Post-Breakup, Divorce, and Separation – Online',
    description: 'Online support group for people going through post-breakup, divorce, and separation. Facilitated by Michael. Contact 072 688 3531 to join.',
    category: 'Bereavement & Grief',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '2nd and 4th Tuesday of the month',
    contactPhone: '072 688 3531',
  },
  {
    name: 'Support Group for Abortion Grief – Online',
    description: 'Online support group via Microsoft Teams for abortion grief and general grief. Facilitated through SADAG. Contact SADAG on 0800 21 22 23 to join.',
    category: 'Bereavement & Grief',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '1st, 3rd and last Saturday of the month',
    contactPhone: '0800 21 22 23',
    website: 'https://www.sadag.org',
  },
  {
    name: 'Mental Health Support Group for Grief and Suicide Bereavement – Potchefstroom',
    description: 'In-person mental health support group for grief and suicide bereavement. Meeting at Pregnancy Care Centre, Potchefstroom. Facilitated by Mercia. Contact 082 961 3152 to join.',
    category: 'Suicide Bereavement',
    meetingType: 'in-person' as const,
    location: { city: 'Potchefstroom', address: 'Pregnancy Care Centre, 5 Esselen Street, Die Bult, Potchefstroom' },
    meetingSchedule: 'Wednesday, twice a month',
    contactPhone: '082 961 3152',
  },

  // Suicide Loss / Bereavement
  {
    name: 'Support Group for Loss of Loved Ones to Suicide – Tyger Valley Cape Town',
    description: 'In-person support group for those who have lost loved ones to suicide. Meeting at Tyger Valley Clinic, Rosenpark, Western Cape. Facilitated by Debra. Contact 082 696 6313 to join.',
    category: 'Suicide Bereavement',
    meetingType: 'in-person' as const,
    location: { city: 'Cape Town', address: 'Tyger Valley Clinic, Belvedere Office Park, Pasita Street, Rosenpark, Western Cape' },
    meetingSchedule: 'Thursday, once a month',
    contactPhone: '082 696 6313',
  },
  {
    name: 'Support Group for Survivors of Loved Ones to Suicide – Windsor Park Cape Town',
    description: 'In-person support group for survivors of loved ones who died by suicide. Meeting at Kraaifontein Library Hall, Windsor Park, Cape Town. Facilitated by Marcel. Contact 070 351 6320 to join.',
    category: 'Suicide Bereavement',
    meetingType: 'in-person' as const,
    location: { city: 'Cape Town', address: 'Kraaifontein Library Hall, Brighton Road, Windsor Park, Cape Town' },
    meetingSchedule: 'Saturday, monthly',
    contactPhone: '070 351 6320',
  },

  // Trauma & PTSD
  {
    name: 'Trauma Support Group – Online (Nicolene)',
    description: 'Online peer support group for trauma. Facilitated by Nicolene. Contact Nicolene on 062 590 1549 to join.',
    category: 'PTSD & Trauma',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '2nd and 4th Tuesday, monthly',
    contactPhone: '062 590 1549',
  },
  {
    name: 'Trauma Support Group – Online (Natasha)',
    description: 'Online peer support group for trauma. Facilitated by Natasha. Contact 061 421 9556 to join.',
    category: 'PTSD & Trauma',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Thursday, weekly',
    contactPhone: '061 421 9556',
  },
  {
    name: 'Support Group for Survivors of Sexual Trauma – Online',
    description: 'Online support group for survivors of sexual trauma. Facilitated by Amy. Contact 082 884 0068 to join.',
    category: 'PTSD & Trauma',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '1st and 3rd Tuesday of every month',
    contactPhone: '082 884 0068',
  },
  {
    name: 'PTSD Support Group – Secunda',
    description: 'In-person PTSD support group. Meeting at Suite A1, Grand Palace Building, Heunis Street, Secunda. Facilitated by Melissa. Contact 072 391 1653 to join.',
    category: 'PTSD & Trauma',
    meetingType: 'in-person' as const,
    location: { city: 'Secunda', address: 'Suite A1, Grand Palace Building, Heunis Street, Secunda' },
    meetingSchedule: 'Saturday, once a month',
    contactPhone: '072 391 1653',
  },

  // HIV/AIDS
  {
    name: 'Support Group for People Living with HIV – Online Zoom',
    description: 'Online support group via Zoom for people living with HIV. Facilitated by Louise. Contact 076 701 0005 to join.',
    category: 'HIV/AIDS',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '1st and 3rd Monday of the month',
    contactPhone: '076 701 0005',
  },
  {
    name: 'HIV/AIDS & TB Support Group – Online Zoom (Mildred)',
    description: 'Online support group via Zoom for people living with HIV/AIDS and TB. Facilitated by Mildred. Contact 081 364 7492 to join.',
    category: 'HIV/AIDS',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Tuesday, twice a month',
    contactPhone: '081 364 7492',
  },
  {
    name: 'Support Group for Those Living with HIV/AIDS – Pretoria Central',
    description: 'In-person support group for those living with HIV/AIDS. Meeting at TAU Village, No.279 Struben Street, Pretoria Central. Facilitated by Louise. Contact 076 701 0005 to join.',
    category: 'HIV/AIDS',
    meetingType: 'in-person' as const,
    location: { city: 'Pretoria', address: 'TAU Village, No.279 Struben Street, Pretoria Central' },
    meetingSchedule: '1st and 3rd Saturday of the month',
    contactPhone: '076 701 0005',
  },
  {
    name: 'Support Group for Those Living with HIV and Depression – Roodepoort',
    description: 'In-person support group for people living with HIV and depression. Meeting at Matholesville Skill Center, Roodepoort, Gauteng. Facilitated by Aretha. Contact 068 177 5526 or 082 898 4169 to join.',
    category: 'HIV/AIDS',
    meetingType: 'in-person' as const,
    location: { city: 'Roodepoort', address: 'Matholesville Skill Center, 352 Mother Teresa Street, Matholesville, Roodepoort, Gauteng' },
    meetingSchedule: '1st and 3rd Wednesday of the month',
    contactPhone: '068 177 5526',
  },

  // Chronic Illness
  {
    name: 'Heart Attack Survivors and Family Members Support Group – Online',
    description: 'Online support group for heart attack survivors and their family members. Facilitated by Vanessa. Contact 076 597 1965 to join.',
    category: 'Chronic Illness',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '1st and 3rd Wednesday of the month',
    contactPhone: '076 597 1965',
  },
  {
    name: 'Chronic Illness and Mental Health Support Group – Newlands East Durban',
    description: 'In-person support group for chronic illness and mental health. Meeting at Newlands East Library Hall, Garrick Crescent, Newlands East, Durban. Facilitated by Denise. Contact 079 707 7877 to join.',
    category: 'Chronic Illness',
    meetingType: 'in-person' as const,
    location: { city: 'Durban', address: 'Newlands East Library Hall, Garrick Crescent, Newlands East, Durban' },
    meetingSchedule: 'Third Saturday of the month',
    contactPhone: '079 707 7877',
  },
  {
    name: 'Chronic Illness and Mental Health Support Group – Online (Anneline)',
    description: 'Online support group via Google Meet for chronic illness and mental health. Facilitated by Anneline. Contact on WhatsApp +90 536 712 5690 to join.',
    category: 'Chronic Illness',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'First and Third Thursday of the month',
    contactPhone: '+90 536 712 5690',
  },
  {
    name: 'Support Group for Young Adults Living with Diabetes – WhatsApp',
    description: 'WhatsApp-based support group for young adults aged 18-35 living with diabetes. Facilitated by Courtney. Contact 079 940 0987 to join.',
    category: 'Chronic Illness',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Daily, Monday to Sunday (8am to 6pm)',
    contactPhone: '079 940 0987',
  },
  {
    name: 'Women\'s Group for IBS and Digestive Issues – Online',
    description: 'Online women\'s support group for IBS and digestive issues. Facilitated by Kirsten and Amisha. Contact Kirsten on 072 509 0300 or Amisha on 082 760 7234 to join.',
    category: 'Chronic Illness',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '2nd and 4th Wednesday of each month',
    contactPhone: '072 509 0300',
  },
  {
    name: 'Fibromyalgia & Autoimmune Conditions Support Group – Online',
    description: 'Online peer support group for people living with fibromyalgia and autoimmune conditions via WhatsApp and Google Meet. Facilitated by Jacqui. Contact WhatsApp 072 452 0013 to join.',
    category: 'Chronic Illness',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Monday, twice a month',
    contactPhone: '072 452 0013',
  },

  // Neurological / FND
  {
    name: 'Functional Neurological Disorder (FND) & Mental Health Support Group – Online',
    description: 'Online support group for Functional Neurological Disorder (FND) and mental health. Facilitated by Audrey. Contact 076 291 3442 to join.',
    category: 'Neurological Conditions',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Tuesday, weekly',
    contactPhone: '076 291 3442',
  },

  // Cancer Support
  {
    name: 'Support Group for Breast Cancer – Boskruin Randburg',
    description: 'In-person support group for breast cancer patients and survivors. Meeting at The Barn Church, Boskruin, Randburg. Facilitated by Pumla. Contact 071 088 6228 to join.',
    category: 'Cancer Support',
    meetingType: 'in-person' as const,
    location: { city: 'Randburg', address: 'The Barn Church, 32 Sharrow Road, Boskruin, Randburg' },
    meetingSchedule: 'Last Wednesday of the month',
    contactPhone: '071 088 6228',
  },

  // Anxiety & Panic
  {
    name: 'Mindful Awareness & Self-Reflection Anxiety Support Group – Online',
    description: 'Online support group for mindful awareness and self-reflection to manage anxiety. Facilitated by Sharon. Contact WhatsApp 083 283 2226 to join.',
    category: 'Anxiety & Panic',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '2nd Wednesday of every month',
    contactPhone: '083 283 2226',
  },
  {
    name: 'Mental Health Support Group for Anxiety – Middelburg Mpumalanga',
    description: 'In-person mental health support group focusing on anxiety. Meeting at Midack Athletics Club House, Middelburg, Mpumalanga. Facilitated by Bea. Contact 072 497 2270 to join.',
    category: 'Anxiety & Panic',
    meetingType: 'in-person' as const,
    location: { city: 'Middelburg', address: 'Midack Athletics Club House, Asalia Street, Kanokop, Middelburg, Mpumalanga' },
    meetingSchedule: '1st and 3rd Monday of every month',
    contactPhone: '072 497 2270',
  },
  {
    name: 'Panic & Anxiety Support Group – Online (Melissa)',
    description: 'Online peer support group for panic disorder and anxiety. Facilitated by Melissa. Contact WhatsApp 079 698 6141 to join.',
    category: 'Anxiety & Panic',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Wednesday',
    contactPhone: '079 698 6141',
  },
  {
    name: 'Support Group for Depression, Anxiety & Panic Attacks – Zoom (Rams)',
    description: 'Online peer support group for depression, anxiety and panic attacks via Zoom. Facilitated by Rams. Contact 062 889 4810 to join.',
    category: 'Anxiety & Panic',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'First Wednesday of the month',
    contactPhone: '062 889 4810',
  },
  {
    name: 'Anxiety, Trauma & Grief Support Group – Margate KZN',
    description: 'In-person support group for anxiety, trauma and grief. Meeting at The Foundry, Marine Drive, Margate, KwaZulu-Natal. Facilitated by Brett. Contact 069 150 1348 to join.',
    category: 'Anxiety & Panic',
    meetingType: 'in-person' as const,
    location: { city: 'Margate', address: 'The Foundry, 42 Marine Drive, Margate, KwaZulu-Natal' },
    meetingSchedule: 'Every Thursday',
    contactPhone: '069 150 1348',
  },
  {
    name: 'Support Group for Anxious Attachment – Online Teams',
    description: 'Online support group for anxious attachment via Microsoft Teams. Facilitated by Modiehi. Contact WhatsApp 067 740 0800 to join.',
    category: 'Anxiety & Panic',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every second Thursday',
    contactPhone: '067 740 0800',
  },

  // BPD
  {
    name: 'Online Support Group for Borderline Personality Disorder',
    description: 'Online support group via Google Meet for people living with Borderline Personality Disorder. Facilitated through SADAG. Contact SADAG on 0800 21 22 23 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '1st and 3rd Thursday of the month',
    contactPhone: '0800 21 22 23',
    website: 'https://www.sadag.org',
  },

  // Specific Populations – Professionals & Educators
  {
    name: 'Support Group for Educators Coping with Anxiety – Online',
    description: 'Online support group for educators coping with anxiety. Facilitated by Nirvana. Contact 081 591 0084 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '1st Wednesday of every month',
    contactPhone: '081 591 0084',
  },
  {
    name: 'Mental Wellness & Disability at Work Support Group – Online',
    description: 'Online support group for mental wellness and disability in the workplace. Facilitated by Esme. Contact 073 631 4840 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Friday, weekly',
    contactPhone: '073 631 4840',
  },
  {
    name: 'Wellness at Work Support Group – Online',
    description: 'Online support group for employee wellness and workplace mental health. Facilitated by Esme. Contact 084 643 5435 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Friday, weekly',
    contactPhone: '084 643 5435',
  },
  {
    name: 'Mental Health Support Group for Teachers and Student Teachers – Online',
    description: 'Online support group via WhatsApp for teachers and student teachers. Facilitated by Seren. Contact WhatsApp 073 666 8875 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'First Friday of the month',
    contactPhone: '073 666 8875',
  },
  {
    name: 'Depression, Anxiety, Burnout and Stress Support Group – Professional Women Online',
    description: 'Online support group via Google Meet for professional women dealing with depression, anxiety, burnout and stress. Facilitated by Pearl. Contact 060 559 8071 to join.',
    category: 'Women\'s Support',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every second Wednesday',
    contactPhone: '060 559 8071',
  },
  {
    name: 'Mental Health Support Group for Professional Mamas – Online',
    description: 'Online mental health support group for professional mothers. Facilitated by Nala. Contact 072 441 9870 to join.',
    category: 'Women\'s Support',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Tuesday, weekly',
    contactPhone: '072 441 9870',
  },
  {
    name: 'Mental Health Support Group for Community Leaders – Online',
    description: 'Online mental health support group for community leaders. Facilitated by Lea. Contact 074 050 8242 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Tuesday, weekly',
    contactPhone: '074 050 8242',
  },
  {
    name: 'Mental Health Support Group for Students 18+ – Online',
    description: 'Online mental health support group for students aged 18 and older. Facilitated by Khethizwi. Contact 083 657 8399 to join.',
    category: 'Youth & Teen Support',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Saturday, twice a month',
    contactPhone: '083 657 8399',
  },
  {
    name: 'South African Students Studying Abroad Support Group – Online',
    description: 'Online support group for South African students studying abroad (young adults 18-35) via Google Meet. Facilitated by Jenna. Contact 072 793 3238 to join.',
    category: 'Youth & Teen Support',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every second Wednesday',
    contactPhone: '072 793 3238',
  },
  {
    name: 'Mental Health & Life Stressors Support Group – Online',
    description: 'Online support group for mental health and life stressors. Facilitated by Priyanka. Contact 079 083 8365 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '1st and 3rd Friday, monthly',
    contactPhone: '079 083 8365',
  },
  {
    name: 'Mental Health Support – Akeso George',
    description: 'In-person mental health support group at Akeso, George. Facilitated by Dee and Lea. Contact WhatsApp Dee on 083 316 7159 or SADAG on 0800 456 7890 to join.',
    category: 'Mental Health',
    meetingType: 'in-person' as const,
    location: { city: 'George', address: 'Akeso, 15 Windsor St, Dormehls drift, George' },
    meetingSchedule: '1st and 3rd Saturday of every month',
    contactPhone: '083 316 7159',
  },

  // Men's Support
  {
    name: 'Men\'s Support Group – Northriding JHB',
    description: 'In-person men\'s mental health support group. Meeting at North Rand Methodist Church, Northriding. Facilitated by Dustyn. Contact 064 901 7923 to join.',
    category: "Men's Support",
    meetingType: 'in-person' as const,
    location: { city: 'Johannesburg', address: 'North Rand Methodist Church, 174 Blandford Road, Northriding' },
    meetingSchedule: 'Every second Wednesday',
    contactPhone: '064 901 7923',
  },
  {
    name: 'Men\'s Mental Health Support Group – Diepsloot',
    description: 'In-person men\'s mental health support group. Meeting at Small Blue Counselling Container, Buffalo Street, Diepsloot. Facilitated by Sibusisiwe. Contact 063 833 8602 to join.',
    category: "Men's Support",
    meetingType: 'in-person' as const,
    location: { city: 'Johannesburg', address: 'Small Blue Counselling Container, Buffalo St, Diepsloot (next to fire station)' },
    meetingSchedule: '2nd and 4th Saturday',
    contactPhone: '063 833 8602',
  },

  // Women's Support
  {
    name: 'Cape Town Based Women Navigating Life\'s Challenges – Online',
    description: 'Online support group via Microsoft Teams for Cape Town-based women navigating life\'s challenges. Facilitated by Tracy Meyer. Contact 082 376 7625 to join.',
    category: "Women's Support",
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Second Thursday of the month',
    contactPhone: '082 376 7625',
  },
  {
    name: 'Support Group for Women\'s Mental Health and Wellbeing – Online',
    description: 'Online support group for women\'s mental health and wellbeing. Facilitated by Marjaanah. Contact 060 551 7962 to join.',
    category: "Women's Support",
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Wednesday',
    contactPhone: '060 551 7962',
  },

  // Young Adults
  {
    name: 'Young Adults (18-35) Mental Health Support Group for Trauma – Online',
    description: 'Online support group for young adults aged 18-35 dealing with trauma and mental health. Facilitated by Natalie-Jane. Contact 064 675 5181 to join.',
    category: 'PTSD & Trauma',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Wednesday',
    contactPhone: '064 675 5181',
  },
  {
    name: 'Young Adults Support Group for Depression 18-35 – Limpopo',
    description: 'In-person support group for young adults aged 18-35 with depression. Meeting at Kgapane Community Centre, Ga-Kgapane-A, Modjadjiskloof, Mapolankeng, Limpopo. Facilitated by Zodwa. Contact 074 933 4191 to join.',
    category: 'Youth & Teen Support',
    meetingType: 'in-person' as const,
    location: { city: 'Ga-Kgapane', address: 'Kgapane Community Centre, Ga-Kgapane-A, Modjadjiskloof, Mapolankeng, Limpopo' },
    meetingSchedule: 'Friday, weekly',
    contactPhone: '074 933 4191',
  },

  // International / Diverse
  {
    name: 'International Women\'s Mental Health Support Group – Online',
    description: 'Online international women\'s mental health support group via Zoom. Facilitated by Chantel. Contact 067 119 6023 to join.',
    category: "Women's Support",
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every second Sunday',
    contactPhone: '067 119 6023',
  },

  // People Living with Disabilities
  {
    name: 'Support Group for People Living with Disabilities – Online',
    description: 'Online support group for people living with disabilities. Facilitated by Alexandra. Contact 066 339 2832 to join.',
    category: 'Chronic Illness',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '1st and 3rd Tuesday of every month',
    contactPhone: '066 339 2832',
  },

  // Crafting & Wellness
  {
    name: 'Using Crafting to Cope with Mental Health – Online',
    description: 'Online support group using crafting as a tool to cope with mental health challenges. Facilitated by Jacinta. Contact 076 055 7961 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '1st and 3rd Monday, monthly',
    contactPhone: '076 055 7961',
  },
  {
    name: 'Meditation & Breathwork Support Group for Stress Relief – Online',
    description: 'Online support group using meditation and breathwork to cope with stress and improve mental health. Facilitated by Josie. Contact 067 573 3402 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: '1st Sunday of every month',
    contactPhone: '067 573 3402',
  },

  // Endometriosis
  {
    name: '\'Hope-In-Endo\' Support Group for Endometriosis – Online',
    description: '\'Hope-In-Endo\' support group for people living with endometriosis via Google Meet. Facilitated by Raeesah Ismail. Contact 041 051 0737 to join.',
    category: 'Chronic Illness',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every 2nd Saturday',
    contactPhone: '041 051 0737',
  },

  // Graduate & Employment
  {
    name: 'Unemployed Graduates Support Group – Online',
    description: 'Online support group for unemployed graduates. Facilitated by Lezahn and Hlumelo. Contact Lezahn on 067 772 6681 or Hlumelo on 079 744 8563 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every second Wednesday',
    contactPhone: '067 772 6681',
  },
  {
    name: 'Unemployed Young Adults Support Group – Mahikeng',
    description: 'In-person support group for unemployed young adults aged 18 to 45. Meeting at Community Library, Mahikeng. Facilitated by Karabo and Ole. Contact 067 457 3149 to join.',
    category: 'Mental Health',
    meetingType: 'in-person' as const,
    location: { city: 'Mahikeng', address: '2200 Sekame Street, Montshiwa Unit 1, Mahikeng' },
    meetingSchedule: '2nd and last Saturday of the month',
    contactPhone: '067 457 3149',
  },
  {
    name: 'Job Seekers Support Group – Online',
    description: 'Online support group for job seekers via Google Meets. Facilitated by Jeetesh. Contact 069 217 5861 to join.',
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Every Monday',
    contactPhone: '069 217 5861',
  },
  {
    name: 'Graduates & Young Professionals Support Group – Hatfield Pretoria',
    description: 'In-person support group for graduates and young professionals. Meeting at Moja Gabedi, 389 Festival Street, Hatfield, Pretoria. Facilitated by Rean. Contact 084 888 5566 to join.',
    category: 'Mental Health',
    meetingType: 'in-person' as const,
    location: { city: 'Pretoria', address: 'Moja Gabedi, 389 Festival Street, Hatfield, Pretoria' },
    meetingSchedule: 'Tuesday, weekly',
    contactPhone: '084 888 5566',
  },

  // Skin & Physical Conditions
  {
    name: 'Skin Conditions and Mental Wellness Support Group – Online',
    description: 'Online support group for people dealing with skin conditions and their impact on mental wellness. Facilitated by Zamansele. Contact 067 995 6133 to join.',
    category: 'Chronic Illness',
    meetingType: 'online' as const,
    location: { city: 'National (Online)' },
    meetingSchedule: 'Wednesday, 1st and 3rd Wednesday of the month',
    contactPhone: '067 995 6133',
  },

  // Ivory Park
  {
    name: 'Ivory Park Counselling Container Mental Health Support Group',
    description: 'In-person mental health support group at Ivory Park Counselling Container, Thuthukani Centre. Facilitated by Dikeledi. Contact 060 402 7697 to join.',
    category: 'Mental Health',
    meetingType: 'in-person' as const,
    location: { city: 'Johannesburg', address: 'Thuthukani Centre, Freedom Drive, Ivory Park' },
    meetingSchedule: 'First and Third Thursday of every month',
    contactPhone: '060 402 7697',
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
