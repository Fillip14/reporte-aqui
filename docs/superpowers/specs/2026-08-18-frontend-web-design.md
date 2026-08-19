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

## Auth no cliente

O backend já seta o JWT via cookie httpOnly no login/refresh — o
frontend nunca guarda token em JS.

- `AuthContext` expõe `{ user, isLoading, login, logout }`. No boot do
  app, chama `GET /me`; em 401, tenta uma vez `POST /refresh` e refaz
  `GET /me`; se falhar de novo, `user = null`.
- `ProtectedRoute` redireciona pra tela de login se `user === null`
  (após `isLoading` resolver). Protege as rotas de criar problema e
  perfil. O feed e o detalhe do problema continuam públicos (a API já
  usa autenticação opcional nessas rotas), com as ações
  autenticadas ocultas/desabilitadas quando `user === null`.
- Logout chama `POST /logout`, reseta o `AuthContext` e invalida todas
  as queries do TanStack Query.
- Qualquer 401 fora do boot dispara o mesmo fluxo de refresh-uma-vez do
  client; se falhar, desloga e redireciona pro login.
- Perfil de empresa com `verificationStatus = pending` mostra um badge
  informativo — não bloqueia nenhuma ação, pois a API não bloqueia hoje
  (consistente com o gap já registrado no ledger do subsistema
  problems sobre a falta de restrição de papel na proposta de
  resolução).

## Telas / rotas

Mapeamento 1:1 com a API existente:

| Rota | Tela | API usada |
|---|---|---|
| `/registro` | Escolha individual/empresa + formulário | `POST /register/individual`, `POST /register/company` |
| `/login` | Login | `POST /login` |
| `/` | Feed de problemas (filtro de status, busca, ordenação) | `GET /problems` |
| `/problemas/:id` | Detalhe (mídia, votos, status, propostas, avaliação) | `GET /problems/:id`, `POST /:id/vote`, `POST /:id/cancel`, `POST /:id/resolve`, `POST /:id/resolution-proposals`, `POST /:id/rating` |
| `/problemas/novo` | Criar problema | `POST /media/upload-url` (+ PUT no R2) → `POST /problems` |
| `/perfil` | Ver/editar cadastro, excluir conta, logout | `GET/PATCH/DELETE /me`, `POST /logout` |

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
código em inglês (pastas, arquivos, variáveis, funções, componentes) —
só as rotas de URL (`/problemas/:id` etc.) e o texto da UI ficam em
português, por serem voltados ao usuário final.
