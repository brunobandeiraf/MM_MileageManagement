import { Router } from 'express';
import * as usersController from './users.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/requireRole.js';

const router = Router();

// Apply authentication and role check to all routes.
// Fine-grained permission checks (e.g. FUNCIONARIO never seeing/touching ADMIN,
// only ADMIN being able to create a FUNCIONARIO) live in users.service.ts.
router.use(authMiddleware, requireRole('ADMIN', 'FUNCIONARIO'));

// Register routes
router.get('/', usersController.listUsers);
router.post('/', usersController.createUser);
router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);
router.put('/:id/password', usersController.setPassword);

export default router;
