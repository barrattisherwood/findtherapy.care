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
      type: 'therapist' as const,
      displayName: 'Dr. Sarah Nkosi',
      bio: `I am a clinical psychologist with over 15 years of experience helping individuals navigate life's challenges. My approach is warm, empathetic, and evidence-based, drawing primarily from Cognitive Behavioural Therapy (CBT) and mindfulness practices.

I believe that everyone has the capacity for growth and healing. My role is to provide a safe, non-judgmental space where you can explore your thoughts and feelings, develop new coping strategies, and work towards meaningful change.

I have particular expertise in treating anxiety disorders, depression, and trauma. I also work extensively with professionals experiencing burnout and work-related stress.`,
      qualifications: ['HPCSA Registered', 'PhD Psychology', 'CBT Trained', 'EMDR Trained'],
      specialties: ['Anxiety', 'Depression', 'Trauma & PTSD', 'Stress Management'],
      location: {
        address: '45 Oxford Road, Rosebank',
        city: 'Johannesburg',
        postcode: '2196',
      },
      contactEmail: 'dr.sarah.nkosi@findtherapy.care',
      contactPhone: '+27 11 447 5890',
      website: 'https://drsarahnkosi.co.za',
      hourlyRate: 1500,
      offersFreeConsultation: true,
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
      qualifications: ['SACSSP Registered', 'MA Psychology', 'Certified Counsellor'],
      specialties: ['Relationship Issues', 'Couples Therapy', 'Family Therapy', 'Parenting'],
      location: {
        address: '12 Kloof Street, Gardens',
        city: 'Cape Town',
        postcode: '8001',
      },
      contactEmail: 'michael.van.der.merwe@findtherapy.care',
      contactPhone: '+27 21 424 5678',
      hourlyRate: 950,
      offersFreeConsultation: true,
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
      type: 'therapist' as const,
      displayName: 'Thandiwe Dlamini',
      bio: `I am a clinical psychologist specialising in trauma therapy and PTSD treatment. Having worked extensively with survivors of violence and abuse, I understand the profound impact that trauma can have on every aspect of a person's life.

I use evidence-based approaches including EMDR (Eye Movement Desensitisation and Reprocessing) and trauma-focused CBT to help clients process traumatic experiences and reclaim their lives. I also incorporate culturally sensitive practices that honour each client's background and beliefs.

My practice is a safe haven where healing can begin. I am committed to walking alongside you on your journey to recovery.`,
      qualifications: ['HPCSA Registered', 'MA Psychology', 'EMDR Trained', 'CBT Trained'],
      specialties: ['Trauma & PTSD', 'Grief & Loss', 'Anxiety', 'Depression'],
      location: {
        address: '78 Peter Mokaba Road, Morningside',
        city: 'Durban',
        postcode: '4001',
      },
      contactEmail: 'thandiwe.dlamini@findtherapy.care',
      contactPhone: '+27 31 312 4567',
      website: 'https://thandiwedlamini.co.za',
      hourlyRate: 1200,
      offersFreeConsultation: false,
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
      type: 'counsellor' as const,
      displayName: 'Johan Pretorius',
      bio: `I am a registered counsellor with a focus on addiction recovery and substance abuse treatment. Having worked in rehabilitation centres for over a decade, I understand the complexities of addiction and the courage it takes to seek help.

My approach combines motivational interviewing, CBT, and 12-step facilitation. I believe in treating the whole person, not just the addiction, and I work with clients to address underlying issues and build a sustainable recovery.

Whether you're taking your first steps towards sobriety or working to maintain long-term recovery, I'm here to support you with compassion and without judgment.`,
      qualifications: ['SACSSP Registered', 'BA Social Work', 'Certified Counsellor'],
      specialties: ['Addiction & Recovery', 'Stress Management', 'Self-Esteem', 'Anger Management'],
      location: {
        address: '234 Lynnwood Road, Brooklyn',
        city: 'Pretoria',
        postcode: '0181',
      },
      contactEmail: 'johan.pretorius@findtherapy.care',
      contactPhone: '+27 12 460 7890',
      hourlyRate: 850,
      offersFreeConsultation: true,
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
      type: 'therapist' as const,
      displayName: 'Dr. Priya Pillay',
      bio: `I am a clinical psychologist specialising in child and adolescent mental health. I work with young people aged 5-18 and their families to address a wide range of emotional and behavioural challenges.

My therapy room is a creative, welcoming space where children and teens can express themselves through play, art, and conversation. I use age-appropriate techniques to help young people understand their feelings, develop coping skills, and build resilience.

I also offer parent guidance sessions to help families support their children's mental health at home. I believe that when we invest in the mental wellbeing of young people, we're investing in a healthier future for all.`,
      qualifications: ['HPCSA Registered', 'PhD Psychology', 'CBT Trained'],
      specialties: ['Child & Adolescent', 'Anxiety', 'ADHD', 'Autism Spectrum'],
      location: {
        address: '56 Florida Road, Morningside',
        city: 'Durban',
        postcode: '4001',
      },
      contactEmail: 'priya.pillay@findtherapy.care',
      contactPhone: '+27 31 303 2345',
      website: 'https://drpriyapillay.co.za',
      hourlyRate: 1400,
      offersFreeConsultation: true,
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
      type: 'counsellor' as const,
      displayName: 'Nomsa Khumalo',
      bio: `I am a counsellor passionate about supporting the LGBTQ+ community. As a queer woman myself, I understand the unique challenges faced by LGBTQ+ individuals, including coming out, identity exploration, discrimination, and family acceptance issues.

My practice is an affirming space where you can be your authentic self without fear of judgment. I work with clients on a range of issues including anxiety, depression, relationship challenges, and life transitions.

I also offer support for partners and family members of LGBTQ+ individuals who are navigating their own journey of understanding and acceptance.`,
      qualifications: ['SACSSP Registered', 'MA Social Work', 'Certified Counsellor'],
      specialties: ['LGBTQ+', 'Self-Esteem', 'Relationship Issues', 'Life Transitions'],
      location: {
        address: '89 Long Street',
        city: 'Cape Town',
        postcode: '8000',
      },
      contactEmail: 'nomsa.khumalo@findtherapy.care',
      contactPhone: '+27 21 422 8901',
      hourlyRate: 800,
      offersFreeConsultation: true,
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
      type: 'therapist' as const,
      displayName: 'Dr. David Goldstein',
      bio: `I am a clinical psychologist with expertise in eating disorders and body image issues. For over 20 years, I have helped individuals recover from anorexia, bulimia, binge eating disorder, and other disordered eating patterns.

My approach integrates CBT, DBT, and family-based treatment. I work closely with dietitians, doctors, and psychiatrists to provide comprehensive care. I believe that recovery is possible for everyone, and I'm committed to supporting you every step of the way.

I also offer support groups and workshops on body positivity and intuitive eating.`,
      qualifications: ['HPCSA Registered', 'PhD Psychology', 'CBT Trained', 'DBT Trained'],
      specialties: ['Eating Disorders', 'Self-Esteem', 'Anxiety', 'OCD'],
      location: {
        address: '123 Jan Smuts Avenue, Parkwood',
        city: 'Johannesburg',
        postcode: '2193',
      },
      contactEmail: 'david.goldstein@findtherapy.care',
      contactPhone: '+27 11 880 3456',
      website: 'https://drdavidgoldstein.co.za',
      hourlyRate: 1600,
      offersFreeConsultation: false,
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
      qualifications: ['SACSSP Registered', 'MA Psychology', 'Certified Counsellor'],
      specialties: ['Career Counselling', 'Stress Management', 'Life Transitions', 'Self-Esteem'],
      location: {
        address: '67 Sandton Drive, Sandton',
        city: 'Johannesburg',
        postcode: '2196',
      },
      contactEmail: 'lindiwe.mthembu@findtherapy.care',
      contactPhone: '+27 11 783 4567',
      hourlyRate: 1100,
      offersFreeConsultation: true,
      subscriptionStatus: 'none' as const,
      trialEndsAt: getTrialEndDate(),
    },
  },
];

// Seed data for support groups
const supportGroupSeedData = [
  {
    name: 'Anxiety Support Circle - Johannesburg',
    description: `A welcoming support group for individuals experiencing anxiety disorders. Whether you're dealing with generalised anxiety, social anxiety, panic attacks, or specific phobias, you'll find understanding and support here.

Our meetings provide a safe space to share experiences, learn coping strategies, and connect with others who understand what you're going through. We often incorporate mindfulness exercises and discuss practical techniques for managing anxiety in daily life.

No registration required - just come along. All sessions are facilitated by a trained mental health professional.`,
    category: 'Anxiety & Panic',
    meetingType: 'hybrid' as const,
    location: {
      address: 'Community Centre, 45 Oxford Road, Rosebank',
      city: 'Johannesburg',
      postcode: '2196',
    },
    meetingSchedule: 'Every Wednesday, 6:00 PM - 7:30 PM',
    contactEmail: 'anxiety.support.jhb@findtherapy.care',
    contactPhone: '+27 11 447 0001',
    website: 'https://findtherapy.care/groups/anxiety-jhb',
  },
  {
    name: 'Cape Town Depression Support Group',
    description: `Living with depression can feel isolating, but you don't have to face it alone. Our support group brings together individuals who understand the weight of depression and are committed to supporting each other through difficult times.

In our sessions, we share our experiences, discuss treatment options, and encourage one another. We celebrate small victories and provide comfort during setbacks. Our facilitator guides discussions and provides psychoeducation about depression.

Whether you're newly diagnosed or have been managing depression for years, you're welcome here.`,
    category: 'Depression',
    meetingType: 'in-person' as const,
    location: {
      address: 'Wellness Hub, 23 Kloof Street, Gardens',
      city: 'Cape Town',
      postcode: '8001',
    },
    meetingSchedule: 'Every Saturday, 10:00 AM - 11:30 AM',
    contactEmail: 'depression.support.cpt@findtherapy.care',
    contactPhone: '+27 21 424 0002',
  },
  {
    name: 'Grief and Loss Support - Durban',
    description: `Losing someone we love is one of life's most painful experiences. Our bereavement support group provides a compassionate space for those grieving the loss of a loved one, whether recent or in the past.

Grief has no timeline, and everyone's journey is different. In our group, you'll find people who understand that grief isn't something you "get over" but something you learn to carry. We share memories, tears, and eventually, moments of hope.

Our facilitator has extensive experience in grief counselling and creates a safe, supportive environment for all participants.`,
    category: 'Bereavement & Grief',
    meetingType: 'in-person' as const,
    location: {
      address: 'Faith Community Hall, 56 Florida Road',
      city: 'Durban',
      postcode: '4001',
    },
    meetingSchedule: 'First and third Tuesday of each month, 5:30 PM - 7:00 PM',
    contactEmail: 'grief.support.dbn@findtherapy.care',
    contactPhone: '+27 31 303 0003',
  },
  {
    name: 'SADAG Online Mental Health Support',
    description: `The South African Depression and Anxiety Group hosts this online support community for anyone affected by mental health challenges. Our virtual meetings make support accessible to people across South Africa, regardless of location.

Sessions cover various topics including anxiety, depression, bipolar disorder, and general mental wellness. We provide peer support, share resources, and discuss coping strategies that work in real life.

All sessions are free and confidential. Join us from the comfort of your home.`,
    category: 'Mental Health',
    meetingType: 'online' as const,
    location: {
      city: 'Online (South Africa)',
      postcode: '0000',
    },
    meetingSchedule: 'Every Monday and Thursday, 7:00 PM - 8:30 PM',
    contactEmail: 'online.support@findtherapy.care',
    website: 'https://findtherapy.care/groups/sadag-online',
  },
  {
    name: 'Pretoria Addiction Recovery Network',
    description: `Recovery from addiction is a journey that's easier with support. Our group welcomes anyone in recovery from substance abuse or behavioural addictions. We follow a peer support model that complements professional treatment and 12-step programs.

In our meetings, we share our experiences, discuss challenges, and celebrate milestones together. We understand that recovery isn't linear and that setbacks don't mean failure. What matters is that you keep coming back.

Confidentiality is paramount - what's shared in the group stays in the group.`,
    category: 'Addiction Recovery',
    meetingType: 'in-person' as const,
    location: {
      address: 'Recovery Centre, 89 Church Street',
      city: 'Pretoria',
      postcode: '0002',
    },
    meetingSchedule: 'Every Tuesday and Friday, 6:00 PM - 7:30 PM',
    contactEmail: 'recovery.pta@findtherapy.care',
    contactPhone: '+27 12 460 0004',
  },
  {
    name: 'LGBTQ+ Safe Space - Cape Town',
    description: `A supportive community for LGBTQ+ individuals navigating identity, coming out, relationships, and life in South Africa. Our group provides a safe, affirming space where you can be your authentic self.

We discuss topics including family acceptance, workplace challenges, relationships, mental health, and celebrating queer joy. Whether you're questioning, newly out, or a seasoned member of the community, you're welcome here.

Our facilitators are LGBTQ+ affirming and ensure that all discussions remain respectful and confidential.`,
    category: 'LGBTQ+',
    meetingType: 'hybrid' as const,
    location: {
      address: 'Pride Centre, 12 Waterkant Street',
      city: 'Cape Town',
      postcode: '8001',
    },
    meetingSchedule: 'Every Thursday, 6:30 PM - 8:00 PM',
    contactEmail: 'lgbtq.cpt@findtherapy.care',
    contactPhone: '+27 21 422 0005',
    website: 'https://findtherapy.care/groups/lgbtq-cpt',
  },
  {
    name: 'Cancer Support Group - Johannesburg',
    description: `Living with cancer affects every aspect of life - physical, emotional, and social. Our support group brings together cancer patients, survivors, and their loved ones to share experiences and support each other through treatment and beyond.

We discuss the emotional challenges of diagnosis, treatment side effects, relationships during illness, and life after cancer. Guest speakers occasionally join us to talk about topics like nutrition, exercise, and complementary therapies.

Family members and caregivers are welcome to join.`,
    category: 'Cancer Support',
    meetingType: 'in-person' as const,
    location: {
      address: 'Oncology Wellness Centre, 34 Republic Road, Randburg',
      city: 'Johannesburg',
      postcode: '2125',
    },
    meetingSchedule: 'Second and fourth Saturday of each month, 9:00 AM - 11:00 AM',
    contactEmail: 'cancer.support.jhb@findtherapy.care',
    contactPhone: '+27 11 789 0006',
  },
  {
    name: 'New Parents Support Circle',
    description: `Becoming a parent is life-changing, and it's okay to need support. Our group welcomes new parents (moms, dads, and non-binary parents) with babies from newborn to 12 months old.

We discuss the joys and challenges of parenthood including sleep deprivation, feeding, relationship changes, return to work, and managing parental anxiety. We also address perinatal mood disorders and when to seek additional help.

Babies are welcome at all meetings! Come connect with others who understand what you're going through.`,
    category: 'New Parents',
    meetingType: 'in-person' as const,
    location: {
      address: 'Family Wellness Centre, 78 Main Road, Green Point',
      city: 'Cape Town',
      postcode: '8005',
    },
    meetingSchedule: 'Every Friday, 10:00 AM - 11:30 AM',
    contactEmail: 'newparents.cpt@findtherapy.care',
    contactPhone: '+27 21 434 0007',
  },
  {
    name: 'Trauma Survivors Support - Durban',
    description: `A supportive group for survivors of trauma including violence, abuse, accidents, and other traumatic experiences. We understand that trauma affects each person differently and that healing is not linear.

Our sessions provide a safe space to share your experience (at your own pace), learn about trauma responses, and develop coping strategies. We focus on building resilience and reclaiming your sense of safety and control.

Sessions are facilitated by a trauma-informed mental health professional. Your privacy and safety are our priority.`,
    category: 'PTSD & Trauma',
    meetingType: 'in-person' as const,
    location: {
      address: 'Healing Hands Centre, 45 Musgrave Road',
      city: 'Durban',
      postcode: '4001',
    },
    meetingSchedule: 'Every Monday, 5:00 PM - 6:30 PM',
    contactEmail: 'trauma.support.dbn@findtherapy.care',
    contactPhone: '+27 31 201 0008',
  },
  {
    name: 'Caregivers Support Network',
    description: `Caring for a loved one with illness, disability, or age-related needs is both rewarding and exhausting. Our group is for caregivers who need a space to share their experiences, vent frustrations, and receive support from others who understand.

We discuss caregiver burnout, setting boundaries, asking for help, navigating healthcare systems, and maintaining your own wellbeing while caring for others. Remember: you can't pour from an empty cup.

Respite care information available for those who need help attending.`,
    category: 'Caregivers',
    meetingType: 'hybrid' as const,
    location: {
      address: 'Senior Care Centre, 123 Hendrik Verwoerd Drive',
      city: 'Pretoria',
      postcode: '0157',
    },
    meetingSchedule: 'Every Wednesday, 10:00 AM - 11:30 AM',
    contactEmail: 'caregivers.pta@findtherapy.care',
    contactPhone: '+27 12 348 0009',
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Provider.deleteMany({});
    await SupportGroup.deleteMany({});

    // Create admin user
    console.log('Creating admin user...');
    const adminUser = await User.create({
      email: 'admin@findtherapy.care',
      username: 'admin',
      password: 'admin123',
      isAdmin: true,
    });
    console.log('Admin user created:', adminUser.email);

    // Create providers (users + provider profiles)
    console.log('Creating providers...');
    for (const data of providerSeedData) {
      const user = await User.create(data.user);
      await Provider.create({
        ...data.provider,
        userId: user._id.toString(),
        isPublished: true,
      });
      console.log(`Created provider: ${data.provider.displayName}`);
    }

    // Create support groups
    console.log('Creating support groups...');
    for (const data of supportGroupSeedData) {
      await SupportGroup.create({
        ...data,
        createdBy: adminUser._id.toString(),
        isActive: true,
      });
      console.log(`Created support group: ${data.name}`);
    }

    console.log('\n=================================');
    console.log('Database seeded successfully!');
    console.log('=================================');
    console.log(`Created ${providerSeedData.length} providers`);
    console.log(`Created ${supportGroupSeedData.length} support groups`);
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
