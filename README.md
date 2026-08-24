# Reporte Aqui

Plataforma para reportar problemas públicos nas cidades — como um "reclame aqui", mas para a esfera pública. Cidadãos registram problemas (com fotos/vídeos e localização), opcionalmente vinculam a uma empresa responsável, e acompanham a resolução com votos, propostas de resolução e avaliação.

## Stack

Monorepo pnpm com dois apps:

- **`apps/api`** — Express 4 + TypeScript + Prisma 5 + PostgreSQL. Autenticação via JWT (access + refresh token em cookie), upload de mídia via S3-compatible storage (Cloudflare R2).
- **`apps/web`** — React 19 + Vite + React Router 7 + TanStack Query 5 + Tailwind CSS 4.

Testes: Vitest em ambos os apps (Supertest no backend, Testing Library + MSW no frontend).

## Estrutura

```
apps/
  api/
    src/
      modules/       # auth, me, admin, companies, media, problems
      middleware/
      lib/
      config/
    prisma/           # schema.prisma e migrations
  web/
    src/
      pages/
      components/
      api/            # clientes HTTP para a API
      auth/
docs/
  superpowers/
    specs/            # design docs por feature
    plans/            # planos de implementação por feature
```

## Pré-requisitos

- Node.js 20+
- pnpm 9 (`packageManager` fixado em `pnpm@9.1.0`)
- PostgreSQL (local ou remoto)

## Setup

```bash
pnpm install
```

### API (`apps/api`)

1. Copie os arquivos de ambiente:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/api/.env.test.example apps/api/.env.test
   ```
2. Ajuste `DATABASE_URL` e os demais valores (`JWT_SECRET`, credenciais do R2 para upload de mídia).
3. Rode as migrations:
   ```bash
   pnpm --filter @reporte-aqui/api prisma:migrate
   ```
4. (Opcional) crie um usuário admin:
   ```bash
   pnpm --filter @reporte-aqui/api seed:admin
   ```
5. Suba a API:
   ```bash
   pnpm --filter @reporte-aqui/api dev
   ```
   A API sobe em `http://localhost:3000` (configurável via `PORT`).

### Web (`apps/web`)

```bash
pnpm --filter @reporte-aqui/web dev
```

O Vite faz proxy de `/api/*` para `http://localhost:3000` (veja `apps/web/vite.config.ts`), então a API precisa estar rodando em paralelo.

## Scripts principais

| Comando | Onde | O que faz |
| --- | --- | --- |
| `pnpm --filter @reporte-aqui/api dev` | API | sobe o servidor com watch (tsx) |
| `pnpm --filter @reporte-aqui/api test` | API | testes com `.env.test` |
| `pnpm --filter @reporte-aqui/api typecheck` | API | checagem de tipos |
| `pnpm --filter @reporte-aqui/api prisma:migrate` | API | aplica migrations em dev |
| `pnpm --filter @reporte-aqui/web dev` | Web | sobe o Vite dev server |
| `pnpm --filter @reporte-aqui/web test` | Web | testes com Vitest + MSW |
| `pnpm --filter @reporte-aqui/web typecheck` | Web | checagem de tipos |
| `pnpm --filter @reporte-aqui/web build` | Web | build de produção |

## Domínio

Usuários têm um papel (`UserRole`): `individual`, `company` ou `admin`. Empresas passam por verificação (`CompanyVerificationStatus`: `pending` → `approved`/`rejected`) antes de aparecerem como responsáveis selecionáveis em um problema.

Um problema (`Problem`) tem status (`ProblemStatus`): `open` → `pending_verification` → `resolved` (ou cancelado). Fluxo:

1. Usuário individual cria um problema com título, descrição, localização (com autofill por CEP via ViaCEP) e 1–5 arquivos de mídia; pode indicar uma empresa responsável.
2. Outros usuários podem votar no problema.
3. A empresa responsável (ou o autor) pode propor uma resolução (`ResolutionProposal`), que passa por aprovação de admin.
4. O autor avalia a resolução (`ProblemRating`).

Título e descrição são imutáveis após a criação por design — o fluxo é "a pessoa posta, a empresa responde", não uma edição colaborativa.

## Endpoints da API

| Rota | Descrição |
| --- | --- |
| `POST /auth/register/individual` | cadastro de pessoa física |
| `POST /auth/register/company` | cadastro de empresa |
| `POST /auth/login` / `POST /auth/refresh` / `POST /auth/logout` | sessão |
| `GET/PATCH/DELETE /me` | perfil do usuário autenticado |
| `GET /companies` | lista empresas aprovadas (para seleção de responsável) |
| `POST /media/upload-url` | URL pré-assinada para upload direto ao storage |
| `POST /problems` / `GET /problems` / `GET /problems/:id` | criar/listar/detalhar problemas |
| `POST /problems/:id/cancel` / `:id/resolve` / `:id/vote` | ações sobre um problema |
| `POST /problems/:id/resolution-proposals` / `:id/rating` | proposta e avaliação de resolução |
| `GET /admin/companies/pending` + `approve`/`reject` | moderação de cadastro de empresas |
| `GET /admin/resolution-proposals/pending` + `approve`/`reject` | moderação de propostas de resolução |

## Documentação de features

Specs de design e planos de implementação de cada feature ficam em `docs/superpowers/specs` e `docs/superpowers/plans`, nomeados por data.
