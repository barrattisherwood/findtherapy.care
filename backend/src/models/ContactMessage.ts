import mongoose, { Document, Schema } from 'mongoose';

export interface IContactMessage extends Document {
  type: 'provider' | 'site';
  // Provider contact fields
  providerId?: string;
  providerName?: string;
  providerContactEmail?: string;
  // Sender
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  // Site contact only
  subject?: string;
  // Content
  message: string;
  // Admin tracking
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    type: {
      type: String,
      enum: ['provider', 'site'],
      required: true,
      index: true,
    },
    providerId: { type: String },
    providerName: { type: String, trim: true },
    providerContactEmail: { type: String, trim: true },
    senderName: { type: String, required: true, trim: true },
    senderEmail: { type: String, required: true, lowercase: true, trim: true },
    senderPhone: { type: String, trim: true },
    subject: { type: String, trim: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });

export const ContactMessage = mongoose.model<IContactMessage>('ContactMessage', contactMessageSchema);
