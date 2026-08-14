import { Response } from 'express';
import mongoose from 'mongoose';
import ProviderDocument from '../../models/ProviderDocument';
import { Provider } from '../../models/Provider';
import {
  uploadDocument,
  getDocument,
  getVerificationStatus,
} from '../../controllers/providerDocumentController';
import { ProviderAuthRequest } from '../../middleware/providerGuard';
import * as cloudinaryService from '../../services/cloudinaryService';
import { createTestUser } from '../fixtures/users';
import { createTestProvider } from '../fixtures/providers';

jest.mock('../../services/cloudinaryService');

const mockUploadDocument = cloudinaryService.uploadDocument as jest.Mock;
const mockDownloadDocument = cloudinaryService.downloadDocument as jest.Mock;
const mockIsConfigured = cloudinaryService.isCloudinaryConfigured as jest.Mock;

const mockRes = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnThis();
  const set = jest.fn().mockReturnThis();
  const end = jest.fn();
  const send = jest.fn();
  return { json, status, set, end, send, res: { json, status, set, end, send } as unknown as Response };
};

const makeReq = (
  provider: any,
  overrides: Partial<ProviderAuthRequest> = {}
): ProviderAuthRequest =>
  ({
    userId: provider.userId,
    provider,
    body: {},
    params: {},
    ...overrides,
  } as unknown as ProviderAuthRequest);

// ─── Task 1: ProviderDocument model ──────────────────────────────────────────

describe('ProviderDocument model', () => {
  it('requires providerId, documentType, cloudinaryPublicId', async () => {
    await expect(ProviderDocument.create({})).rejects.toThrow();
  });

  it('rejects invalid documentType', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    await expect(
      ProviderDocument.create({
        providerId: provider._id,
        documentType: 'fake_type',
        cloudinaryPublicId: 'provider-documents/abc123',
        fileName: 'cert.pdf',
        fileType: 'pdf',
      })
    ).rejects.toThrow();
  });

  it('accepts all valid documentTypes', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const types = ['hpcsa_registration', 'aschp_registration', 'qualification', 'other'];
    for (const documentType of types) {
      const doc = await ProviderDocument.create({
        providerId: provider._id,
        documentType,
        cloudinaryPublicId: `provider-documents/abc-${documentType}`,
        fileName: 'cert.pdf',
        fileType: 'pdf',
      });
      expect(doc.documentType).toBe(documentType);
    }
  });
});

// ─── Task 1: Upload endpoint ──────────────────────────────────────────────────

describe('uploadDocument endpoint', () => {
  beforeEach(() => {
    mockIsConfigured.mockReturnValue(true);
    mockUploadDocument.mockResolvedValue({ publicId: 'provider-documents/abc123' });
  });

  it('returns 401 when no auth (no provider on request)', async () => {
    const { res, status, json } = mockRes();
    await uploadDocument(
      { userId: undefined, provider: undefined, params: {}, body: {} } as unknown as ProviderAuthRequest,
      res
    );
    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  it('returns 400 when no file is provided', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const { res, status, json } = mockRes();
    await uploadDocument(
      makeReq(provider, { body: { documentType: 'hpcsa_registration' } }),
      res
    );
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('file') }));
  });

  it('returns 400 for disallowed file types', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const { res, status, json } = mockRes();
    await uploadDocument(
      makeReq(provider, {
        body: { documentType: 'hpcsa_registration' },
        file: { buffer: Buffer.from('x'), mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', originalname: 'cert.docx', size: 100 },
      } as any),
      res
    );
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('file type') }));
  });

  it('returns 400 for files over 10MB', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const { res, status, json } = mockRes();
    await uploadDocument(
      makeReq(provider, {
        body: { documentType: 'qualification' },
        file: { buffer: Buffer.alloc(10), mimetype: 'application/pdf', originalname: 'cert.pdf', size: 11 * 1024 * 1024 },
      } as any),
      res
    );
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('size') }));
  });

  it('creates a ProviderDocument record and returns its ID on success', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString(), vettingStatus: 'unverified' } as any);
    const { res, json } = mockRes();
    await uploadDocument(
      makeReq(provider, {
        body: { documentType: 'hpcsa_registration' },
        file: { buffer: Buffer.from('pdf'), mimetype: 'application/pdf', originalname: 'hpcsa.pdf', size: 50000 },
      } as any),
      res
    );
    const result = json.mock.calls[0][0];
    expect(result.id).toBeDefined();
    expect(result.documentType).toBe('hpcsa_registration');
    const saved = await ProviderDocument.findById(result.id);
    expect(saved).not.toBeNull();
    expect(saved!.cloudinaryPublicId).toBe('provider-documents/abc123');
  });

  it('sets vettingStatus to pending when provider was unverified', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString(), vettingStatus: 'unverified' } as any);
    const { res } = mockRes();
    await uploadDocument(
      makeReq(provider, {
        body: { documentType: 'qualification' },
        file: { buffer: Buffer.from('pdf'), mimetype: 'application/pdf', originalname: 'qual.pdf', size: 1000 },
      } as any),
      res
    );
    const updated = await Provider.findById(provider._id);
    expect(updated!.vettingStatus).toBe('pending');
  });

  it('sets vettingStatus to pending when provider was rejected', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString(), vettingStatus: 'rejected' } as any);
    const { res } = mockRes();
    await uploadDocument(
      makeReq(provider, {
        body: { documentType: 'hpcsa_registration' },
        file: { buffer: Buffer.from('pdf'), mimetype: 'application/pdf', originalname: 'hpcsa.pdf', size: 1000 },
      } as any),
      res
    );
    const updated = await Provider.findById(provider._id);
    expect(updated!.vettingStatus).toBe('pending');
  });

  it('does not change vettingStatus when provider is already approved', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() }); // default: approved
    const { res } = mockRes();
    await uploadDocument(
      makeReq(provider, {
        body: { documentType: 'hpcsa_registration' },
        file: { buffer: Buffer.from('pdf'), mimetype: 'application/pdf', originalname: 'hpcsa.pdf', size: 1000 },
      } as any),
      res
    );
    const updated = await Provider.findById(provider._id);
    expect(updated!.vettingStatus).toBe('approved');
  });

  it('returns 500 when Cloudinary is not configured', async () => {
    mockIsConfigured.mockReturnValue(false);
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    const { res, status } = mockRes();
    await uploadDocument(
      makeReq(provider, {
        body: { documentType: 'hpcsa_registration' },
        file: { buffer: Buffer.from('pdf'), mimetype: 'application/pdf', originalname: 'hpcsa.pdf', size: 1000 },
      } as any),
      res
    );
    expect(status).toHaveBeenCalledWith(500);
  });
});

// ─── Task 2: Secure document access ──────────────────────────────────────────

describe('getDocument endpoint', () => {
  let provider: any;
  let docId: string;

  beforeEach(async () => {
    mockDownloadDocument.mockResolvedValue({ buffer: Buffer.from('%PDF'), contentType: 'application/pdf' });
    const user = await createTestUser();
    provider = await createTestProvider({ userId: user._id.toString() });
    const doc = await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'hpcsa_registration',
      cloudinaryPublicId: 'provider-documents/abc123',
      fileName: 'cert.pdf',
      fileType: 'pdf',
    });
    docId = doc._id.toString();
  });

  it('returns 403 when unauthenticated', async () => {
    const { res, status } = mockRes();
    await getDocument(
      { userId: undefined, provider: undefined, params: { id: docId } } as unknown as ProviderAuthRequest,
      res
    );
    expect(status).toHaveBeenCalledWith(403);
  });

  it('returns 403 when a provider tries to access another provider\'s document', async () => {
    const otherUser = await createTestUser();
    const otherProvider = await createTestProvider({ userId: otherUser._id.toString() });
    const { res, status } = mockRes();
    await getDocument(makeReq(otherProvider, { params: { id: docId } }), res);
    expect(status).toHaveBeenCalledWith(403);
  });

  it('streams the document when the owning provider requests it', async () => {
    const { res, set } = mockRes();
    await getDocument(makeReq(provider, { params: { id: docId } }), res);
    expect(mockDownloadDocument).toHaveBeenCalledWith('provider-documents/abc123');
    expect(set).toHaveBeenCalledWith('Content-Type', 'application/pdf');
  });

  it('returns 404 for a non-existent document ID', async () => {
    const { res, status } = mockRes();
    await getDocument(makeReq(provider, { params: { id: new mongoose.Types.ObjectId().toString() } }), res);
    expect(status).toHaveBeenCalledWith(404);
  });

  it('returns 410 when the document file has been deleted (cloudinaryPublicId cleared)', async () => {
    const doc = await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'qualification',
      cloudinaryPublicId: '',
      fileName: 'old.pdf',
      fileType: 'pdf',
    });
    const { res, status, json } = mockRes();
    await getDocument(makeReq(provider, { params: { id: doc._id.toString() } }), res);
    expect(status).toHaveBeenCalledWith(410);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringContaining('longer available') }));
  });
});

// ─── Task 3: Provider verification status ────────────────────────────────────

describe('getVerificationStatus endpoint', () => {
  it('returns 401 when unauthenticated', async () => {
    const { res, status } = mockRes();
    await getVerificationStatus(
      { userId: undefined, provider: undefined, params: {}, body: {} } as unknown as ProviderAuthRequest,
      res
    );
    expect(status).toHaveBeenCalledWith(401);
  });

  it('returns vettingStatus, vettingNotes, and document list for authenticated provider', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString(), vettingStatus: 'pending' } as any);
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'hpcsa_registration',
      cloudinaryPublicId: 'provider-documents/abc',
      fileName: 'cert.pdf',
      fileType: 'pdf',
    });
    const { res, json } = mockRes();
    await getVerificationStatus(makeReq(provider), res);
    const result = json.mock.calls[0][0];
    expect(result.vettingStatus).toBe('pending');
    expect(Array.isArray(result.documents)).toBe(true);
    expect(result.documents).toHaveLength(1);
    expect(result.documents[0].id).toBeDefined();
    expect(result.documents[0].fileAvailable).toBe(true);
  });

  it('includes rejection notes when status is rejected', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({
      userId: user._id.toString(),
      vettingStatus: 'rejected',
      vettingNotes: 'Name mismatch on HPCSA certificate',
    } as any);
    const { res, json } = mockRes();
    await getVerificationStatus(makeReq(provider), res);
    const result = json.mock.calls[0][0];
    expect(result.vettingStatus).toBe('rejected');
    expect(result.vettingNotes).toBe('Name mismatch on HPCSA certificate');
  });

  it('marks fileAvailable as false when cloudinaryPublicId is cleared', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'qualification',
      cloudinaryPublicId: '',
      fileName: 'old.pdf',
      fileType: 'pdf',
      reviewOutcome: 'approved',
    });
    const { res, json } = mockRes();
    await getVerificationStatus(makeReq(provider), res);
    const result = json.mock.calls[0][0];
    expect(result.documents[0].fileAvailable).toBe(false);
  });

  it('does not expose cloudinaryPublicId in the response', async () => {
    const user = await createTestUser();
    const provider = await createTestProvider({ userId: user._id.toString() });
    await ProviderDocument.create({
      providerId: provider._id,
      documentType: 'hpcsa_registration',
      cloudinaryPublicId: 'provider-documents/secret123',
      fileName: 'cert.pdf',
      fileType: 'pdf',
    });
    const { res, json } = mockRes();
    await getVerificationStatus(makeReq(provider), res);
    const result = json.mock.calls[0][0];
    expect(result.documents[0].cloudinaryPublicId).toBeUndefined();
  });
});
