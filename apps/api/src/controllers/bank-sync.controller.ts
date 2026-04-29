import { Request, Response } from 'express';
import { BankSyncService } from '../services/bank-sync.service';
import prisma from '../lib/prisma';
import { syncWalletTransactions } from '../cron/jobs/wallet-sync.job';

export class BankSyncController {
  static async getPending(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { walletId } = req.query;
      console.log(`[API] Fetching pending txs for user: ${userId}, wallet: ${walletId || 'ALL'}`);
      
      const transactions = await BankSyncService.getPendingTransactions(userId, walletId as string);
      console.log(`[API] Found ${transactions.length} pending transactions`);
      
      res.json({ success: true, data: transactions });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async approve(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const { categoryId, description, type } = req.body;

      if (!categoryId) {
        return res.status(400).json({ message: 'Vui lòng chọn danh mục' });
      }

      const expense = await BankSyncService.approveTransaction(userId, id, { categoryId, description, type });
      res.json({ success: true, message: 'Đã duyệt giao dịch', expense });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async reject(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      await BankSyncService.rejectTransaction(userId, id);
      res.json({ success: true, message: 'Đã từ chối giao dịch' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async fetchByWallet(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { walletId } = req.params;
      
      const wallet = await (prisma as any).wallet.findUnique({
        where: { id: walletId, userId }
      });

      if (!wallet || !wallet.sepayToken) {
        return res.status(400).json({ message: 'Ví chưa bật đồng bộ SePay' });
      }

      // Gọi hàm sync đã import ở đầu file
      await syncWalletTransactions(wallet);

      res.json({ success: true, message: 'Đồng bộ hoàn tất' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async clear(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      await BankSyncService.clearHistory(userId);
      res.json({ success: true, message: 'Đã dọn dẹp lịch sử' });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}
