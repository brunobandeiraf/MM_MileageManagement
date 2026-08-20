import { Router } from 'express';
import * as loyaltyProgramsController from './loyaltyPrograms.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

router.use(authMiddleware);

router.get('/', loyaltyProgramsController.listLoyaltyPrograms);
router.post('/', requireRole('ADMIN'), loyaltyProgramsController.createLoyaltyProgram);
router.put('/:id', requireRole('ADMIN'), loyaltyProgramsController.updateLoyaltyProgram);
router.delete('/:id', requireRole('ADMIN'), loyaltyProgramsController.deleteLoyaltyProgram);

export default router;
