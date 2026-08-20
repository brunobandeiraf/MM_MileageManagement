# Mundo Milhas — API

API REST do sistema **Mundo Milhas**, construída com Node.js + Express + Prisma ORM, containerizada com Docker e projetada para deploy no Railway.

---

## Pré-requisitos

- [Node.js 20 LTS](https://nodejs.org/en/download) ou superior
- [npm 10+](https://www.npmjs.com/) (incluso com Node.js 20)
- [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/) (para execução via container)
- Acesso a uma instância PostgreSQL (ex: [Supabase](https://supabase.com/))
- Conta no [Resend](https://resend.com/) para envio de emails transacionais

---

## Instalação

1. **Clone o repositório e acesse a pasta da API:**

   ```bash
   git clone https://github.com/seu-usuario/mm-mileage-management.git
   cd mm-mileage-management/api
   ```

2. **Instale as dependências:**

   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente** (veja a seção abaixo).

4. **Execute as migrações do banco de dados:**

   ```bash
   npx prisma migrate deploy
   ```

5. **(Opcional) Popule o banco com o usuário administrador inicial:**

   ```bash
   npm run seed
   ```

---

## Configuração de Variáveis de Ambiente

1. Copie o arquivo de exemplo:

   ```bash
   cp .env.example .env
   ```

2. Abra `.env` e preencha cada variável com os valores reais do seu ambiente:

   | Variável           | Descrição                                                                 | Obrigatória |
   |--------------------|---------------------------------------------------------------------------|-------------|
   | `NODE_ENV`         | Ambiente de execução: `development`, `production` ou `test`               | Não         |
   | `PORT`             | Porta em que a API irá escutar (padrão: `3000`)                           | Não         |
   | `DATABASE_URL`     | String de conexão PostgreSQL (Supabase) com `sslmode=require`             | **Sim**     |
   | `JWT_SECRET`       | Secret para assinatura JWT — mínimo 32 caracteres aleatórios              | **Sim**     |
   | `ADMIN_EMAIL`      | Email do administrador criado pelo seed                                   | Seed only   |
   | `ADMIN_PASSWORD`   | Senha do administrador criado pelo seed                                   | Seed only   |
   | `RESEND_API_KEY`   | Chave de API do Resend (`re_...`)                                         | **Sim**     |
   | `RESEND_FROM_EMAIL`| Endereço de email remetente verificado no Resend                          | **Sim**     |

   > **Importante:** o arquivo `.env` nunca deve ser commitado no repositório. Ele já está incluído no `.gitignore`.

3. **Gere um JWT_SECRET seguro** com o seguinte comando:

   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

---

## Executando Localmente

### Modo desenvolvimento (com hot-reload)

```bash
npm run dev
```

A API estará disponível em `http://localhost:3000/api`.

### Build de produção

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## Executando Testes

### Todos os testes (unitários + PBT)

```bash
npm test
```

### Com relatório de cobertura

```bash
npm run test:coverage
```

O relatório de cobertura HTML é gerado em `coverage/index.html`.

### Executando em modo watch durante o desenvolvimento

```bash
npx vitest
```

---

## Uso com Docker

### Pré-requisito

Certifique-se de que o arquivo `/api/.env` existe e está configurado corretamente antes de iniciar os containers.

### Construir a imagem localmente

```bash
# A partir da pasta /api
docker build -t mm-mileage-api .

# Ou a partir da raiz do repositório
docker build -t mm-mileage-api ./api
```

### Iniciar o ambiente completo com Docker Compose

Execute a partir da raiz do repositório:

```bash
docker compose up
```

Para rodar em background:

```bash
docker compose up -d
```

Para parar os containers:

```bash
docker compose down
```

### Verificar os logs da API

```bash
docker compose logs -f api
```

### Executar migrações dentro do container

```bash
docker compose exec api npx prisma migrate deploy
```

### Executar o seed dentro do container

```bash
docker compose exec api npm run seed
```

---

## Estrutura do Projeto

```
api/
├── src/
│   ├── config/
│   │   └── env.ts              # Validação e exportação de variáveis de ambiente
│   ├── lib/
│   │   └── prisma.ts           # Singleton do PrismaClient
│   ├── middleware/
│   │   ├── auth.middleware.ts  # Validação de JWT
│   │   └── requireRole.ts      # Controle de acesso por papel
│   ├── modules/
│   │   ├── auth/               # Login, logout, /me
│   │   └── users/              # CRUD de usuários (apenas ADMIN)
│   ├── utils/
│   │   ├── password.ts         # hashPassword, comparePassword
│   │   ├── token.ts            # signToken, verifyToken
│   │   └── tempPassword.ts     # generateTempPassword
│   └── server.ts               # Entry point Express
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
│   ├── unit/                   # Testes unitários e PBT
│   └── setup.ts
├── .env.example
├── Dockerfile
├── .dockerignore
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## Endpoints

| Método | Rota                | Auth       | Descrição                              |
|--------|---------------------|------------|----------------------------------------|
| POST   | `/api/auth/login`   | —          | Autenticação, retorna JWT em cookie    |
| POST   | `/api/auth/logout`  | JWT        | Encerra sessão, limpa cookie           |
| GET    | `/api/auth/me`      | JWT        | Dados do usuário autenticado           |
| GET    | `/api/users`        | JWT+ADMIN  | Listagem paginada de usuários          |
| POST   | `/api/users`        | JWT+ADMIN  | Cria usuário e envia email boas-vindas |
| PUT    | `/api/users/:id`    | JWT+ADMIN  | Atualiza nome e/ou email               |
| DELETE | `/api/users/:id`    | JWT+ADMIN  | Remove usuário                         |
| GET    | `/api/health`       | —          | Health check                           |
