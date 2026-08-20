# Mundo Milhas — Contexto Completo do Projeto

## Visão Geral

**Mundo Milhas** é um sistema de gestão de milhas aéreas de alto padrão para a empresa homônima. O projeto é um monorepo com duas aplicações independentes:

- `/api` — Backend REST (Node.js + Express + Prisma ORM) hospedado no **Railway**
- `/web` — Frontend React hospedado na **Vercel**
- Banco de dados: **PostgreSQL via Supabase** (em produção) / PostgreSQL local via Docker (em desenvolvimento)
- Email transacional: **Resend**

---

## Stack Tecnológica (imutável — não alterar)

### Backend (`/api`)
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **ORM**: Prisma 5 (NodeNext ESM)
- **Linguagem**: TypeScript strict, módulos ESM (`"type": "module"`)
- **Testes**: Vitest + fast-check (Property-Based Testing)
- **Containerização**: Docker multi-stage (alpine, usuário não-root)

### Frontend (`/web`)
- **Framework**: React 18 + TypeScript + Vite
- **Estilo**: Tailwind CSS (`darkMode: 'class'`) + shadcn/ui (base color: slate)
- **Animações**: `framer-motion` — hoje usado só na Home page pública (landing page); não é padrão obrigatório pras telas internas (dashboard, gestão de usuários etc.), que continuam sem animação por escolha, não por falta de lib
- **Roteamento**: React Router v6
- **Testes**: Vitest + React Testing Library + fast-check

### Regras absolutas de segurança
- **NUNCA** hardcodar credenciais, tokens ou secrets no código
- **SEMPRE** ler valores sensíveis de variáveis de ambiente
- Senhas: bcrypt com custo mínimo 10
- JWT: httpOnly cookie, SameSite=Strict, Secure=true em produção, expiração 8h
- `password_hash` **NUNCA** deve aparecer em respostas HTTP

---

## Estrutura de Pastas

```
MM_MileageManagement/
├── api/
│   ├── src/
│   │   ├── config/env.ts          # Validação fail-fast de env vars
│   │   ├── lib/prisma.ts          # Singleton PrismaClient
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts # Valida JWT Bearer token
│   │   │   └── requireRole.ts     # Controle de acesso por papel
│   │   ├── modules/
│   │   │   ├── auth/               # login, logout, /me, /me/password, /me/banks
│   │   │   ├── users/               # CRUD usuários (ADMIN|FUNCIONARIO) + /:id/password, /:id/banks
│   │   │   ├── banks/               # Catálogo global de bancos (ADMIN escreve, todos leem)
│   │   │   ├── loyaltyPrograms/     # Catálogo de programas de fidelidade de bancos
│   │   │   └── transferParities/    # Paridade de transferência entre programas
│   │   ├── utils/
│   │   │   ├── password.ts        # hashPassword, comparePassword
│   │   │   ├── token.ts           # signToken, verifyToken
│   │   │   ├── tempPassword.ts    # generateTempPassword
│   │   │   └── errors.ts          # AppError class
│   │   └── server.ts              # Entry point Express
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   ├── seed.ts                # Seed seguro do admin (lê ADMIN_EMAIL/PASSWORD de env)
│   │   ├── seedBanks.ts           # npm run seed:banks — TRUNCA banks+loyalty_programs e recria (⚠️ ver seção própria)
│   │   └── seedTransferParities.ts # npm run seed:parities — trunca transfer_parities e recria
│   ├── tests/unit/                # Testes PBT com fast-check
│   ├── Dockerfile                 # Multi-stage, alpine, non-root
│   ├── .dockerignore
│   └── .env.example
├── web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                # shadcn/ui components
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx  # Sidebar + Header + Outlet
│   │   │   │   ├── Sidebar.tsx    # Nav lateral responsiva
│   │   │   │   └── Header.tsx     # Toggle tema + info usuário
│   │   │   └── shared/
│   │   │       ├── ProtectedRoute.tsx
│   │   │       ├── ThemeProvider.tsx
│   │   │       ├── ProfileDialog.tsx   # "Meu Perfil": dados + Alterar Senha + Meus Bancos
│   │   │       ├── BankMultiSelect.tsx # checkboxes de bancos (Programas, editar usuário, Meu Perfil)
│   │   │       ├── LogoUpload.tsx      # logo de Banco/Programa, com recorte (react-easy-crop)
│   │   │       └── SortableTh.tsx      # <th> clicável, alterna asc/desc
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx    # user (com banks[]), isLoading, login(), logout(), updateProfile(), changePassword(), updateMyBanks()
│   │   │   └── ThemeContext.tsx   # theme, toggleTheme()
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useTheme.ts
│   │   ├── lib/
│   │   │   ├── image.ts           # resizeImageToDataUrl() — usado pelo avatar
│   │   │   └── cropImage.ts       # getCroppedImageDataUrl() — usado pelo LogoUpload
│   │   ├── pages/
│   │   │   ├── public/            # HomePage, LoginPage, ForgotPasswordPage, SetPasswordPage
│   │   │   └── private/           # DashboardPage, UsersPage, BanksPage, LoyaltyProgramsPage, TransferParitiesPage
│   │   └── services/api.ts        # fetch wrapper com credentials: 'include'
│   └── .env.example
├── docker-compose.yml             # Postgres local + API (perfil docker)
└── .github/workflows/ci.yml       # Lint + testes em PRs para main
```

---

## Variáveis de Ambiente

### `/api/.env` (desenvolvimento local)
```dotenv
NODE_ENV="development"
PORT="3000"
DATABASE_URL="postgresql://mundimilhas:mundimilhas_dev@localhost:5432/mundimilhas_db"
JWT_SECRET="<secret gerado com crypto.randomBytes(48)>"
CORS_ORIGIN="http://localhost:5173"
ADMIN_EMAIL="contatomundomilhas@gmail.com"
ADMIN_PASSWORD="Brwn0Gestão#"
RESEND_API_KEY="<chave do Resend>"
RESEND_FROM_EMAIL="onboarding@resend.dev"  # dev: usar domínio Resend
                                            # prod: noreply@mundomilhas.com.br (após verificar domínio)
```

### `/web/.env` (desenvolvimento local)
```dotenv
VITE_API_URL="http://localhost:3000/api"
```

---

## Como Rodar Localmente

```bash
# 1. Subir o Postgres local
docker compose up postgres -d

# 2. API
cd api
npm install
npx prisma migrate dev    # primeira vez
npm run seed              # criar admin
npm run seed:banks        # opcional — catálogo de bancos/programas (⚠️ TRUNCA se já existir, ver seção própria)
npm run seed:parities     # opcional — paridades de transferência (depende do seed:banks)
npm run dev               # http://localhost:3000

# 3. Frontend
cd web
npm install
npm run dev               # http://localhost:5173
```

### ⚠️ Cuidado com `prisma migrate diff --shadow-database-url`

**Nunca** passar a `DATABASE_URL` real (ou qualquer banco com dados) como `--shadow-database-url`. Esse comando trata o alvo como banco descartável e o recria do zero para calcular o diff — isso já **apagou todos os dados locais** uma vez neste projeto (schema ficou correto, mas todas as linhas de `users` sumiram, incluindo o admin). Se `prisma migrate dev` recusar rodar por falta de TTY (ambiente não-interativo), prefira: gerar o SQL manualmente comparando `schema.prisma` com a última migration, criar a pasta em `prisma/migrations/<timestamp>_<nome>/migration.sql` à mão, e aplicar com `prisma migrate deploy` (não precisa de shadow database nenhum).

---

## Schema do Banco de Dados

```prisma
enum Role { ADMIN FUNCIONARIO USER }
enum UserType { GESTAO ASSINANTE }

model User {
  id                         String    @id @default(uuid())
  name                       String    @db.VarChar(255)
  email                      String    @unique @db.VarChar(255)
  phone                      String    @default("") @db.VarChar(20)
  avatar_url                 String?
  password_hash              String?
  password_reset_token_hash  String?   @unique
  password_reset_expires_at  DateTime?
  role                       Role      @default(USER)
  user_type                  UserType  @default(GESTAO)
  created_at                 DateTime  @default(now()) @db.Timestamptz
  updated_at                 DateTime  @updatedAt @db.Timestamptz
  @@map("users")
}

model Lead {
  id                 String   @id @default(uuid())
  name               String   @db.VarChar(255)
  whatsapp           String   @db.VarChar(20)
  email              String   @db.VarChar(255)
  monthly_card_spend String   @db.VarChar(50)
  trips_per_year     String?  @db.VarChar(50)
  created_at         DateTime @default(now()) @db.Timestamptz
  @@map("leads")
}

// Catálogo global de bancos — só ADMIN cria/edita/exclui, todo papel autenticado lê.
model Bank {
  id         String   @id @default(uuid())
  name       String   @unique @db.VarChar(255)
  logo_url   String?  // data URI base64, mesmo padrão do avatar_url
  loyaltyPrograms BankLoyaltyProgram[]
  users           UserBank[]
  @@map("banks")
}

// Catálogo de programas de fidelidade DE BANCOS (não confundir com futuro
// catálogo de programas de fidelidade de companhias aéreas — são separados).
model LoyaltyProgram {
  id         String   @id @default(uuid())
  name       String   @unique @db.VarChar(255)
  logo_url   String?
  banks         BankLoyaltyProgram[]
  transfersFrom TransferParity[] @relation("TransferParityFrom")
  transfersTo   TransferParity[] @relation("TransferParityTo")
  @@map("loyalty_programs")
}

// N:N — quais programas um banco oferece (ex.: Livelo pertence a BB e Bradesco).
model BankLoyaltyProgram {
  bank_id String
  loyalty_program_id String
  @@id([bank_id, loyalty_program_id])
  @@map("bank_loyalty_programs")
}

// N:N — quais bancos estão vinculados à conta de um usuário.
model UserBank {
  user_id String
  bank_id String
  @@id([user_id, bank_id])
  @@map("user_banks")
}

// Paridade de transferência entre dois programas — direcional (A→B não
// implica B→A) e curada manualmente pelo ADMIN, nunca inferida.
model TransferParity {
  id              String @id @default(uuid())
  from_program_id String
  to_program_id   String
  from_points     Int    @default(1)
  to_points       Int    @default(1)
  fromProgram LoyaltyProgram @relation("TransferParityFrom", fields: [from_program_id], references: [id])
  toProgram   LoyaltyProgram @relation("TransferParityTo", fields: [to_program_id], references: [id])
  @@unique([from_program_id, to_program_id])
  @@map("transfer_parities")
}
```

- `User.banks: UserBank[]` — todo papel pode vincular um ou mais bancos à própria conta (`PUT /auth/me/banks`); ADMIN/FUNCIONARIO também vinculam bancos a um usuário que gerenciam (`PUT /users/:id/banks`), com a mesma regra de visibilidade do resto do módulo (FUNCIONARIO nunca mexe no ADMIN)
- Todos os campos `logo_url` seguem exatamente o padrão do `avatar_url` do usuário: data URI base64, limite de tamanho no backend (`MAX_LOGO_LENGTH`), recorte/redimensionamento no client antes do upload — ver seção "Catálogo de Bancos..." abaixo

- `Lead` é só captação da Home page pública — não vira `User` automaticamente. Conversão de lead em usuário/cliente é manual (Admin cria pelo painel de Gestão de Usuários quando fechar negócio). Não existe ainda uma tela de listagem de leads — só a tabela e o email de notificação

- `password_hash` é `String?` (opcional) — ver seção "Senha de usuário — fluxo de convite" abaixo antes de assumir que todo usuário tem senha

- `phone`: obrigatório no cadastro pela UI/API (validado no controller via `isValidPhone()` em `api/src/utils/phone.ts`), formato `(DD) 9XXXX-XXXX`. A coluna tem `@default("")` só para a migration não quebrar em linhas legadas — nunca depender desse default em código novo.

### `role` vs `user_type` (não confundir)

- `role` (`ADMIN`/`USER`) = **permissão de acesso** ao sistema — controla o que a pessoa pode fazer (já existia desde o início)
- `user_type` (`GESTAO`/`ASSINANTE`) = **categoria de negócio** — de que "tipo" de conta se trata, independente da permissão
- **Hoje**: todo usuário criado pelo painel de Gestão de Usuários (Admin cria) nasce com `user_type: GESTAO` — é sempre setado explicitamente em `createUser()`, nunca deixado só no default do schema, para deixar claro no código que essa é a origem "interna/staff"
- **Motivo**: o sistema vai futuramente abrir cadastro para **usuários assinantes** (clientes finais que assinam o serviço, categoria `ASSINANTE`) — esse campo já separa as duas categorias desde agora para não exigir migração de dados depois
- `user_type` **não é exposto na UI/DTO** por enquanto — é só uma tag interna. Quando a feature de assinantes for implementada, ela decide sozinha seu próprio fluxo de cadastro/permissões; não reaproveitar o formulário "Novo Usuário" do Admin para isso
- Rótulo na UI da tabela de Gestão de Usuários continua "Usuário" / "Admin" (baseado em `role`) — `user_type` não altera nada visualmente hoje

---

## Endpoints da API

| Método | Rota               | Auth                  | Descrição                                      |
|--------|--------------------|------------------------|-------------------------------------------------|
| GET    | `/api/health`      | —                      | Health check                                     |
| POST   | `/api/auth/login`  | —                      | Login, seta httpOnly cookie JWT                  |
| POST   | `/api/auth/logout` | JWT                    | Logout, limpa cookie                             |
| GET    | `/api/auth/me`     | JWT                    | Dados do usuário autenticado (`id, name, email, phone, avatar_url, role, banks[]`) |
| PUT    | `/api/auth/me`     | JWT                    | Self-service: edita o próprio nome/email/telefone/foto — qualquer papel |
| PUT    | `/api/auth/me/password` | JWT              | Self-service: troca a própria senha informando a senha atual — qualquer papel (ver seção "Senha de usuário") |
| PUT    | `/api/auth/me/banks` | JWT                 | Self-service: substitui a lista de bancos vinculados à própria conta — qualquer papel |
| GET    | `/api/users`       | JWT+ADMIN\|FUNCIONARIO | Listagem paginada de usuários — query `page`, `limit` (default 20), `search` (nome), `sortBy` (name\|email\|phone\|role\|created_at, default created_at), `sortOrder` (asc\|desc, default asc) |
| POST   | `/api/users`       | JWT+ADMIN\|FUNCIONARIO | Cria usuário (`name`, `email`, `phone` obrigatórios; `role` opcional, default `USER`) + envia convite de definição de senha por email |
| PUT    | `/api/users/:id`   | JWT+ADMIN\|FUNCIONARIO | Atualiza nome, email e/ou telefone               |
| DELETE | `/api/users/:id`   | JWT+ADMIN\|FUNCIONARIO | Remove usuário                                   |
| PUT    | `/api/users/:id/password` | JWT+ADMIN\|FUNCIONARIO | Define diretamente uma nova senha para USER/FUNCIONARIO (usado pelo diálogo "Editar"). Nunca permitido para alvo `ADMIN` (400). Notifica o usuário por email |
| PUT    | `/api/users/:id/banks` | JWT+ADMIN\|FUNCIONARIO | Substitui a lista de bancos vinculados ao usuário gerenciado |
| POST   | `/api/auth/forgot-password` | —                | Self-service: se o email existir, envia o link de definição de senha. Resposta genérica sempre — nunca revela se o email existe |
| POST   | `/api/auth/set-password` | —                 | Consome o token do email (convite inicial ou "esqueci minha senha") e define a senha. Público — o token é a credencial |
| GET    | `/api/banks`       | JWT                    | Lista todos os bancos com os programas vinculados — qualquer papel |
| POST/PUT/DELETE | `/api/banks[/:id]` | JWT+ADMIN     | CRUD do catálogo de bancos (`name`, `logo_url` opcional) |
| GET    | `/api/loyalty-programs` | JWT              | Lista todos os programas de fidelidade de bancos com os bancos vinculados — qualquer papel |
| POST/PUT/DELETE | `/api/loyalty-programs[/:id]` | JWT+ADMIN | CRUD do catálogo de programas (`name`, `logo_url` opcional, `bankIds[]` — substitui o vínculo inteiro) |
| GET    | `/api/transfer-parities` | JWT               | Lista todas as paridades de transferência (De → Para + proporção) — qualquer papel |
| POST/PUT/DELETE | `/api/transfer-parities[/:id]` | JWT+ADMIN | CRUD da paridade (`fromProgramId`, `toProgramId`, `fromPoints`, `toPoints`) |
| GET    | `/api/public/contact` | —                    | Público: email + telefone do ADMIN mais antigo, pra Home page (nunca expõe id/nome/role) |
| POST   | `/api/leads`       | —                      | Público: captação de lead da Home page (`name`, `whatsapp`, `email`, `monthly_card_spend` obrigatórios; `trips_per_year` opcional). Persiste em `leads` e notifica `ADMIN_EMAIL` por email (best-effort) |

- Permissões finas (FUNCIONARIO nunca vê/edita/exclui/define senha do ADMIN; só ADMIN cria um ADMIN ou FUNCIONARIO) são resolvidas dentro de `users.service.ts`, não no `requireRole` do router — o router só garante "é ADMIN ou FUNCIONARIO".
- Padrão dos módulos `banks`/`loyaltyPrograms`/`transferParities`: leitura (`GET`) liberada pra qualquer papel autenticado (Team e Usuário precisam da lista pra vincular banco a si mesmo/a alguém), escrita restrita a `requireRole('ADMIN')` no router.

### Payload JWT
```json
{ "id": "uuid", "name": "string", "role": "ADMIN|FUNCIONARIO|USER", "iat": 0, "exp": 0 }
```

### Cookie JWT
- `HttpOnly: true`, `Secure: true` (prod), `SameSite: Strict`, `Max-Age: 28800` (8h)

---

## Envio de Emails (Resend)

- Todo envio de email transacional passa por `sendEmail()` em `api/src/utils/email.ts` — **nunca** instanciar `Resend` diretamente em services/controllers
- Regra: `env.nodeEnv !== 'production'` → o email é apenas **logado no console** (`[email:dev] ...`), a API do Resend não é chamada. Só em `NODE_ENV=production` o envio é real.
- **Motivo**: evitar consumir a cota gratuita do Resend durante desenvolvimento/testes locais
- Para testar o envio real fora de produção, usar o MCP do Resend (instalado via plugin oficial) ou setar `NODE_ENV=production` localmente por conta própria — nunca alterar a regra acima para "sempre enviar"
- **Ambiente local está atualmente em `NODE_ENV=production`** (decisão consciente, pra testar envio real) — lembrar que isso também ativa `Secure: true` no cookie JWT (funciona normalmente em `http://localhost` no Chrome, que trata `localhost` como origem segura) e oculta `detail` do erro nas respostas 500

### ⚠️ O SDK do Resend nunca lança exceção em erro de API

`resend.emails.send()` sempre resolve para `{ data, error }` — mesmo em 401 (chave inválida), 403 (restrição de sandbox), etc. **Nunca** ignorar esse retorno; `sendEmail()` verifica `error` e lança explicitamente, senão qualquer falha fica completamente silenciosa (sem log, sem erro, nada — foi exatamente o que aconteceu e mascarou uma chave inválida por um tempo). Ao mexer em `email.ts`, manter essa checagem.

### ⚠️ Conta Resend em modo sandbox — só envia pro próprio email da conta

Com o domínio de teste `onboarding@resend.dev`, a API do Resend só aceita enviar para o email cadastrado na própria conta Resend (`contatomundomilhas@gmail.com`) — qualquer outro destinatário retorna 403. Isso significa que, mesmo com `NODE_ENV=production` e uma `RESEND_API_KEY` válida, **criar um usuário com outro email não vai entregar o convite de verdade** até verificar um domínio próprio em resend.com/domains e trocar `RESEND_FROM_EMAIL`. Pra testar o envio real hoje, usar `contatomundomilhas@gmail.com` como destinatário (ex: fluxo de "esqueci minha senha" nesse email).

---

## Perfis de Usuário

| Papel | Rótulo na UI | Permissões |
|-------|--------------|-----------|
| `ADMIN` | "Admin" | Tudo: gerencia todos os usuários (incluindo outros ADMIN/FUNCIONARIO), único papel que pode criar uma conta `ADMIN` ou `FUNCIONARIO` |
| `FUNCIONARIO` | **"Team"** | Cadastra, edita, exclui e define a senha de qualquer usuário (`USER` ou `FUNCIONARIO`) **exceto o ADMIN** — o ADMIN é totalmente invisível para ele: não aparece na listagem, e tentar editar/excluir/definir senha por ID direto retorna 404 (não 403), pra não revelar que a conta existe. Não pode criar outro `ADMIN`/`FUNCIONARIO` (só `USER`) |
| `USER` | "Usuário" | Dashboard, perfil próprio |

- **Importante**: o rótulo visual de `FUNCIONARIO` é **"Team"** — só o texto exibido mudou (decisão de produto), o valor do enum/role continua `FUNCIONARIO` em todo o código/API/DB. Não renomear o enum.
- Sidebar mostra "Gestão de Usuários" para **ADMIN e FUNCIONARIO** (ausente do DOM para USER); só ADMIN também vê o submenu "Cadastros" (Bancos/Programas/Paridade — ver seção própria)
- Proteção dupla: frontend (`ProtectedRoute allowedRoles`) + backend (`requireRole` no router + checagem fina em `users.service.ts`)
- Quando `ProtectedRoute` bloqueia por papel (usuário autenticado mas sem `allowedRoles`), **redireciona pra `/dashboard`** — nunca mostra uma página de erro 403 solta. Isso cobre o caso de alguém cair em `/login?redirect=/usuarios` (link antigo, favorito) e ser jogado de volta pra uma tela de erro logo após logar: em vez disso, sempre volta pro dashboard, a "home" de qualquer papel autenticado
- Badge de papel na UI: Admin (âmbar) / Team (azul) / Usuário (cinza)
- No formulário "Novo Usuário", o seletor de papel (Usuário/Team/Admin) só aparece para quem está logado como ADMIN — um FUNCIONARIO logado só consegue criar contas `USER`

### Listagem de usuários — busca, paginação e scroll

- Lista pagina no backend (`page`/`limit`, default `limit=20`) — a UI nunca carrega "todos os usuários" de uma vez
- Campo de busca por nome acima da tabela, debounce de 400ms, delega a filtragem pro backend (`?search=`) — nunca filtrar só no array já carregado, porque isso quebra com listas grandes/paginadas
- Ao buscar, a paginação volta para a página 1
- A tabela tem `max-h-[60vh] overflow-y-auto` com `<thead>` `sticky` — quando a lista enche a altura disponível, ela ganha scroll interno em vez de empurrar a paginação pra fora da tela
- Colunas Nome/Email/Telefone/Papel/Data de criação são ordenáveis clicando no cabeçalho (`SortableTh`, server-side — ver seção "Ordenação e busca nas listas"); coluna "Bancos" (lista de bancos vinculados ao usuário) não é ordenável

---

## Senha de usuário — três caminhos

Existem exatamente três jeitos de uma senha ser definida/alterada. Os dois primeiros **sempre** reaproveitam a mesma infra de token — `api/src/utils/resetToken.ts` + `api/src/utils/passwordInvite.ts` (`issueSetPasswordEmail`) + `POST /auth/set-password`. **Nunca criar um quarto mecanismo** sem atualizar esta seção.

### 1. Self-service (o próprio dono da conta)

- **Cadastro**: `createUser` **não gera nem envia senha nenhuma** — a conta nasce com `password_hash: null`. É emitido um token (`issueSetPasswordEmail`) e enviado por email um link `<corsOrigin>/definir-senha?token=...` convidando a pessoa a definir a própria senha.
- **"Esqueci minha senha"**: link na tela de login (`/esqueci-senha`) → `POST /api/auth/forgot-password` → mesmo `issueSetPasswordEmail`, mas **não invalida a senha atual** (só emite um novo token; se a pessoa não completar o fluxo, a senha antiga continua funcionando). Resposta **sempre genérica**, nunca revela se o email está cadastrado — mesma lógica anti-enumeração do login.
- Ambos terminam em `POST /api/auth/set-password` (público, token é a credencial, uso único, expira em 48h) → página `/definir-senha`.
- `login()` retorna `null` (mesmo erro genérico "Credenciais inválidas") se `password_hash` for `null` — nunca revela que a conta existe mas ainda não tem senha.

### 2. Direto por ADMIN/FUNCIONARIO (alguém definindo a senha de outra pessoa)

- No diálogo "Editar Usuário" da Gestão de Usuários, campo opcional "Nova senha" — `PUT /api/users/:id/password` (`setUserPassword` em `users.service.ts`).
- **Nunca existe "visualizar" senha** — impossível por design (bcrypt é hash de mão única) e seria falha de segurança grave se fosse possível. Só existe **definir uma nova**.
- **Nunca permitido para um alvo `ADMIN`**, mesmo que o requisitante seja outro ADMIN — um admin muda a própria senha só pelo "esqueci minha senha" (caminho 1), nunca tem esse campo em si mesmo. Evita que uma sessão comprometida sequestre outra conta admin.
- Ao definir, invalida qualquer convite/token pendente (`password_reset_token_hash`/`expires_at` limpos) e **notifica o usuário por email** que a senha foi alterada — nunca silencioso.
- Campo escondido na UI quando `editUser.role === 'ADMIN'`, e bloqueado no backend independentemente do que a UI mostrar (autorização nunca só no frontend).
- Validação de tamanho mínimo (`MIN_PASSWORD_LENGTH = 8`, exportado de `api/src/utils/password.ts`) é a fonte única — usada tanto aqui quanto em `set-password`, não duplicar o número.

### 3. Self-service — o próprio usuário troca a própria senha (logado)

- Seção "Alterar Senha" dentro de "Meu Perfil" (`ProfileDialog.tsx`) — três campos: Senha Atual, Nova Senha, Confirmar Nova Senha. Disponível pra qualquer papel.
- `PUT /api/auth/me/password` (`changeMyPassword` em `auth.service.ts`) — **não usa a infra de token/email dos outros dois caminhos**, porque a identidade já é provada de outro jeito: a pessoa está autenticada (cookie JWT) *e* informa a senha atual (`comparePassword` contra o hash existente). Se a senha atual não bater, 401.
- Igual ao caminho 2: invalida qualquer convite/token pendente e notifica por email que a senha mudou.
- Diferente do caminho 2: aqui é sempre a própria pessoa alterando a própria senha (não existe "trocar a senha de outro usuário" nesse endpoint) — por isso não tem a restrição de "nunca pra ADMIN": o próprio ADMIN pode usar esse caminho para trocar a própria senha (diferente do caminho 2, onde ninguém — nem outro ADMIN — pode setar a senha de um ADMIN).

---

## Tema Dark/Light

- **Padrão**: **light mode** (mudou — era dark). `ThemeProvider.tsx` só entra em dark se `localStorage['theme'] === 'dark'` explicitamente; qualquer outro valor (ou ausente) cai em light.
- **Toggle**: dentro do menu do avatar no Header (item "Modo claro"/"Modo escuro")
- **Persistência**: `localStorage['theme']`
- **Implementação**: classe `dark` no `<html>` via ThemeProvider (presente = dark, ausente = light)
- Tailwind configurado com `darkMode: 'class'`

### Paleta — azul no light, âmbar preservado no dark

- **Light mode** (padrão): fundo branco, texto preto, **detalhes em azul** (`blue-600`/`blue-700` como acento visual — botões, ícones, bordas ativas, links). Tokens `--primary`/`--ring` em `web/src/index.css` (`:root`) foram trocados para azul (`hsl(221.2 83.2% 53.3%)`, ~ Tailwind `blue-600`) — isso propaga automaticamente pra qualquer componente que usa `bg-primary`/`text-primary`/`ring` (botões default, item ativo da Sidebar, avatar fallback etc.), sem precisar tocar em cada tela.
- **Dark mode**: **propositalmente inalterado** — continua com o acento âmbar (`amber-500`/`amber-400`) que já existia antes da mudança de paleta. O bloco `.dark` em `index.css` não foi tocado.
- **Como isso foi feito nas páginas com cor "hardcoded"** (HomePage, Login/ForgotPassword/SetPassword, Sidebar, DashboardPage — telas que usavam `amber-500` direto em vez do token `--primary`): cada classe `amber-*` virou um par `blue-*` (light) + `dark:amber-*` explícito (preserva o dark exatamente como estava). Ex.: `text-amber-500` → `text-blue-600 dark:text-amber-500`. **Ao adicionar uma cor de destaque nova em qualquer tela, seguir esse mesmo padrão de par** — nunca só trocar amber→blue sem o `dark:` de volta, ou o dark muda sem querer.
- **Exceção deliberada — não mexer**: os badges de papel de usuário em `UsersPage.tsx` (`roleBadge()`) usam `amber-100/800/300` pro Admin, `sky-100/800/300` pro Team, `slate-*` pro Usuário — isso é cor **semântica** (distingue papéis), não é o acento de marca. Não faz parte da paleta azul/âmbar e não deve ganhar par `dark:` nem ser convertido.

---

## Menu do usuário (Header) e "Meu Perfil"

- **Nome do usuário, papel e botão "Sair" não ficam na Sidebar** — vivem no canto superior direito do Header. O avatar é maior (`h-11 w-11`, era `h-8 w-8`) e o **nome + papel ficam permanentemente visíveis à esquerda do avatar**, empilhados em duas linhas alinhadas à direita (`text-right`, nome em cima / papel embaixo, ambos truncando com `max-w-[9rem]`) — mudou de "só aparece dentro do dropdown" pra "sempre visível na barra", pra ficar visualmente balanceado com o avatar maior
- Clicar no avatar (ou no bloco nome+papel) abre o dropdown — como o papel já está sempre visível na barra, o dropdown **não repete mais** nome/papel no topo (removido o `DropdownMenuLabel` redundante); vai direto pros itens
- Ordem dos itens no dropdown: **Meu Perfil** → toggle de tema → separador → **Sair**
- Sidebar tem: logo no topo + navegação (Dashboard, Gestão de Usuários quando aplicável, submenu **Cadastros** pro ADMIN — ver seção própria) — sem nenhuma seção de usuário embaixo
- **"Meu Perfil"** (`web/src/components/shared/ProfileDialog.tsx`) é self-service, qualquer papel, e hoje tem **três seções** dentro do mesmo diálogo:
  1. Dados (nome, email, telefone, foto) — `PUT /api/auth/me`
  2. **Alterar Senha** (senha atual, nova senha, confirmar) — `PUT /api/auth/me/password` (ver "Senha de usuário", caminho 3)
  3. **Meus Bancos** (`BankMultiSelect`) — `PUT /api/auth/me/banks`, autoatribuição de banco (ver seção "Catálogo de Bancos...")
- Diferente de `PUT /api/users/:id` (que é admin/Team editando OUTRA pessoa) — nunca reaproveitar um endpoint pro outro caso
- Depois de salvar qualquer seção, o contexto (`AuthContext.updateProfile()` / `changePassword()` / `updateMyBanks()`) já atualiza o `user` — não precisa de reload

### Diálogos (`Dialog`/`DialogContent`) — altura máxima + scroll interno

- `web/src/components/ui/dialog.tsx` foi corrigido pra **nunca mais estourar a viewport**: `DialogContent` é `flex flex-col max-h-[85vh]`, com um `<div>` interno `flex-1 min-h-0 overflow-y-auto` que é a única parte que rola — cabeçalho/título e o botão de fechar (X) ficam fixos, fora da área de scroll.
- **Pegadinha resolvida**: só `max-h` + `overflow-y-auto` no wrapper *não* funciona em flex/grid — o filho não encolhe sem `min-h-0` explícito (limitação conhecida do CSS flexbox). Se um diálogo novo "crescer além da tela" de novo, checar primeiro se o conteúdo tá dentro dessa estrutura padrão em vez de reinventar.
- Isso é global (afeta todo `<Dialog>` do sistema) — não precisa replicar em cada tela.

### Foto de perfil (avatar)

- Armazenada como **data URI base64** direto na coluna `avatar_url` (`String?` no schema) — não há bucket/storage externo configurado ainda (nem Supabase Storage, nem S3)
- Redimensionada no client **antes** de enviar (`web/src/lib/image.ts`, `resizeImageToDataUrl`): máx. 256px no maior lado, JPEG qualidade 0.85 — mantém o payload pequeno (dezenas de KB) mesmo a partir de uma foto de celular de vários MB
- `express.json()` tem limite elevado para `2mb` em `server.ts` só por causa disso (default do Express é 100kb) — se _outro_ tipo de payload grande aparecer, considerar uma rota dedicada em vez de subir esse limite global de novo
- Backend também limita o tamanho da string (`MAX_AVATAR_LENGTH` em `auth.service.ts`) como rede de segurança, mesmo já esperando algo pequeno do client
- Se um dia migrar pra storage de verdade (Supabase Storage, S3, etc.): só trocar o que `avatar_url` guarda (deixa de ser data URI, vira URL pública) — o resto do fluxo (campo, upload, `<AvatarImage src=...>`) não muda

---

## Sidebar — submenu "Cadastros"

- ADMIN vê um item de menu expansível **"Cadastros"** (ícone `Layers`, seta que gira ao abrir/fechar) agrupando as telas de catálogo: **Bancos**, **Programas de Fidelidade de Bancos**, **Paridade de Transferência**. Fica fechado por padrão, mas abre sozinho quando a rota atual é uma das filhas (`CADASTROS_ROUTES` em `Sidebar.tsx`) — ex.: entrar direto em `/bancos` já mostra o submenu aberto com o item ativo destacado.
- **Motivo de agrupar num submenu em vez de 3 itens soltos no menu principal**: já nasceu pensando em crescer — a ideia é que futuros catálogos (Companhias Aéreas, Programas de Fidelidade de Cia Aérea) entrem como novos itens dentro do mesmo "Cadastros", sem inflar o menu principal. Ao adicionar um catálogo novo, adicionar aqui, não como item solto.
- Rotas: `/bancos`, `/programas-fidelidade`, `/paridade-transferencia` — todas `ProtectedRoute allowedRoles={['ADMIN']}`.

---

## Catálogo de Bancos, Programas de Fidelidade e Paridade de Transferência

Feature grande adicionada depois do MVP inicial. Resumo do modelo mental: **Banco** e **Programa de Fidelidade de Banco** são catálogos globais N:N entre si (um banco pode oferecer vários programas, um programa — ex. Livelo — pode pertencer a vários bancos). Usuários se vinculam a **bancos** (não a programas diretamente). Programas podem ter **paridade de transferência** entre si (quanto de um programa vira quanto de outro).

### Permissões (padrão em todos os três módulos)

- **Leitura livre** pra qualquer papel autenticado (ADMIN, FUNCIONARIO, USER) — Team e Usuário precisam da lista de bancos pra se autoatribuir ou atribuir a alguém.
- **Escrita (criar/editar/excluir) só ADMIN**, via `requireRole('ADMIN')` no router de cada módulo (`banks`, `loyaltyPrograms`, `transferParities`).

### Bancos (`Bank`) e Programas de Fidelidade de Bancos (`LoyaltyProgram`)

- Nome **obrigatoriamente único** em ambos (`@unique` no schema; 409 se duplicado).
- Vínculo N:N via `BankLoyaltyProgram` — gerenciado **a partir da tela de Programa** (o formulário de programa tem um multi-select de bancos que substitui o vínculo inteiro a cada salvamento; a tela de Banco só mostra os programas vinculados, somente leitura ali).
- **"Programas de Fidelidade de Bancos"**, não só "Programas de Fidelidade" — nome escolhido de propósito porque no futuro vai existir um catálogo separado de programas de fidelidade de **companhias aéreas** (Smiles, LATAM Pass etc.), que não é a mesma coisa. Não misturar os dois catálogos quando essa segunda feature for implementada.
- Cada um pode ter uma **logo** (`logo_url`, data URI base64 — mesmíssimo padrão do `avatar_url`, ver seção "Foto de perfil" acima): tamanho máximo validado no backend (`MAX_LOGO_LENGTH` em `banks.service.ts`/`loyaltyPrograms.service.ts`), e no client passa por **recorte antes do upload** (`web/src/components/shared/LogoUpload.tsx` + `web/src/lib/cropImage.ts`, usando a lib `react-easy-crop` — única dependência nova instalada nesta feature). Diferente do avatar (que só redimensiona automaticamente), aqui o usuário **arrasta pra posicionar e usa um slider de zoom** pra escolher exatamente a área/tamanho da imagem antes de aplicar — resultado final limitado a 512px no lado maior, JPEG.
- Tabelas de listagem mostram uma miniatura da logo (fallback: inicial do nome, quadrado cinza) ao lado do nome.

### Vínculo usuário↔banco (`UserBank`)

- Um usuário pode ter **um ou vários bancos** vinculados à própria conta.
- Dois pontos de entrada pro mesmo relacionamento, cada um com seu endpoint:
  - **Autoatribuição** (qualquer papel, a si mesmo): seção "Meus Bancos" em "Meu Perfil" → `PUT /api/auth/me/banks`
  - **Atribuição por Admin/Team** (a um usuário gerenciado): multi-select "Bancos vinculados" no diálogo "Editar Usuário" da Gestão de Usuários → `PUT /api/users/:id/banks`, mesma regra de visibilidade do resto do módulo `users` (FUNCIONARIO nunca mexe no ADMIN)
- Ambos os endpoints **substituem a lista inteira** a cada chamada (não é incremental) — o front sempre manda o array completo de `bankIds` selecionados.

### Paridade de Transferência (`TransferParity`)

- Tela própria: "Paridade de Transferência" (`web/src/pages/private/TransferParitiesPage.tsx`), dentro do submenu Cadastros.
- Registra que **é possível transferir pontos de um programa de fidelidade pra outro**, e em qual proporção — ex.: BTG → Livelo, 1:1. **Não é algo universal**: só existe paridade entre o par que o ADMIN cadastrou explicitamente. Nunca inferir/assumir que existe transferência entre dois programas quaisquer.
- **Direcional**: uma linha De=A/Para=B não implica a volta (B→A) — se a transferência funcionar nos dois sentidos, precisa de duas linhas.
- Proporção armazenada como dois inteiros positivos (`from_points`/`to_points`, ex. `1`/`1`) em vez de um decimal único — deixa o "1:1" (ou "2:3" etc.) explícito na UI sem depender de arredondamento.
- Restrições de negócio (`transferParities.service.ts`): não pode ter paridade de um programa consigo mesmo (400); par (De, Para) é único (409 se duplicado); ambos os programas precisam existir (400 senão).
- Lista com logo dos dois programas lado a lado, seta entre eles, proporção, busca (por qualquer um dos dois nomes) e ordenação clicável (ver seção "Ordenação e busca nas listas").

### Seeds — `npm run seed:banks` e `npm run seed:parities`

- **`prisma/seedBanks.ts`** (`npm run seed:banks`): cadastra ~29 bancos que atuam no Brasil com seus respectivos programas (curadoria manual — só bancos com programa de fidelidade próprio bem estabelecido; cooperativas/bancos sem programa conhecido foram deixados de fora de propósito, pra não inventar vínculo). Livelo aparece repetido pra Banco do Brasil e Bradesco (mesmo programa, dois bancos — é assim que o N:N deve ser usado).
  - ⚠️ **Esse script TRUNCA `banks` e `loyalty_programs` inteiros antes de recriar** (`deleteMany({})` nos dois, que cascateia pra `BankLoyaltyProgram`, `UserBank` e `TransferParity`). **Nunca rodar de novo sem checar antes se algum banco/programa tem `logo_url` enviado manualmente pela UI** — rodar o seed apaga essas logos junto (aconteceu de precisar adicionar 2 bancos novos ao catálogo depois que o usuário já tinha subido logos reais pra Banco do Brasil/Bradesco; a solução foi criar os 2 bancos novos via chamada direta à API em vez de re-rodar o seed). Se precisar adicionar/ajustar um banco pontual, preferir `POST`/`PUT` direto em vez de re-seed.
- **`prisma/seedTransferParities.ts`** (`npm run seed:parities`): cadastra a lista de paridades vigente hoje (14 linhas, todas 1:1 apontando pra Livelo — C6 Átomos, BTG, BV Merece, PAN Mais, Nordeste Mais, Banestes, Sisprime, Unicred, Coopera, Safra Rewards, Nomad, Efí, XP, BRB). Também trunca (`transfer_parities`) antes de recriar — mais seguro de re-rodar porque essa tabela não guarda nada além do que o próprio seed define, mas se o ADMIN já tiver cadastrado paridades extras manualmente pela UI, elas também seriam apagadas.
  - Depende de `seed:banks` já ter rodado antes (resolve os programas por nome exato); loga um aviso e pula qualquer linha cujo programa não seja encontrado, em vez de falhar tudo.
- Essa lista de paridades **pode mudar no futuro** — o motivo de existir uma tela de CRUD além do seed é justamente permitir o ADMIN ajustar sem precisar de deploy/migration.

---

## Ordenação e busca nas listas

- Cabeçalho de coluna clicável (`web/src/components/shared/SortableTh.tsx`) em toda tela de listagem: primeiro clique ordena ascendente, segundo clique na mesma coluna inverte pra descendente, clique em outra coluna troca e reinicia em ascendente. Ícone (`ChevronUp`/`ChevronDown`/`ChevronsUpDown` do lucide-react) indica a coluna/direção ativa.
- **Gestão de Usuários**: ordenação **no servidor** (a listagem é paginada) — `GET /users?sortBy=...&sortOrder=...`, campos permitidos: `name`, `email`, `phone`, `role`, `created_at` (não dá pra ordenar pela coluna "Bancos", que é uma lista por linha, não um valor único).
- **Bancos / Programas de Fidelidade de Bancos / Paridade de Transferência**: ordenação **no client** (`Array.sort` num `useMemo`) — essas listas já vêm inteiras da API de uma vez (sem paginação), então não precisam de round-trip pra reordenar. Bancos/Programas também aceitam ordenar pela coluna de vínculos, usando a **contagem** de itens vinculados como critério (não dá pra ordenar alfabeticamente uma lista de badges).
- **Busca nas telas de Bancos e Programas**: o campo de busca casa tanto o nome da própria entidade **quanto o nome de qualquer entidade vinculada** — buscar "Bradesco" na tela de Programas encontra o Livelo (porque Livelo está vinculado ao Bradesco), e buscar "Livelo" na tela de Bancos encontra Banco do Brasil e Bradesco. Isso não é o comportamento óbvio de um filtro simples — foi um bug reportado ("o filtro não funciona") porque a primeira versão só casava o nome da própria linha; ao criar uma tela de listagem nova com relacionamento, replicar esse padrão de busca-nos-dois-lados desde o início.

---

## Home Page Pública (Landing Page)

- `web/src/pages/public/HomePage.tsx` é a página institucional/comercial (não logado) — funciona como cartão de visita pra quem chega no site, não como tela de login. O CTA principal é o formulário de lead ("Solicitar Análise de Perfil"), não "Entrar" — "Entrar" fica no nav como botão outline azul no light / âmbar no dark (visível, mas secundário) e no rodapé
- Estrutura atual: Header (logo + "Mundo Milhas"/"Gestão de Milhas" à esquerda, nav + "Entrar" à direita) → Hero (título+parágrafo à esquerda, **imagem** à direita do mesmo tamanho do bloco título+subtítulo — placeholder de vídeo do YouTube que ainda vai entrar; botões centralizados abaixo dos dois) → programas parceiros (marquee) → **Números** (imagem à esquerda + estatísticas com contagem animada empilhadas à direita) → Como Funciona (5 etapas) → **Comparativo** (tabela pareada, ver abaixo) → O que está incluso → Resultados → Formulário de lead → **FAQ** (7 perguntas, quebra de objeções — ver abaixo) → Rodapé — **não existem mais** a seção "Dores" isolada (removida; virou a coluna esquerda do Comparativo) nem a seção "Benefícios"/"Por que delegar sua gestão de milhas" (removida; array `BENEFITS` também foi deletado do código)
- Headline do hero (H1): "Acúmulo de milhas não é sorte. **É método!** E o método **é nosso** para fazer suas milhas trabalharem a seu favor." — dois trechos com destaque em gradiente (`from-blue-500 to-blue-700` no light, `dark:from-amber-400 dark:to-amber-600` no dark, `bg-clip-text text-transparent`): "É método!" e "é nosso"
- Nav: logo à esquerda, links + botão "Entrar" agrupados à direita (`ml-auto`) — não tem CTA de conversão no nav (removido "Simular Minha Economia"; a conversão principal é só via `#analise-de-perfil`)
- **Toda a página segue o padrão de par `blue-*` (light) + `dark:amber-*` (dark)** descrito na seção "Tema Dark/Light" — não é só o H1, é ícones, bordas, fundos de destaque, botões etc. Ao adicionar um elemento novo com cor de marca aqui, seguir o mesmo par.
- **Números** (`STATS` + `STATS_IMAGE`): layout `lg:grid-cols-2` — uma única foto real (Unsplash) na coluna esquerda, os 3 itens de `STATS` empilhados com divisores (`divide-y`) na coluna direita. Valores vêm diretamente do usuário/dono do negócio — diferente de "inventar" (ver regra de honestidade abaixo), aqui é conteúdo real fornecido pelo próprio negócio. Anima com `StatCounter` (contagem de 0 até o valor, `onViewportEnter` do framer-motion, easing cúbico, ~1.6s) — pula a animação e mostra o valor final direto se `prefers-reduced-motion`
- **Como Funciona** tem 5 etapas nessa ordem fixa: Onboarding Estratégico → Análise de Perfil → Acúmulo Inteligente → Emissão & Acompanhamento → Registro de Resultados. Grid `sm:grid-cols-2 lg:grid-cols-5`; conector animado (avião) calibrado pra 5 colunas (`left-[10%] right-[10%]`) — se o número de etapas mudar de novo, recalcular esses insets
- **Comparativo** (`#comparativo`) é uma tabela de linhas pareadas, não duas listas independentes: `SELF_MANAGED_CONS[i]` (coluna "Gestão Própria", ícone `XCircle`) sempre aparece na mesma linha que seu contraponto `MANAGED_PROS[i]` (coluna "Gestão Mundo Milhas", ícone `CheckCircle2`, fundo `bg-blue-600/15 dark:bg-amber-500/5` — bumped de `/5` pra `/15` no light porque ficava fraco demais pra diferenciar da coluna ao lado). **Os dois arrays precisam ter sempre o mesmo tamanho e ficar index-pareados** — ao adicionar/remover um item de dor, adicionar/remover o contraponto correspondente no mesmo índice
- Seção "Perguntas Frequentes" tem 7 perguntas focadas em quebra de objeção (não é só FAQ genérico): já ter milhas acumuladas, complexidade (resposta aponta o time de especialistas), acesso a conta/cartão, investimento, fidelidade/multa de cancelamento (contrato é anual — necessário pra desenhar a estratégia — sem multa, cancelamento só ao fim do ciclo), como comprovar economia, sem viagem prevista no momento. Conteúdo vem de decisão de negócio explícita do usuário, não inventado — se for editar, confirmar a redação com ele antes

### Regra de honestidade de conteúdo (importante ao editar essa página)

- **Nunca inventar números, depoimentos ou casos de clientes por conta própria** — a seção "Resultados" usa cenários genéricos (sem valor em R$ atribuído a um cliente real, sem nome, sem citação atribuída a alguém específico). Isso é diferente de usar números que o **usuário/dono do negócio forneceu explicitamente** (ex: a seção "Números"/`STATS`) — aí não é invenção, é conteúdo real repassado por quem manda no negócio. A regra é: nunca decidir um número/depoimento sozinho; sempre ok usar o que foi passado
- **Imagens da seção "Resultados"**: fotos reais de banco de imagens (hoje, Unsplash — licença free, uso comercial permitido, sem exigir atribuição), contendo pessoas, em `images.unsplash.com/photo-<id>?auto=format&fit=crop&w=800&q=80`. São fotos de banco (modelos/situações genéricas), **nunca** apresentadas como se fossem fotos de clientes reais da Mundo Milhas — não colocar nome/depoimento junto de nenhuma delas. Painel com `aspect-[8/3]` (metade da altura de `aspect-[4/3]`, decisão explícita do usuário) + badge de ícone no canto superior esquerdo pra manter a identidade visual da marca
- Ao trocar/adicionar foto: sempre verificar que a URL carrega (`curl -I`) antes de commitar — evitar link quebrado de CDN externo
- **Nunca prometer garantia financeira/reembolso** — decisão consciente de não incluir isso até a empresa definir formalmente os termos
- **Nunca inventar CNPJ, endereço ou dados legais da empresa** — se precisar, perguntar; não existe CNPJ na página hoje, de propósito
- Contato do rodapé é **dinâmico**, não hardcoded: `GET /api/public/contact` retorna email+telefone do `ADMIN` mais antigo (hoje email = `contatomundomilhas@gmail.com`, telefone = o que estiver cadastrado no perfil desse admin). Se precisar trocar o contato público, é só editar o perfil do admin — não mexer no código

### Captação de lead

- Formulário → `POST /api/leads` (público) → grava em `leads` **e** tenta notificar `env.adminEmail` por email (best-effort — se o email falhar, o lead já foi salvo, não perde o contato)
- Sujeito à mesma regra de `sendEmail()`: fora de produção só loga no console, não gasta cota do Resend
- Campos: `name`, `whatsapp` (validado com `isValidPhone`, mesma máscara `(DD) 9XXXX-XXXX`), `email`, `monthly_card_spend` (obrigatórios) + `trips_per_year` (opcional)

### Animação/visual (framer-motion)

- Padrão: `variants` reutilizáveis (`fadeUp`, `staggerContainer`) + componente `<Reveal>` local que faz `whileInView` com `once: true` — cada seção só anima na primeira vez que entra na viewport, não fica reanimando a cada scroll
- Elementos decorativos em loop infinito (blobs de fundo no Hero, avião animado na conectora do "Como Funciona") são **sempre condicionados a `useReducedMotion()`** — desligam completamente para quem tem "reduzir movimento" ativado no SO. Ao adicionar nova animação em loop, seguir o mesmo padrão — não deixar incondicional
- `scroll-behavior: smooth` está no `html` global (`index.css`), com fallback `auto` no mesmo media query de `prefers-reduced-motion`
- Lista de programas de fidelidade (`LOYALTY_PROGRAMS`) é um carrossel infinito (`LoyaltyMarquee`, framer-motion, array duplicado + `translateX` em loop linear) — com fallback estático (lista quebrando linha, sem animação) quando `prefers-reduced-motion` está ativo

---

## Tratamento de Erros da API

| HTTP | Situação |
|------|---------|
| 400 | Campo obrigatório ausente / regra de negócio violada |
| 401 | Token ausente/inválido/expirado / credenciais inválidas |
| 403 | Autenticado mas sem permissão |
| 404 | Recurso não encontrado |
| 409 | Email já cadastrado |
| 500 | Erro interno (nunca expõe stack em produção) |

- Mensagem de erro de autenticação sempre genérica: `"Credenciais inválidas"` (não revela qual campo)
- AppError class em `src/utils/errors.ts`: `new AppError(statusCode, message)`

---

## Testes

- Framework: **Vitest** + **fast-check** (PBT)
- API: `cd api && npm run test`
- Web: `cd web && npm run test:run`
- 70 tasks concluídas, 20 propriedades de correção implementadas (planejamento original)
- Estado atual: **82 testes na API** (12 arquivos, incluindo `banks.service.test.ts`, `loyaltyPrograms.service.test.ts`, `transferParities.service.test.ts`) e **15 testes no web** (5 arquivos) — todos passando
- Mocks de env.ts usam `vi.mock('../../src/config/env.js', ...)` antes dos imports

---

## Sprint Atual — Funcionalidades Implementadas

✅ Infraestrutura do monorepo  
✅ Schema Prisma + migração  
✅ Seed seguro do admin  
✅ Autenticação JWT (login/logout/me)  
✅ Home page pública  
✅ Página de login com validação  
✅ Dashboard com boas-vindas  
✅ Sidebar responsiva (desktop fixo, mobile overlay)  
✅ Header com toggle dark/light (padrão hoje: light — ver seção "Tema Dark/Light")  
✅ Gestão de usuários (CRUD completo para Admin)  
✅ Email de boas-vindas via Resend ao cadastrar usuário  
✅ Docker multi-stage (Dockerfile + docker-compose)  
✅ GitHub Actions CI (lint + testes em PRs)  
✅ Testes PBT com fast-check (20 propriedades)  
✅ MCP do Resend instalado no Claude Code (plugin oficial, escopo user) — autenticado via OAuth com a conta Resend do projeto, usado para envio/teste de emails e geração de templates React Email durante o desenvolvimento. Independente do `RESEND_API_KEY` usado pelo backend em runtime.
✅ Campo `user_type` (GESTAO/ASSINANTE) — tag interna preparando o terreno para assinantes, não exposta na UI
✅ Papel `FUNCIONARIO` — gerencia usuários exceto o ADMIN (invisível para ele)
✅ Campo telefone obrigatório no cadastro/edição de usuário, com máscara brasileira
✅ Busca por nome (server-side) e paginação na listagem de usuários, com scroll interno na tabela
✅ Papel `FUNCIONARIO` exibido como "Team" na UI (rótulo apenas — valor do role continua `FUNCIONARIO`)
✅ Admin pode criar outro Admin (ou Team) pelo formulário "Novo Usuário"
✅ Fluxo de convite de senha: cadastro não define senha, usuário recebe email com link para definir a própria (`/definir-senha`)
✅ "Esqueci minha senha" self-service na tela de login (`/esqueci-senha` → `POST /auth/forgot-password`), resposta sempre genérica
✅ Admin/Team define diretamente uma nova senha para Usuário/Team pelo diálogo "Editar" (`PUT /users/:id/password`), nunca para Admin — notifica por email
✅ Menu do avatar no Header (nome/papel, Meu Perfil, tema, Sair) substituindo a seção de usuário da Sidebar
✅ "Meu Perfil" self-service (nome/email/telefone/foto) para qualquer papel, com upload de foto redimensionada no client (base64 em `avatar_url`)
✅ Home page pública reescrita como landing page comercial (cartão de visita): benefícios, como funciona, comparativo, resultados ilustrativos, FAQ, formulário de lead funcional (`POST /api/leads`, salva + notifica admin por email), contato dinâmico no rodapé  
✅ Tema padrão trocado de dark para **light**; paleta de destaque em azul no light, âmbar preservado no dark (ver seção "Tema Dark/Light")  
✅ Self-service de troca de senha logado (`PUT /auth/me/password`, seção "Alterar Senha" em Meu Perfil) — terceiro caminho de senha, com verificação da senha atual  
✅ Componente `Dialog` corrigido pra nunca estourar a viewport (`max-h-[85vh]` + scroll interno, cabeçalho/fechar fixos) — correção global, vale pra todo diálogo do sistema  
✅ Catálogo de **Bancos** e **Programas de Fidelidade de Bancos** (CRUD completo pra ADMIN, N:N entre si, leitura liberada a todo papel) — com upload de logo com recorte (`react-easy-crop`)  
✅ Vínculo usuário↔banco (`UserBank`): autoatribuição em "Meu Perfil" (`PUT /auth/me/banks`) e atribuição por Admin/Team no diálogo "Editar Usuário" (`PUT /users/:id/banks`)  
✅ **Paridade de Transferência** entre programas de fidelidade (`TransferParity`) — CRUD pra ADMIN, direcional, proporção configurável (ex. 1:1), seed inicial com 14 paridades reais  
✅ Submenu "Cadastros" na Sidebar (ADMIN) agrupando Bancos / Programas de Fidelidade de Bancos / Paridade de Transferência, com auto-expansão pela rota ativa  
✅ Ordenação clicável (`SortableTh`) em toda tela de listagem — server-side em Gestão de Usuários, client-side em Bancos/Programas/Paridade  
✅ Busca nas telas de Bancos/Programas casando também o nome da entidade vinculada (banco↔programa), não só o nome da própria linha  
✅ Seeds `npm run seed:banks` (~29 bancos brasileiros + programas) e `npm run seed:parities` (14 paridades de transferência) — ambos truncam antes de recriar, ver avisos na seção própria antes de rodar de novo

---

## Próximas Sprints (não implementado ainda)

- Onboarding do usuário (formulário customizável pelo Admin)
- Área do usuário com visualização de milhas
- Regras de negócio configuráveis pelo Admin
- Gestão completa de milhas dos clientes
- Tela de "Gestão de Leads" pro Admin/Team ver e converter os leads capturados na Home page (hoje só existe a tabela `leads` + email de notificação, sem UI de listagem)
- Catálogo de **Companhias Aéreas** e **Programas de Fidelidade de Cia Aérea** (Smiles, LATAM Pass etc.) — mesmo padrão do catálogo de Bancos/Programas de hoje, entraria como novo item dentro do submenu "Cadastros" da Sidebar (ver seção própria)

---

## Convenções de Código

### API (TypeScript ESM NodeNext)
- Imports usam extensão `.js` (ex: `import { env } from './config/env.js'`)
- `env.ts` deve ser o **primeiro import** em `server.ts`
- Services lançam `AppError` — controllers capturam e retornam o statusCode correto
- `password_hash` excluído via Prisma `select` — nunca retornar ao cliente

### Frontend (React + TypeScript)
- Contextos em `src/contexts/` — hooks em `src/hooks/`
- Páginas públicas em `src/pages/public/` — privadas em `src/pages/private/`
- Componentes de layout em `src/components/layout/`
- Serviço HTTP centralizado em `src/services/api.ts` com `credentials: 'include'`
- Usar `cn()` de `src/lib/utils.ts` para classes condicionais Tailwind

### Segurança (regras invioláveis)
1. Nenhum valor hardcoded — sempre variável de ambiente
2. Senha nunca em log ou resposta HTTP
3. `password_hash` nunca retornado ao cliente
4. JWT em httpOnly cookie — nunca em localStorage
5. Stack trace nunca exposto em produção
