import { env } from './config/env.js';

import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import authRouter from './modules/auth/auth.router.js';
import usersRouter from './modules/users/users.router.js';
import leadsRouter from './modules/leads/leads.router.js';
import publicRouter from './modules/public/public.router.js';
import banksRouter from './modules/banks/banks.router.js';
import loyaltyProgramsRouter from './modules/loyaltyPrograms/loyaltyPrograms.router.js';
import transferParitiesRouter from './modules/transferParities/transferParities.router.js';

export const app = express();

// ─── Middlewares globais ───────────────────────────────────────────
app.use(cors({
  origin: env.corsOrigin,
  credentials: true,
}));
app.use(cookieParser());
// Raised from Express's 100kb default to fit a resized profile photo sent as
// a base64 data URI in the JSON body (see auth.service.ts's MAX_AVATAR_LENGTH).
app.use(express.json({ limit: '2mb' }));

// ─── Health check ─────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Rotas ────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/public', publicRouter);
app.use('/api/banks', banksRouter);
app.use('/api/loyalty-programs', loyaltyProgramsRouter);
app.use('/api/transfer-parities', transferParitiesRouter);

// ─── Global error handler ─────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const isDev = env.nodeEnv === 'development';
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({
    error: 'Erro interno do servidor',
    ...(isDev && { detail: err.message }),
  });
});

// ─── Server ───────────────────────────────────────────────────────
export const server = createServer(app);

// ─── Bootstrap ────────────────────────────────────────────────────
function bootstrap(): void {
  server.listen(env.port, () => {
    console.log(`[server] API rodando em http://localhost:${env.port}`);
  });
}

bootstrap();
