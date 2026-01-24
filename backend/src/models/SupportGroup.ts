import mongoose, { Document, Schema } from 'mongoose';
import { SupportGroup as SharedSupportGroup, MeetingType } from '@findlocal/shared';

export interface ISupportGroup extends Omit<SharedSupportGroup, 'id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const supportGroupSchema = new Schema<ISupportGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    meetingType: {
      type: String,
      enum: ['in-person', 'online', 'hybrid'] as MeetingType[],
      required: true,
    },
    location: {
      address: String,
      city: {
        type: String,
        required: true,
        trim: true,
      },
      postcode: String,
    },
    meetingSchedule: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
supportGroupSchema.index({ category: 1, 'location.city': 1, isActive: 1 });
supportGroupSchema.index({ meetingType: 1 });

export const SupportGroup = mongoose.model<ISupportGroup>('SupportGroup', supportGroupSchema);
