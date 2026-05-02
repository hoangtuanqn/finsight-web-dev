import { Router } from 'express';
import { login, me, register } from '../../controllers/enterprise/auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);

export default router;
