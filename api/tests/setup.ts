import { afterEach } from 'vitest';

// Garante que as variáveis de ambiente obrigatórias estejam definidas antes de qualquer
// módulo ser importado, evitando que o guard de fail-fast em env.ts encerre o processo
// de testes via process.exit(1).
process.env.DATABASE_URL    ??= 'postgresql://test:test@localhost:5432/test';
process.env.JWT_SECRET      ??= 'test-jwt-secret';
process.env.RESEND_API_KEY  ??= 'test-resend-api-key';
process.env.RESEND_FROM_EMAIL ??= 'test@example.com';

// Configuração global do Vitest para todos os testes
afterEach(() => {
  // Limpa todos os mocks entre testes para evitar contaminação de estado
  vi.clearAllMocks();
  vi.restoreAllMocks();
  vi.resetAllMocks();
});
