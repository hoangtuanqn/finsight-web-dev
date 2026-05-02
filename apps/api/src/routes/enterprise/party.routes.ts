import { Router } from 'express';
import { createParty, getParties, updateParty } from '../../controllers/enterprise/party.controller';

const router = Router();

router.get('/', getParties);
router.post('/', createParty);
router.put('/:id', updateParty);

export default router;
