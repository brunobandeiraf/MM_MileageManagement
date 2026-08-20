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
