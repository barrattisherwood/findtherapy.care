/**
 * makeAdmin.ts — promote a user to admin by email
 *
 * Usage:
 *   npx ts-node src/scripts/makeAdmin.ts <email>
 *
 * Example:
 *   npx ts-node src/scripts/makeAdmin.ts julia@example.com
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findlocal';

async function makeAdmin(email: string): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    process.exit(1);
  }

  if (user.isAdmin) {
    console.log(`${email} is already an admin.`);
    process.exit(0);
  }

  user.isAdmin = true;
  await user.save();

  console.log(`✓ ${email} (${user._id}) has been promoted to admin.`);
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: npx ts-node src/scripts/makeAdmin.ts <email>');
  process.exit(1);
}

makeAdmin(email)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
