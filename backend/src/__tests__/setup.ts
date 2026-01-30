import { setupTestDb, teardownTestDb, clearTestDb } from './helpers/mockDb';

// Setup before all tests (longer timeout for first-time binary download)
beforeAll(async () => {
  await setupTestDb();
}, 120_000);

// Clear database between tests
afterEach(async () => {
  await clearTestDb();
});

// Cleanup after all tests
afterAll(async () => {
  await teardownTestDb();
});

// Note: Environment variables are set in setupEnv.ts which runs before test files are imported
