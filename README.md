# Mundo Milhas — Mileage Management System

Sistema de gestão de milhas de alto padrão que permite a uma empresa administrar clientes, regras de negócio e solicitações relacionadas a programas de milhas aéreas.

---

## Overview

O sistema é composto por duas aplicações independentes dentro deste monorepo:

| Aplicação | Tecnologias | Hospedagem |
|-----------|-------------|------------|
| **API** (`/api`) | Node.js · Express · Prisma ORM · PostgreSQL | Railway |
| **Web** (`/web`) | React · Vite · Tailwind CSS · shadcn/ui | Vercel |

O banco de dados PostgreSQL é provisionado pelo **Supabase**.

---

## Folder Structure

```
MM_MileageManagement/
├── api/                    # Backend — REST API (Node.js + Express + Prisma)
│   ├── src/
│   ├── prisma/
│   ├── tests/
│   ├── Dockerfile
│   └── README.md           # API-specific docs
│
├── web/                    # Frontend — React application
│   ├── src/
│   ├── public/
│   └── README.md           # Web-specific docs
│
├── docker-compose.yml      # Run API locally via Docker
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI (lint + tests on PRs)
└── README.md               # This file
```

---

## Getting Started

Refer to each application's README for full setup instructions:

- [API — `/api/README.md`](./api/README.md)
- [Web — `/web/README.md`](./web/README.md)

### Quick start (Docker)

```bash
# Copy environment variables for the API
cp api/.env.example api/.env
# Edit api/.env with your actual values, then:
docker compose up
```

The API will be available at `http://localhost:3000`.

---

## CI/CD

Pull requests targeting `main` automatically trigger GitHub Actions checks:

- **API job**: installs dependencies, runs lint and unit/property-based tests
- **Web job**: installs dependencies, runs lint and unit/property-based tests

Both jobs must exit with code 0 for a PR to be considered approved.

---

## Requirements

- Node.js 20+
- Docker and Docker Compose (for containerised local development)
- A PostgreSQL database (Supabase recommended)
