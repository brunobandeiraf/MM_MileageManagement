import { prisma } from '../src/lib/prisma.js';

/**
 * Paridades de transferência de pontos em vigor hoje entre programas de
 * fidelidade — quais programas podem transferir pontos para qual outro
 * programa, e a proporção. Direcional: um par (de, para) não implica o
 * inverso. Todas as paridades atuais são 1:1, mas a proporção é armazenada
 * explicitamente para suportar casos futuros diferentes de 1:1.
 *
 * Depende do catálogo de bancos/programas já estar populado — rode
 * `npm run seed:banks` antes deste script.
 */
const TRANSFER_PARITIES: { from: string; to: string; fromPoints: number; toPoints: number }[] = [
  { from: 'Átomos', to: 'Livelo', fromPoints: 1, toPoints: 1 },
  { from: 'Pontos BTG', to: 'Livelo', fromPoints: 1, toPoints: 1 },
  { from: 'BV Merece', to: 'Livelo', fromPoints: 1, toPoints: 1 },
  { from: 'PAN Mais', to: 'Livelo', fromPoints: 1, toPoints: 1 },
  { from: 'Nordeste Mais', to: 'Livelo', fromPoints: 1, toPoints: 1 },
  { from: 'Programa de Fidelidade Banestes', to: 'Livelo', fromPoints: 1, toPoints: 1 },
  { from: 'Programa de Pontos Sisprime', to: 'Livelo', fromPoints: 1, toPoints: 1 },
  { from: 'Programa de Pontos Unicred', to: 'Livelo', fromPoints: 1, toPoints: 1 },
  { from: 'Programa de Pontos Coopera', to: 'Livelo', fromPoints: 1, toPoints: 1 },
  { from: 'Safra Rewards', to: 'Livelo', fromPoints: 1, toPoints: 1 },
  { from: 'Programa de Pontos Nomad', to: 'Livelo', fromPoints: 1, toPoints: 1 },
  { from: 'Programa de Pontos Efí', to: 'Livelo', fromPoints: 1, toPoints: 1 },
  { from: 'Pontos XP', to: 'Livelo', fromPoints: 1, toPoints: 1 },
  { from: 'Curtaí', to: 'Livelo', fromPoints: 1, toPoints: 1 },
];

/**
 * Trunca o catálogo de paridades de transferência e recria a partir de
 * TRANSFER_PARITIES. Destrutivo por natureza — chamado apenas quando este
 * script é executado diretamente.
 */
async function main(): Promise<void> {
  console.log('[seedTransferParities] Truncando paridades de transferência existentes...');
  await prisma.transferParity.deleteMany({});

  let created = 0;
  const missing: string[] = [];

  for (const { from, to, fromPoints, toPoints } of TRANSFER_PARITIES) {
    const [fromProgram, toProgram] = await Promise.all([
      prisma.loyaltyProgram.findUnique({ where: { name: from } }),
      prisma.loyaltyProgram.findUnique({ where: { name: to } }),
    ]);

    if (!fromProgram || !toProgram) {
      missing.push(`${from} → ${to}`);
      continue;
    }

    await prisma.transferParity.create({
      data: {
        from_program_id: fromProgram.id,
        to_program_id: toProgram.id,
        from_points: fromPoints,
        to_points: toPoints,
      },
    });
    created++;
    console.log(`[seedTransferParities] ${from} → ${to} (${fromPoints}:${toPoints})`);
  }

  if (missing.length > 0) {
    console.warn(
      `[seedTransferParities] Pulado(s) por falta de programa cadastrado (rode "npm run seed:banks" primeiro): ${missing.join(', ')}`
    );
  }

  console.log(`[seedTransferParities] Concluído: ${created} paridades de transferência cadastradas.`);
}

// Only execute when run directly (not when imported by tests).
if (!process.env['VITEST']) {
  main()
    .catch((error: unknown) => {
      console.error('[seedTransferParities] Erro ao executar seed:', (error as Error).message);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
