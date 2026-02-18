import { AdminLog, AdminLogAction } from '../models/AdminLog';

interface AdminLogData {
  action: AdminLogAction;
  adminId: string;
  adminEmail: string;
  targetId: string;
  targetName: string;
  details?: Record<string, any>;
}

export async function logAdminAction(data: AdminLogData): Promise<void> {
  try {
    await AdminLog.create(data);
  } catch (err) {
    // Non-blocking — never propagate logging failures
    console.error('Failed to write admin log:', err);
  }
}
