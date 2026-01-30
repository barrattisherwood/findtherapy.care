import { User } from '../../models/User';
import mongoose from 'mongoose';

export interface TestUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
}

export const createTestUser = async (overrides: Partial<TestUser> = {}): Promise<TestUser> => {
  const userId = overrides._id || new mongoose.Types.ObjectId();

  const userData = {
    _id: userId,
    email: overrides.email || `test-${userId}@example.com`,
    password: overrides.password || 'hashedpassword123',
  };

  const user = await User.create(userData);
  return {
    _id: user._id as mongoose.Types.ObjectId,
    email: user.email,
    password: user.password,
  };
};

export const testUserData = {
  email: 'test@example.com',
  password: 'password123',
};
