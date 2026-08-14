import ProviderDocument from '../../models/ProviderDocument';
import { deleteExpiredDocuments } from '../../services/scheduledJobs';
import { createTestProvider } from '../fixtures/providers';
import { createTestUser } from '../fixtures/users';
import * as cloudinaryService from '../../services/cloudinaryService';

jest.mock('../../services/cloudinaryService');
jest.mock('../../services/emailService', () => ({
  sendTrialEndingReminderEmail: jest.fn().mockResolvedValue(undefined),
}));

const mockDeleteDocument = cloudinaryService.deleteDocument as jest.Mock;

const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

describe('deleteExpiredDocuments', () => {
  beforeEach(() => {
    mockDeleteDocument.mockResolvedValue(undefined);
  });

  it('deletes Cloudinary asset for approved docs older than 90 days', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'hpcsa_registration',
      cloudinaryPublicId: 'provider-documents/old-approved',
      fileName: 'cert.pdf',
      fileType: 'pdf',
      reviewOutcome: 'approved',
      reviewedAt: daysAgo(91),
    });

    await deleteExpiredDocuments();

    expect(mockDeleteDocument).toHaveBeenCalledWith('provider-documents/old-approved');
  });

  it('deletes Cloudinary asset for rejected docs older than 30 days', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'qualification',
      cloudinaryPublicId: 'provider-documents/old-rejected',
      fileName: 'qual.pdf',
      fileType: 'pdf',
      reviewOutcome: 'rejected',
      reviewedAt: daysAgo(31),
    });

    await deleteExpiredDocuments();

    expect(mockDeleteDocument).toHaveBeenCalledWith('provider-documents/old-rejected');
  });

  it('clears cloudinaryPublicId after deletion so the record is an audit trail', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const doc = await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'hpcsa_registration',
      cloudinaryPublicId: 'provider-documents/to-delete',
      fileName: 'cert.pdf',
      fileType: 'pdf',
      reviewOutcome: 'approved',
      reviewedAt: daysAgo(91),
    });

    await deleteExpiredDocuments();

    const updated = await ProviderDocument.findById(doc._id);
    expect(updated).not.toBeNull(); // record kept
    expect(updated!.cloudinaryPublicId).toBe(''); // asset cleared
  });

  it('does not delete approved docs reviewed less than 90 days ago', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'hpcsa_registration',
      cloudinaryPublicId: 'provider-documents/recent-approved',
      fileName: 'cert.pdf',
      fileType: 'pdf',
      reviewOutcome: 'approved',
      reviewedAt: daysAgo(89),
    });

    await deleteExpiredDocuments();

    expect(mockDeleteDocument).not.toHaveBeenCalled();
  });

  it('does not delete rejected docs reviewed less than 30 days ago', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'qualification',
      cloudinaryPublicId: 'provider-documents/recent-rejected',
      fileName: 'qual.pdf',
      fileType: 'pdf',
      reviewOutcome: 'rejected',
      reviewedAt: daysAgo(29),
    });

    await deleteExpiredDocuments();

    expect(mockDeleteDocument).not.toHaveBeenCalled();
  });

  it('does not delete documents with no reviewOutcome (not yet reviewed)', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'hpcsa_registration',
      cloudinaryPublicId: 'provider-documents/unreviewed',
      fileName: 'cert.pdf',
      fileType: 'pdf',
    });

    await deleteExpiredDocuments();

    expect(mockDeleteDocument).not.toHaveBeenCalled();
  });

  it('skips docs already cleared (cloudinaryPublicId is empty) without calling Cloudinary', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'hpcsa_registration',
      cloudinaryPublicId: '',
      fileName: 'cert.pdf',
      fileType: 'pdf',
      reviewOutcome: 'approved',
      reviewedAt: daysAgo(100),
    });

    await deleteExpiredDocuments();

    expect(mockDeleteDocument).not.toHaveBeenCalled();
  });

  it('returns counts of deleted documents', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'hpcsa_registration',
      cloudinaryPublicId: 'provider-documents/exp1',
      fileName: 'cert.pdf',
      fileType: 'pdf',
      reviewOutcome: 'approved',
      reviewedAt: daysAgo(91),
    });
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'qualification',
      cloudinaryPublicId: 'provider-documents/exp2',
      fileName: 'qual.pdf',
      fileType: 'pdf',
      reviewOutcome: 'rejected',
      reviewedAt: daysAgo(31),
    });

    const result = await deleteExpiredDocuments();

    expect(result.deletedCount).toBe(2);
  });
});
