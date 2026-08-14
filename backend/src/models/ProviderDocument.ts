import mongoose, { Schema, Document, Types } from 'mongoose';
import type { ProviderDocumentType, ProviderDocumentFileType, ReviewOutcome } from '@findlocal/shared';

export interface IProviderDocument extends Document {
  _id: Types.ObjectId;
  providerId: Types.ObjectId;
  documentType: ProviderDocumentType;
  cloudinaryPublicId: string;
  fileName: string;
  fileType: ProviderDocumentFileType;
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewOutcome?: ReviewOutcome;
}

const ProviderDocumentSchema = new Schema<IProviderDocument>(
  {
    providerId: { type: Schema.Types.ObjectId, ref: 'Provider', required: true, index: true },
    documentType: {
      type: String,
      enum: ['hpcsa_registration', 'aschp_registration', 'qualification', 'other'] as ProviderDocumentType[],
      required: true,
    },
    cloudinaryPublicId: { type: String, default: '', trim: true },
    fileName: { type: String, required: true, trim: true },
    fileType: {
      type: String,
      enum: ['pdf', 'jpg', 'png'] as ProviderDocumentFileType[],
      required: true,
    },
    uploadedAt: { type: Date, default: () => new Date() },
    reviewedAt: { type: Date },
    reviewOutcome: { type: String, enum: ['approved', 'rejected'] as ReviewOutcome[] },
  },
  { timestamps: false }
);

// Index for the deletion cron: find reviewed documents past their retention window
ProviderDocumentSchema.index({ reviewOutcome: 1, reviewedAt: 1 });

export default mongoose.model<IProviderDocument>('ProviderDocument', ProviderDocumentSchema);
