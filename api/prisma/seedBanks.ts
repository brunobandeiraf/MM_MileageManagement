import { prisma } from '../src/lib/prisma.js';

/**
 * Catálogo de bancos que operam no Brasil, com seus respectivos programas de
 * fidelidade/pontos. Um programa pode se repetir entre bancos (ex.: Livelo é
 * compartilhado por Banco do Brasil e Bradesco) — o seed cria cada programa
 * uma única vez e apenas vincula os bancos a ele.
 */
const BANKS_DATA: { name: string; programs: string[] }[] = [
  { name: 'Banco do Brasil', programs: ['Livelo'] },
  { name: 'Bradesco', programs: ['Livelo'] },
  { name: 'Santander', programs: ['Esfera'] },
  { name: 'Itaú', programs: ['Iupp'] },
  { name: 'C6 Bank', programs: ['Átomos'] },
  { name: 'Banco Inter', programs: ['Loop'] },
  { name: 'BTG Pactual', programs: ['Pontos BTG'] },
  { name: 'Caixa Econômica Federal', programs: ['Uau CAIXA'] },
  { name: 'Banco do Nordeste', programs: ['Nordeste Mais'] },
  { name: 'Banco de Brasília (BRB)', programs: ['Curtaí'] },
  { name: 'Sicoob', programs: ['Sicoobcard Prêmios'] },
  { name: 'Unicred', programs: ['Programa de Pontos Unicred'] },
  { name: 'Sisprime', programs: ['Programa de Pontos Sisprime'] },
  { name: 'Coopera', programs: ['Programa de Pontos Coopera'] },
  { name: 'Banestes', programs: ['Programa de Fidelidade Banestes'] },
  { name: 'Banese', programs: ['BaneseCard'] },
  { name: 'Banco Bari', programs: ['Programa de Pontos Bari'] },
  { name: 'Digio', programs: ['Programa de Pontos Digio'] },
  { name: 'Banco Industrial do Brasil (BIB)', programs: ['Programa de Pontos BIB'] },
  { name: 'Banco Pan', programs: ['PAN Mais'] },
  { name: 'Credicard', programs: ['Programa de Pontos Credicard'] },
  { name: 'Banco Next', programs: ['Programa de Pontos Next'] },
  { name: 'XP', programs: ['Pontos XP'] },
  { name: 'Genial Investimentos', programs: ['Pontos Genial'] },
  { name: 'Efí', programs: ['Programa de Pontos Efí'] },
  { name: 'Nomad', programs: ['Programa de Pontos Nomad'] },
  { name: 'Porto Bank', programs: ['Programa de Relacionamento Porto'] },
  { name: 'Banco Votorantim (BV)', programs: ['BV Merece'] },
  { name: 'Banco Safra', programs: ['Safra Rewards'] },
];

/**
 * Trunca os cadastros de bancos e programas de fidelidade (e, por cascata,
 * os vínculos banco↔programa e usuário↔banco), depois recria tudo a partir
 * de BANKS_DATA. Destrutivo por natureza — chamado apenas quando este script
 * é executado diretamente.
 */
async function main(): Promise<void> {
  console.log('[seedBanks] Truncando cadastros de bancos e programas de fidelidade existentes...');
  // Deletar Bank cascata para BankLoyaltyProgram e UserBank; deletar
  // LoyaltyProgram cascata para qualquer BankLoyaltyProgram remanescente.
  await prisma.bank.deleteMany({});
  await prisma.loyaltyProgram.deleteMany({});

  const programIdByName = new Map<string, string>();

  for (const { name, programs } of BANKS_DATA) {
    const bank = await prisma.bank.create({ data: { name } });

    for (const programName of programs) {
      let programId = programIdByName.get(programName);
      if (!programId) {
        const program = await prisma.loyaltyProgram.create({ data: { name: programName } });
        programId = program.id;
        programIdByName.set(programName, programId);
      }

      await prisma.bankLoyaltyProgram.create({
        data: { bank_id: bank.id, loyalty_program_id: programId },
      });
    }

    console.log(`[seedBanks] ${name} → ${programs.join(', ')}`);
  }

  console.log(
    `[seedBanks] Concluído: ${BANKS_DATA.length} bancos e ${programIdByName.size} programas de fidelidade cadastrados.`
  );
}

// Only execute when run directly (not when imported by tests).
if (!process.env['VITEST']) {
  main()
    .catch((error: unknown) => {
      console.error('[seedBanks] Erro ao executar seed:', (error as Error).message);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
