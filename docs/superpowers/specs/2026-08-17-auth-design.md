# Auth e Cadastro — Design

Data: 2026-08-17
Status: Aprovado
Depende de: [2026-08-17-arquitetura-geral-design.md](./2026-08-17-arquitetura-geral-design.md)

## Contexto

Primeiro sub-projeto derivado da arquitetura geral. Cobre as features de
autenticação e gestão de conta do `planejamento.md`: cadastro (individual/
empresa), login, logout, edição de dados cadastrais, exclusão de conta,
rotas autenticadas, e verificação de conta empresa.

## Escopo

**Dentro do escopo:**
- Cadastro de usuário individual e empresa
- Login / logout
- Editar dados cadastrais
- Excluir usuário (soft delete + anonimização)
- Rotas autenticadas (middleware de auth)
- Verificação de conta empresa por admin

**Fora de escopo (revisar depois se necessário):**
- Verificação de email
- "Esqueci minha senha" / reset de senha
- Login social (Google, etc.)

## Papéis (roles)

- `individual` — pessoa física, reporta problemas
- `company` — entidade responsável por resolver problemas (concessionária,
  órgão público, prefeitura), sujeita a verificação
- `admin` — administrador da plataforma; aprova/rejeita empresas. Sem
  auto-cadastro — criado via script de seed.

## Modelo de dados

```
User
  id            uuid, pk
  email         string, unique
  passwordHash  string
  role          enum: individual | company | admin
  status        enum: active | deleted
  createdAt     timestamp
  updatedAt     timestamp

IndividualProfile
  id        uuid, pk
  userId    uuid, fk -> User, unique
  fullName  string

CompanyProfile
  id                  uuid, pk
  userId              uuid, fk -> User, unique
  companyName         string
  cnpj                string, unique
  verificationStatus  enum: pending | approved | rejected
  verifiedAt          timestamp, nullable
  verifiedBy          uuid, fk -> User (admin), nullable
  rejectionReason     string, nullable

RefreshToken
  id          uuid, pk
  userId      uuid, fk -> User
  tokenHash   string
  expiresAt   timestamp
  createdAt   timestamp
  revokedAt   timestamp, nullable
```

Notas:
- Empresa só pode ser atribuída como responsável por um problema quando
  `CompanyProfile.verificationStatus = approved`. Antes disso a conta
  existe e pode logar, mas fica em estado "aguardando verificação".
- Trocar o CNPJ de uma empresa já aprovada reseta `verificationStatus`
  para `pending` (precisa reverificar).

## Exclusão de conta (soft delete + anonimização)

Ao excluir:
- `User.status = deleted`
- `User.email` reescrito para `deleted-<id>@removed.local`
- `User.passwordHash` invalidado (impossibilita novo login)
- `IndividualProfile.fullName` → `"Usuário removido"` (ou
  `CompanyProfile.companyName` → `"Empresa removida"`)
- Todos os `RefreshToken` do usuário revogados

Problemas reportados/geridos pela conta permanecem visíveis publicamente,
com o autor exibido como removido. Motivo: preservar o histórico público
de interesse coletivo (problemas urbanos reportados) mesmo após exclusão
da conta, alinhado ao direito ao esquecimento sem apagar registro de
interesse coletivo.

## Sessão: access token + refresh token

- **Access token**: JWT, vida curta (15 min), usado no header
  `Authorization` de cada request autenticada.
- **Refresh token**: token opaco, vida longa (30 dias), guardado
  hasheado em `RefreshToken.tokenHash`, entregue ao cliente como cookie
  httpOnly + secure + sameSite=strict.
- **Refresh**: troca um refresh token válido por um novo access token;
  rotaciona o refresh token (revoga o antigo, emite um novo) a cada uso,
  reduzindo risco de replay.
- **Logout**: revoga (`revokedAt`) o refresh token atual no banco — torna
  a sessão de fato inválida, não apenas cosmético.

Alternativas descartadas: JWT único de vida longa sem refresh (logout
viraria cosmético); sessão tradicional com store no Postgres/Redis
(contraria a escolha de JWT stateless já feita na arquitetura geral e
adiciona consulta ao banco em toda request).

## Fluxos

- **Cadastro individual** → cria `User(role=individual)` +
  `IndividualProfile`, ativo imediatamente, login liberado.
- **Cadastro empresa** → cria `User(role=company)` +
  `CompanyProfile(verificationStatus=pending)`. Login funciona, mas conta
  fica sinalizada como pendente.
- **Aprovação de empresa (admin)** → lista contas pendentes, aprova ou
  rejeita com motivo.
- **Login** → valida email+senha (bcrypt), emite access token + refresh
  token.
- **Refresh** → ver seção de sessão acima.
- **Logout** → revoga refresh token atual.
- **Editar dados cadastrais** → atualiza `IndividualProfile`/
  `CompanyProfile`; troca de CNPJ de empresa aprovada volta status para
  `pending`.
- **Excluir conta** → soft delete + anonimização; revoga todos os
  refresh tokens do usuário.

## Rotas de API

```
POST   /auth/register/individual
POST   /auth/register/company
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /me
PATCH  /me
DELETE /me

GET    /admin/companies/pending      (role: admin)
POST   /admin/companies/:id/approve  (role: admin)
POST   /admin/companies/:id/reject   (role: admin)
```

Middleware `requireAuth` valida o access token em toda rota autenticada;
`requireRole(role)` restringe rotas de admin.

## Segurança

- Senhas: bcrypt (cost 12), mínimo 8 caracteres.
- Rate limiting em `/auth/login` e `/auth/register/*` (por IP) contra
  brute-force.
- Refresh token nunca exposto ao JS do frontend (cookie httpOnly +
  secure + sameSite=strict).
- Validação de entrada (formato de email, CNPJ) na API antes de tocar o
  banco.

## Convenções

Segue a convenção da arquitetura geral: toda nomenclatura de código em
inglês (nomes de tabelas, campos, rotas, variáveis, funções, arquivos).
