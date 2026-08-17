# Cadastro e Listagem de Problemas — Design

Data: 2026-08-17
Status: Aprovado
Depende de: [2026-08-17-arquitetura-geral-design.md](./2026-08-17-arquitetura-geral-design.md), [2026-08-17-auth-design.md](./2026-08-17-auth-design.md)

## Contexto

Segundo sub-projeto derivado da arquitetura geral, construído sobre o
subsistema de auth já implementado e mesclado em `main`. Cobre as
features de reporte de problemas urbanos do `planejamento.md`: cadastro
de problema (com mídia obrigatória), listagem/filtro na home, voto de
prioridade, cancelamento, fluxo de resolução (direta ou proposta por
terceiro com verificação de admin), e avaliação da resolução.

## Escopo

**Dentro do escopo:**
- Cadastro de problema (título, descrição, localização em texto livre,
  mídia obrigatória)
- Upload de mídia via URL pré-assinada (Cloudflare R2)
- Listagem pública com filtro por status, busca textual e ordenação
  (mais recentes / mais votados)
- Voto de prioridade (upvote, tipo "curtir")
- Cancelamento do report pelo autor
- Resolução: autor ou admin marcam diretamente; qualquer outro usuário
  autenticado (incluindo `company`) pode propor resolução com foto,
  sujeita a aprovação de admin
- Avaliação da resolução (nota 1–5 + comentário opcional)

**Fora de escopo (fica pro backlog futuro do `planejamento.md`):**
- Vínculo formal problema↔empresa e atribuição automática de empresa
  responsável
- Geolocalização (coordenadas/mapa) — localização é texto livre por ora
- Deduplicação de problemas
- Detecção de ociosidade de cadastro
- Edição de título/descrição após criação (imutável no MVP)

## Modelo de dados

```
Problem
  id             uuid, pk
  authorId       uuid, fk -> User
  title          string (5–200 chars)
  description    string (20–5000 chars)
  location       string (5–300 chars), texto livre
  status         enum: open | pending_verification | resolved | cancelled
  resolvedAt     timestamp, nullable
  resolvedById   uuid, fk -> User, nullable
  createdAt      timestamp
  updatedAt      timestamp

ProblemMedia
  id          uuid, pk
  problemId   uuid, fk -> Problem
  objectKey   string (chave no R2)
  mediaType   enum: image | video
  createdAt   timestamp

ProblemVote
  id          uuid, pk
  problemId   uuid, fk -> Problem
  userId      uuid, fk -> User
  createdAt   timestamp
  unique(problemId, userId)

ResolutionProposal
  id             uuid, pk
  problemId      uuid, fk -> Problem
  proposedById   uuid, fk -> User
  objectKey      string (foto evidência no R2)
  status         enum: pending | approved | rejected
  reviewedById   uuid, fk -> User (admin), nullable
  reviewedAt     timestamp, nullable
  createdAt      timestamp

ProblemRating
  id          uuid, pk
  problemId   uuid, fk -> Problem, unique
  ratedById   uuid, fk -> User
  score       int (1–5)
  comment     string (≤1000 chars), nullable
  createdAt   timestamp
```

Notas:
- `ProblemMedia` exige no mínimo 1 e no máximo 5 registros por `Problem`,
  todos anexados no momento da criação (mídia não pode ser
  adicionada/removida depois).
- `ProblemVote`: o autor do problema não pode votar no próprio problema.
  Um usuário tem no máximo um voto por problema (toggle: votar de novo
  remove o voto).
- `ResolutionProposal`: o autor do problema não pode propor resolução do
  próprio problema (ele usa o endpoint de resolução direta). Usuários
  `company` não têm caminho de resolução direta próprio — usam o mesmo
  fluxo de proposta de qualquer outro usuário não-autor. Só pode existir
  uma proposta com `status=pending` por vez por problema.
- `ProblemRating`: só pode ser criada quando `Problem.status = resolved`,
  por `Problem.authorId` ou por um usuário `admin`. No máximo uma por
  problema.

## Máquina de estados de `Problem`

```
open ──(autor ou admin marca resolvido)───────► resolved
open ──(terceiro/empresa propõe c/ foto)──────► pending_verification
pending_verification ──(admin aprova)─────────► resolved
pending_verification ──(admin rejeita)────────► open
open ──(autor cancela)────────────────────────► cancelled
```

`resolved` e `cancelled` são estados terminais: sem novas propostas de
resolução, sem cancelamento, sem novo voto (votos continuam contados,
mas a ação de votar fica bloqueada). Aprovar/rejeitar uma proposta seta
`ResolutionProposal.reviewedById`/`reviewedAt`; aprovar também seta
`Problem.resolvedAt`/`resolvedById` (o admin que aprovou).

## Upload de mídia (URL pré-assinada, Cloudflare R2)

1. `POST /media/upload-url` (autenticado) — corpo `{ mediaType }` →
   retorna `{ objectKey, uploadUrl }`. `objectKey` prefixada com o
   `userId` do solicitante (ex: `<userId>/<uuid>.jpg`) para impedir que
   um usuário referencie/sobrescreva a chave de outro.
2. Cliente faz `PUT` direto para `uploadUrl` no R2 (upload não passa
   pelo servidor da API).
3. Cliente referencia essa `objectKey` ao criar o problema
   (`ProblemMedia`) ou uma proposta de resolução
   (`ResolutionProposal.objectKey`).
4. O servidor não confirma ativamente que o upload aconteceu antes de
   aceitar a referência — aceitável no MVP: uma `objectKey` órfã resulta
   apenas em mídia quebrada na exibição, não é falha de segurança (a
   chave já é escopada por usuário no passo 1).

Geração de URL pré-assinada é uma operação de assinatura pura via SDK
S3-compatível, sem chamada de rede — testável sem mockar o R2 e sem
credenciais reais válidas.

## Rotas de API

```
POST   /media/upload-url                          (autenticado)

POST   /problems                                   (autenticado)
GET    /problems                                   (público)
GET    /problems/:id                                (público)
POST   /problems/:id/cancel                        (autor)
POST   /problems/:id/resolve                       (autor ou admin)
POST   /problems/:id/resolution-proposals           (autenticado, não-autor)
POST   /problems/:id/rating                         (autor ou admin)
POST   /problems/:id/vote                           (autenticado, não-autor)

GET    /admin/resolution-proposals/pending          (role: admin)
POST   /admin/resolution-proposals/:id/approve      (role: admin)
POST   /admin/resolution-proposals/:id/reject       (role: admin)
```

`GET /problems` aceita query params `status`, `q` (busca em
title/description), `sort` (`newest` padrão, ou `top` por contagem de
votos), `page`/`limit` (paginação, primeira convenção de paginação do
projeto — demais listagens futuras devem seguir o mesmo padrão).

`GET /problems/:id` inclui mídia, contagem de votos, `hasVoted` (se
autenticado) e a `ProblemRating` quando `status = resolved`. Tanto
`GET /problems` quanto `GET /problems/:id` usam autenticação opcional
(o middleware não rejeita requisição sem token; se houver token válido,
popula `hasVoted` por item — precisa de uma variante "soft" do
`requireAuth` existente, já que hoje ele sempre exige token).

## Erros e regras de acesso

- `404` — problema ou proposta de resolução inexistente.
- `403` — ação exige autor/admin e o usuário não é (`cancel`, `resolve`,
  `rating`); ou o próprio autor tentando votar ou propor resolução no
  próprio problema.
- `409` — nova proposta de resolução quando já existe uma `pending` para
  o problema; transição de estado inválida (cancelar problema já
  `resolved`/`cancelled`, avaliar problema que não está `resolved`,
  avaliar duas vezes o mesmo problema).
- `400` — validação de entrada (zod): `title` 5–200 chars, `description`
  20–5000 chars, `location` 5–300 chars, `score` inteiro 1–5, `comment`
  ≤1000 chars opcional, `mediaType` em `image|video`, 1–5 mídias por
  problema.

## Configuração nova

`env.ts` ganha as variáveis do R2, validadas via zod como as demais:
`R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
`R2_PUBLIC_URL_BASE`.

## Convenções

Segue a convenção já estabelecida: toda nomenclatura de código em
inglês (tabelas, campos, rotas, variáveis, funções, arquivos). Reusa os
middlewares `requireAuth`/`requireRole` do subsistema de auth. Testes de
integração batem no Postgres real local via `resetDb()`, mesmo padrão
já em uso.
