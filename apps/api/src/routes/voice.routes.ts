import { Router } from 'express';
import multer from 'multer';
import { transcribeVoice } from '../controllers/voice.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Multer: memory storage for voice file uploads (max 10MB)
const voiceUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) return cb(null, true);
    cb(new Error('Chỉ chấp nhận file audio'));
  },
});

router.use(authenticate);

// POST /api/voice/transcribe
router.post(
  '/transcribe',
  (req, res, next) => {
    voiceUpload.single('audio')(req, res, (err) => {
      if (err) return res.status(400).json({ error: err.message });
      next();
    });
  },
  transcribeVoice,
);

export default router;
