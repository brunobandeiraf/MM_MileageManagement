# Migrations

As migrações do banco de dados são gerenciadas pelo Prisma Migrate.

## Como aplicar as migrações

Certifique-se de que a variável de ambiente `DATABASE_URL` está configurada corretamente
no arquivo `.env` (veja `.env.example`), então execute:

```bash
npx prisma migrate deploy
```

Este comando aplica todas as migrações pendentes no banco de dados sem solicitar confirmação
— ideal para ambientes de CI/CD e produção.

## Gerando novas migrações (desenvolvimento)

Para criar uma nova migração após alterar o `schema.prisma`:

```bash
npx prisma migrate dev --name <nome-descritivo>
```

Este comando:
1. Detecta as diferenças entre o schema atual e o banco de dados
2. Gera o arquivo SQL de migração em `prisma/migrations/<timestamp>_<nome>/`
3. Aplica a migração no banco de dados local
4. Regenera o Prisma Client

## Ambiente Railway (produção)

No Railway, configure a variável `DATABASE_URL` com a connection string do Supabase e
execute `npx prisma migrate deploy` no hook de deploy ou no entrypoint do container.

## Notas

- `prisma migrate deploy` **não** requer uma conexão de banco ativa para ser incluído no repositório.
- O Prisma Client é gerado automaticamente durante o build Docker via `npx prisma generate`.
- Nunca commite o arquivo `.env` com credenciais reais — use apenas `.env.example` como referência.
