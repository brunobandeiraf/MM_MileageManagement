import { Router } from 'express';
import * as banksController from './banks.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

// Every authenticated role can read the catalog — Team and Usuário both need
// it to link a bank to a user or to themselves. Only ADMIN can mutate it.
router.use(authMiddleware);

router.get('/', banksController.listBanks);
router.post('/', requireRole('ADMIN'), banksController.createBank);
router.put('/:id', requireRole('ADMIN'), banksController.updateBank);
router.delete('/:id', requireRole('ADMIN'), banksController.deleteBank);

export default router;
