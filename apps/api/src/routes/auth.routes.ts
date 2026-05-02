import { Router } from 'express';
import { login, logout, me, register } from '../controllers/auth.controller';
import { facebookLogin, getFacebookConfig } from '../controllers/facebookAuth.controller';
import { getGoogleConfig, googleLogin } from '../controllers/googleAuth.controller';
import { checkQRStatus, confirmQRLogin, generateQR, markQRScanned } from '../controllers/qrAuth.controller';
import { disable2FA, enable2FA, setup2FA, trustDevice, verify2FALogin } from '../controllers/twoFactor.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { authSchemas } from '../utils/validationSchemas';

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
