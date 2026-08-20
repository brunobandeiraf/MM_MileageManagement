# Implementation Plan: Mundo Milhas

## Overview

Implementação incremental do sistema Mundo Milhas em monorepo (`/api` + `/web`), cobrindo infraestrutura base, autenticação JWT, gestão de usuários, dashboard, navegação com sidebar responsiva, alternância de tema dark/light e containerização Docker. Cada fase constrói sobre a anterior, garantindo que nenhum código fique órfão sem integração.

---

## Tasks

- [x] 1. Configurar estrutura do monorepo
  - Criar `.gitignore` na raiz excluindo `.env*`, `node_modules/`, `dist/`, `build/`, `.next/`, `*.log`, `logs/`, `.eslintcache` e `coverage/`
  - Criar `README.md` na raiz com visão geral do projeto, estrutura de pastas e links para os READMEs de `/api` e `/web`
  - _Requisitos: 1.1, 1.4_

- [x] 2. Configurar o projeto `/api`
  - [x] 2.1 Inicializar pacote Node.js + TypeScript na pasta `/api`
    - Criar `package.json` com scripts: `dev`, `build`, `start`, `lint`, `test`, `seed`
    - Criar `tsconfig.json` com `target: ES2022`, `module: NodeNext`, `outDir: dist`, `strict: true`
    - Instalar dependências de produção: `express`, `@prisma/client`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `cors`, `resend`
    - Instalar devDependências: `typescript`, `@types/*`, `prisma`, `vitest`, `fast-check`, `@vitest/coverage-v8`, `eslint`, `tsx`
    - Criar `/api/.env.example` com todas as variáveis obrigatórias e placeholders descritivos
    - Criar `/api/README.md` com seções: Pré-requisitos, Instalação, Configuração de Variáveis de Ambiente, Executando localmente, Executando testes
    - _Requisitos: 1.1, 1.2, 1.5_

  - [x] 2.2 Criar estrutura de pastas e arquivos base da API
    - Criar diretórios: `src/config/`, `src/lib/`, `src/middleware/`, `src/modules/auth/`, `src/modules/users/`, `src/utils/`, `prisma/`, `tests/unit/`
    - Criar `src/lib/prisma.ts` com singleton do `PrismaClient`
    - Criar `src/server.ts` com app Express base (sem rotas ainda): `cors`, `cookie-parser`, `express.json()`, health check e exportação do app
    - Criar `tests/setup.ts` com configuração global do Vitest
    - Configurar `vitest.config.ts` com globals, setup file e cobertura via v8
    - _Requisitos: 1.1_

- [x] 3. Configurar o projeto `/web`
  - [x] 3.1 Inicializar projeto React + TypeScript + Vite na pasta `/web`
    - Criar `package.json` com scripts: `dev`, `build`, `preview`, `lint`, `test`
    - Instalar dependências: `react`, `react-dom`, `react-router-dom`, `@types/react`, `@types/react-dom`, `typescript`, `vite`, `@vitejs/plugin-react`
    - Instalar devDependências: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `fast-check`, `jsdom`, `eslint`
    - Criar `tsconfig.json` e `vite.config.ts` com plugin React e alias `@` → `src/`
    - Criar `/web/.env.example` com `VITE_API_URL="http://localhost:3000/api"`
    - Criar `/web/README.md` com seções: Pré-requisitos, Instalação, Configuração de Variáveis de Ambiente, Executando localmente, Executando testes
    - _Requisitos: 1.1, 1.3, 1.6_

  - [x] 3.2 Configurar Tailwind CSS com suporte a dark mode
    - Instalar e configurar `tailwindcss`, `postcss`, `autoprefixer`
    - Criar `tailwind.config.ts` com `darkMode: 'class'` e scan de `./src/**/*.{ts,tsx}`
    - Importar diretivas Tailwind no arquivo `src/index.css`
    - Configurar `vitest.config.ts` com `environment: 'jsdom'`, globals e setup file
    - Criar `src/tests/setup.ts` com importação de `@testing-library/jest-dom`
    - _Requisitos: 1.1, 9.3_

  - [x] 3.3 Instalar e configurar shadcn/ui
    - Executar `npx shadcn@latest init` com base color `slate` e CSS variables habilitadas
    - Adicionar componentes necessários: `button`, `input`, `label`, `dialog`, `table`, `badge`, `avatar`, `dropdown-menu`, `toast`
    - Criar `src/lib/utils.ts` com função utilitária `cn` (clsx + tailwind-merge)
    - _Requisitos: 1.1_

- [x] 4. Configurar GitHub Actions CI
  - Criar `.github/workflows/ci.yml` com trigger em `pull_request` para `main`
  - Configurar job `api`: checkout, setup-node 20, cache npm, `npm ci`, `npm run lint`, `npm run test`
  - Configurar job `web`: checkout, setup-node 20, cache npm, `npm ci`, `npm run lint`, `npm run test`
  - Garantir que ambos os jobs encerrem com código 0 para aprovação do PR
  - _Requisitos: 1.7_

- [x] 5. Implementar schema Prisma e migração inicial
  - Criar `prisma/schema.prisma` com datasource PostgreSQL, enum `Role` (`ADMIN`, `USER`) e model `User` (id UUID, name, email único, password_hash, role, created_at, updated_at com @updatedAt)
  - Executar `prisma migrate dev --name init` para gerar o arquivo de migração em `prisma/migrations/`
  - Verificar que o schema gerado corresponde exatamente ao definido no design
  - _Requisitos: 3.1, 3.2_

- [x] 6. Implementar módulo de configuração de ambiente
  - [x] 6.1 Criar `src/config/env.ts` com validação fail-fast
    - Definir array `REQUIRED_VARS` com `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
    - Iterar sobre `REQUIRED_VARS`; se ausente, logar nome exato da variável e encerrar com `process.exit(1)`
    - Exportar objeto `env` tipado com todas as variáveis (obrigatórias e opcionais)
    - Importar `env.ts` como primeira instrução de `server.ts`
    - _Requisitos: 2.1, 2.2_

  - [x]* 6.2 Escrever teste de propriedade para validação de variáveis de ambiente
    - **Propriedade 1: Variáveis de ambiente obrigatórias são validadas na inicialização**
    - **Valida: Requisito 2.2**
    - Usar `fc.subarray` sobre `REQUIRED_VARS` para gerar subconjuntos de variáveis ausentes
    - Verificar que a função de validação lança erro com o nome exato da variável ausente
    - Arquivo: `tests/unit/env.test.ts`

- [x] 7. Implementar utilitários de senha
  - [x] 7.1 Criar `src/utils/password.ts`
    - Implementar `hashPassword(plain: string): Promise<string>` usando `bcryptjs` com custo 10
    - Implementar `comparePassword(plain: string, hash: string): Promise<boolean>`
    - _Requisitos: 2.3, 4.3_

  - [x]* 7.2 Escrever teste de propriedade para hash de senha
    - **Propriedade 2: Hash de senha tem formato bcrypt com custo mínimo 10**
    - **Valida: Requisitos 2.3, 4.3**
    - Usar `fc.string({ minLength: 1, maxLength: 72 })` para gerar senhas arbitrárias
    - Verificar que hash tem formato `$2b$10$...`, custo ≥ 10, e hash ≠ senha original
    - Verificar que `comparePassword(plain, hash)` retorna `true` para senha correta
    - Arquivo: `tests/unit/password.test.ts`

- [x] 8. Implementar utilitários de token JWT
  - [x] 8.1 Criar `src/utils/token.ts`
    - Implementar `signToken(payload: { id, name, role }): string` com expiração de 8 horas
    - Implementar `verifyToken(token: string): JwtPayload` — lança erro para token inválido/expirado
    - Usar `env.jwtSecret` como segredo
    - _Requisitos: 5.1, 5.3_

  - [x]* 8.2 Escrever testes de propriedade para JWT
    - **Propriedade 5: JWT de login contém claims corretos**
    - **Valida: Requisito 5.1**
    - Usar `fc.record({ id: fc.uuid(), name: fc.string(), role: fc.constantFrom('ADMIN', 'USER') })` para gerar payloads
    - Verificar que claims `id`, `name`, `role` estão presentes e corretos; `exp - iat === 28800`
    - **Propriedade 7: Tokens inválidos são universalmente rejeitados com erro**
    - **Valida: Requisitos 5.4, 5.7, 7.4**
    - Usar `fc.string()` para gerar tokens arbitrários e verificar que `verifyToken` lança exceção
    - Arquivo: `tests/unit/token.test.ts`

- [x] 9. Implementar utilitário de senha temporária
  - [x] 9.1 Criar `src/utils/tempPassword.ts`
    - Implementar `generateTempPassword(): string` retornando string de 8–16 caracteres
    - Garantir pelo menos 1 letra e pelo menos 1 dígito na senha gerada
    - _Requisitos: 10.2_

  - [x]* 9.2 Escrever teste de propriedade para senha temporária
    - **Propriedade 16: Senha temporária gerada atende formato obrigatório**
    - **Valida: Requisito 10.2**
    - Chamar `generateTempPassword()` em 100 iterações via `fc.assert(fc.property(fc.constant(null), ...))`
    - Verificar comprimento 8–16, presença de letra, presença de dígito, tipo string (não hash)
    - Arquivo: `tests/unit/tempPassword.test.ts`

- [x] 10. Implementar seed seguro do administrador
  - [x] 10.1 Criar `prisma/seed.ts`
    - Verificar presença de `ADMIN_EMAIL` e `ADMIN_PASSWORD`; encerrar com mensagem de erro se ausentes
    - Buscar usuário existente com `ADMIN_EMAIL` no banco via Prisma
    - Se existir: logar mensagem informativa e encerrar sem erro
    - Se não existir: aplicar `hashPassword`, criar registro com `role: 'ADMIN'`
    - Registrar comando `"prisma": { "seed": "tsx prisma/seed.ts" }` no `package.json`
    - _Requisitos: 2.5, 2.6, 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x]* 10.2 Escrever testes de propriedade para o seed
    - **Propriedade 3: Validação de variáveis obrigatórias do seed**
    - **Valida: Requisitos 2.6, 4.5**
    - Usar `fc.subarray(['ADMIN_EMAIL', 'ADMIN_PASSWORD'])` para simular ausência de variáveis
    - Verificar que seed lança erro com nome da variável ausente sem criar registros
    - **Propriedade 4: Idempotência do seed — ausência de duplicatas de admin**
    - **Valida: Requisitos 4.1, 4.2**
    - Mockar Prisma e executar seed N vezes (via `fc.integer({ min: 1, max: 10 })`)
    - Verificar que `prisma.user.create` foi chamado no máximo 1 vez no total
    - Arquivo: `tests/unit/seed.test.ts`

- [x] 11. Implementar middlewares de autenticação e autorização
  - [x] 11.1 Criar `src/middleware/auth.middleware.ts`
    - Extrair token do cabeçalho `Authorization: Bearer <token>`
    - Se ausente: retornar 401 `{ error: 'Token não fornecido' }`
    - Chamar `verifyToken`; se inválido/expirado: retornar 401
    - Anexar payload decodificado em `req.user` e chamar `next()`
    - _Requisitos: 5.3, 5.4, 5.7, 7.3, 7.4_

  - [x] 11.2 Criar `src/middleware/requireRole.ts`
    - Receber `role: Role` como parâmetro e retornar middleware Express
    - Se `req.user.role !== role`: retornar 403 `{ error: 'Acesso não autorizado' }`
    - Caso contrário: chamar `next()`
    - _Requisitos: 7.2_

- [x] 12. Checkpoint — API base funcional
  - Garantir que todos os testes de utils e middlewares passam sem erros
  - Verificar que `src/server.ts` importa `env.ts` como primeira instrução e sobe sem erros
  - Garantir ausência de erros de compilação TypeScript (`npm run build`)

- [x] 13. Implementar módulo de autenticação
  - [x] 13.1 Criar `src/modules/auth/auth.service.ts`
    - Implementar `login(email, password)`: buscar usuário, `comparePassword`, gerar JWT, retornar `{ id, name, role }`
    - Retornar `null` (erro genérico) para email não cadastrado ou senha incorreta — nunca indicar qual campo
    - Implementar `me(userId)`: buscar usuário por `id`, retornar `{ id, name, role }` sem `password_hash`
    - _Requisitos: 5.1, 5.2_

  - [x]* 13.2 Escrever testes de propriedade para auth service
    - **Propriedade 6: Uniformidade da mensagem de erro de autenticação**
    - **Valida: Requisito 5.2**
    - Usar `fc.emailAddress()` para emails não cadastrados e senhas arbitrárias
    - Verificar que serviço retorna `null` (sem vazar qual campo é inválido) para qualquer credencial incorreta
    - Arquivo: `tests/unit/auth.service.test.ts`

  - [x] 13.3 Criar `src/modules/auth/auth.controller.ts`
    - `POST /auth/login`: validar campos obrigatórios, chamar `auth.service.login`, setar cookie httpOnly + Secure (em produção) + SameSite=Strict + Max-Age=28800, retornar 200 com dados do usuário ou 401
    - `POST /auth/logout`: limpar cookie `token`, retornar 200
    - `GET /auth/me`: chamar `auth.service.me(req.user.id)`, retornar 200 com dados do usuário
    - _Requisitos: 5.1, 5.2, 5.5, 5.6_

  - [x] 13.4 Criar `src/modules/auth/auth.router.ts`
    - Registrar `POST /login` → controller.login (sem middleware de auth)
    - Registrar `POST /logout` → authMiddleware + controller.logout
    - Registrar `GET /me` → authMiddleware + controller.me
    - _Requisitos: 5.1, 5.6, 5.7_

- [x] 14. Implementar módulo de usuários
  - [x] 14.1 Criar `src/modules/users/users.service.ts`
    - Implementar `listUsers(page, limit)`: retornar `{ data, pagination }` sem `password_hash`
    - Implementar `createUser(name, email)`: verificar unicidade, gerar senha temporária, aplicar hash, salvar, enviar email via Resend, retornar usuário sem `password_hash`
    - Implementar `updateUser(id, data)`: verificar existência (404), verificar unicidade de email (409), atualizar registro
    - Implementar `deleteUser(id)`: verificar existência (404), verificar invariante de único admin (400), remover registro
    - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

  - [x]* 14.2 Escrever testes de propriedade para users service
    - **Propriedade 8: Campos obrigatórios ausentes retornam 400 com identificação**
    - **Valida: Requisitos 5.6, 10.9**
    - Usar `fc.subarray(['name', 'email'])` para simular ausência de campos
    - Verificar que serviço lança erro com lista dos campos ausentes sem criar registros
    - **Propriedade 15: Listagem de usuários nunca expõe password_hash**
    - **Valida: Requisito 10.1**
    - Usar `fc.array(fc.record({ id: fc.uuid(), name: fc.string(), ... }))` com campo password_hash
    - Verificar que nenhum objeto retornado contém a chave `password_hash`
    - **Propriedade 17: Unicidade de email é preservada em criação e atualização**
    - **Valida: Requisitos 10.5, 10.6**
    - Mockar Prisma para retornar conflito; verificar que serviço lança 409 sem criar/modificar registros
    - **Propriedade 18: Invariante de pelo menos um administrador no sistema**
    - **Valida: Requisito 10.7**
    - Mockar banco com exatamente 1 admin; verificar que `deleteUser` lança erro 400
    - **Propriedade 19: Operações em IDs inexistentes retornam 404**
    - **Valida: Requisito 10.8**
    - Usar `fc.uuid()` para IDs aleatórios não existentes; verificar 404 para update e delete
    - Arquivo: `tests/unit/users.service.test.ts`

  - [x] 14.3 Criar `src/modules/users/users.controller.ts`
    - `GET /users`: extrair `page` e `limit` dos query params, chamar `users.service.listUsers`
    - `POST /users`: validar `name` e `email` obrigatórios (400 com campos ausentes), chamar `users.service.createUser`
    - `PUT /users/:id`: chamar `users.service.updateUser`, tratar 404 e 409
    - `DELETE /users/:id`: chamar `users.service.deleteUser`, tratar 400, 404
    - _Requisitos: 10.1, 10.3, 10.4, 10.7, 10.8, 10.9_

  - [x] 14.4 Criar `src/modules/users/users.router.ts`
    - Aplicar `authMiddleware` + `requireRole('ADMIN')` em todas as rotas
    - Registrar: `GET /`, `POST /`, `PUT /:id`, `DELETE /:id`
    - _Requisitos: 7.2, 10.1_

- [x] 15. Integrar rotas e global error handler no servidor Express
  - Montar routers em `src/server.ts`: `/api/auth` e `/api/users`
  - Registrar `GET /api/health` retornando `{ status: 'ok', timestamp }` (sem autenticação)
  - Registrar global error handler (último middleware) retornando 500 com `{ error: 'Erro interno do servidor' }` — nunca expor stack trace em produção
  - _Requisitos: 2.4, 12.5_

- [x] 16. Checkpoint — Backend completo com testes passando
  - Executar `npm run test` em `/api` e garantir que todas as propriedades e testes unitários passam
  - Executar `npm run build` e verificar ausência de erros TypeScript
  - Garantir que nenhum teste expõe `password_hash`, token ou secret em output

- [x] 17. Configurar Docker para a API
  - [x] 17.1 Criar `/api/Dockerfile` multi-stage
    - Estágio `builder`: `FROM node:20-alpine`, `WORKDIR /app`, `COPY package*.json prisma ./`, `RUN npm ci`, `COPY . .`, `RUN npx prisma generate && npm run build`
    - Estágio `runner`: `FROM node:20-alpine`, criar grupo e usuário não-root (`appgroup`/`appuser`), `npm ci --omit=dev && npx prisma generate`, copiar `dist/` do builder, `chown -R appuser`, `USER appuser`, `EXPOSE ${PORT:-3000}`, `CMD ["node", "dist/server.js"]`
    - _Requisitos: 12.1, 12.2, 12.7_

  - [x] 17.2 Criar `/api/.dockerignore`
    - Excluir: `node_modules/`, `dist/`, `.env`, `.env.*`, `*.log`, `logs/`, `coverage/`, `tests/`, `*.test.ts`, `*.spec.ts`, `.git/`, `.github/`, `README.md`
    - _Requisitos: 12.3_

  - [x] 17.3 Criar `docker-compose.yml` na raiz do repositório
    - Definir serviço `api` com `build.context: ./api`, `env_file: ./api/.env`, mapeamento de porta, `restart: unless-stopped`
    - Adicionar `healthcheck` com `wget -qO- http://localhost:${PORT:-3000}/api/health`
    - Garantir que nenhum valor sensível está hardcoded no arquivo
    - Incluir seção de uso Docker no `README.md` da API (comandos `docker build` e `docker compose up`)
    - _Requisitos: 12.4, 12.5, 12.6, 12.8_

- [x] 18. Implementar ThemeContext e ThemeProvider
  - [x] 18.1 Criar `src/contexts/ThemeContext.tsx` e `src/components/shared/ThemeProvider.tsx`
    - Definir tipo `Theme = 'dark' | 'light'`
    - Criar `ThemeContext` com `{ theme, toggleTheme }`
    - `ThemeProvider`: ler `localStorage['theme']` na inicialização; padrão `'dark'` se ausente
    - Aplicar/remover classe `dark` no elemento `<html>` a cada mudança de tema
    - Persistir tema em `localStorage['theme']` a cada `toggleTheme`
    - _Requisitos: 9.1, 9.3, 9.4_

  - [x]* 18.2 Escrever teste de propriedade para ThemeContext
    - **Propriedade 14: Toggle de tema alterna corretamente e persiste no localStorage**
    - **Valida: Requisitos 9.3, 9.4**
    - Usar `fc.integer({ min: 1, max: 20 })` para número de acionamentos do toggle
    - Verificar que tema alterna `dark`↔`light` a cada acionamento
    - Verificar que `localStorage['theme']` sempre corresponde ao tema atual
    - Arquivo: `src/contexts/__tests__/ThemeContext.test.tsx`

- [x] 19. Criar hook `useTheme`
  - Criar `src/hooks/useTheme.ts` que consome `ThemeContext` e lança erro se usado fora do `ThemeProvider`
  - _Requisitos: 9.3_

- [x] 20. Implementar AuthContext e serviço de API
  - [x] 20.1 Criar `src/services/api.ts`
    - Implementar fetch wrapper com `credentials: 'include'` para envio automático de cookies
    - Implementar funções tipadas: `apiPost<T>`, `apiGet<T>`, `apiPut<T>`, `apiDelete<T>`
    - Usar `VITE_API_URL` como base URL
    - _Requisitos: 5.3, 5.5_

  - [x] 20.2 Criar `src/contexts/AuthContext.tsx`
    - Definir tipo `User = { id, name, role }`
    - `AuthProvider`: chamar `GET /api/auth/me` na inicialização para validar cookie existente; estado inicial `{ user: null, isLoading: true }`
    - Implementar `login(email, password)`: chamar `POST /api/auth/login`, atualizar `user`
    - Implementar `logout()`: chamar `POST /api/auth/logout`, limpar `user`
    - _Requisitos: 5.1, 5.5, 7.1_

- [x] 21. Criar hook `useAuth`
  - Criar `src/hooks/useAuth.ts` que consome `AuthContext` e lança erro se usado fora do `AuthProvider`
  - _Requisitos: 7.1_

- [x] 22. Implementar componente ProtectedRoute
  - [x] 22.1 Criar `src/components/shared/ProtectedRoute.tsx`
    - Props: `{ children, requiredRole? }`
    - Se `isLoading`: renderizar spinner/loading
    - Se `!user`: redirecionar para `/login?redirect=<currentPath>` (usar `useLocation` para capturar rota atual)
    - Se `requiredRole && user.role !== requiredRole`: renderizar mensagem de acesso negado (403)
    - Caso contrário: renderizar `children`
    - _Requisitos: 7.1, 7.2, 11.4_

  - [x]* 22.2 Escrever teste de propriedade para ProtectedRoute
    - **Propriedade 9: Redirecionamento de visitante não autenticado preserva rota destino**
    - **Valida: Requisitos 7.1, 11.4**
    - Usar `fc.webPath()` para rotas privadas arbitrárias
    - Verificar que redirect para `/login` contém `?redirect=<rotaOriginal>` sem truncamento
    - **Propriedade 10: Controle de acesso por papel — rotas de admin rejeitam papel USER**
    - **Valida: Requisito 7.2**
    - Renderizar `ProtectedRoute` com `requiredRole='ADMIN'` e user com `role: 'USER'`
    - Verificar que conteúdo protegido não é renderizado
    - Arquivo: `src/components/shared/__tests__/ProtectedRoute.test.tsx`

- [x] 23. Implementar AppLayout, Sidebar e Header
  - [x] 23.1 Criar `src/components/layout/AppLayout.tsx`
    - Gerenciar estado `isSidebarOpen` para responsividade mobile
    - Renderizar `<Sidebar>` + `<main>` contendo `<Header>` + `<Outlet />`
    - Passar `isSidebarOpen` e `setIsSidebarOpen` para `Sidebar` e `Header`
    - _Requisitos: 8.1, 8.2, 11.2_

  - [x] 23.2 Criar `src/components/layout/Sidebar.tsx`
    - Exibir logotipo e nome "Mundo Milhas" no topo
    - Renderizar itens de navegação com `NavLink` (react-router-dom) para highlight automático do item ativo
    - Exibir "Gestão de Usuários" → `/usuarios` apenas se `user.role === 'ADMIN'` (remover do DOM para `USER`, não apenas ocultar)
    - Exibir nome e papel do usuário na parte inferior (`Admin` para `ADMIN`, `Usuário` para `USER`)
    - Em mobile (<768px): `position: fixed`, overlay, controlado por `isSidebarOpen`
    - _Requisitos: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [x] 23.3 Criar `src/components/layout/Header.tsx`
    - Exibir botão hambúrguer para toggle da sidebar em mobile
    - Exibir nome do usuário e papel (`Admin`/`Usuário`) à direita
    - Exibir toggle de tema: ícone lua (dark) / sol (light), usando `useTheme()`
    - _Requisitos: 9.2, 11.3_

  - [x]* 23.4 Escrever testes de propriedade para Sidebar e Header
    - **Propriedade 11: Sidebar e header exibem dados do usuário autenticado corretamente**
    - **Valida: Requisitos 8.3, 11.3**
    - Usar `fc.record({ name: fc.string({ minLength: 1 }), role: fc.constantFrom('ADMIN', 'USER') })` para usuários arbitrários
    - Verificar que nome e papel label corretos aparecem em Sidebar e Header
    - **Propriedade 12: Destaque visual do item ativo na Sidebar é exclusivo**
    - **Valida: Requisito 8.5**
    - Usar `fc.constantFrom('/dashboard', '/usuarios')` para rotas ativas
    - Verificar que exatamente 1 item tem classe de destaque ativo
    - **Propriedade 13: Visibilidade de "Gestão de Usuários" é determinada pelo papel**
    - **Valida: Requisito 8.7**
    - Renderizar Sidebar com `role: 'ADMIN'`: item presente no DOM
    - Renderizar Sidebar com `role: 'USER'`: item ausente do DOM (não apenas `display: none`)
    - Arquivo: `src/components/layout/__tests__/Sidebar.test.tsx` e `Header.test.tsx`

- [x] 24. Configurar roteamento da aplicação
  - Criar `src/App.tsx` com `BrowserRouter`, `Routes` e `Route`
  - Rotas públicas: `/` → `HomePage`, `/login` → `LoginPage`
  - Rotas privadas (envoltas em `ProtectedRoute` + `AppLayout`): `/dashboard` → `DashboardPage`, `/usuarios` → `UsersPage` (com `requiredRole='ADMIN'`)
  - Redirecionar `/` autenticado para `/dashboard` usando `AuthContext`
  - _Requisitos: 6.1, 6.2, 6.3, 7.1, 7.2_

- [x] 25. Implementar páginas públicas (Home e Login)
  - [x] 25.1 Criar `src/pages/public/HomePage.tsx`
    - Exibir título "Mundo Milhas", descrição do propósito de gestão de milhas
    - Renderizar botão/link CTA para `/login`
    - Acessível sem autenticação
    - _Requisitos: 6.1_

  - [x] 25.2 Criar `src/pages/public/LoginPage.tsx`
    - Formulário com campos `email` (type="email", com `<label>` associado) e `password` (type="password", com `<label>` associado)
    - Validação inline de campos obrigatórios — exibir mensagem de erro adjacente ao campo sem recarregar
    - Ao submeter: chamar `useAuth().login()`, redirecionar para `?redirect` ou `/dashboard`
    - Se usuário já autenticado: redirecionar imediatamente para `/dashboard`
    - _Requisitos: 6.2, 6.3, 6.4, 6.5_

- [x] 26. Implementar páginas privadas (Dashboard e Usuários)
  - [x] 26.1 Criar `src/pages/private/DashboardPage.tsx`
    - Exibir mensagem de boas-vindas contendo o `user.name` como substring (ex: "Bem-vindo, {nome}!")
    - Exibir painel inicial com informações básicas do sistema Mundo Milhas
    - _Requisitos: 11.1, 11.2_

  - [x]* 26.2 Escrever teste de propriedade para DashboardPage
    - **Propriedade 20: Mensagem de boas-vindas contém o nome do usuário autenticado**
    - **Valida: Requisito 11.1**
    - Usar `fc.string({ minLength: 1 })` para nomes arbitrários (incluindo caracteres especiais)
    - Verificar que a mensagem renderizada contém o nome exato como substring
    - Arquivo: `src/pages/private/__tests__/DashboardPage.test.tsx`

  - [x] 26.3 Criar `src/pages/private/UsersPage.tsx`
    - Buscar usuários via `GET /api/users` ao montar o componente
    - Renderizar tabela com colunas: Nome, Email, Papel, Data de criação, Ações
    - Botão "Novo Usuário" abre modal de criação (campos: nome, email)
    - Ações por linha: edição inline de nome/email, confirmação modal antes de excluir
    - Exibir toast/feedback de sucesso e erro para cada operação CRUD
    - _Requisitos: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

- [x] 27. Checkpoint final — Testes completos e build verde
  - Executar `npm run test` em `/api` e `/web` — todos os testes devem passar
  - Executar `npm run build` em `/api` e `/web` — sem erros de compilação
  - Executar `npm run lint` em ambos os projetos — sem warnings ou erros
  - Verificar que nenhum arquivo `.env` com valores reais está versionado

---

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia os requisitos correspondentes para rastreabilidade completa
- As propriedades PBT devem ser executadas com `numRuns: 100` (mínimo) via `fast-check`
- Testes unitários com exemplos concretos complementam os testes de propriedade
- Checkpoints garantem validação incremental antes de avançar para a próxima fase
- O módulo de configuração `env.ts` deve ser importado antes de qualquer outro módulo na API
- O cookie JWT deve ter `Secure: true` apenas em `NODE_ENV === 'production'` para facilitar desenvolvimento local
- O campo `password_hash` nunca deve aparecer em respostas HTTP — verificar em todas as camadas
- A invariante de único administrador (`Propriedade 18`) deve ser verificada na service layer, não no controller

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1", "4"] },
    { "id": 1, "tasks": ["2.2", "3.2"] },
    { "id": 2, "tasks": ["3.3"] },
    { "id": 3, "tasks": ["5", "6.1"] },
    { "id": 4, "tasks": ["6.2", "7.1", "8.1", "9.1"] },
    { "id": 5, "tasks": ["7.2", "8.2", "9.2", "10.1"] },
    { "id": 6, "tasks": ["10.2", "11.1", "11.2"] },
    { "id": 7, "tasks": ["13.1", "18.1", "20.1"] },
    { "id": 8, "tasks": ["13.2", "13.3", "14.1", "18.2", "19", "20.2"] },
    { "id": 9, "tasks": ["13.4", "14.2", "14.3", "21", "22.1"] },
    { "id": 10, "tasks": ["14.4", "22.2", "23.1"] },
    { "id": 11, "tasks": ["15", "23.2", "23.3"] },
    { "id": 12, "tasks": ["17.1", "17.2", "23.4", "24"] },
    { "id": 13, "tasks": ["17.3", "25.1", "25.2"] },
    { "id": 14, "tasks": ["26.1", "26.3"] },
    { "id": 15, "tasks": ["26.2"] }
  ]
}
```
