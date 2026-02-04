# Prisma Schema e NestJS – Guia de Implementacao

Este documento contem o **schema Prisma** completo e a **estrutura de modulos NestJS** para implementar o backend alinhado ao contrato frontend (doc 01-contrato-frontend-backend.md) e a api-specification.md.

**Escopo atual:** O modulo financeiro (dashboard, balanco, relatorios, fluxo de caixa) sera feito depois. Nao implementar endpoints de Dashboard, Balanco nem Relatorios por enquanto; o front segue com mock nessas telas.

---

## 1. Pre-requisitos

- Node.js 18+
- PostgreSQL 14+
- Conta e projeto configurados (npm/yarn/pnpm)

---

## 2. Schema Prisma Completo

Crie o arquivo `prisma/schema.prisma` com o conteudo abaixo. Ajuste `provider` e `url` conforme seu ambiente.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ========== MULTI-TENANCY ==========

model Tenant {
  id           String   @id @default(uuid())
  name         String   // Razao social
  nomeFantasia String?
  cnpj         String?  @unique
  email        String?
  telefone     String?
  endereco     String?
  responsavel  String?
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  users    User[]
  lojas    Loja[]
  socios   Socio[]
  despesas Despesa[]
  parcelamentos Parcelamento[]
  receitas Receita[]
  investimentos  Investimento[]
  fornecedores   Fornecedor[]
  movimentacoesSocios MovimentacaoSocio[]
  lembretes Lembrete[]
  configuracoes ConfiguracaoUsuario[]
}

// ========== USUARIOS E AUTH ==========

model User {
  id            String   @id @default(uuid())
  tenantId      String?
  nome          String
  email         String   @unique
  passwordHash  String
  telefone      String?
  cpf           String?
  role          String   @default("user") // super_admin, admin, manager, user
  isSuperAdmin  Boolean  @default(false)
  isActive      Boolean  @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tenant        Tenant?  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userLojas     UserLoja[]
  configuracoes ConfiguracaoUsuario[]

  @@index([tenantId])
}

model UserLoja {
  userId String
  lojaId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  loja   Loja @relation(fields: [lojaId], references: [id], onDelete: Cascade)

  @@id([userId, lojaId])
}

model RefreshToken {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

// ========== LOJAS ==========

model Loja {
  id           String   @id @default(uuid())
  tenantId     String
  cnpj         String
  razaoSocial  String
  nomeFantasia String
  apelido      String
  observacoes  String?
  isAtiva      Boolean  @default(true)
  isMatriz     Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  userLojas    UserLoja[]

  endereco     EnderecoLoja?
  contato      ContatoLoja?
  responsavel  ResponsavelLoja?

  despesas     Despesa[]
  parcelamentos Parcelamento[]
  receitas     Receita[]
  investimentos Investimento[]
  movimentacoesSocios MovimentacaoSocio[]

  @@unique([tenantId, nomeFantasia])
  @@index([tenantId])
}

// Embed ou tabelas separadas para endereco/contato/responsavel da loja
// Prisma nao suporta embed em PostgreSQL para JSON; use Json ou tabelas 1:1

model EnderecoLoja {
  id         String  @id @default(uuid())
  lojaId     String  @unique
  cep        String
  tipoLogradouro String
  logradouro String
  numero     String
  complemento String?
  bairro     String
  cidade    String
  uf        String

  loja Loja @relation(fields: [lojaId], references: [id], onDelete: Cascade)
}

model ContatoLoja {
  id                String  @id @default(uuid())
  lojaId            String  @unique
  telefonePrincipal String?
  whatsapp          String?
  emailPrincipal    String
  emailFinanceiro   String?

  loja Loja @relation(fields: [lojaId], references: [id], onDelete: Cascade)
}

model ResponsavelLoja {
  id       String @id @default(uuid())
  lojaId   String @unique
  nome     String
  cpf      String
  whatsapp String
  email    String

  loja Loja @relation(fields: [lojaId], references: [id], onDelete: Cascade)
}

// ========== DESPESAS ==========

model Despesa {
  id              String   @id @default(uuid())
  tenantId        String
  lojaId          String?
  categoria       String   // despesa-fixa, despesa-extra, etc.
  data            DateTime @db.Date
  tipo            String   // ALUGUEL, LUZ, ...
  descricao       String
  valor           Decimal  @db.Decimal(15, 2)
  comunicarAgenda Boolean  @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  loja   Loja?  @relation(fields: [lojaId], references: [id], onDelete: SetNull)

  @@index([tenantId, data])
  @@index([categoria])
}

// ========== PARCELAMENTOS ==========

model Parcelamento {
  id        String   @id @default(uuid())
  tenantId  String
  lojaId    String?
  data      DateTime @db.Date
  descricao String
  parcela   String   // "3/12"
  valor     Decimal  @db.Decimal(15, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  loja   Loja?  @relation(fields: [lojaId], references: [id], onDelete: SetNull)

  @@index([tenantId, data])
}

// ========== RECEITAS (RENDA EXTRA) ==========

model Receita {
  id        String   @id @default(uuid())
  tenantId  String
  lojaId    String?
  data      DateTime @db.Date
  tipo      String
  descricao String
  valor     Decimal  @db.Decimal(15, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  loja   Loja?  @relation(fields: [lojaId], references: [id], onDelete: SetNull)

  @@index([tenantId, data])
}

// ========== INVESTIMENTOS ==========

model Investimento {
  id        String   @id @default(uuid())
  tenantId  String
  lojaId    String?
  data      DateTime @db.Date
  tipo      String
  descricao String
  valor     Decimal  @db.Decimal(15, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  loja   Loja?  @relation(fields: [lojaId], references: [id], onDelete: SetNull)

  @@index([tenantId, data])
}

// ========== SOCIOS ==========

model Socio {
  id                   String   @id @default(uuid())
  tenantId             String
  nome                 String
  cpf                  String
  percentualSociedade  Decimal  @db.Decimal(5, 2)
  isAtivo              Boolean  @default(true)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  tenant        Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  movimentacoes MovimentacaoSocio[]

  @@unique([tenantId, cpf])
  @@index([tenantId])
}

model MovimentacaoSocio {
  id        String   @id @default(uuid())
  tenantId  String
  socioId   String
  lojaId    String?
  data      DateTime @db.Date
  tipo      String   // pro-labore, distribuicao, retirada, aporte, outro
  descricao String
  valor     Decimal  @db.Decimal(15, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  socio  Socio  @relation(fields: [socioId], references: [id], onDelete: Cascade)
  loja   Loja?  @relation(fields: [lojaId], references: [id], onDelete: SetNull)

  @@index([tenantId, data])
  @@index([socioId])
}

// ========== FORNECEDORES ==========
// Union CNPJ/CPF: duas tabelas ou uma com campos opcionais. Uma tabela com tipo e campos opcionais e mais simples.

model Fornecedor {
  id        String   @id @default(uuid())
  tenantId  String
  tipo      String   // cnpj | cpf
  // CNPJ
  cnpj         String?
  razaoSocial  String?
  nomeFantasia String?
  // CPF
  cpf          String?
  nomeCompleto String?
  nomeComercial String?
  // Comum
  observacoes String?
  isAtivo     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant     Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  endereco   EnderecoFornecedor?
  contatoEmpresa ContatoFornecedor?
  contatoVendedor ContatoVendedor?

  @@index([tenantId])
}

model EnderecoFornecedor {
  id             String @id @default(uuid())
  fornecedorId   String @unique
  cep            String
  tipoLogradouro String
  logradouro     String
  numero         String
  complemento    String?
  bairro         String
  cidade         String
  uf             String

  fornecedor Fornecedor @relation(fields: [fornecedorId], references: [id], onDelete: Cascade)
}

model ContatoFornecedor {
  id                String  @id @default(uuid())
  fornecedorId      String  @unique
  telefonePrincipal String?
  whatsapp          String?
  emailPrincipal    String
  emailFinanceiro   String?
  site              String?
  instagram         String?

  fornecedor Fornecedor @relation(fields: [fornecedorId], references: [id], onDelete: Cascade)
}

model ContatoVendedor {
  id           String @id @default(uuid())
  fornecedorId String @unique
  nome         String
  whatsapp     String
  email        String

  fornecedor Fornecedor @relation(fields: [fornecedorId], references: [id], onDelete: Cascade)
}

// ========== LEMBRETES ==========

model Lembrete {
  id         String   @id @default(uuid())
  tenantId   String
  userId     String?  // opcional: lembrete do usuario ou do tenant
  titulo     String
  descricao  String?
  data       DateTime @db.Date
  hora       String?  // "09:00"
  prioridade String   @default("media") // baixa, media, alta
  status     String   @default("pendente") // pendente, concluido, cancelado
  createdAt  DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([status])
}

// ========== CONFIGURACOES USUARIO ==========

model ConfiguracaoUsuario {
  id        String   @id @default(uuid())
  userId    String
  tenantId  String
  chave     String   // ex: tabelas-colunas
  valor     Json     // array de TabelaConfig
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([userId, chave])
  @@index([userId])
}
```

**Nota:** Se preferir evitar muitas tabelas 1:1 para endereco/contato, pode usar `Json` no Prisma para esses objetos (menos tipagem no banco, mais flexibilidade). Exemplo:

```prisma
model Loja {
  ...
  endereco Json?  // EnderecoLoja
  contato  Json?   // ContatoLoja
  responsavel Json? // ResponsavelLoja
}
```

**Nota sobre Loja e Fornecedor:** No schema acima, EnderecoLoja, ContatoLoja e ResponsavelLoja sao modelos separados com `lojaId` (relacao 1:1; o filho guarda a FK). Se preferir menos tabelas, pode usar campos **Json** em Loja e Fornecedor para endereco/contato/responsavel; o front já envia objetos aninhados e o Prisma aceita Json.

---

## 3. Estrutura de Modulos NestJS

```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts
│   │   ├── tenant-id.decorator.ts
│   │   └── roles.decorator.ts
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   ├── roles.guard.ts
│   │   └── tenant.guard.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── response-transform.interceptor.ts
│   └── dto/
│       ├── pagination.dto.ts
│       └── api-response.dto.ts
├── prisma/
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   └── jwt-refresh.strategy.ts
│   └── dto/
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
├── tenants/
│   ├── tenants.module.ts
│   ├── tenants.controller.ts
│   ├── tenants.service.ts
│   └── dto/
├── admin/
│   ├── admin.module.ts
│   ├── admin-tenants.controller.ts
│   ├── admin-users.controller.ts
│   └── dto/
├── lojas/
│   ├── lojas.module.ts
│   ├── lojas.controller.ts
│   ├── lojas.service.ts
│   └── dto/
├── despesas/
│   ├── despesas.module.ts
│   ├── despesas.controller.ts
│   ├── despesas.service.ts
│   └── dto/
├── parcelamentos/
├── receitas/
├── investimentos/
├── socios/
│   ├── socios.module.ts
│   ├── socios.controller.ts
│   ├── socios.service.ts
│   ├── movimentacoes-socios.controller.ts
│   └── movimentacoes-socios.service.ts
├── fornecedores/
├── configuracoes/
├── lembretes/
└── config/
    └── ...
```

---

## 4. Ordem Sugerida de Implementacao

1. **Projeto e banco**
   - Criar projeto NestJS, instalar Prisma, configurar `.env` com `DATABASE_URL`.
   - Colar o schema Prisma (com Loja/Fornecedor em Json se optar por isso), rodar `npx prisma migrate dev`.

2. **Auth**
   - Implementar AuthModule: login (bcrypt + JWT), register, refresh, logout.
   - Retornar user no formato do contrato (id, nome, email, tenantId, lojas, permissoes, isSuperAdmin).
   - Endpoint GET `/auth/tenants` ou `/tenants/available` para Super Admin (listar tenants do usuario).

3. **Tenants e Lojas**
   - Tenants: CRUD para Super Admin em `/admin/tenants`.
   - Lojas: CRUD em `/lojas` com tenantId do JWT (ou X-Tenant-Id). Validar regra “nao excluir matriz”.

4. **Despesas**
   - CRUD `/despesas` com filtros (categoria, dataInicio, dataFim, lojaId) e paginacao. Garantir que cada item tenha `categoria` e os tipos por categoria conforme o contrato.

5. **Parcelamentos, Receitas, Investimentos**
   - CRUD para cada recurso; mesmo padrao de resposta e tenantId.

6. **Socios e Movimentacoes**
   - CRUD socios; GET `/socios/resumo` (calcular totais por socio).
   - CRUD movimentacoes-socios; incluir `socioNome` na resposta quando fizer sentido.

7. **Fornecedores**
   - CRUD com union CNPJ/CPF (um model com tipo + campos opcionais ou dois endpoints). Persistir endereco/contato em Json ou em tabelas 1:1.

8. **Configuracoes**
   - GET/PUT configuracoes de tabelas por usuario (chave tipo `tabelas-colunas`, valor JSON com TabelaConfig[]).

9. **Lembretes**
   - CRUD e toggle de status (pendente/concluido).

10. **Admin Users**
    - CRUD e toggle em `/admin/users`; listar tenants para o select (usar mesmo GET de tenants disponiveis ou lista de admin).

11. **Testes e ajustes**
    - Testar cada tela do front contra a API; ajustar campos e nomes conforme o contrato (01-contrato-frontend-backend.md).

**Fase 2 (apos o modulo financeiro):** Dashboard (resumo, transacoes-recentes), Balanco (GET /balanco/mensal), Relatorios (despesas, vendas, fluxo-caixa, lucro). Nao implementar nem exigir esses endpoints na fase atual.

---

## 5. Variaveis de Ambiente

```env
DATABASE_URL="postgresql://user:password@localhost:5432/doosed"
JWT_SECRET="..."
JWT_EXPIRES_IN="1h"
JWT_REFRESH_SECRET="..."
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3000
API_PREFIX=api/v1
```

---

## 6. Padrao de Resposta da API

- Sucesso com dados: `{ success: true, data: T }`.
- Lista paginada: `{ success: true, data: T[], meta: { total, page, perPage, totalPages } }`.
- **Listagens que alimentam tabelas:** incluir na resposta o campo **`columns`** (array de `{ id, label, order, isRequired? }`). O backend deve buscar a configuracao de colunas do usuario para o `tabelaId` correspondente (ver 01-contrato-frontend-backend.md, secao "Colunas de tabela"). Se nao houver config salva, retornar o padrao do sistema para essa tabela.
- Erro: `{ success: false, error: { code: string, message: string, details?: array } }`.

Use um interceptor global para envolver os retornos dos controllers nesse formato.

---

**Versao:** 1.0.0  
**Data:** 2026-02-03  
**Revalidado:** 2026-02-03 (alinhado ao front com columns e ao contrato).  
**Referencias:** 01-contrato-frontend-backend.md, api-specification.md, dtos-e-tipos.md.
