import { Router } from 'express';
import { BankSyncController } from '../controllers/bank-sync.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Tất cả các route đều yêu cầu đăng nhập
router.use(authenticate);

router.get('/pending', BankSyncController.getPending);
router.post('/fetch/:walletId', BankSyncController.fetchByWallet);
router.post('/approve/:id', BankSyncController.approve);
router.post('/reject/:id', BankSyncController.reject);
router.delete('/clear', BankSyncController.clear);

export default router;
