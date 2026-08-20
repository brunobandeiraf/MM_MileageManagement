import { Router } from 'express';
import * as authController from './auth.controller.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';

const router = Router();

// POST /login — no auth required
router.post('/login', authController.login);

// POST /set-password — no auth required, the token itself is the credential
router.post('/set-password', authController.setPassword);

// POST /forgot-password — no auth required, self-service password recovery
router.post('/forgot-password', authController.forgotPassword);

// POST /logout — requires authentication
router.post('/logout', authMiddleware, authController.logout);

// GET /me — requires authentication
router.get('/me', authMiddleware, authController.me);

// PUT /me — requires authentication, self-service profile update
router.put('/me', authMiddleware, authController.updateMe);

export default router;
