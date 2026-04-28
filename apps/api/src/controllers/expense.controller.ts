import { Request, Response } from 'express';
import { ExpenseService } from '../services/expense.service';

export class ExpenseController {
  static async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const expenses = await ExpenseService.getAll(userId, req.query);
      res.json({ success: true, data: expenses });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const expense = await ExpenseService.create(userId, req.body);
      res.json({ success: true, data: expense });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const expense = await ExpenseService.update(id, userId, req.body);
      res.json({ success: true, data: expense });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      await ExpenseService.delete(id, userId);
      res.json({ success: true, message: 'Expense deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getCategories(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const categories = await ExpenseService.getCategories(userId);
      res.json({ success: true, data: categories });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async createCategory(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const category = await ExpenseService.createCategory(userId, req.body);
      res.json({ success: true, data: category });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getStats(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const stats = await ExpenseService.getStats(userId, req.query);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
