import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { error, success } from '../utils/apiResponse';

function normalizeArticleBody(body: any) {
  return {
    title: String(body?.title || '').trim(),
    author: String(body?.author || 'FinSight Team').trim(),
    date: String(body?.date || new Date().toISOString().slice(0, 10)).trim(),
    imageUrl: String(body?.imageUrl || '').trim(),
    excerpt: String(body?.excerpt || '').trim(),
    content: String(body?.content || '').trim(),
    category: String(body?.category || 'STORY').trim() || 'STORY',
  };
}

function validateArticlePayload(data: ReturnType<typeof normalizeArticleBody>) {
  if (!data.title) return 'Title is required';
  if (!data.imageUrl) return 'Image URL is required';
  if (!data.excerpt) return 'Excerpt is required';
  if (!data.content) return 'Content is required';
  return null;
}

export async function getArticles(req: Request, res: Response) {
  try {
    const articles = await (prisma as any).article.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return success(res, { articles });
  } catch (err) {
    console.error('getArticles error:', err);
    return error(res, 'Internal server error');
  }
}

export async function createArticle(req: Request, res: Response) {
  try {
    const data = normalizeArticleBody(req.body);
    const validationError = validateArticlePayload(data);
    if (validationError) return error(res, validationError, 400);

    const article = await (prisma as any).article.create({ data });
    return success(res, { article }, 201);
  } catch (err) {
    console.error('createArticle error:', err);
    return error(res, 'Internal server error');
  }
}

export async function updateArticle(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const data = normalizeArticleBody(req.body);
    const validationError = validateArticlePayload(data);
    if (validationError) return error(res, validationError, 400);

    const existing = await (prisma as any).article.findUnique({ where: { id } });
    if (!existing) return error(res, 'Article not found', 404);

    const article = await (prisma as any).article.update({
      where: { id },
      data,
    });
    return success(res, { article });
  } catch (err) {
    console.error('updateArticle error:', err);
    return error(res, 'Internal server error');
  }
}

export async function deleteArticle(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await (prisma as any).article.findUnique({ where: { id } });
    if (!existing) return error(res, 'Article not found', 404);

    await (prisma as any).article.delete({ where: { id } });
    return success(res, { message: 'Article deleted successfully' });
  } catch (err) {
    console.error('deleteArticle error:', err);
    return error(res, 'Internal server error');
  }
}
