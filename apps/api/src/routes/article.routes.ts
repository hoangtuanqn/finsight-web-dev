import { Router } from 'express';
import {
  createArticle,
  deleteArticle,
  getArticles,
  seedArticles,
  updateArticle,
} from '../controllers/article.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Routes for articles (knowledge base)
router.get('/', authenticate, getArticles);
router.post('/', authenticate, createArticle);
router.patch('/:id', authenticate, updateArticle);
router.delete('/:id', authenticate, deleteArticle);
router.post('/seed', seedArticles); // In production, add admin middleware

export default router;
