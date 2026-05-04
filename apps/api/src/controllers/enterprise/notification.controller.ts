import { Request, Response } from 'express';
import { NotificationService } from '../../services/enterprise/notification.service';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { isRead, priority, category } = req.query;

    const notifications = await NotificationService.getUserNotifications(userId, {
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      priority: priority as string,
      category: category as string,
    });

    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const count = await NotificationService.getUnreadCount(userId);
    res.json({ unreadCount: count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const markRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    await NotificationService.markAsRead(id as string, userId as string);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const acknowledgeNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    await NotificationService.acknowledge(id as string, userId as string);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const snoozeNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { days } = req.body;
    await NotificationService.snooze(id as string, userId as string, days);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
