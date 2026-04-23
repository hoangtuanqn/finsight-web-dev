import { Router } from 'express';
import { register, login, me, logout } from '../controllers/auth.controller.js';
import { googleLogin, getGoogleConfig } from '../controllers/googleAuth.controller.js';
import { facebookLogin, getFacebookConfig } from '../controllers/facebookAuth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { authSchemas } from '../utils/validationSchemas.js';

const router = Router();

router.post('/register', validate(authSchemas.register), register);
router.post('/login', validate(authSchemas.login), login);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

router.post('/google', googleLogin);
router.get('/google-config', getGoogleConfig);

router.post('/facebook', facebookLogin);
router.get('/facebook-config', getFacebookConfig);

export default router;
