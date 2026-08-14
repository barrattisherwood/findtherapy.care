import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { Provider } from '../../models/Provider';
import { User } from '../../models/User';
import ProviderDocument from '../../models/ProviderDocument';
import { getPendingProviders, vetProvider } from '../../controllers/adminController';
import { createTestProvider } from '../fixtures/providers';
import { createTestUser } from '../fixtures/users';

jest.mock('../../services/emailService', () => ({
  sendVettingApprovedEmail: jest.fn().mockResolvedValue(undefined),
  sendVettingRejectedEmail: jest.fn().mockResolvedValue(undefined),
  sendBlogPostPendingReviewEmail: jest.fn().mockResolvedValue(undefined),
}));

const mockRes = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnThis();
  return { json, status, res: { json, status } as unknown as Response };
};

let adminUserId: string;

beforeEach(async () => {
  const admin = await createTestUser({ email: 'admin@example.com' });
  await User.findByIdAndUpdate(admin._id, { isAdmin: true });
  adminUserId = admin._id.toString();
});

const makeAdminReq = (overrides: Partial<AuthRequest> = {}): AuthRequest =>
  ({ userId: adminUserId, params: {}, body: {}, query: {}, ...overrides } as unknown as AuthRequest);

// ─── Task 4: getPendingProviders includes 'unverified' and documents ──────────

describe('getPendingProviders', () => {
  it('accepts unverified as a valid status filter', async () => {
    const user = await createTestUser();
    await createTestProvider({ userId: user._id.toString(), vettingStatus: 'unverified' });
    const { res, json } = mockRes();
    await getPendingProviders(makeAdminReq({ query: { status: 'unverified' } }), res);
    const result = json.mock.calls[0][0];
    expect(result.providers).toHaveLength(1);
    expect(result.providers[0].vettingStatus).toBe('unverified');
  });

  it('returns pending by default', async () => {
    const user = await createTestUser();
    await createTestProvider({ userId: user._id.toString(), vettingStatus: 'pending' });
    const { res, json } = mockRes();
    await getPendingProviders(makeAdminReq(), res);
    const result = json.mock.calls[0][0];
    expect(result.providers.every((p: any) => p.vettingStatus === 'pending')).toBe(true);
  });

  it('includes documents array for each provider', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString(), vettingStatus: 'pending' });
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'hpcsa_registration',
      cloudinaryPublicId: 'provider-documents/abc',
      fileName: 'cert.pdf',
      fileType: 'pdf',
    });
    const { res, json } = mockRes();
    await getPendingProviders(makeAdminReq({ query: { status: 'pending' } }), res);
    const result = json.mock.calls[0][0];
    const found = result.providers.find((p: any) => p.id === provider._id.toString());
    expect(found).toBeDefined();
    expect(Array.isArray(found.documents)).toBe(true);
    expect(found.documents).toHaveLength(1);
    expect(found.documents[0].documentType).toBe('hpcsa_registration');
    expect(found.documents[0].cloudinaryPublicId).toBeUndefined();
  });

  it('returns empty documents array for providers with no uploads', async () => {
    const user = await createTestUser();
    await createTestProvider({ userId: user._id.toString(), vettingStatus: 'pending' });
    const { res, json } = mockRes();
    await getPendingProviders(makeAdminReq({ query: { status: 'pending' } }), res);
    const result = json.mock.calls[0][0];
    expect(result.providers[0].documents).toEqual([]);
  });
});

// ─── Task 5: vetProvider sets isPublished and stamps documents ────────────────

describe('vetProvider', () => {
  it('sets isPublished to true when approving', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString(), vettingStatus: 'pending', isPublished: false });
    const { res } = mockRes();
    await vetProvider(
      makeAdminReq({ params: { id: provider._id.toString() }, body: { status: 'approved' } }),
      res
    );
    const updated = await Provider.findById(provider._id);
    expect(updated!.isPublished).toBe(true);
  });

  it('does not set isPublished to true when rejecting', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString(), vettingStatus: 'pending', isPublished: false });
    const { res } = mockRes();
    await vetProvider(
      makeAdminReq({ params: { id: provider._id.toString() }, body: { status: 'rejected', notes: 'Docs unclear' } }),
      res
    );
    const updated = await Provider.findById(provider._id);
    expect(updated!.isPublished).toBe(false);
  });

  it('stamps reviewedAt and reviewOutcome on all pending documents when approving', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString(), vettingStatus: 'pending', isPublished: false });
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'hpcsa_registration',
      cloudinaryPublicId: 'provider-documents/doc1',
      fileName: 'hpcsa.pdf',
      fileType: 'pdf',
    });
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'qualification',
      cloudinaryPublicId: 'provider-documents/doc2',
      fileName: 'qual.pdf',
      fileType: 'pdf',
    });
    const { res } = mockRes();
    await vetProvider(
      makeAdminReq({ params: { id: provider._id.toString() }, body: { status: 'approved' } }),
      res
    );
    const docs = await ProviderDocument.find({ providerId: provider._id });
    expect(docs).toHaveLength(2);
    for (const doc of docs) {
      expect(doc.reviewOutcome).toBe('approved');
      expect(doc.reviewedAt).toBeDefined();
    }
  });

  it('stamps reviewedAt and reviewOutcome on all pending documents when rejecting', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString(), vettingStatus: 'pending', isPublished: false });
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'hpcsa_registration',
      cloudinaryPublicId: 'provider-documents/doc1',
      fileName: 'hpcsa.pdf',
      fileType: 'pdf',
    });
    const { res } = mockRes();
    await vetProvider(
      makeAdminReq({ params: { id: provider._id.toString() }, body: { status: 'rejected', notes: 'Missing registration number' } }),
      res
    );
    const doc = await ProviderDocument.findOne({ providerId: provider._id });
    expect(doc!.reviewOutcome).toBe('rejected');
    expect(doc!.reviewedAt).toBeDefined();
  });

  it('does not overwrite reviewedAt on documents already stamped', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString(), vettingStatus: 'pending', isPublished: false });
    const pastDate = new Date('2025-01-01');
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'hpcsa_registration',
      cloudinaryPublicId: 'provider-documents/doc1',
      fileName: 'hpcsa.pdf',
      fileType: 'pdf',
      reviewedAt: pastDate,
      reviewOutcome: 'approved',
    });
    const { res } = mockRes();
    await vetProvider(
      makeAdminReq({ params: { id: provider._id.toString() }, body: { status: 'approved' } }),
      res
    );
    const doc = await ProviderDocument.findOne({ providerId: provider._id });
    // Already-stamped documents should not be touched
    expect(doc!.reviewedAt!.toISOString()).toBe(pastDate.toISOString());
  });
});
