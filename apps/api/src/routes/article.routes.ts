import { Router } from 'express';
import { getArticles, seedArticles } from '../controllers/article.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Routes for articles (knowledge base)
router.get('/', authenticate, getArticles);
router.post('/seed', seedArticles); // In production, add admin middleware

export default router;
