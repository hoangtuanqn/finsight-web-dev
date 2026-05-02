import { Router } from 'express';
import { faceLogin, getFaceStatus, registerFace, removeFace, selectAccount } from '../controllers/face.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Authenticated routes
router.get('/status', authenticate, getFaceStatus);
router.post('/register', authenticate, registerFace);
router.delete('/remove', authenticate, removeFace);

// Public routes (no token needed — user not yet logged in)
router.post('/login', faceLogin);
router.post('/select-account', selectAccount);

export default router;
