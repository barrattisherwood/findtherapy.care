import { FeatureFlag, getFlag, getAllFlags, updateFlag } from '../../models/FeatureFlag';

describe('FeatureFlag model', () => {

  it('requires key', async () => {
    await expect(FeatureFlag.create({ description: 'no key here' })).rejects.toThrow();
  });

  it('enforces unique key', async () => {
    await FeatureFlag.create({ key: 'provider_blog', description: 'first' });
    await expect(
      FeatureFlag.create({ key: 'provider_blog', description: 'second' })
    ).rejects.toThrow();
  });

  it('defaults enabled to false', async () => {
    const flag = await FeatureFlag.create({ key: 'test_flag' });
    expect(flag.enabled).toBe(false);
  });

  it('defaults allowlistedAdminIds to empty array', async () => {
    const flag = await FeatureFlag.create({ key: 'test_flag' });
    expect(flag.allowlistedAdminIds).toEqual([]);
  });

  describe('getFlag', () => {
    it('returns the flag by key', async () => {
      await FeatureFlag.create({ key: 'my_flag', enabled: true });
      const flag = await getFlag('my_flag');
      expect(flag).not.toBeNull();
      expect(flag!.enabled).toBe(true);
    });

    it('returns null for an unknown key', async () => {
      const flag = await getFlag('does_not_exist');
      expect(flag).toBeNull();
    });
  });

  describe('getAllFlags', () => {
    it('returns all flags sorted by key', async () => {
      await FeatureFlag.create({ key: 'z_flag' });
      await FeatureFlag.create({ key: 'a_flag' });
      const flags = await getAllFlags();
      expect(flags.length).toBe(2);
      expect(flags[0].key).toBe('a_flag');
      expect(flags[1].key).toBe('z_flag');
    });

    it('returns empty array when no flags exist', async () => {
      const flags = await getAllFlags();
      expect(flags).toEqual([]);
    });
  });

  describe('updateFlag', () => {
    it('updates enabled and updatedBy and returns the new document', async () => {
      await FeatureFlag.create({ key: 'toggle_flag', enabled: false });
      const updated = await updateFlag('toggle_flag', { enabled: true, updatedBy: 'admin-id' });
      expect(updated).not.toBeNull();
      expect(updated!.enabled).toBe(true);
      expect(updated!.updatedBy).toBe('admin-id');
    });

    it('returns null for an unknown key', async () => {
      const result = await updateFlag('no_such_flag', { enabled: true });
      expect(result).toBeNull();
    });
  });
});
