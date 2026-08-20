import { Router } from 'express';
import * as leadsController from './leads.controller.js';

const router = Router();

// POST / — public, no auth required (landing page lead capture)
router.post('/', leadsController.createLead);

export default router;
