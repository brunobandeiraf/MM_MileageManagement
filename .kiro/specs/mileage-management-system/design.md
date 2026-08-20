# Documento de Design Técnico — Mundo Milhas

## Overview

O **Mundo Milhas** é um sistema de gestão de milhas de alto padrão composto por duas aplicações independentes:

- **API** (`/api`): serviço REST construído em Node.js + Express + Prisma ORM, containerizado com Docker e hospedado no Railway.
- **Web** (`/web`): aplicação React com Tailwind CSS + shadcn/ui, hospedada na Vercel.
- **Banco de Dados**: PostgreSQL provisionado pelo Supabase.

Esta sprint entrega a infraestrutura base do projeto: autenticação JWT, páginas públicas, dashboard inicial, sidebar responsiva com suporte a dark/light mode, e CRUD de usuários pelo administrador, incluindo envio de email transacional via Resend.

---

## Architecture

```mermaid
graph TD
    subgraph "Cliente (Vercel)"
        Browser["Navegador do Usuário"]
        Web["React App\n(Tailwind + shadcn/ui)"]
    end

    subgraph "Servidor (Railway)"
        API["Express API\n(Node.js + Prisma)"]
        Docker["Docker Container\n(multi-stage, alpine, non-root)"]
    end

    subgraph "Serviços Externos"
        Supabase["PostgreSQL\n(Supabase)"]
        Resend["Resend\n(Email Transacional)"]
        GHA["GitHub Actions\n(CI/CD)"]
    end

    Browser --> Web
    Web -->|"REST (HTTPS)\nJWT via httpOnly cookie"| API
    API --> Docker
    API -->|"Prisma ORM"| Supabase
    API -->|"HTTP API"| Resend
    GHA -->|"lint + tests em PRs"| API
    GHA -->|"lint + tests em PRs"| Web
```

### Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant B as Navegador
    participant W as Web (React)
    participant A as API (Express)
    participant DB as PostgreSQL

    B->>W: Acessa /login
    W->>B: Renderiza formulário de login
    B->>W: Submete email + senha
    W->>A: POST /api/auth/login
    A->>DB: SELECT user WHERE email = ?
    DB-->>A: User row
    A->>A: bcrypt.compare(senha, hash)
    A-->>W: 200 + Set-Cookie: token=JWT; HttpOnly; Secure
    W->>B: Redireciona para /dashboard
```

### Estrutura de Pastas

#### `/api` — Backend

```
/api
├── src/
│   ├── config/
│   │   └── env.ts              # Carrega e valida variáveis de ambiente
│   ├── lib/
│   │   └── prisma.ts           # Singleton do PrismaClient
│   ├── middleware/
│   │   ├── auth.middleware.ts  # Valida JWT (Bearer token)
│   │   └── requireRole.ts      # Valida papel (ADMIN, USER)
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.router.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── auth.service.ts
│   │   └── users/
│   │       ├── users.router.ts
│   │       ├── users.controller.ts
│   │       └── users.service.ts
│   ├── utils/
│   │   ├── password.ts         # Funções de hash/compare
│   │   ├── token.ts            # Funções de sign/verify JWT
│   │   └── tempPassword.ts     # Gerador de senha temporária
│   └── server.ts               # Entry point Express
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── tests/
│   ├── unit/
│   │   ├── password.test.ts
│   │   ├── token.test.ts
│   │   ├── tempPassword.test.ts
│   │   └── users.service.test.ts
│   └── setup.ts
├── Dockerfile
├── .dockerignore
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

#### `/web` — Frontend

```
/web
├── src/
│   ├── components/
│   │   ├── ui/                    # Componentes shadcn/ui (gerados)
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx      # Layout wrapper (Sidebar + Header + main)
│   │   │   ├── Sidebar.tsx        # Menu lateral responsivo
│   │   │   └── Header.tsx         # Barra superior com toggle de tema e info do user
│   │   └── shared/
│   │       ├── ProtectedRoute.tsx # Guard de rota privada
│   │       └── ThemeProvider.tsx  # Contexto de tema dark/light
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Estado de autenticação global
│   │   └── ThemeContext.tsx       # Estado do tema global
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useTheme.ts
│   ├── pages/
│   │   ├── public/
│   │   │   ├── HomePage.tsx
│   │   │   └── LoginPage.tsx
│   │   └── private/
│   │       ├── DashboardPage.tsx
│   │       └── UsersPage.tsx
│   ├── services/
│   │   └── api.ts                 # Cliente HTTP (fetch wrapper com cookie)
│   ├── lib/
│   │   └── utils.ts               # Utilitários (cn, formatadores)
│   ├── App.tsx                    # Definição de rotas (React Router v6)
│   └── main.tsx
├── public/
├── .env.example
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

---

## Components and Interfaces

### API REST

#### Base URL

```
https://api.mundomilhas.com.br/api
```

Em desenvolvimento: `http://localhost:3000/api`

#### Endpoints

**Autenticação**

| Método | Rota             | Auth | Descrição                               |
|--------|------------------|------|-----------------------------------------|
| POST   | `/auth/login`    | ✗    | Autentica usuário, retorna JWT em cookie |
| POST   | `/auth/logout`   | JWT  | Limpa o httpOnly cookie                 |
| GET    | `/auth/me`       | JWT  | Retorna dados do usuário autenticado    |

**Usuários (somente ADMIN)**

| Método | Rota             | Auth       | Descrição                                |
|--------|------------------|------------|------------------------------------------|
| GET    | `/users`         | JWT+ADMIN  | Lista usuários (paginado, máx 100/página)|
| POST   | `/users`         | JWT+ADMIN  | Cria usuário + envia email boas-vindas   |
| PUT    | `/users/:id`     | JWT+ADMIN  | Atualiza nome e/ou email                 |
| DELETE | `/users/:id`     | JWT+ADMIN  | Remove usuário (exceto último admin)     |

#### Request/Response Shapes

**`POST /auth/login`**

Request:
```json
{
  "email": "admin@mundomilhas.com.br",
  "password": "senha123"
}
```

Response 200:
```json
{
  "user": {
    "id": "uuid-v4",
    "name": "Administrador",
    "role": "ADMIN"
  }
}
```
Header: `Set-Cookie: token=<JWT>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=28800`

Response 401: `{ "error": "Credenciais inválidas" }`

Response 400: `{ "error": "Campos obrigatórios ausentes", "fields": ["email", "password"] }`

---

**`GET /users?page=1&limit=100`**

Response 200:
```json
{
  "data": [
    {
      "id": "uuid-v4",
      "name": "João Silva",
      "email": "joao@mundomilhas.com.br",
      "role": "USER",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1
  }
}
```

---

**`POST /users`**

Request:
```json
{
  "name": "Maria Souza",
  "email": "maria@exemplo.com"
}
```

Response 201:
```json
{
  "id": "uuid-v4",
  "name": "Maria Souza",
  "email": "maria@exemplo.com",
  "role": "USER",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

> `password_hash` e `Temporary_Password` **nunca** aparecem na resposta.

Response 409: `{ "error": "Email já cadastrado" }`

Response 400: `{ "error": "Campos obrigatórios ausentes", "fields": ["name"] }`

---

**`PUT /users/:id`**

Request:
```json
{
  "name": "Maria Souza Atualizada",
  "email": "maria.nova@exemplo.com"
}
```

Response 200: objeto do usuário atualizado (sem `password_hash`)

Response 404: `{ "error": "Usuário não encontrado" }`

Response 409: `{ "error": "Email já cadastrado" }`

---

**`DELETE /users/:id`**

Response 200: `{ "message": "Usuário removido com sucesso" }`

Response 400: `{ "error": "Não é possível excluir o único administrador do sistema" }`

Response 404: `{ "error": "Usuário não encontrado" }`

---

### Componentes React Principais

#### `ThemeProvider`

```mermaid
graph LR
    ThemeProvider -->|"provê"| ThemeContext
    ThemeContext -->|"className dark/light"| HtmlRoot
    ThemeContext -->|"persiste"| localStorage
    Header -->|"useTheme()"| ThemeContext
```

Responsabilidades:
1. Lê preferência de `localStorage['theme']` na inicialização
2. Aplica classe `dark` ou `light` no `<html>`
3. Provê `{ theme, toggleTheme }` via contexto
4. Padrão: `'dark'` quando nenhuma preferência existir

#### `AuthContext`

```mermaid
graph LR
    AuthContext -->|"provê"| AuthState
    AuthState -->|"user, isLoading"| ProtectedRoute
    AuthState -->|"login(), logout()"| LoginPage
    ProtectedRoute -->|"redireciona se não autenticado"| LoginPage
```

Responsabilidades:
1. `GET /api/auth/me` na inicialização (valida cookie existente)
2. Provê `{ user, isLoading, login, logout }`
3. `login()` chama `POST /auth/login` e atualiza estado
4. `logout()` chama `POST /auth/logout` e limpa estado

#### `ProtectedRoute`

```typescript
// Props: { children, requiredRole? }
// Comportamento:
// - isLoading → exibe spinner
// - !user → redirect /login?redirect=<currentPath>
// - requiredRole && user.role !== requiredRole → exibe 403
// - Caso contrário → renderiza children
```

#### `AppLayout`

```mermaid
graph TB
    AppLayout --> Sidebar
    AppLayout --> main
    main --> Header
    main --> Outlet["Outlet (conteúdo da página)"]
    Sidebar -->|"open state"| SidebarToggle
```

Layout wrapper para todas as páginas autenticadas. Gerencia estado de abertura/fechamento da sidebar para responsividade. Usa React Router `<Outlet />` para injetar o conteúdo de cada página.

#### `Sidebar` — Comportamento por Estado

| Estado | Comportamento |
|--------|---------------|
| Desktop (≥768px) | Sempre visível, fixada à esquerda |
| Mobile (<768px) | Recolhida por padrão, toggle via botão hambúrguer |
| Item ativo | Destaque visual com cor de acento do design system |
| Papel ADMIN | Exibe item "Gestão de Usuários" (`/usuarios`) |
| Papel USER | Item "Gestão de Usuários" omitido do DOM |

#### `Header` — Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  [≡ Toggle Mobile]   Mundo Milhas       [Nome · Papel]  [🌙/☀]  │
└──────────────────────────────────────────────────────────────────┘
```

### Gerenciamento de Estado

A aplicação utiliza **Context API nativo do React** — suficiente para o escopo desta sprint.

| Contexto | Dados gerenciados | Persistência |
|----------|-------------------|--------------|
| `AuthContext` | `user`, `isLoading`, `login()`, `logout()` | Cookie httpOnly (gerenciado pelo servidor) |
| `ThemeContext` | `theme` (`'dark'` \| `'light'`), `toggleTheme()` | `localStorage['theme']` |

**Decisão de design:** Zustand ou Redux seriam over-engineering para esta sprint. A Context API com `useReducer` cobre os casos de uso sem custo adicional.

---

### Configuração Docker

#### `Dockerfile` (multi-stage)

```dockerfile
# /api/Dockerfile

# ─── Estágio 1: Builder ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Instala todas as dependências (incluindo devDeps para build)
RUN npm ci

COPY . .

# Gera o Prisma Client e compila TypeScript
RUN npx prisma generate
RUN npm run build

# ─── Estágio 2: Runner ────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Usuário não-root para segurança
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
COPY prisma ./prisma/

# Somente dependências de produção
RUN npm ci --omit=dev && npx prisma generate

# Copia artefatos compilados do estágio builder
COPY --from=builder /app/dist ./dist

# Ajusta propriedade dos arquivos
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE ${PORT:-3000}

CMD ["node", "dist/server.js"]
```

#### `.dockerignore`

```
node_modules/
dist/
.env
.env.*
*.log
logs/
coverage/
tests/
*.test.ts
*.spec.ts
.git/
.github/
README.md
```

#### `docker-compose.yml` (raiz do repositório)

```yaml
version: '3.9'

services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    env_file:
      - ./api/.env
    ports:
      - "${PORT:-3000}:${PORT:-3000}"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:${PORT:-3000}/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
```

> Nenhuma variável de ambiente possui valor hardcoded. Todos os valores provêm de `./api/.env`.

---

### Variáveis de Ambiente

#### `/api/.env.example`

```dotenv
# Servidor
NODE_ENV="development"
PORT="3000"

# Banco de Dados (Supabase PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"

# JWT
JWT_SECRET="seu-segredo-jwt-aqui-minimo-32-caracteres"

# Seed do Administrador
ADMIN_EMAIL="admin@mundomilhas.com.br"
ADMIN_PASSWORD="senha-forte-do-admin"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@mundomilhas.com.br"
```

#### `/web/.env.example`

```dotenv
# URL base da API (sem barra final)
VITE_API_URL="http://localhost:3000/api"
```

#### Validação na Inicialização da API

```typescript
// src/config/env.ts
const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
];

for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    console.error(`[FATAL] Variável de ambiente obrigatória ausente: ${varName}`);
    process.exit(1);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  resendApiKey: process.env.RESEND_API_KEY!,
  resendFromEmail: process.env.RESEND_FROM_EMAIL!,
  adminEmail: process.env.ADMIN_EMAIL,
  adminPassword: process.env.ADMIN_PASSWORD,
};
```

---

### CI/CD com GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  api:
    name: API — Lint & Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: api/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run test

  web:
    name: Web — Lint & Tests
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: web/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run test
```

---

## Data Models

### Schema Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  ADMIN
  USER
}

model User {
  id            String   @id @default(uuid())
  name          String   @db.VarChar(255)
  email         String   @unique @db.VarChar(255)
  password_hash String
  role          Role     @default(USER)
  created_at    DateTime @default(now()) @db.Timestamptz
  updated_at    DateTime @updatedAt @db.Timestamptz

  @@map("users")
}
```

> - `uuid()` gera UUIDs v4 em nível de aplicação (compatível com Supabase).
> - `@updatedAt` garante atualização automática do `updated_at` a cada `update`.
> - `@unique` em `email` é aplicado no banco, garantindo integridade em operações concorrentes.

### Estrutura do JWT Payload

```json
{
  "id": "uuid-v4",
  "name": "Administrador",
  "role": "ADMIN",
  "iat": 1705312200,
  "exp": 1705340400
}
```

### Configuração do Cookie JWT

| Atributo   | Valor    | Justificativa                               |
|------------|----------|---------------------------------------------|
| HttpOnly   | `true`   | Inacessível via JavaScript (mitigação XSS)  |
| Secure     | `true`   | Somente via HTTPS em produção               |
| SameSite   | `Strict` | Proteção contra CSRF                        |
| Path       | `/`      | Válido para toda a aplicação                |
| Max-Age    | `28800`  | 8 horas em segundos                         |

> Em desenvolvimento local, `Secure` é desativado quando `NODE_ENV !== "production"`.

---

## Correctness Properties

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas de um sistema — essencialmente, uma declaração formal sobre o que o software deve fazer. As propriedades servem como ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquina.*

As propriedades abaixo foram derivadas dos critérios de aceitação dos 12 requisitos via análise de prework. Para cada critério foi avaliado se testa lógica do nosso código (não serviços externos), se o comportamento varia com diferentes inputs, e se 100 iterações encontrariam mais bugs que 2-3.

Critérios de infraestrutura Docker, estrutura de pastas, arquivos de configuração e comportamentos visuais puramente estéticos foram classificados como SMOKE/INTEGRATION e não geram propriedades PBT.

Após identificar todas as propriedades candidatas, foi realizada **reflexão de propriedades** para eliminar redundâncias: 4.3 foi absorvido por 2.3; 4.5 foi consolidado com 2.6; 7.4 foi consolidado com 5.4; 10.5 e 10.6 foram consolidados com 10.3; 8.3 e 11.3 foram consolidados em uma única propriedade de layout; 9.3 e 9.4 foram consolidados em uma propriedade de toggle.

---

### Property 1: Variáveis de ambiente obrigatórias são validadas na inicialização

*Para qualquer* subconjunto das variáveis de ambiente obrigatórias que esteja ausente, a função de validação de ambiente deve encerrar o processo com uma mensagem que identifique pelo nome exato a variável ausente, sem processar nenhuma requisição.

**Validates: Requirements 2.2**

---

### Property 2: Hash de senha tem formato bcrypt com custo mínimo 10

*Para qualquer* string de senha válida (entre 1 e 72 caracteres), a função `hashPassword` deve produzir um hash no formato bcrypt (`$2b$10$...`) com fator de custo maior ou igual a 10, e o hash jamais deve ser igual à senha original em texto plano.

**Validates: Requirements 2.3, 4.3**

---

### Property 3: Validação de variáveis obrigatórias do seed

*Para qualquer* combinação de ausência de `ADMIN_EMAIL` e/ou `ADMIN_PASSWORD` (variável ausente, string vazia ou indefinida), o script de seed deve encerrar sem criar nenhum registro no banco, emitindo uma mensagem de erro que identifica exatamente qual variável está ausente.

**Validates: Requirements 2.6, 4.5**

---

### Property 4: Idempotência do seed — ausência de duplicatas de admin

*Para qualquer* número N de execuções consecutivas do script de seed (N ≥ 1), ao final deve existir exatamente 1 registro de administrador com o email `ADMIN_EMAIL` no banco de dados, independentemente de N.

**Validates: Requirements 4.1, 4.2**

---

### Property 5: JWT de login contém claims corretos

*Para qualquer* usuário válido cadastrado no banco, ao efetuar login com as credenciais corretas, o JWT retornado deve conter no payload exatamente os campos `id`, `name` e `role` com os valores correspondentes ao registro do usuário, e o campo `exp` deve corresponder a exatamente 8 horas a partir do momento de emissão (`iat`).

**Validates: Requirements 5.1**

---

### Property 6: Uniformidade da mensagem de erro de autenticação

*Para qualquer* combinação de credenciais inválidas (email não cadastrado, senha incorreta para email existente, ou variações de capitalização), a resposta da API deve ser sempre HTTP 401 com o corpo `{ "error": "Credenciais inválidas" }`, sem vazar qual campo está errado.

**Validates: Requirements 5.2**

---

### Property 7: Tokens inválidos são universalmente rejeitados com 401

*Para qualquer* token inválido — incluindo tokens expirados, tokens com assinatura adulterada, tokens com payload modificado, strings arbitrárias formatadas como Bearer, e ausência total do cabeçalho — qualquer endpoint protegido deve retornar HTTP 401 sem executar a lógica do handler.

**Validates: Requirements 5.4, 5.7, 7.4**

---

### Property 8: Campos obrigatórios ausentes retornam 400 com identificação

*Para qualquer* subconjunto de campos obrigatórios ausentes em requisições de login (`email`, `password`) ou de criação de usuário (`name`, `email`), a API deve retornar HTTP 400 com a lista dos campos ausentes identificados pelo nome, sem processar a requisição nem criar registros.

**Validates: Requirements 5.6, 10.9**

---

### Property 9: Redirecionamento de visitante não autenticado preserva rota destino

*Para qualquer* rota privada da aplicação web tentada por um visitante sem JWT válido, o redirecionamento deve enviar para `/login` com o parâmetro `redirect` contendo exatamente a rota original tentada, sem alteração, truncamento ou codificação incorreta.

**Validates: Requirements 7.1, 11.4**

---

### Property 10: Controle de acesso por papel — endpoints de admin rejeitam papel USER

*Para qualquer* usuário autenticado com papel `USER` e *para qualquer* endpoint exclusivo de administrador (`POST /users`, `PUT /users/:id`, `DELETE /users/:id`, `GET /users`), a API deve retornar HTTP 403 com a mensagem `"Acesso não autorizado"` sem executar a lógica do handler.

**Validates: Requirements 7.2**

---

### Property 11: Sidebar e header exibem dados do usuário autenticado corretamente

*Para qualquer* usuário autenticado (independentemente de nome, papel ou presença de caracteres especiais no nome), o componente `Sidebar` deve exibir o nome do usuário na seção inferior com a label de papel correspondente (`Admin` para `ADMIN`, `Usuário` para `USER`), e o `Header` deve exibir as mesmas informações de forma consistente.

**Validates: Requirements 8.3, 11.3**

---

### Property 12: Destaque visual do item ativo na Sidebar é exclusivo

*Para qualquer* rota ativa da área logada, o componente `Sidebar` deve aplicar classe CSS de destaque (active state) exclusivamente ao item de navegação correspondente àquela rota, e todos os demais itens devem estar sem destaque.

**Validates: Requirements 8.5**

---

### Property 13: Visibilidade de "Gestão de Usuários" é determinada pelo papel

*Para qualquer* usuário com papel `ADMIN`, o item de navegação "Gestão de Usuários" deve estar presente na `Sidebar`. *Para qualquer* usuário com papel `USER`, esse item deve estar completamente ausente da `Sidebar` (não apenas oculto via CSS).

**Validates: Requirements 8.7**

---

### Property 14: Toggle de tema alterna corretamente e persiste no localStorage

*Para qualquer* sequência de N acionamentos do toggle de tema (N ≥ 1), o estado do tema aplicado na interface e o valor armazenado em `localStorage['theme']` devem ser sempre idênticos, e o tema deve alternar entre `'dark'` e `'light'` a cada acionamento sem recarregar a página.

**Validates: Requirements 9.3, 9.4**

---

### Property 15: Listagem de usuários nunca expõe password_hash

*Para qualquer* conjunto de usuários cadastrados no banco (incluindo conjuntos vazios, com 1 ou com múltiplos usuários), a resposta do endpoint `GET /users` não deve conter o campo `password_hash` em nenhum objeto da lista retornada.

**Validates: Requirements 10.1**

---

### Property 16: Senha temporária gerada atende formato obrigatório

*Para qualquer* invocação da função `generateTempPassword`, a string retornada deve ter comprimento entre 8 e 16 caracteres, conter pelo menos 1 letra e pelo menos 1 dígito, e não deve corresponder ao hash bcrypt (deve ser texto plano, adequado para envio por email antes de ser hashada).

**Validates: Requirements 10.2**

---

### Property 17: Unicidade de email é preservada em criação e atualização

*Para qualquer* tentativa de criar um usuário com um email já existente no banco, ou de atualizar o email de um usuário para um email já utilizado por outro usuário, a API deve retornar HTTP 409 com a mensagem `"Email já cadastrado"` sem criar ou modificar nenhum registro.

**Validates: Requirements 10.5, 10.6**

---

### Property 18: Invariante de pelo menos um administrador no sistema

*Para qualquer* estado do banco onde existe exatamente 1 usuário com papel `ADMIN`, uma requisição de exclusão desse usuário deve ser rejeitada com HTTP 400 e a mensagem `"Não é possível excluir o único administrador do sistema"`, sem remover o registro.

**Validates: Requirements 10.7**

---

### Property 19: Operações em IDs inexistentes retornam 404

*Para qualquer* UUID sintaticamente válido que não corresponda a nenhum registro existente no banco, as operações `PUT /users/:id` e `DELETE /users/:id` devem retornar HTTP 404 com a mensagem `"Usuário não encontrado"`, sem modificar o banco de dados.

**Validates: Requirements 10.8**

---

### Property 20: Mensagem de boas-vindas contém o nome do usuário autenticado

*Para qualquer* usuário autenticado (independentemente do valor do campo `name`), a página `/dashboard` deve renderizar uma mensagem de boas-vindas que contenha exatamente o valor do campo `name` daquele usuário como substring.

**Validates: Requirements 11.1**

---

## Error Handling

### Tabela de Códigos de Resposta

| Código HTTP | Situação | Exemplo de mensagem |
|-------------|----------|---------------------|
| 400 | Campo obrigatório ausente / regra de negócio violada | `"Campos obrigatórios ausentes"`, `"Não é possível excluir o único administrador"` |
| 401 | Token ausente, inválido ou expirado / credenciais inválidas | `"Credenciais inválidas"`, `"Token não fornecido"` |
| 403 | Usuário autenticado sem permissão para o recurso | `"Acesso não autorizado"` |
| 404 | Recurso não encontrado pelo ID | `"Usuário não encontrado"` |
| 409 | Conflito de unicidade | `"Email já cadastrado"` |
| 500 | Erro interno não tratado | `"Erro interno do servidor"` |

### Camadas de Tratamento na API

| Camada | Mecanismo | Responsabilidade |
|--------|-----------|------------------|
| Validação de entrada | Middleware de validação (Zod) | Campos obrigatórios e formatos |
| Autenticação | `auth.middleware.ts` | Valida JWT antes de qualquer handler |
| Autorização | `requireRole.ts` | Valida papel do usuário autenticado |
| Negócio | Service layer | Regras de unicidade, invariantes de integridade |
| Recurso não encontrado | Service layer | IDs inexistentes |
| Erro interno | Global error handler | Exceções não tratadas, sem expor stack trace |

### Global Error Handler

```typescript
// Registrado como último middleware em server.ts
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const isDev = env.nodeEnv === 'development';
  // Nunca expõe stack trace em produção
  console.error(`[ERROR] ${err.message}`);
  res.status(500).json({
    error: 'Erro interno do servidor',
    ...(isDev && { detail: err.message }),
  });
});
```

**Regras de segurança aplicadas:**
- Stack traces nunca são expostos em produção
- Senhas, tokens e chaves API nunca aparecem em logs ou respostas HTTP
- Mensagens de erro de autenticação são genéricas (não revelam qual campo está errado)

---

## Testing Strategy

### Abordagem Dual

A estratégia combina **testes unitários com exemplos específicos** e **testes baseados em propriedades (PBT)** para cobertura complementar:

- **Testes unitários**: casos concretos, edge cases, pontos de integração entre camadas
- **Testes de propriedade**: verificação de invariantes universais com inputs gerados aleatoriamente (mínimo 100 iterações cada)

### Framework e Bibliotecas

| Ambiente | Framework | PBT Library |
|----------|-----------|-------------|
| API (Node.js) | Vitest | `fast-check` |
| Web (React) | Vitest + Testing Library | `fast-check` |

### Arquivos de Teste

```
/api/tests/unit/
├── password.test.ts          # hashPassword, comparePassword, custo bcrypt
├── token.test.ts             # signToken, verifyToken, expiração
├── tempPassword.test.ts      # generateTempPassword, formato e comprimento
└── users.service.test.ts     # createUser, deleteUser, updateUser (mocks Prisma)

/web/src/
├── components/layout/__tests__/
│   ├── Sidebar.test.tsx
│   └── Header.test.tsx
├── components/shared/__tests__/
│   └── ProtectedRoute.test.tsx
└── contexts/__tests__/
    ├── AuthContext.test.tsx
    └── ThemeContext.test.tsx
```

### Configuração de Propriedades PBT

```typescript
// Cada propriedade usa mínimo 100 iterações
// Tag format: Feature: mileage-management-system, Property N: <texto>

import fc from 'fast-check';
import { describe, it, expect } from 'vitest';

describe('Property 2: Hash de senha tem formato bcrypt com custo mínimo 10', () => {
  it('para qualquer senha válida, hash deve ter formato bcrypt e custo >= 10', async () => {
    // Feature: mileage-management-system, Property 2: Hash de senha bcrypt custo 10
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 72 }),
        async (password) => {
          const hash = await hashPassword(password);
          expect(hash).not.toBe(password);
          expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
          const cost = parseInt(hash.split('$')[2], 10);
          expect(cost).toBeGreaterThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Cobertura por Camada

| Camada | Tipo de teste | Propriedades cobertas |
|--------|---------------|----------------------|
| `password.ts` (utils) | PBT | Prop 2 (hash bcrypt) |
| `token.ts` (utils) | PBT + Unitário | Prop 5 (claims JWT), Prop 7 (tokens inválidos) |
| `tempPassword.ts` (utils) | PBT | Prop 16 (formato senha temporária) |
| `env.ts` (config) | PBT | Prop 1 (vars ausentes), Prop 3 (vars do seed) |
| `users.service.ts` | PBT + Unitário | Prop 8, 15, 17, 18, 19 |
| `seed.ts` | PBT | Prop 4 (idempotência) |
| `auth.service.ts` | PBT + Unitário | Prop 5, 6 |
| `Sidebar.tsx` | PBT (RTL) | Prop 11, 12, 13 |
| `Header.tsx` | PBT (RTL) | Prop 11 |
| `ThemeContext.tsx` | PBT (RTL) | Prop 14 |
| `ProtectedRoute.tsx` | PBT (RTL) | Prop 9, 10 |
| `DashboardPage.tsx` | PBT (RTL) | Prop 20 |

### Testes de Integração e Smoke

Testes fora do escopo de PBT são cobertos como:

- **Smoke**: estrutura de pastas, arquivos `.env.example`, configuração Docker, schema Prisma aplicado, acessibilidade WCAG (axe-core)
- **Integração**: endpoints da API com banco de dados real (ambiente de CI com Postgres em Docker)

### Comandos de Teste

```bash
# API
cd api && npm test          # Vitest em modo watch (desenvolvimento)
cd api && npm run test:run  # Vitest single-run (CI)

# Web
cd web && npm test          # Vitest em modo watch (desenvolvimento)
cd web && npm run test:run  # Vitest single-run (CI)
```
