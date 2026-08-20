import { Router } from 'express';
import * as publicController from './public.controller.js';

const router = Router();

router.get('/contact', publicController.getContact);

export default router;
