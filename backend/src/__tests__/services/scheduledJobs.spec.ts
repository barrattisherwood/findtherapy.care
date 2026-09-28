import { Provider } from '../../models/Provider';
import { checkTrialEndingReminders } from '../../services/scheduledJobs';
import { createTestProvider } from '../fixtures/providers';
import { createTestUser } from '../fixtures/users';
import * as emailService from '../../services/emailService';

jest.mock('../../services/emailService', () => ({
  sendTrialEndingReminderEmail: jest.fn().mockResolvedValue(undefined),
  sendTrialExpiredEmail: jest.fn().mockResolvedValue(undefined),
}));

// Also mock cloudinaryService so scheduledJobs import doesn't need it configured
jest.mock('../../services/cloudinaryService', () => ({
  deleteDocument: jest.fn().mockResolvedValue(undefined),
}));

const mockSendReminder = emailService.sendTrialEndingReminderEmail as jest.Mock;

const daysFromNow = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

describe('checkTrialEndingReminders', () => {
  beforeEach(() => {
    mockSendReminder.mockClear();
  });

  it('sends reminder when trial ends within 7 days and reminder not yet sent', async () => {
    const user = await createTestUser();
    await createTestProvider({
      userId: user._id.toString(),
      trialEndsAt: daysFromNow(3),
      subscriptionStatus: 'none',
    } as any);

    await checkTrialEndingReminders();

    expect(mockSendReminder).toHaveBeenCalledTimes(1);
    expect(mockSendReminder).toHaveBeenCalledWith(
      user.email,
      expect.any(String),
      expect.any(Date)
    );
  });

  it('sends reminder when trial ends in exactly 7 days', async () => {
    const user = await createTestUser();
    await createTestProvider({
      userId: user._id.toString(),
      trialEndsAt: daysFromNow(7),
      subscriptionStatus: 'none',
    } as any);

    await checkTrialEndingReminders();

    expect(mockSendReminder).toHaveBeenCalledTimes(1);
  });

  it('does not send reminder when trial ends more than 7 days away', async () => {
    const user = await createTestUser();
    await createTestProvider({
      userId: user._id.toString(),
      trialEndsAt: daysFromNow(8),
      subscriptionStatus: 'none',
    } as any);

    await checkTrialEndingReminders();

    expect(mockSendReminder).not.toHaveBeenCalled();
  });

  it('does not send reminder when trial has already expired', async () => {
    const user = await createTestUser();
    await createTestProvider({
      userId: user._id.toString(),
      trialEndsAt: daysFromNow(-1),
      subscriptionStatus: 'none',
    } as any);

    await checkTrialEndingReminders();

    expect(mockSendReminder).not.toHaveBeenCalled();
  });

  it('does not send reminder if provider already has active subscription', async () => {
    const user = await createTestUser();
    await createTestProvider({
      userId: user._id.toString(),
      trialEndsAt: daysFromNow(3),
      subscriptionStatus: 'active',
    } as any);

    await checkTrialEndingReminders();

    expect(mockSendReminder).not.toHaveBeenCalled();
  });

  it('does not send reminder if trialEndingReminderSent is already true', async () => {
    const user = await createTestUser();
    await createTestProvider({
      userId: user._id.toString(),
      trialEndsAt: daysFromNow(3),
      subscriptionStatus: 'none',
      trialEndingReminderSent: true,
    } as any);

    await checkTrialEndingReminders();

    expect(mockSendReminder).not.toHaveBeenCalled();
  });

  it('marks trialEndingReminderSent = true after sending so it is never sent twice', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({
      userId: user._id.toString(),
      trialEndsAt: daysFromNow(3),
      subscriptionStatus: 'none',
    } as any);

    await checkTrialEndingReminders();

    const updated = await Provider.findById(provider._id);
    expect(updated!.trialEndingReminderSent).toBe(true);
  });

  it('does not resend if cron runs again the next day', async () => {
    const user = await createTestUser();
    await createTestProvider({
      userId: user._id.toString(),
      trialEndsAt: daysFromNow(3),
      subscriptionStatus: 'none',
    } as any);

    // Simulate two consecutive daily runs
    await checkTrialEndingReminders();
    await checkTrialEndingReminders();

    expect(mockSendReminder).toHaveBeenCalledTimes(1);
  });

  it('sends to multiple providers in the same window', async () => {
    const user1 = await createTestUser();
    const user2 = await createTestUser();
    await createTestProvider({ userId: user1._id.toString(), trialEndsAt: daysFromNow(2), subscriptionStatus: 'none' } as any);
    await createTestProvider({ userId: user2._id.toString(), trialEndsAt: daysFromNow(5), subscriptionStatus: 'none' } as any);

    await checkTrialEndingReminders();

    expect(mockSendReminder).toHaveBeenCalledTimes(2);
  });

  it('skips a provider whose user record is missing without crashing', async () => {
    // Create a valid provider then point its userId at a non-existent user
    const user = await createTestUser();
    const provider = await createTestProvider({
      userId: user._id.toString(),
      trialEndsAt: daysFromNow(3),
      subscriptionStatus: 'none',
    } as any);
    await Provider.findByIdAndUpdate(provider._id, { userId: 'nonexistent-000000000000' });

    await expect(checkTrialEndingReminders()).resolves.not.toThrow();
    expect(mockSendReminder).not.toHaveBeenCalled();
  });
});
