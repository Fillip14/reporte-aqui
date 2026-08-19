# Frontend Web (apps/web) — Design

Data: 2026-08-18
Status: Aprovado
Depende de: [2026-08-17-arquitetura-geral-design.md](./2026-08-17-arquitetura-geral-design.md), [2026-08-17-auth-design.md](./2026-08-17-auth-design.md), [2026-08-17-problems-design.md](./2026-08-17-problems-design.md)

## Contexto

Primeiro frontend do projeto. O backend (`apps/api`) está completo:
subsistemas de auth (cadastro individual/empresa, login, logout,
refresh, editar/excluir perfil) e problems (criar com mídia, listar/
filtrar, votar, cancelar, resolver, propor resolução, avaliar
resolução) implementados, testados e mesclados em `main`. A arquitetura
geral já prevê uma SPA React + Vite + TypeScript consumindo a API via
HTTPS/JSON, sem acesso direto a Postgres/R2. Este design cobre a
primeira fase do frontend: os fluxos de usuário final (`individual` e
`company`). Telas de admin ficam fora de escopo por ora — a operação
admin continua via chamada direta à API.

## Escopo

**Dentro do escopo:**
- Cadastro (individual/empresa) e login
- Feed de problemas (listar, filtrar por status, busca textual,
  ordenar recentes/mais votados)
- Detalhe do problema, com ações condicionais: votar, cancelar,
  resolver, propor resolução, avaliar resolução
- Criação de problema, com upload de mídia via URL pré-assinada
- Perfil: ver/editar dados cadastrais, excluir conta, logout

**Fora de escopo (fica pro backlog):**
- Telas de admin (aprovar empresa, moderar propostas de resolução)
- Deploy real (Render ou outro) — este design cobre só o app buildável
  estaticamente, não a publicação
- Geolocalização/mapa, filtro por empresa, deduplicação — já fora de
  escopo no backend também
- Testes E2E, PWA/offline, i18n (interface só em português)

## Stack

- **Vite + React + TypeScript**, novo pacote `apps/web` no workspace
  pnpm, ao lado de `apps/api`.
- **Roteamento:** React Router.
- **Dados/API:** TanStack Query sobre um client `fetch` fino que já
  injeta `credentials: 'include'` e centraliza o tratamento de erro da
  API.
- **Estilo:** Tailwind CSS.
- **Testes:** Vitest + Testing Library + MSW (mock da API nos testes de
  componente), mesmo stack de teste do `apps/api`.
- **Dev server ↔ API:** a API (`apps/api`) não tem CORS configurado
  hoje. Em vez de mexer no backend já revisado/mesclado, o Vite dev
  server faz proxy de `/api/*` para `http://localhost:3000/*`
  (removendo o prefixo `/api` no proxy), deixando toda chamada do
  frontend same-origin do ponto de vista do navegador. O client de API
  usa `/api` como base path. Esse prefixo também evita colisão entre
  as rotas da API (`/problems`) e as rotas de UI do React Router
  (`/problems/:id`).

## Auth no cliente

O backend usa **Bearer token**: login/register/refresh retornam um
`accessToken` de curta duração no corpo da resposta (não em cookie), e
todo endpoint autenticado exige `Authorization: Bearer <accessToken>`.
Só o **refresh token** vai em cookie httpOnly (setado pelo servidor em
login/register/refresh, lido só por `POST /refresh`). Ou seja: o
access token precisa viver em memória no cliente (nunca em
`localStorage`, pra reduzir exposição a XSS) — a única coisa que o
frontend nunca toca diretamente é o refresh token.

- O client de API (`src/api/client.ts`) guarda o access token atual
  numa variável de módulo (`let currentAccessToken`) com um setter
  exportado (`setAccessToken`); toda chamada autenticada lê essa
  variável pra montar o header `Authorization`.
- `AuthContext` expõe `{ user, isLoading, login, logout }`. No boot do
  app (a memória do access token não sobrevive a um reload de página),
  chama `POST /refresh` (cookie httpOnly enviado automaticamente pelo
  navegador via `credentials: 'include'`); em caso de sucesso, guarda
  `user` + `accessToken` (via `setAccessToken`); em caso de falha
  (sem cookie válido), `user = null`.
- `ProtectedRoute` redireciona pra tela de login se `user === null`
  (após `isLoading` resolver). Protege as rotas de criar problema e
  perfil. O feed e o detalhe do problema continuam públicos (a API já
  usa autenticação opcional nessas rotas), com as ações
  autenticadas ocultas/desabilitadas quando `user === null`.
- Login/registro chamam o endpoint correspondente (sem `Authorization`
  — ainda não há sessão), guardam `user` + `accessToken` no sucesso.
- Logout chama `POST /logout` (usa o cookie de refresh, não exige
  `Authorization`), limpa o access token em memória, reseta o
  `AuthContext` e invalida todas as queries do TanStack Query.
- Qualquer 401 numa chamada autenticada (fora do boot) dispara uma
  única tentativa de `POST /refresh`; se der certo, repete a chamada
  original com o novo access token; se falhar, desloga e redireciona
  pro login.
- Perfil de empresa com `verificationStatus = pending` mostra um badge
  informativo — não bloqueia nenhuma ação, pois a API não bloqueia hoje
  (consistente com o gap já registrado no ledger do subsistema
  problems sobre a falta de restrição de papel na proposta de
  resolução).

## Telas / rotas

Mapeamento 1:1 com a API existente:

| Rota | Tela | API usada |
|---|---|---|
| `/register` | Escolha individual/empresa + formulário | `POST /register/individual`, `POST /register/company` |
| `/login` | Login | `POST /login` |
| `/` | Feed de problemas (filtro de status, busca, ordenação) | `GET /problems` |
| `/problems/:id` | Detalhe (mídia, votos, status, propostas, avaliação) | `GET /problems/:id`, `POST /:id/vote`, `POST /:id/cancel`, `POST /:id/resolve`, `POST /:id/resolution-proposals`, `POST /:id/rating` |
| `/problems/new` | Criar problema | `POST /media/upload-url` (+ PUT no R2) → `POST /problems` |
| `/profile` | Ver/editar cadastro, excluir conta, logout | `GET/PATCH/DELETE /me`, `POST /logout` |

Regras de exibição condicional na tela de detalhe (derivadas do modelo
já definido em `2026-08-17-problems-design.md`):
- **Votar**: qualquer autenticado, exceto o autor do problema.
- **Cancelar**: só o autor, quando `status` ∈ `{open, pending_verification}`.
- **Resolver**: só o autor, quando `status = open`.
- **Propor resolução**: autenticado não-autor, quando `status = open`.
- **Avaliar resolução**: só o autor, quando `status = resolved`.

## Fluxo de upload de mídia

1. Usuário seleciona arquivo(s) no formulário de criar problema.
2. Front chama `POST /media/upload-url` (autenticado) por arquivo →
   recebe `{ objectKey, uploadUrl }`.
3. Front faz `PUT` direto pra `uploadUrl` no R2 — upload não passa pela
   API.
4. Front acumula os `objectKey`s confirmados e só então envia
   `POST /problems` com `title/description/location/media`.
5. Erro de upload (rede, tipo de arquivo) bloqueia o submit com
   mensagem inline; sem retry automático no MVP.

## Testes

Vitest + Testing Library para os fluxos críticos: registro/login,
criação de problema (com mock do upload de mídia), e as ações
condicionais da tela de detalhe (votar/cancelar/resolver/propor/
avaliar aparecendo/sumindo conforme `user`/`status`). MSW mocka a API
nos testes de componente — sem bater na API real.

## Convenções

Segue a convenção já estabelecida no projeto: toda nomenclatura de
código em inglês (pastas, arquivos, variáveis, funções, componentes,
rotas de URL). Só o texto da UI (labels, mensagens) fica em português,
por ser voltado ao usuário final.
