# Filtro de problemas por empresa responsável

## Contexto

O feed de problemas hoje só filtra por status, texto e ordenação. A spec
original do frontend (`2026-08-18-frontend-web-design.md`) deixou
explicitamente fora de escopo um "filtro por empresa", e o schema do
backend nunca teve qualquer relação entre `Problem` e `CompanyProfile` —
empresas são só um tipo de conta que pode votar, propor resolução e
(via módulo admin) ser verificada, mas não são "donas" de nenhum
problema.

Este design adiciona esse vínculo: ao reportar um problema, o autor pode
opcionalmente indicar qual empresa é responsável por resolvê-lo (ex: a
concessionária de energia, se a empresa já tiver conta cadastrada e
aprovada). O feed ganha um filtro por essa empresa.

## Escopo

- Campo opcional "empresa responsável" na criação de problema.
- Só empresas com `verificationStatus = approved` podem ser escolhidas.
- Filtro por empresa no feed (`GET /problems?companyId=`).
- Exibição do nome da empresa responsável no feed e na página de
  detalhe do problema.

**Fora de escopo:**
- Trocar a empresa responsável depois de criado o problema.
- Notificar a empresa quando for marcada como responsável.
- Empresas "reivindicarem" problemas já existentes.
- Qualquer papel especial de moderação/resolução para a empresa
  responsável (ela continua sem privilégios além dos que já tem hoje
  como conta comum — votar, propor resolução).

## Backend

### Schema (Prisma)

Novo campo em `Problem`:

```prisma
model Problem {
  // ...campos existentes...
  responsibleCompanyId String?

  responsibleCompany CompanyProfile? @relation("ProblemResponsibleCompany", fields: [responsibleCompanyId], references: [id])

  @@index([responsibleCompanyId])
}

model CompanyProfile {
  // ...campos existentes...
  responsibleForProblems Problem[] @relation("ProblemResponsibleCompany")
}
```

Nova migration via `prisma migrate dev`.

### Novo módulo `modules/companies`

Só um endpoint, público (sem `requireAuth`), pois o feed de problemas
já é navegável por visitantes não autenticados e o filtro deve
funcionar pra eles também:

- `GET /companies` — retorna empresas aprovadas: `{ id, companyName }[]`,
  ordenadas por `companyName` (`orderBy: { companyName: 'asc' }`, `where:
  { verificationStatus: 'approved' }`).

Segue o mesmo padrão dos demais módulos (`routes.ts` fino, `service.ts`
com a query Prisma).

### `problems.validation.ts`

- `createProblemSchema` ganha `responsibleCompanyId: z.string().uuid().optional()`.
- `listProblemsQuerySchema` ganha `companyId: z.string().uuid().optional()`.

### `problems.service.ts`

- Novo `export class CompanyNotFoundError extends Error {}`.
- `createProblem`: se `input.responsibleCompanyId` vier, busca a
  `CompanyProfile` por id; se não existir ou `verificationStatus !==
  'approved'`, lança `CompanyNotFoundError` (mesmo erro pros dois
  casos — não vale a pena diferenciar "não existe" de "não aprovada"
  pro cliente). Se existir, inclui `responsibleCompanyId` no
  `data` do `prisma.problem.create`.
- `listProblems`: se `query.companyId` vier, adiciona
  `responsibleCompanyId: query.companyId` ao `where`.
- Tanto `listProblems` quanto `getProblemById` passam a `include:
  { responsibleCompany: { select: { id: true, companyName: true } } }`
  e retornam esse campo tal qual (sem transformação extra, ao
  contrário de `withMediaUrls`).

### `problems.controller.ts`

- `createProblem`: novo `catch` pra `CompanyNotFoundError` → `400 {
  error: 'company_not_found' }`.

### Registro do módulo

`app.ts` ganha `app.use('/companies', companiesRouter)`.

## Frontend

### `api/companies.ts` (novo)

```ts
import { apiFetch } from './client';

export interface Company {
  id: string;
  companyName: string;
}

export function listCompanies(): Promise<Company[]> {
  return apiFetch<Company[]>('/companies');
}
```

### `api/problems.ts`

- `createProblem(input)`: `input` ganha `responsibleCompanyId?: string`.
- `listProblems(params)`: `params` ganha `companyId?: string`.
- Tipo `Problem` ganha `responsibleCompany: { id: string; companyName:
  string } | null`.

### `pages/NewProblemPage.tsx`

- `useQuery(['companies'], listCompanies)` pra popular um `<select
  id="responsibleCompanyId">` opcional, rotulado "Empresa responsável
  (opcional)", com uma primeira opção "Nenhuma" (`value=""`).
- Ao submeter, só inclui `responsibleCompanyId` no payload se um valor
  foi selecionado.

### `pages/FeedPage.tsx`

- Mesmo `useQuery(['companies'], listCompanies)`, populando um
  `<select id="companyId">` no grid de filtros existente (ao lado de
  Status/Ordenar), rotulado "Empresa", com opção "Todas" (`value=""`).
  Passa a incluir `companyId` na `queryKey`/params de `listProblems`,
  igual já é feito com `status`/`q`/`sort`.
- Cada card do feed mostra `problem.responsibleCompany.companyName`
  (texto pequeno, junto do `StatusBadge`) quando não for `null`.

### `pages/ProblemDetailPage.tsx`

- Mostra a linha "Empresa responsável: {nome}" junto de "Local:
  {location}", só quando `problem.responsibleCompany` não for `null`.

## Tratamento de erros

- Criar problema com `responsibleCompanyId` inválido/não aprovado →
  400 `company_not_found`, exibido com a mensagem genérica já usada em
  `NewProblemPage` ("Não foi possível criar o problema. Tente
  novamente.") — não precisa de mensagem específica, é um caso raro
  (só ocorre se a empresa for desaprovada entre o carregamento do
  formulário e o envio).
- Filtrar por uma `companyId` que não existe mais simplesmente retorna
  lista vazia, sem erro — mesmo comportamento que os filtros de
  `status`/`q` já têm hoje.

## Testes

**Backend:**
- `companies.routes.test.ts` (novo): retorna só empresas aprovadas,
  ordenadas por nome; exclui pendentes/rejeitadas.
- `problems.routes.test.ts` (existente, adicionar casos): criar
  problema com empresa aprovada grava `responsibleCompanyId`; criar
  com empresa inexistente ou não aprovada retorna 400; listar com
  `companyId` retorna só os problemas daquela empresa; buscar um
  problema específico inclui `responsibleCompany`.

**Frontend:**
- `NewProblemPage.test.tsx` (existente, adicionar casos): lista as
  empresas no seletor; envia `responsibleCompanyId` quando selecionado;
  envia sem o campo quando não selecionado.
- `FeedPage.test.tsx` (existente, adicionar casos): filtro de empresa
  envia `companyId` na query; card mostra o nome da empresa quando
  presente.
- `ProblemDetailPage.test.tsx` (existente, adicionar caso): mostra a
  empresa responsável quando presente.
