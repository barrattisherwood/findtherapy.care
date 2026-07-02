import mongoose, { Document, Schema } from 'mongoose';

export interface IFeatureFlag extends Document {
  key: string;
  description: string;
  enabled: boolean;
  allowlistedAdminIds: string[];
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const featureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: { type: String, required: true, unique: true },
    description: { type: String, default: '' },
    enabled: { type: Boolean, default: false },
    allowlistedAdminIds: { type: [String], default: [] },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

export const FeatureFlag = mongoose.model<IFeatureFlag>('FeatureFlag', featureFlagSchema);

export async function getFlag(key: string): Promise<IFeatureFlag | null> {
  return FeatureFlag.findOne({ key });
}

export async function getAllFlags(): Promise<IFeatureFlag[]> {
  return FeatureFlag.find().sort({ key: 1 });
}

export async function updateFlag(
  key: string,
  updates: Partial<Pick<IFeatureFlag, 'enabled' | 'updatedBy'>>
): Promise<IFeatureFlag | null> {
  return FeatureFlag.findOneAndUpdate({ key }, updates, { new: true });
}
