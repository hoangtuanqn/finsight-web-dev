import { Router } from 'express';
import { register } from '../../controllers/enterprise/auth.controller';

const router = Router();

router.post('/register', register);

export default router;
