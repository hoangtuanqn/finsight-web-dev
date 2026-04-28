import { Router } from 'express';
import { WalletController } from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/balance', WalletController.getTotalBalance);
router.get('/', WalletController.getAll);
router.post('/', WalletController.create);
router.patch('/:id', WalletController.update);
router.delete('/:id', WalletController.delete);

export default router;
