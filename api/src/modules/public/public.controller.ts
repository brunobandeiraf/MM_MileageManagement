import { type Request, type Response, type NextFunction } from 'express';
import * as publicService from './public.service.js';

/**
 * GET /public/contact — public, no auth. Contact info for the landing page.
 */
export async function getContact(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const contact = await publicService.getContact();
    res.status(200).json(contact ?? { email: '', phone: '' });
  } catch (err) {
    next(err);
  }
}
