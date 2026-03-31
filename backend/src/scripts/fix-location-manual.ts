/**
 * fix-location-manual.ts
 * One-off script to fix providers that couldn't be auto-migrated.
 */

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Provider } from '../models/Provider';

const FIXES: { id: string; note: string; location: any; sessionFormats: any }[] = [
  // "Online" providers → online-only
  {
    id: '69c5f484f74ae044089aa334',
    note: 'Sumarie Engelbrecht — Online',
    location: {
      type: 'online-only',
      city: 'online',
      cityDisplay: 'Online Only',
      fullLocation: 'Online Only',
      shortLocation: 'Online',
      searchTerms: ['online', 'nationwide', 'virtual'],
    },
    sessionFormats: { inPerson: false, online: true },
  },
  {
    id: '69ca22291073f899176ac461',
    note: 'Candice Jordan — Online',
    location: {
      type: 'online-only',
      city: 'online',
      cityDisplay: 'Online Only',
      fullLocation: 'Online Only',
      shortLocation: 'Online',
      searchTerms: ['online', 'nationwide', 'virtual'],
    },
    sessionFormats: { inPerson: false, online: true },
  },
  // Sandton → Johannesburg
  {
    id: '69c6a2cc2366b11e696c36ef',
    note: 'Karen Davidson — Sandton (Johannesburg suburb)',
    location: {
      type: 'physical',
      province: 'gauteng',
      provinceDisplay: 'Gauteng',
      city: 'johannesburg',
      cityDisplay: 'Johannesburg',
      suburb: 'Sandton',
      fullLocation: 'Sandton, Johannesburg, Gauteng',
      shortLocation: 'Johannesburg',
      searchTerms: ['johannesburg', 'gauteng', 'jhb', 'joburg'],
    },
    sessionFormats: { inPerson: true, online: false },
  },
  // Doringkloof, Centurion → Pretoria
  {
    id: '69c63c8bf74ae044089aa413',
    note: 'Zanel Mvd Brink — Doringkloof, Centurion (Pretoria suburb)',
    location: {
      type: 'physical',
      province: 'gauteng',
      provinceDisplay: 'Gauteng',
      city: 'pretoria',
      cityDisplay: 'Pretoria (Tshwane)',
      suburb: 'Centurion',
      fullLocation: 'Centurion, Pretoria (Tshwane), Gauteng',
      shortLocation: 'Pretoria (Tshwane)',
      searchTerms: ['pretoria', 'gauteng', 'tshwane', 'pta'],
    },
    sessionFormats: { inPerson: true, online: false },
  },
  // Parklands → Cape Town
  {
    id: '69c656a6f74ae044089aa712',
    note: 'Lehandra Riley — Parklands (Cape Town suburb)',
    location: {
      type: 'physical',
      province: 'western-cape',
      provinceDisplay: 'Western Cape',
      city: 'cape-town',
      cityDisplay: 'Cape Town',
      suburb: 'Parklands',
      fullLocation: 'Parklands, Cape Town, Western Cape',
      shortLocation: 'Cape Town',
      searchTerms: ['cape-town', 'western-cape', 'cpt'],
    },
    sessionFormats: { inPerson: true, online: false },
  },
  // "Gauteng" (province only) → Johannesburg as best guess
  {
    id: '69c65280f74ae044089aa5d3',
    note: 'Juanique Cornelius — "Gauteng" (province only, defaulting to Johannesburg)',
    location: {
      type: 'physical',
      province: 'gauteng',
      provinceDisplay: 'Gauteng',
      city: 'johannesburg',
      cityDisplay: 'Johannesburg',
      fullLocation: 'Johannesburg, Gauteng',
      shortLocation: 'Johannesburg',
      searchTerms: ['johannesburg', 'gauteng', 'jhb'],
    },
    sessionFormats: { inPerson: true, online: false },
  },
  // Matatiele → Eastern Cape (small town, use city slug as-is)
  {
    id: '69c65356f74ae044089aa652',
    note: 'Miss Tlhokomelo Khusu — Matatiele (Eastern Cape)',
    location: {
      type: 'physical',
      province: 'eastern-cape',
      provinceDisplay: 'Eastern Cape',
      city: 'matatiele',
      cityDisplay: 'Matatiele',
      fullLocation: 'Matatiele, Eastern Cape',
      shortLocation: 'Matatiele',
      searchTerms: ['matatiele', 'eastern-cape'],
    },
    sessionFormats: { inPerson: true, online: false },
  },
  // Julia Shatalov — Pretoria
  {
    id: '698fa8381e4d17a043ede2c2',
    note: 'Julia Shatalov — Pretoria',
    location: {
      type: 'physical',
      province: 'gauteng',
      provinceDisplay: 'Gauteng',
      city: 'pretoria',
      cityDisplay: 'Pretoria (Tshwane)',
      fullLocation: 'Pretoria (Tshwane), Gauteng',
      shortLocation: 'Pretoria (Tshwane)',
      searchTerms: ['pretoria', 'gauteng', 'tshwane', 'pta'],
    },
    sessionFormats: { inPerson: true, online: false },
  },
];

async function fixLocations() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('Connected');

  for (const fix of FIXES) {
    const provider = await Provider.findById(fix.id);
    if (!provider) { console.warn(`Not found: ${fix.id}`); continue; }

    provider.location = fix.location as any;
    (provider as any).sessionFormats = fix.sessionFormats;

    try {
      await provider.save({ validateBeforeSave: false });
      console.log(`✓ Fixed: ${fix.note}`);
    } catch (err) {
      console.error(`✗ Failed: ${fix.note}`, err);
    }
  }

  console.log('\nDone.');
  await mongoose.disconnect();
}

fixLocations().catch(err => { console.error(err); process.exit(1); });
