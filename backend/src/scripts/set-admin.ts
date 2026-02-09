import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findlocal';
const ACTION = process.argv[2]; // 'grant', 'revoke', or 'list'
const USER_EMAIL = process.argv[3];

async function manageAdmins() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected\n');

    if (ACTION === 'list') {
      const users = await User.find({}).select('email isAdmin').sort({ email: 1 });

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  USER ACCOUNTS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      if (users.length === 0) {
        console.log('  No users found');
      } else {
        users.forEach(user => {
          const badge = user.isAdmin ? '👑 ADMIN' : '   USER';
          console.log(`  ${badge}  ${user.email}`);
        });
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      process.exit(0);
    }

    if (!USER_EMAIL) {
      console.error('❌ Please provide an email address\n');
      console.log('Usage:');
      console.log('  npm run admin list                    - List all users');
      console.log('  npm run admin grant <email>           - Grant admin access');
      console.log('  npm run admin revoke <email>          - Revoke admin access\n');
      process.exit(1);
    }

    const user = await User.findOne({ email: USER_EMAIL });

    if (!user) {
      console.error(`❌ User not found: ${USER_EMAIL}\n`);
      console.log('Run "npm run admin list" to see all users\n');
      process.exit(1);
    }

    if (ACTION === 'grant') {
      if (user.isAdmin) {
        console.log(`ℹ️  User ${USER_EMAIL} is already an admin\n`);
        process.exit(0);
      }

      user.isAdmin = true;
      await user.save();

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  ✅ ADMIN ACCESS GRANTED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  Email: ${user.email}`);
      console.log(`  Role:  Administrator`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else if (ACTION === 'revoke') {
      if (!user.isAdmin) {
        console.log(`ℹ️  User ${USER_EMAIL} is not an admin\n`);
        process.exit(0);
      }

      user.isAdmin = false;
      await user.save();

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('  ✅ ADMIN ACCESS REVOKED');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`  Email: ${user.email}`);
      console.log(`  Role:  User`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.error(`❌ Unknown action: ${ACTION}\n`);
      console.log('Valid actions: grant, revoke, list\n');
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

manageAdmins();
