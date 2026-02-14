import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Provider } from '../models/Provider';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findlocal';

async function listAccounts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const allUsers = await User.find().select('email isAdmin');
    console.log(`📊 Total users: ${allUsers.length}\n`);

    // Get providers
    const providers = await Provider.find().populate('userId', 'email isAdmin');

    console.log('👤 USER ACCOUNTS:');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const user of allUsers) {
      const provider = providers.find(p => {
        const userId = (p.userId as any)?._id || p.userId;
        return userId && user._id && userId.toString() === user._id.toString();
      });
      const isTest = user.email.endsWith('@findtherapy.care');
      
      console.log(`${isTest ? '🧪 TEST' : '✨ REAL'}  ${user.email}`);
      console.log(`        ${user.isAdmin ? '👑 Admin' : '   User'}`);
      if (provider) {
        console.log(`        📋 Provider: ${provider.displayName}`);
        console.log(`        📍 ${provider.location.city}`);
      }
      console.log();
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n🧪 Test accounts (will be deleted): ${allUsers.filter(u => u.email.endsWith('@findtherapy.care')).length}`);
    console.log(`✨ Real accounts (will be kept): ${allUsers.filter(u => !u.email.endsWith('@findtherapy.care')).length}`);

    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listAccounts();
