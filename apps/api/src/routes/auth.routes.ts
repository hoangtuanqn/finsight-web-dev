import { Router } from 'express';
import { register, login, me, logout } from '../controllers/auth.controller';
import { generateQR, checkQRStatus, markQRScanned, confirmQRLogin } from '../controllers/qrAuth.controller';
import { googleLogin, getGoogleConfig } from '../controllers/googleAuth.controller';
import { facebookLogin, getFacebookConfig } from '../controllers/facebookAuth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authSchemas } from '../utils/validationSchemas';
import { setup2FA, enable2FA, disable2FA, verify2FALogin, trustDevice } from '../controllers/twoFactor.controller';

const router = Router();

router.post('/register', validate(authSchemas.register), register);
router.post('/login', validate(authSchemas.login), login);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

// Two-Factor Authentication
router.get('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/enable', authenticate, enable2FA);
router.post('/2fa/disable', authenticate, disable2FA);
router.post('/2fa/verify', verify2FALogin);
router.post('/2fa/trust', authenticate, trustDevice);

router.post('/google', googleLogin);
router.get('/google-config', getGoogleConfig);

router.post('/facebook', facebookLogin);
router.get('/facebook-config', getFacebookConfig);

// QR Login Flow
router.get('/qr/generate', generateQR);
router.get('/qr/status/:token', checkQRStatus);
router.post('/qr/scanned', authenticate, validate(authSchemas.qrScanned), markQRScanned);
router.post('/qr/confirm', authenticate, validate(authSchemas.qrConfirm), confirmQRLogin);

export default router;
