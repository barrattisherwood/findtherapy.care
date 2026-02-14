import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Provider } from '../models/Provider';
import { SupportGroup } from '../models/SupportGroup';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/findlocal';

async function cleanupTestData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all test provider accounts (emails ending with @findtherapy.care)
    // BUT exclude admin@findtherapy.care
    const testUsers = await User.find({
      email: { 
        $regex: /@findtherapy\.care$/i,
        $ne: 'admin@findtherapy.care'
      }
    });

    console.log(`\n📋 Found ${testUsers.length} test user accounts to remove:`);
    testUsers.forEach(user => {
      console.log(`   - ${user.email}`);
    });

    // Get their user IDs
    const testUserIds = testUsers.map(u => u._id);

    // Delete providers associated with test users
    const deletedProviders = await Provider.deleteMany({
      userId: { $in: testUserIds }
    });
    console.log(`\n🗑️  Deleted ${deletedProviders.deletedCount} test providers`);

    // Delete test user accounts
    const deletedUsers = await User.deleteMany({
      _id: { $in: testUserIds }
    });
    console.log(`🗑️  Deleted ${deletedUsers.deletedCount} test user accounts`);

    // Delete all support groups (no real data yet)
    const deletedGroups = await SupportGroup.deleteMany({});
    console.log(`🗑️  Deleted ${deletedGroups.deletedCount} support groups`);

    // Show remaining providers
    const remainingProviders = await Provider.find().populate('userId', 'email');
    console.log(`\n✨ Remaining providers: ${remainingProviders.length}`);
    for (const provider of remainingProviders) {
      const user = provider.userId as any;
      console.log(`   - ${provider.displayName} (${user?.email || 'unknown'})`);
    }

    console.log('\n✅ Cleanup complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupTestData();
