import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

export const setupTestDb = async (): Promise<void> => {
  mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '7.0.15',
    },
  });
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
};

export const teardownTestDb = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

export const clearTestDb = async (): Promise<void> => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};

export const getTestDbUri = (): string => {
  return mongoServer?.getUri() || '';
};
