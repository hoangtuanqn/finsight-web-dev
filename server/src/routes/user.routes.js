import { Router } from 'express';
import { getProfile, updateProfile, getNotifications, markNotificationRead, markAllRead } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.delete('/notifications/read-all', markAllRead);

export default router;
