import { Router } from 'express';
import * as transferParitiesController from './transferParities.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

router.use(authMiddleware);

router.get('/', transferParitiesController.listTransferParities);
router.post('/', requireRole('ADMIN'), transferParitiesController.createTransferParity);
router.put('/:id', requireRole('ADMIN'), transferParitiesController.updateTransferParity);
router.delete('/:id', requireRole('ADMIN'), transferParitiesController.deleteTransferParity);

export default router;
