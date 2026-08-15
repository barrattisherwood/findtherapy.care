import { Response } from 'express';
import ProviderDocument from '../models/ProviderDocument';
import { Provider } from '../models/Provider';
import { uploadDocument as cloudinaryUpload, downloadDocument, getDocumentSignedUrl, isCloudinaryConfigured } from '../services/cloudinaryService';
import { ProviderAuthRequest } from '../middleware/providerGuard';
import { AuthRequest } from '../middleware/auth';
import type { ProviderDocumentType, ProviderDocumentFileType } from '@findlocal/shared';

const ALLOWED_MIMETYPES: Record<string, ProviderDocumentFileType> = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const VALID_DOCUMENT_TYPES: ProviderDocumentType[] = [
  'hpcsa_registration',
  'aschp_registration',
  'qualification',
  'other',
];

export const uploadDocument = async (req: ProviderAuthRequest, res: Response): Promise<void> => {
  if (!req.provider) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const file = (req as any).file as { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined;
  if (!file) {
    res.status(400).json({ message: 'No file provided' });
    return;
  }

  const fileType = ALLOWED_MIMETYPES[file.mimetype];
  if (!fileType) {
    res.status(400).json({ message: 'Invalid file type. Allowed: pdf, jpg, png' });
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    res.status(400).json({ message: 'File size exceeds 10MB limit' });
    return;
  }

  const { documentType } = req.body as { documentType: string };
  if (!documentType || !VALID_DOCUMENT_TYPES.includes(documentType as ProviderDocumentType)) {
    res.status(400).json({ message: 'Invalid or missing documentType' });
    return;
  }

  if (!isCloudinaryConfigured()) {
    res.status(500).json({ message: 'Document storage is not configured' });
    return;
  }

  const { publicId } = await cloudinaryUpload(file.buffer, file.originalname);

  const doc = await ProviderDocument.create({
    providerId: req.provider._id,
    documentType: documentType as ProviderDocumentType,
    cloudinaryPublicId: publicId,
    fileName: file.originalname,
    fileType,
  });

  const { vettingStatus } = req.provider;
  if (vettingStatus === 'unverified' || vettingStatus === 'rejected') {
    await Provider.findByIdAndUpdate(req.provider._id, { vettingStatus: 'pending' });
  }

  res.status(201).json({
    id: doc._id.toString(),
    documentType: doc.documentType,
    fileName: doc.fileName,
    fileType: doc.fileType,
    uploadedAt: doc.uploadedAt,
  });
};

export const getDocument = async (req: ProviderAuthRequest, res: Response): Promise<void> => {
  if (!req.provider) {
    res.status(403).json({ message: 'Authentication required' });
    return;
  }

  const doc = await ProviderDocument.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ message: 'Document not found' });
    return;
  }

  if (doc.providerId.toString() !== req.provider._id.toString()) {
    res.status(403).json({ message: 'Access denied' });
    return;
  }

  if (!doc.cloudinaryPublicId) {
    res.status(410).json({ message: 'Document is no longer available' });
    return;
  }

  const { buffer, contentType } = await downloadDocument(doc.cloudinaryPublicId);
  res.set('Content-Type', contentType);
  res.set('Content-Disposition', `inline; filename="${doc.fileName}"`);
  res.end(buffer);
};

export const adminGetDocumentUrl = async (req: AuthRequest, res: Response): Promise<void> => {
  const doc = await ProviderDocument.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ message: 'Document not found' });
    return;
  }

  if (!doc.cloudinaryPublicId) {
    res.status(410).json({ message: 'Document is no longer available' });
    return;
  }

  const url = getDocumentSignedUrl(doc.cloudinaryPublicId);
  res.json({ url, fileName: doc.fileName });
};

export const getVerificationStatus = async (req: ProviderAuthRequest, res: Response): Promise<void> => {
  if (!req.provider) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const documents = await ProviderDocument.find({ providerId: req.provider._id }).sort({ uploadedAt: -1 });

  res.json({
    vettingStatus: req.provider.vettingStatus,
    vettingNotes: req.provider.vettingNotes,
    vettedAt: req.provider.vettedAt,
    documents: documents.map((d) => ({
      id: d._id.toString(),
      documentType: d.documentType,
      fileName: d.fileName,
      fileType: d.fileType,
      uploadedAt: d.uploadedAt,
      reviewedAt: d.reviewedAt,
      reviewOutcome: d.reviewOutcome,
      fileAvailable: !!d.cloudinaryPublicId,
    })),
  });
};
