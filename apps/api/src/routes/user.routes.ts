import { Router } from 'express';
import {
  getNotifications,
  getProfile,
  markAllRead,
  markNotificationRead,
  updateProfile,
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authSchemas } from '../utils/validationSchemas';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', validate(authSchemas.profile), updateProfile);
router.get('/notifications', getNotifications);
router.put('/notifications/:id/read', markNotificationRead);
router.delete('/notifications/read-all', markAllRead);

export default router;
