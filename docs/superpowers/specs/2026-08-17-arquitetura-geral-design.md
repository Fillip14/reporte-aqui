# Arquitetura Geral — Site de Reporte de Problemas Urbanos

Data: 2026-08-17
Status: Aprovado (arquitetura geral)

## Contexto

Site inspirado no Reclame Aqui, mas voltado a problemas urbanos/públicos.
Usuários (pessoa física ou empresa/órgão responsável) reportam problemas,
acompanham resolução, avaliam o resultado e priorizam via votação.

Referências de produto consideradas: Colab.re (Brasil, mais próximo),
FixMyStreet (roteamento automático pro responsável), SeeClickFix/311 apps
(pipeline de status mais pesado).

O `planejamento.md` na raiz do projeto lista o backlog de features completo.
Este documento cobre apenas a arquitetura geral que vai sustentar esses
subsistemas — cada subsistema (auth, perfil empresa, cadastro de problemas,
resolução/avaliação, votação) recebe seu próprio spec depois, começando por
auth já que é pré-requisito dos demais.

## Decisões de escopo

- Plataforma: web app responsivo (navegador, desktop e mobile). App nativo
  fica fora de escopo por enquanto.
- Produção real desde o início (não é projeto descartável/estudo).
- "Empresa" = entidade responsável por resolver um problema (concessionária,
  órgão público, prefeitura), não um tipo qualquer de usuário. Problemas
  podem ser atribuídos a uma empresa responsável.
- Cadastro de empresa: auto-cadastro com verificação (fica pendente até ser
  verificada antes de poder atuar como responsável por problemas).

## Visão geral do sistema

```
[React SPA (Vite)] --HTTPS/JSON--> [API Node/TS (Express+TS)] --SQL--> [Postgres]
                                          |
                                          +--presigned URL--> [Cloudflare R2 (mídia)]
```

- O frontend nunca acessa Postgres ou R2 diretamente — tudo passa pela API.
- Upload de mídia usa URL pré-assinada: o frontend pede à API uma URL
  temporária de upload, envia o arquivo direto pro R2, e apenas a URL final
  fica salva no Postgres. Evita que a API vire gargalo de banda.
- Auth via JWT: API emite token no login; frontend guarda (cookie httpOnly)
  e envia em cada request; rotas autenticadas são verificadas por middleware
  na API.

## Stack

| Camada | Escolha | Motivo |
|---|---|---|
| Backend | Node.js + TypeScript + Express | Simples, maduro, muita documentação |
| ORM | Prisma | Boa DX com TS, migrations versionadas, bom encaixe com Postgres |
| Banco | PostgreSQL (gerenciado no Railway/Render) | Relacional, encaixa bem no domínio (usuários, problemas, relações N:N de voto) |
| Frontend | React + Vite + TypeScript | Padrão, rápido, SPA simples |
| Data fetching | TanStack Query | Cache/refetch de chamadas à API sem reinventar |
| Storage de mídia | Cloudflare R2 (S3-compatível) | Free tier generoso, sem custo de egress |
| Auth | JWT + bcrypt (implementação própria) | Controle total do fluxo de verificação de empresa e dos dois tipos de conta |
| Deploy | Railway/Render | PaaS simples, Postgres gerenciado incluso |

## Estrutura do monorepo

```
reporte-aqui-2/
├── apps/
│   ├── api/          # Express + TS + Prisma
│   └── web/           # React + Vite + TS
├── packages/
│   └── shared/         # Tipos TS compartilhados (ex: shape de Problem, User, enums de status)
├── pnpm-workspace.yaml
└── docker-compose.yml    # Postgres local para dev
```

Monorepo com pnpm workspaces, monolito modular: um único serviço de API,
um único banco. Compartilha tipos TS entre `api` e `web` via
`packages/shared`, evitando duplicar contratos de API. Estrutura permite
separar em serviços menores no futuro caso necessário, mas isso é
premature optimization no estágio atual.

Alternativas consideradas e descartadas: repositórios separados para
api/web (perde compartilhamento de tipos sem ganho real de isolamento);
separar auth como microsserviço à parte desde já (complexidade
operacional desnecessária para o volume atual de features/usuários).

## Modelo de dados (alto nível)

Entidades e relações — campos detalhados de cada uma ficam para o spec de
cada sub-projeto (auth, problemas, etc.):

- **User** — conta de autenticação (email, senha, `type`: `individual` |
  `company`, `verified`)
- **IndividualProfile** — 1:1 com User quando `type = individual`
- **CompanyProfile** — 1:1 com User quando `type = company` (nome, CNPJ,
  status de verificação)
- **Problem** — reportado por um User; opcionalmente atribuído a uma
  CompanyProfile responsável; tem status (aberto/resolvido/não
  resolvido/cancelado)
- **Media** — N:1 com Problem, URL aponta pro R2
- **Vote** — N:N entre User e Problem (up/down), usado pra priorização
- **Rating** — avaliação da resolução, vinculada a Problem (feita pelo
  autor do report)

```
User 1--1 IndividualProfile
User 1--1 CompanyProfile
User 1--N Problem (reporter)
CompanyProfile 1--N Problem (responsible, opcional)
Problem 1--N Media
Problem N--N User (via Vote)
Problem 1--N Rating
```

## Deploy

- `apps/api` → serviço Railway/Render, conectado ao Postgres gerenciado
- `apps/web` → build estático (Vite), servido como static site (Render
  Static Site / Cloudflare Pages)
- Variáveis de ambiente (DB URL, JWT secret, credenciais R2) via painel do
  provedor, nunca commitadas
- CI simples: lint + typecheck + testes antes de cada deploy

## Convenções de código

Toda nomenclatura de código — variáveis, funções, arquivos, pastas,
tabelas/colunas do banco, rotas de API, tipos — em **inglês**. Documentos
de planejamento/specs podem continuar em português.

## Próximos passos

Os subsistemas do `planejamento.md` viram specs próprios, cada um
encaixando neste esqueleto:

1. Autenticação e cadastro (User, IndividualProfile, CompanyProfile, JWT,
   rotas autenticadas) — pré-requisito dos demais
2. Perfil empresa (verificação, edição)
3. Cadastro e listagem de problemas (Problem, Media, filtros)
4. Resolução e avaliação (status, Rating)
5. Votação (Vote, priorização)
