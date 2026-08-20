# Mundo Milhas — Web

Aplicação frontend do sistema **Mundo Milhas**, construída com React + TypeScript + Vite, Tailwind CSS e shadcn/ui. Hospedada na Vercel.

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) v20 ou superior
- [npm](https://www.npmjs.com/) v10 ou superior

---

## Instalação

```bash
# Na pasta /web
npm install
```

---

## Configuração de Variáveis de Ambiente

Copie o arquivo `.env.example` e preencha com os valores do ambiente:

```bash
cp .env.example .env
```

| Variável        | Descrição                                      | Exemplo                          |
|-----------------|------------------------------------------------|----------------------------------|
| `VITE_API_URL`  | URL base da API (sem barra final)              | `http://localhost:3000/api`      |

> Todas as variáveis de ambiente expostas ao frontend devem ter o prefixo `VITE_`.

---

## Executando localmente

```bash
# Inicia o servidor de desenvolvimento com hot reload
npm run dev
```

A aplicação ficará disponível em `http://localhost:5173` por padrão.

Para gerar um build de produção:

```bash
npm run build
npm run preview  # Serve o build localmente para inspeção
```

---

## Executando testes

```bash
# Roda os testes em modo watch (desenvolvimento)
npm test

# Roda os testes uma única vez e encerra (CI/CD)
npm run test:run

# Roda os testes com cobertura de código
npm run test:run -- --coverage
```

---

## Lint

```bash
npm run lint
```
