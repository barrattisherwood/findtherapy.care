import mongoose, { Document, Schema } from 'mongoose';

export type AdminLogAction =
  | 'vet_provider'
  | 'suspend_provider'
  | 'unsuspend_provider'
  | 'delete_provider'
  | 'mark_message_read';

export interface IAdminLog extends Document {
  action: AdminLogAction;
  adminId: string;
  adminEmail: string;
  targetId: string;
  targetName: string;
  details?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const adminLogSchema = new Schema<IAdminLog>(
  {
    action: {
      type: String,
      enum: ['vet_provider', 'suspend_provider', 'unsuspend_provider', 'delete_provider', 'mark_message_read'],
      required: true,
      index: true,
    },
    adminId: { type: String, required: true, index: true },
    adminEmail: { type: String, required: true },
    targetId: { type: String, required: true },
    targetName: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

adminLogSchema.index({ createdAt: -1 });
// TTL: auto-delete logs older than 90 days
adminLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AdminLog = mongoose.model<IAdminLog>('AdminLog', adminLogSchema);
