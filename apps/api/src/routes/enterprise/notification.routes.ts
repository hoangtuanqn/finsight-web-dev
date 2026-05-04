import { Router } from 'express';
import {
  acknowledgeNotification,
  getNotifications,
  getUnreadCount,
  markAllRead,
  markRead,
  snoozeNotification,
} from '../../controllers/enterprise/notification.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/mark-all-read', markAllRead);
router.patch('/:id/read', markRead);
router.post('/:id/acknowledge', acknowledgeNotification);
router.post('/:id/snooze', snoozeNotification);

export default router;
