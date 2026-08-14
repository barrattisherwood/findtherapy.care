import { Provider } from '../../models/Provider';
import { migrateVettingStatus } from '../../scripts/migrate-vetting-status';
import { createTestProvider } from '../fixtures/providers';
import { createTestUser } from '../fixtures/users';

describe('migrate-vetting-status', () => {
  it('sets vettingStatus to approved for providers that are published with pending status (pre-feature providers)', async () => {
    const user = await createTestUser();
    // Simulate an old provider: isPublished=true, vettingStatus='pending' (old defaults)
    const provider = await createTestProvider({ userId: user._id.toString(), vettingStatus: 'pending', isPublished: true });
    await Provider.findByIdAndUpdate(provider._id, { vettingStatus: 'pending' }); // ensure it's pending

    await migrateVettingStatus();

    const updated = await Provider.findById(provider._id);
    expect(updated!.vettingStatus).toBe('approved');
    expect(updated!.isPublished).toBe(true);
  });

  it('does not modify providers already marked approved', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString(), vettingStatus: 'approved', isPublished: true });

    await migrateVettingStatus();

    const updated = await Provider.findById(provider._id);
    expect(updated!.vettingStatus).toBe('approved');
  });

  it('does not modify providers that are unpublished and pending (they were already rejected/unvetted)', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString(), vettingStatus: 'pending', isPublished: false });

    await migrateVettingStatus();

    const updated = await Provider.findById(provider._id);
    // Should remain pending — not promoted to approved
    expect(updated!.vettingStatus).toBe('pending');
    expect(updated!.isPublished).toBe(false);
  });

  it('returns the count of providers updated', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await createTestProvider({ userId: user1._id.toString(), vettingStatus: 'pending', isPublished: true });
    await createTestProvider({ userId: user2._id.toString(), vettingStatus: 'pending', isPublished: true });
    // Also add one that should not be touched
    const user3 = await createTestUser();
    await createTestProvider({ userId: user3._id.toString(), vettingStatus: 'approved', isPublished: true });

    const result = await migrateVettingStatus();

    expect(result.updatedCount).toBe(2);
  });

  it('is idempotent — running twice does not change result', async () => {
    const user = await createTestUser();
    await createTestProvider({ userId: user._id.toString(), vettingStatus: 'pending', isPublished: true });

    await migrateVettingStatus();
    const result2 = await migrateVettingStatus();

    expect(result2.updatedCount).toBe(0);
  });
});
