import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ContactMessage } from '../models/ContactMessage';

// GET /admin/messages
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 25));
    const skip = (page - 1) * limit;

    const filter: any = {};
    const type = req.query.type as string;
    if (type === 'provider' || type === 'site') filter.type = type;
    const read = req.query.read as string;
    if (read === 'true') filter.isRead = true;
    if (read === 'false') filter.isRead = false;

    const [messages, total, unreadCount] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ContactMessage.countDocuments(filter),
      ContactMessage.countDocuments({ isRead: false }),
    ]);

    res.json({
      messages: messages.map(m => ({
        id: m._id.toString(),
        type: m.type,
        providerId: m.providerId,
        providerName: m.providerName,
        providerContactEmail: m.providerContactEmail,
        senderName: m.senderName,
        senderEmail: m.senderEmail,
        senderPhone: m.senderPhone,
        subject: m.subject,
        message: m.message,
        isRead: m.isRead,
        createdAt: m.createdAt,
      })),
      total,
      unreadCount,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};

// PATCH /admin/messages/:id/read
export const markMessageRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { $set: { isRead: isRead !== false } },
      { new: true, runValidators: false }
    );

    if (!message) {
      res.status(404).json({ message: 'Message not found' });
      return;
    }

    res.json({ id: message._id.toString(), isRead: message.isRead });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ message: 'Failed to update message' });
  }
};

// GET /admin/messages/unread-count
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await ContactMessage.countDocuments({ isRead: false });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
};
