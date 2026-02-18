import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AdminLog, AdminLogAction } from '../models/AdminLog';

// GET /admin/logs
export const getAdminLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const filter: any = {};
    const action = req.query.action as string;
    const validActions: AdminLogAction[] = [
      'vet_provider', 'suspend_provider', 'unsuspend_provider', 'delete_provider', 'mark_message_read',
    ];
    if (action && validActions.includes(action as AdminLogAction)) {
      filter.action = action;
    }

    const [logs, total] = await Promise.all([
      AdminLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AdminLog.countDocuments(filter),
    ]);

    res.json({
      logs: logs.map(l => ({
        id: l._id.toString(),
        action: l.action,
        adminId: l.adminId,
        adminEmail: l.adminEmail,
        targetId: l.targetId,
        targetName: l.targetName,
        details: l.details,
        createdAt: l.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    res.status(500).json({ message: 'Failed to fetch admin logs' });
  }
};
