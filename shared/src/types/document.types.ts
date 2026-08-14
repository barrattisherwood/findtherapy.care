export type ProviderDocumentType =
  | 'hpcsa_registration'
  | 'aschp_registration'
  | 'qualification'
  | 'other';

export type ProviderDocumentFileType = 'pdf' | 'jpg' | 'png';

export type ReviewOutcome = 'approved' | 'rejected';

export interface ProviderDocument {
  _id: string;
  providerId: string;
  documentType: ProviderDocumentType;
  cloudinaryPublicId: string;
  fileName: string;
  fileType: ProviderDocumentFileType;
  uploadedAt: Date | string;
  reviewedAt?: Date | string;
  reviewOutcome?: ReviewOutcome;
}

export interface UploadDocumentRequest {
  documentType: ProviderDocumentType;
}

export interface ProviderVerificationStatus {
  vettingStatus: 'unverified' | 'pending' | 'approved' | 'rejected';
  vettingNotes?: string;
  vettedAt?: Date | string;
  documents: ProviderDocumentSummary[];
}

export interface ProviderDocumentSummary {
  id: string;
  documentType: ProviderDocumentType;
  fileName: string;
  fileType: ProviderDocumentFileType;
  uploadedAt: Date | string;
  reviewedAt?: Date | string;
  reviewOutcome?: ReviewOutcome;
  fileAvailable: boolean;
}
