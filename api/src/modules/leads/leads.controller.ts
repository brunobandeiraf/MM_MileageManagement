import { type Request, type Response, type NextFunction } from 'express';
import * as leadsService from './leads.service.js';
import { isValidPhone } from '../../utils/phone.js';

/**
 * POST /leads — public, no auth. Captures a landing-page lead.
 */
export async function createLead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, whatsapp, email, monthly_card_spend, trips_per_year } = req.body as {
      name?: string;
      whatsapp?: string;
      email?: string;
      monthly_card_spend?: string;
      trips_per_year?: string;
    };

    const missing: string[] = [];
    if (!name) missing.push('name');
    if (!whatsapp) missing.push('whatsapp');
    if (!email) missing.push('email');
    if (!monthly_card_spend) missing.push('monthly_card_spend');

    if (missing.length > 0) {
      res.status(400).json({ error: 'Campos obrigatórios ausentes', fields: missing });
      return;
    }

    if (!isValidPhone(whatsapp!)) {
      res.status(400).json({ error: 'WhatsApp inválido. Use o formato (DD) 9XXXX-XXXX' });
      return;
    }

    const lead = await leadsService.createLead({
      name: name!,
      whatsapp: whatsapp!,
      email: email!,
      monthly_card_spend: monthly_card_spend!,
      trips_per_year,
    });

    res.status(201).json(lead);
  } catch (err) {
    next(err);
  }
}
