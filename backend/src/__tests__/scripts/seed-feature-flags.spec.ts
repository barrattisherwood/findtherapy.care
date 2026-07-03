import { FeatureFlag } from '../../models/FeatureFlag';

const ALLOWLISTED_IDS = [
  '697dcddbdd2e9922a3b2ab64',
  '698226e7addf6a90e7889b49',
];

async function upsertProviderBlogFlag() {
  return FeatureFlag.findOneAndUpdate(
    { key: 'provider_blog' },
    {
      $setOnInsert: {
        key: 'provider_blog',
        description: 'Provider-written blog submissions (invitation campaigns, submission form, Claude review workflow)',
        enabled: false,
        allowlistedAdminIds: ALLOWLISTED_IDS,
      },
    },
    { upsert: true, new: true }
  );
}

describe('seed-feature-flags', () => {
  it('creates the provider_blog flag with enabled=false and both admin IDs allowlisted', async () => {
    const flag = await upsertProviderBlogFlag();

    expect(flag).not.toBeNull();
    expect(flag!.key).toBe('provider_blog');
    expect(flag!.enabled).toBe(false);
    expect(flag!.allowlistedAdminIds).toContain(ALLOWLISTED_IDS[0]);
    expect(flag!.allowlistedAdminIds).toContain(ALLOWLISTED_IDS[1]);
  });

  it('running the upsert twice does not create duplicate flags', async () => {
    await upsertProviderBlogFlag();
    await upsertProviderBlogFlag();

    const count = await FeatureFlag.countDocuments({ key: 'provider_blog' });
    expect(count).toBe(1);
  });

  it('a second upsert does not overwrite a flag that was enabled in between', async () => {
    await upsertProviderBlogFlag();

    // Simulate admin enabling the flag after first seed
    await FeatureFlag.findOneAndUpdate({ key: 'provider_blog' }, { enabled: true });

    // Running seed again should NOT reset to disabled
    await upsertProviderBlogFlag();

    const flag = await FeatureFlag.findOne({ key: 'provider_blog' });
    expect(flag!.enabled).toBe(true);
  });
});
