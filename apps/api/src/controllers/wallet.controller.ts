import { Request, Response } from 'express';
import { WalletService } from '../services/wallet.service';

export class WalletController {
  static async getAll(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const wallets = await WalletService.getAll(userId);
      res.json({ success: true, data: wallets });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getTotalBalance(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const result = await WalletService.getTotalBalance(userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const wallet = await WalletService.create(userId, req.body);
      res.json({ success: true, data: wallet });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const wallet = await WalletService.update(id, userId, req.body);
      res.json({ success: true, data: wallet });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      await WalletService.delete(id, userId);
      res.json({ success: true, message: 'Wallet deleted' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
