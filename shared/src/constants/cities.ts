export const MAJOR_CITIES = ['johannesburg', 'cape-town', 'durban', 'pretoria'] as const;
export type MajorCity = typeof MAJOR_CITIES[number];

// ── SA Provinces ────────────────────────────────────────────────────────────

export interface SAProvince {
  slug: string;
  name: string;
}

export const SA_PROVINCES: SAProvince[] = [
  { slug: 'eastern-cape',    name: 'Eastern Cape' },
  { slug: 'free-state',      name: 'Free State' },
  { slug: 'gauteng',         name: 'Gauteng' },
  { slug: 'kwazulu-natal',   name: 'KwaZulu-Natal' },
  { slug: 'limpopo',         name: 'Limpopo' },
  { slug: 'mpumalanga',      name: 'Mpumalanga' },
  { slug: 'north-west',      name: 'North West' },
  { slug: 'northern-cape',   name: 'Northern Cape' },
  { slug: 'western-cape',    name: 'Western Cape' },
];

// ── SA Cities ────────────────────────────────────────────────────────────────

export interface SACity {
  slug: string;
  /** Primary display name */
  name: string;
  /** Optional formatted name (e.g. "Mbombela (Nelspruit)") */
  displayName?: string;
  province: string;           // matches SAProvince.slug
  isMetro?: boolean;
  aliases?: string[];         // alternative names / common misspellings
  suburbs?: string[];         // major suburbs for metro areas
}

export const SA_CITIES: SACity[] = [
  // ── Gauteng ─────────────────────────────────────────────────────────────
  {
    slug: 'johannesburg',
    name: 'Johannesburg',
    province: 'gauteng',
    isMetro: true,
    aliases: ['jhb', 'joburg', 'johanesburg', 'egoli'],
    suburbs: ['Sandton', 'Rosebank', 'Fourways', 'Randburg', 'Roodepoort', 'Soweto', 'Midrand', 'Edenvale', 'Bedfordview', 'Bryanston', 'Melville', 'Parkhurst'],
  },
  {
    slug: 'pretoria',
    name: 'Pretoria',
    displayName: 'Pretoria (Tshwane)',
    province: 'gauteng',
    isMetro: true,
    aliases: ['tshwane', 'pta'],
    suburbs: ['Centurion', 'Menlyn', 'Brooklyn', 'Hatfield', 'Lynnwood', 'Arcadia', 'Waterkloof', 'Faerie Glen', 'Moreleta Park'],
  },
  {
    slug: 'ekurhuleni',
    name: 'Ekurhuleni',
    province: 'gauteng',
    isMetro: true,
    aliases: ['east-rand', 'germiston', 'boksburg', 'benoni', 'kempton-park'],
    suburbs: ['Germiston', 'Boksburg', 'Benoni', 'Kempton Park', 'Edenvale', 'Springs', 'Brakpan'],
  },
  // ── Western Cape ────────────────────────────────────────────────────────
  {
    slug: 'cape-town',
    name: 'Cape Town',
    province: 'western-cape',
    isMetro: true,
    aliases: ['cpt', 'cape town', 'capetown'],
    suburbs: ['Sea Point', 'Claremont', 'Constantia', 'Rondebosch', 'Wynberg', 'Bellville', 'Somerset West', 'Stellenbosch', 'Pinelands', 'Observatory', 'Green Point', 'Camps Bay', 'Hout Bay', 'Milnerton', 'Bloubergstrand'],
  },
  {
    slug: 'stellenbosch',
    name: 'Stellenbosch',
    province: 'western-cape',
    aliases: ['stel', 'stellies'],
    suburbs: ['Die Boord', 'Welgemoed', 'Cloetesville'],
  },
  {
    slug: 'paarl',
    name: 'Paarl',
    province: 'western-cape',
    aliases: ['pearl'],
  },
  {
    slug: 'george',
    name: 'George',
    province: 'western-cape',
  },
  {
    slug: 'knysna',
    name: 'Knysna',
    province: 'western-cape',
    aliases: ['knysna', 'nysna'],
  },
  {
    slug: 'worcester',
    name: 'Worcester',
    province: 'western-cape',
  },
  {
    slug: 'mossel-bay',
    name: 'Mossel Bay',
    province: 'western-cape',
    aliases: ['mosselbaai', 'mosselbay'],
  },
  {
    slug: 'hermanus',
    name: 'Hermanus',
    province: 'western-cape',
  },
  {
    slug: 'franschhoek',
    name: 'Franschhoek',
    province: 'western-cape',
  },
  // ── KwaZulu-Natal ───────────────────────────────────────────────────────
  {
    slug: 'durban',
    name: 'Durban',
    displayName: 'Durban (eThekwini)',
    province: 'kwazulu-natal',
    isMetro: true,
    aliases: ['ethekwini', 'ethekwini'],
    suburbs: ['Umhlanga', 'Ballito', 'Berea', 'Morningside', 'Westville', 'Pinetown', 'Hillcrest', 'Amanzimtoti', 'uMhlanga', 'La Lucia'],
  },
  {
    slug: 'pietermaritzburg',
    name: 'Pietermaritzburg',
    province: 'kwazulu-natal',
    aliases: ['pmb', 'maritzburg'],
  },
  {
    slug: 'newcastle',
    name: 'Newcastle',
    province: 'kwazulu-natal',
  },
  {
    slug: 'richards-bay',
    name: 'Richards Bay',
    province: 'kwazulu-natal',
    aliases: ['richardsbay'],
  },
  // ── Eastern Cape ────────────────────────────────────────────────────────
  {
    slug: 'gqeberha',
    name: 'Gqeberha',
    displayName: 'Gqeberha (Port Elizabeth)',
    province: 'eastern-cape',
    aliases: ['port elizabeth', 'pe', 'port-elizabeth'],
  },
  {
    slug: 'east-london',
    name: 'East London',
    province: 'eastern-cape',
    aliases: ['eastlondon'],
    suburbs: ['Vincent', 'Beacon Bay', 'Nahoon'],
  },
  {
    slug: 'makhanda',
    name: 'Makhanda',
    displayName: 'Makhanda (Grahamstown)',
    province: 'eastern-cape',
    aliases: ['grahamstown', 'graham', 'grahamstad'],
  },
  // ── Free State ──────────────────────────────────────────────────────────
  {
    slug: 'bloemfontein',
    name: 'Bloemfontein',
    province: 'free-state',
    isMetro: true,
    aliases: ['bloem', 'mangaung'],
    suburbs: ['Westdene', 'Universitas', 'Langenhovenpark', 'Bayswater'],
  },
  {
    slug: 'welkom',
    name: 'Welkom',
    province: 'free-state',
  },
  // ── Mpumalanga ──────────────────────────────────────────────────────────
  {
    slug: 'mbombela',
    name: 'Mbombela',
    displayName: 'Mbombela (Nelspruit)',
    province: 'mpumalanga',
    aliases: ['nelspruit', 'nels', 'mbombela'],
  },
  {
    slug: 'emalahleni',
    name: 'eMalahleni',
    displayName: 'eMalahleni (Witbank)',
    province: 'mpumalanga',
    aliases: ['witbank', 'witban'],
  },
  {
    slug: 'secunda',
    name: 'Secunda',
    province: 'mpumalanga',
  },
  // ── Limpopo ─────────────────────────────────────────────────────────────
  {
    slug: 'polokwane',
    name: 'Polokwane',
    displayName: 'Polokwane (Pietersburg)',
    province: 'limpopo',
    aliases: ['pietersburg', 'limpopo'],
  },
  {
    slug: 'tzaneen',
    name: 'Tzaneen',
    province: 'limpopo',
  },
  // ── North West ──────────────────────────────────────────────────────────
  {
    slug: 'rustenburg',
    name: 'Rustenburg',
    province: 'north-west',
  },
  {
    slug: 'mahikeng',
    name: 'Mahikeng',
    displayName: 'Mahikeng (Mafikeng)',
    province: 'north-west',
    aliases: ['mafikeng', 'mmabatho'],
  },
  {
    slug: 'potchefstroom',
    name: 'Potchefstroom',
    province: 'north-west',
    aliases: ['potch'],
  },
  // ── Northern Cape ───────────────────────────────────────────────────────
  {
    slug: 'kimberley',
    name: 'Kimberley',
    province: 'northern-cape',
  },
  {
    slug: 'upington',
    name: 'Upington',
    province: 'northern-cape',
  },
];

/**
 * Search SA cities by query string. Matches city name, displayName, and aliases.
 * Minimum query length: 2 characters.
 */
export function searchSACities(query: string, limit = 10): (SACity & { provinceDisplay: string; fullName: string })[] {
  if (!query || query.length < 2) return [];

  const q = query.toLowerCase().trim();

  return SA_CITIES
    .filter(city => {
      if (city.name.toLowerCase().includes(q)) return true;
      if (city.displayName?.toLowerCase().includes(q)) return true;
      if (city.aliases?.some(a => a.includes(q))) return true;
      if (city.suburbs?.some(s => s.toLowerCase().includes(q))) return true;
      return false;
    })
    .map(city => {
      const province = SA_PROVINCES.find(p => p.slug === city.province);
      return {
        ...city,
        provinceDisplay: province?.name ?? city.province,
        fullName: `${city.displayName ?? city.name}, ${province?.name ?? city.province}`,
      };
    })
    .slice(0, limit);
}

export interface CityConfig {
  slug: string;
  name: string;
  province: string;
  heroImage: string;
  ogImage: string;
  metaDescription: string;
  heading: string;
  subheading: string;
  contentSections: {
    title: string;
    content: string;
  }[];
}

export const CITY_CONFIGS: Record<MajorCity, CityConfig> = {
  'johannesburg': {
    slug: 'johannesburg',
    name: 'Johannesburg',
    province: 'Gauteng',
    heroImage: 'assets/images/cities/johannesburg-hero.jpg',
    ogImage: 'https://findtherapy.care/assets/images/cities/johannesburg-og.jpg',
    metaDescription: 'Find qualified therapists and counsellors in Johannesburg, Sandton, and Rosebank. Browse HPCSA-registered mental health professionals. Book consultations today.',
    heading: 'Find Therapists in Johannesburg',
    subheading: 'Connect with experienced mental health professionals across Gauteng',
    contentSections: [
      {
        title: 'Mental Health Care in Johannesburg',
        content: 'Johannesburg is home to South Africa\'s largest network of mental health professionals. Whether you\'re in Sandton, Rosebank, Fourways, or anywhere across the greater Gauteng area, find experienced therapists and counsellors specializing in anxiety, depression, trauma, and more. Our directory features HPCSA-registered professionals offering both in-person and online sessions to suit your schedule and preferences.'
      },
      {
        title: 'Why Choose findtherapy.care',
        content: 'Browse verified profiles, read about specialties and qualifications, and connect directly with providers. Many offer free initial consultations to help you find the right fit. All listed providers maintain active professional registrations and meet our quality standards. Filter by location, specialty, and availability to find the perfect match for your mental health journey.'
      }
    ]
  },
  'cape-town': {
    slug: 'cape-town',
    name: 'Cape Town',
    province: 'Western Cape',
    heroImage: 'assets/images/cities/cape-town-hero.jpg',
    ogImage: 'https://findtherapy.care/assets/images/cities/cape-town-og.jpg',
    metaDescription: 'Find therapists and counsellors in Cape Town, Sea Point, and Claremont. Browse verified mental health professionals across the Western Cape. Book your consultation today.',
    heading: 'Find Therapists in Cape Town',
    subheading: 'Connect with mental health professionals across the Western Cape',
    contentSections: [
      {
        title: 'Mental Health Support in Cape Town',
        content: 'Cape Town offers a diverse community of mental health professionals across the Mother City and surrounding areas. From Sea Point to Claremont, Constantia to the Northern Suburbs, find qualified therapists and counsellors who understand the unique challenges of life in the Western Cape. Our directory includes specialists in trauma, anxiety, depression, relationship counselling, and more, all committed to supporting your wellbeing.'
      },
      {
        title: 'Finding the Right Therapist',
        content: 'Our platform makes it easy to find mental health support that suits your needs. View detailed profiles including qualifications, specialties, session rates, and location. Many providers offer flexible appointment times, including evenings and weekends, with options for in-person or online consultations. Take the first step towards better mental health today.'
      }
    ]
  },
  'durban': {
    slug: 'durban',
    name: 'Durban',
    province: 'KwaZulu-Natal',
    heroImage: 'assets/images/cities/durban-hero.jpg',
    ogImage: 'https://findtherapy.care/assets/images/cities/durban-og.jpg',
    metaDescription: 'Find therapists and counsellors in Durban, Umhlanga, and Ballito. Connect with HPCSA-registered mental health professionals across KwaZulu-Natal. Book your session today.',
    heading: 'Find Therapists in Durban',
    subheading: 'Connect with mental health professionals across KwaZulu-Natal',
    contentSections: [
      {
        title: 'Mental Health Services in Durban',
        content: 'Durban and the greater KwaZulu-Natal region offer access to experienced mental health professionals dedicated to supporting your wellbeing. From Umhlanga to the Berea, Ballito to the South Coast, find qualified therapists and counsellors who specialize in a wide range of mental health concerns. Our directory features HPCSA-registered professionals with expertise in anxiety, depression, trauma, family therapy, and more.'
      },
      {
        title: 'Start Your Mental Health Journey',
        content: 'Finding the right therapist is an important step in your mental health journey. Browse profiles to learn about each provider\'s approach, qualifications, and areas of specialty. Many therapists offer free initial consultations, giving you the opportunity to find someone you feel comfortable with. Take control of your mental health and wellbeing by connecting with a professional who understands your needs.'
      }
    ]
  },
  'pretoria': {
    slug: 'pretoria',
    name: 'Pretoria',
    province: 'Gauteng',
    heroImage: 'assets/images/cities/pretoria-hero.jpg',
    ogImage: 'https://findtherapy.care/assets/images/cities/pretoria-og.jpg',
    metaDescription: 'Find therapists and counsellors in Pretoria, Centurion, and Menlyn. Browse qualified mental health professionals in the Tshwane area. Book your consultation now.',
    heading: 'Find Therapists in Pretoria',
    subheading: 'Connect with mental health professionals across Tshwane',
    contentSections: [
      {
        title: 'Mental Health Care in Pretoria',
        content: 'Pretoria and the wider Tshwane area provide access to a comprehensive network of mental health professionals. From Centurion to Menlyn, Brooklyn to Hatfield, find qualified therapists and counsellors ready to support your mental wellbeing. Our directory features specialists in various therapeutic approaches including CBT, EMDR, couples therapy, and more. All providers are verified and maintain professional registrations.'
      },
      {
        title: 'Your Path to Better Mental Health',
        content: 'Whether you\'re dealing with stress, anxiety, depression, or life transitions, finding the right therapist can make all the difference. Our platform allows you to search by location, specialty, and session format (in-person or online). Read detailed provider profiles, view qualifications, and reach out directly to schedule your first appointment. Many therapists offer flexible scheduling and free initial consultations.'
      }
    ]
  }
};
