# API Specification - Plataforma Financeira & Operacional

## Sumario

1. [Visao Geral](#1-visao-geral)
2. [Stack Tecnologica](#2-stack-tecnologica)
3. [Arquitetura](#3-arquitetura)
4. [Autenticacao e Autorizacao](#4-autenticacao-e-autorizacao)
5. [Multi-Tenancy](#5-multi-tenancy)
6. [Modelo de Dados](#6-modelo-de-dados)
7. [Endpoints da API](#7-endpoints-da-api)
8. [Validacoes e Regras de Negocio](#8-validacoes-e-regras-de-negocio)
9. [Filtros e Paginacao](#9-filtros-e-paginacao)
10. [Tratamento de Erros](#10-tratamento-de-erros)
11. [Consideracoes de Seguranca](#11-consideracoes-de-seguranca)

---

## 1. Visao Geral

### 1.1 Objetivo do Sistema

Sistema financeiro e operacional multi-tenant para gestao completa de:
- Despesas (fixas, extras, funcionarios, impostos, veiculos, bancarias)
- Parcelamentos
- Receitas e renda extra
- Investimentos
- Gestao de socios e distribuicao de lucros
- Balanco financeiro consolidado
- Multi-loja com consolidacao

### 1.2 Usuarios do Sistema

| Tipo | Descricao | Permissoes |
|------|-----------|------------|
| Super Admin | Administrador da plataforma | Gerencia tenants, usuarios globais, acesso a todos os tenants |
| Admin Tenant | Administrador da empresa | Gerencia usuarios do tenant, configuracoes, todas as operacoes |
| Usuario | Operador comum | Operacoes do dia-a-dia conforme permissoes |

### 1.3 Fluxo Principal

```
Login -> [Super Admin?] -> Selecao de Tenant -> Dashboard -> Modulos
                |
                v
         [Usuario Normal?] -> Dashboard (tenant fixo) -> Modulos
```

---

## 2. Stack Tecnologica

### Backend
- **Framework**: NestJS (Node.js)
- **ORM**: Prisma ou TypeORM
- **Banco de Dados**: PostgreSQL
- **Autenticacao**: JWT (Access Token + Refresh Token)
- **Validacao**: class-validator / class-transformer
- **Documentacao**: Swagger/OpenAPI

### Requisitos de Ambiente
- Node.js 18+
- PostgreSQL 14+
- Redis (opcional, para cache/sessoes)

---

## 3. Arquitetura

### 3.1 Estrutura de Modulos

```
src/
├── auth/                 # Autenticacao e autorizacao
├── users/                # Gestao de usuarios
├── tenants/              # Gestao de empresas (tenants)
├── lojas/                # Gestao de lojas por tenant
├── socios/               # Gestao de socios
├── despesas/             # Modulo de despesas (todas categorias)
├── parcelamentos/        # Parcelamentos
├── receitas/             # Renda extra e receitas
├── investimentos/        # Investimentos
├── balanco/              # Balanco e relatorios
├── configuracoes/        # Configuracoes do usuario
├── common/               # Guards, interceptors, decorators
└── database/             # Prisma/TypeORM config
```

### 3.2 Padrao de Resposta da API

#### Sucesso (200/201)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-14T10:30:00Z"
  }
}
```

#### Sucesso com Paginacao
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 150,
    "page": 1,
    "perPage": 20,
    "totalPages": 8,
    "timestamp": "2026-01-14T10:30:00Z"
  }
}
```

#### Erro (4xx/5xx)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados invalidos",
    "details": [
      { "field": "email", "message": "Email invalido" }
    ]
  },
  "meta": {
    "timestamp": "2026-01-14T10:30:00Z"
  }
}
```

---

## 4. Autenticacao e Autorizacao

### 4.1 Endpoints de Autenticacao

#### POST /auth/login
Autentica usuario e retorna tokens.

**Request:**
```json
{
  "email": "usuario@empresa.com",
  "password": "senhaSegura123!"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "nome": "Joao Silva",
      "email": "usuario@empresa.com",
      "isSuperAdmin": false,
      "tenantId": "uuid-tenant",
      "tenant": {
        "id": "uuid-tenant",
        "nome": "Empresa Alpha Ltda",
        "cnpj": "12.345.678/0001-90"
      },
      "lojas": ["uuid-loja-1", "uuid-loja-2"],
      "permissoes": ["despesas:read", "despesas:write", "balanco:read"]
    }
  }
}
```

**Response para Super Admin (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
      "id": "uuid",
      "nome": "Super Admin",
      "email": "admin@plataforma.com",
      "isSuperAdmin": true,
      "tenantId": null,
      "tenant": null,
      "lojas": [],
      "permissoes": ["*"]
    }
  }
}
```

#### POST /auth/refresh
Renova o access token usando o refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
  }
}
```

#### POST /auth/logout
Invalida o refresh token.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### POST /auth/register
Registra novo usuario (apenas para cadastro inicial ou auto-registro se habilitado).

**Request:**
```json
{
  "nome": "Maria Santos",
  "email": "maria@empresa.com",
  "password": "senhaSegura123!",
  "confirmPassword": "senhaSegura123!"
}
```

### 4.2 Estrutura do JWT

```json
{
  "sub": "uuid-usuario",
  "email": "usuario@empresa.com",
  "isSuperAdmin": false,
  "tenantId": "uuid-tenant",
  "lojas": ["uuid-loja-1"],
  "permissoes": ["despesas:read", "despesas:write"],
  "iat": 1705234800,
  "exp": 1705238400
}
```

### 4.3 Headers Obrigatorios

```
Authorization: Bearer <access_token>
X-Tenant-Id: <uuid-tenant>  # Obrigatorio para Super Admin acessando tenant especifico
```

### 4.4 Permissoes do Sistema

| Modulo | Permissoes |
|--------|------------|
| despesas | `despesas:read`, `despesas:write`, `despesas:delete` |
| parcelamentos | `parcelamentos:read`, `parcelamentos:write`, `parcelamentos:delete` |
| receitas | `receitas:read`, `receitas:write`, `receitas:delete` |
| investimentos | `investimentos:read`, `investimentos:write`, `investimentos:delete` |
| socios | `socios:read`, `socios:write`, `socios:delete` |
| balanco | `balanco:read` |
| configuracoes | `configuracoes:read`, `configuracoes:write` |
| usuarios | `usuarios:read`, `usuarios:write`, `usuarios:delete` |
| lojas | `lojas:read`, `lojas:write`, `lojas:delete` |

---

## 5. Multi-Tenancy

### 5.1 Estrategia

Utilizamos **Row-Level Security (RLS)** com coluna `tenant_id` em todas as tabelas de dados.

### 5.2 Regras

1. Todo registro deve ter `tenant_id`
2. Queries devem SEMPRE filtrar por `tenant_id` do usuario logado
3. Super Admin pode acessar qualquer tenant via header `X-Tenant-Id`
4. Usuario normal so acessa dados do seu proprio tenant

### 5.3 Multi-Loja

Dentro de cada tenant, pode haver multiplas lojas:

1. Usuario pode estar vinculado a uma ou mais lojas
2. Dados podem ser filtrados por loja
3. Balanco consolidado mostra todas as lojas
4. Balanco por loja mostra dados especificos

---

## 6. Modelo de Dados

### 6.1 Diagrama ER (Simplificado)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Tenant    │────<│    User     │     │    Loja     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │                   └───────────────────┘
       │                           │
       ▼                           ▼
┌─────────────┐     ┌─────────────────────────────┐
│   Socio     │     │   Despesa / Parcelamento    │
└─────────────┘     │   Receita / Investimento    │
       │            └─────────────────────────────┘
       ▼
┌─────────────┐
│ Movimentacao│
│    Socio    │
└─────────────┘
```

### 6.2 Entidades

#### Tenant (Empresa)
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18) UNIQUE NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  responsavel VARCHAR(255),
  endereco_cep VARCHAR(10),
  endereco_logradouro VARCHAR(255),
  endereco_numero VARCHAR(20),
  endereco_complemento VARCHAR(100),
  endereco_bairro VARCHAR(100),
  endereco_cidade VARCHAR(100),
  endereco_estado CHAR(2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### User (Usuario)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  cpf VARCHAR(14),
  role VARCHAR(50) DEFAULT 'user', -- 'super_admin', 'admin', 'user'
  is_super_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  permissoes JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(email),
  UNIQUE(tenant_id, cpf)
);
```

#### Loja
```sql
CREATE TABLE lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  endereco VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id, nome)
);
```

#### User_Lojas (Relacionamento N:N)
```sql
CREATE TABLE user_lojas (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  loja_id UUID REFERENCES lojas(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, loja_id)
);
```

#### Socio
```sql
CREATE TABLE socios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cpf VARCHAR(14) NOT NULL,
  percentual_sociedade DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tenant_id, cpf)
);
```

#### Movimentacao_Socio
```sql
CREATE TABLE movimentacoes_socios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  socio_id UUID NOT NULL REFERENCES socios(id) ON DELETE CASCADE,
  loja_id UUID REFERENCES lojas(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'pro-labore', 'distribuicao', 'retirada', 'aporte', 'outro'
  descricao VARCHAR(500) NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Despesa
```sql
CREATE TABLE despesas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  loja_id UUID REFERENCES lojas(id) ON DELETE SET NULL,
  categoria VARCHAR(50) NOT NULL, -- 'fixa', 'extra', 'funcionario', 'imposto', 'veiculo', 'banco'
  data DATE NOT NULL,
  descricao VARCHAR(500) NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  recorrencia VARCHAR(50) DEFAULT 'unica', -- 'unica', 'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual'
  recorrencia_fim DATE, -- Data limite da recorrencia (null = infinito)
  observacao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_despesas_tenant_data ON despesas(tenant_id, data);
CREATE INDEX idx_despesas_categoria ON despesas(categoria);
```

#### Parcelamento
```sql
CREATE TABLE parcelamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  loja_id UUID REFERENCES lojas(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  descricao VARCHAR(500) NOT NULL,
  parcela VARCHAR(20) NOT NULL, -- Ex: "3/12"
  parcela_atual INT NOT NULL,
  parcela_total INT NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  valor_total DECIMAL(15,2), -- Valor total do parcelamento
  status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado', 'cancelado'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parcelamentos_tenant_data ON parcelamentos(tenant_id, data);
```

#### Receita (Renda Extra)
```sql
CREATE TABLE receitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  loja_id UUID REFERENCES lojas(id) ON DELETE SET NULL,
  categoria VARCHAR(50) NOT NULL, -- 'renda-extra', 'venda', 'servico', 'outro'
  data DATE NOT NULL,
  descricao VARCHAR(500) NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_receitas_tenant_data ON receitas(tenant_id, data);
```

#### Investimento
```sql
CREATE TABLE investimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  loja_id UUID REFERENCES lojas(id) ON DELETE SET NULL,
  data DATE NOT NULL,
  descricao VARCHAR(500) NOT NULL,
  valor DECIMAL(15,2) NOT NULL,
  tipo VARCHAR(50), -- 'acao', 'fundo', 'cdb', 'tesouro', 'outro'
  observacao TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_investimentos_tenant_data ON investimentos(tenant_id, data);
```

#### Configuracao_Usuario
```sql
CREATE TABLE configuracoes_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chave VARCHAR(100) NOT NULL,
  valor JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id, chave)
);
```

---

## 7. Endpoints da API

### 7.1 Tenants (Super Admin Only)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /tenants | Lista todos os tenants |
| GET | /tenants/:id | Detalhes de um tenant |
| POST | /tenants | Cria novo tenant |
| PATCH | /tenants/:id | Atualiza tenant |
| DELETE | /tenants/:id | Remove tenant (soft delete) |
| PATCH | /tenants/:id/toggle-status | Ativa/desativa tenant |

#### POST /tenants
```json
{
  "nome": "Empresa Alpha Ltda",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@alpha.com",
  "telefone": "(11) 99999-9999",
  "responsavel": "Joao Silva",
  "endereco": {
    "cep": "01310-100",
    "logradouro": "Av. Paulista",
    "numero": "1000",
    "complemento": "Sala 101",
    "bairro": "Bela Vista",
    "cidade": "Sao Paulo",
    "estado": "SP"
  }
}
```

### 7.2 Users

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /users | Lista usuarios do tenant |
| GET | /users/:id | Detalhes de um usuario |
| POST | /users | Cria novo usuario |
| PATCH | /users/:id | Atualiza usuario |
| DELETE | /users/:id | Remove usuario (soft delete) |
| PATCH | /users/:id/toggle-status | Ativa/desativa usuario |
| PATCH | /users/:id/permissions | Atualiza permissoes |

#### POST /users
```json
{
  "nome": "Maria Santos",
  "email": "maria@empresa.com",
  "password": "senhaSegura123!",
  "telefone": "(11) 98888-8888",
  "cpf": "123.456.789-00",
  "role": "user",
  "lojas": ["uuid-loja-1", "uuid-loja-2"],
  "permissoes": ["despesas:read", "despesas:write", "balanco:read"]
}
```

### 7.3 Lojas

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /lojas | Lista lojas do tenant |
| GET | /lojas/:id | Detalhes de uma loja |
| POST | /lojas | Cria nova loja |
| PATCH | /lojas/:id | Atualiza loja |
| DELETE | /lojas/:id | Remove loja (soft delete) |

### 7.4 Despesas

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /despesas | Lista despesas (com filtros) |
| GET | /despesas/:id | Detalhes de uma despesa |
| POST | /despesas | Cria nova despesa |
| PATCH | /despesas/:id | Atualiza despesa |
| DELETE | /despesas/:id | Remove despesa |
| GET | /despesas/categorias | Lista categorias disponiveis |
| GET | /despesas/totais | Totais por categoria |

#### GET /despesas

**Query Parameters:**
| Param | Tipo | Descricao |
|-------|------|-----------|
| categoria | string | Filtra por categoria |
| dataInicio | date | Data inicial (YYYY-MM-DD) |
| dataFim | date | Data final (YYYY-MM-DD) |
| lojaId | uuid | Filtra por loja |
| recorrencia | string | Filtra por tipo de recorrencia |
| page | number | Pagina (default: 1) |
| perPage | number | Itens por pagina (default: 20, max: 100) |
| sortBy | string | Campo para ordenacao |
| sortOrder | string | asc ou desc |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "categoria": "fixa",
      "data": "2026-01-15",
      "descricao": "Aluguel",
      "valor": 3500.00,
      "recorrencia": "mensal",
      "loja": {
        "id": "uuid",
        "nome": "Loja Centro"
      },
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "perPage": 20,
    "totalPages": 3
  }
}
```

#### POST /despesas
```json
{
  "categoria": "fixa",
  "data": "2026-01-15",
  "descricao": "Aluguel do escritorio",
  "valor": 3500.00,
  "recorrencia": "mensal",
  "recorrenciaFim": null,
  "lojaId": "uuid-loja",
  "observacao": "Contrato renovado em 2026"
}
```

### 7.5 Parcelamentos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /parcelamentos | Lista parcelamentos |
| GET | /parcelamentos/:id | Detalhes |
| POST | /parcelamentos | Cria novo |
| PATCH | /parcelamentos/:id | Atualiza |
| DELETE | /parcelamentos/:id | Remove |

#### POST /parcelamentos
```json
{
  "data": "2026-01-15",
  "descricao": "Compra equipamentos",
  "parcelaAtual": 1,
  "parcelaTotal": 12,
  "valor": 500.00,
  "valorTotal": 6000.00,
  "lojaId": "uuid-loja"
}
```

### 7.6 Receitas (Renda Extra)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /receitas | Lista receitas |
| GET | /receitas/:id | Detalhes |
| POST | /receitas | Cria nova |
| PATCH | /receitas/:id | Atualiza |
| DELETE | /receitas/:id | Remove |

### 7.7 Investimentos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /investimentos | Lista investimentos |
| GET | /investimentos/:id | Detalhes |
| POST | /investimentos | Cria novo |
| PATCH | /investimentos/:id | Atualiza |
| DELETE | /investimentos/:id | Remove |

### 7.8 Socios

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /socios | Lista socios |
| GET | /socios/:id | Detalhes do socio |
| GET | /socios/:id/movimentacoes | Movimentacoes do socio |
| GET | /socios/resumo | Resumo de todos os socios |
| POST | /socios | Cria novo socio |
| PATCH | /socios/:id | Atualiza socio |
| DELETE | /socios/:id | Remove socio |

#### GET /socios/resumo
```json
{
  "success": true,
  "data": [
    {
      "socio": {
        "id": "uuid",
        "nome": "Joao Silva",
        "cpf": "123.456.789-00",
        "percentualSociedade": 50.00
      },
      "totalProLabore": 96000.00,
      "totalDistribuicao": 50000.00,
      "totalRetiradas": 10000.00,
      "totalAportes": 0.00,
      "saldoTotal": 156000.00
    }
  ]
}
```

### 7.9 Movimentacoes de Socios

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /movimentacoes-socios | Lista todas movimentacoes |
| GET | /movimentacoes-socios/:id | Detalhes |
| POST | /movimentacoes-socios | Cria nova |
| PATCH | /movimentacoes-socios/:id | Atualiza |
| DELETE | /movimentacoes-socios/:id | Remove |

#### POST /movimentacoes-socios
```json
{
  "socioId": "uuid",
  "data": "2026-01-15",
  "tipo": "pro-labore",
  "descricao": "Pro-labore Janeiro/2026",
  "valor": 8000.00,
  "lojaId": "uuid-loja"
}
```

**Tipos de Movimentacao:**
- `pro-labore` - Pro-labore mensal
- `distribuicao` - Distribuicao de lucros
- `retirada` - Retirada pessoal
- `aporte` - Aporte de capital
- `outro` - Outros

### 7.10 Balanco

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /balanco/mensal | Balanco do mes |
| GET | /balanco/anual | Balanco do ano |
| GET | /balanco/comparativo | Comparativo entre periodos |

#### GET /balanco/mensal

**Query Parameters:**
| Param | Tipo | Descricao |
|-------|------|-----------|
| mes | number | Mes (1-12) |
| ano | number | Ano (ex: 2026) |
| lojaId | uuid | Filtra por loja (opcional) |

**Response:**
```json
{
  "success": true,
  "data": {
    "periodo": {
      "mes": 1,
      "ano": 2026,
      "dataInicio": "2026-01-01",
      "dataFim": "2026-01-31"
    },
    "resumo": {
      "faturamentoTotal": 53340.00,
      "despesasTotal": 29225.56,
      "lucroLiquido": 24114.44,
      "margemLucro": 45.21
    },
    "despesas": {
      "items": [
        {
          "categoria": "DESP - FIXA",
          "valor": 3369.90,
          "percentualVenda": 6.32,
          "loja": null
        }
      ],
      "total": 29225.56,
      "percentualTotal": 54.79
    },
    "vendas": {
      "items": [
        {
          "descricao": "DINHEIRO - DEPOSITO",
          "valor": 51000.00,
          "percentual": 95.61
        }
      ],
      "total": 53340.00
    },
    "socios": {
      "items": [
        {
          "socio": "Joao Silva",
          "proLabore": 8000.00,
          "distribuicao": 0.00,
          "total": 8000.00
        }
      ],
      "total": 16000.00
    },
    "investimento": 10500.00,
    "rendaExtra": 4550.00,
    "ativoImobilizado": {
      "entrada": 10000.00,
      "saida": 5000.00
    }
  }
}
```

### 7.11 Configuracoes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /configuracoes | Lista configuracoes do usuario |
| GET | /configuracoes/:chave | Valor de uma configuracao |
| PUT | /configuracoes/:chave | Define/atualiza configuracao |
| DELETE | /configuracoes/:chave | Remove configuracao |

#### PUT /configuracoes/colunas-despesa-fixa
```json
{
  "valor": {
    "colunas": [
      { "id": "data", "isVisible": true, "order": 1 },
      { "id": "descricao", "isVisible": true, "order": 2 },
      { "id": "valor", "isVisible": true, "order": 3 },
      { "id": "recorrencia", "isVisible": true, "order": 4 },
      { "id": "observacao", "isVisible": false, "order": 5 }
    ]
  }
}
```

### 7.12 Dashboard

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /dashboard/resumo | Resumo para cards |
| GET | /dashboard/transacoes-recentes | Ultimas transacoes |
| GET | /dashboard/grafico-mensal | Dados para grafico |

#### GET /dashboard/resumo

**Query Parameters:**
| Param | Tipo | Descricao |
|-------|------|-----------|
| dataInicio | date | Data inicial |
| dataFim | date | Data final |
| lojaId | uuid | Filtra por loja |

**Response:**
```json
{
  "success": true,
  "data": {
    "receitaTotal": 45230.00,
    "receitaVariacao": 12.5,
    "despesasTotal": 28450.00,
    "despesasVariacao": -3.2,
    "saldoAtual": 16780.00,
    "saldoVariacao": 8.1,
    "investimentos": 32100.00,
    "investimentosVariacao": 5.4
  }
}
```

---

## 8. Validacoes e Regras de Negocio

### 8.1 Validacoes de Campos

| Campo | Validacao |
|-------|-----------|
| email | Formato valido, unico por tenant |
| cpf | Formato valido (XXX.XXX.XXX-XX), unico por tenant |
| cnpj | Formato valido (XX.XXX.XXX/XXXX-XX), unico |
| telefone | Formato (XX) XXXXX-XXXX ou (XX) XXXX-XXXX |
| cep | Formato XXXXX-XXX |
| valor | Decimal positivo, max 2 casas decimais |
| data | Formato YYYY-MM-DD |
| password | Min 8 chars, 1 maiuscula, 1 minuscula, 1 numero, 1 especial |
| percentualSociedade | Decimal 0-100, soma de todos socios do tenant <= 100 |

### 8.2 Regras de Negocio

1. **Despesas Recorrentes**
   - Ao criar despesa recorrente, sistema deve gerar lancamentos futuros automaticamente
   - Limite de geracao: 12 meses a frente ou ate `recorrenciaFim`
   - Job diario para gerar proximos lancamentos

2. **Parcelamentos**
   - Campo `parcela` deve ser formatado como "X/Y"
   - `parcelaAtual` <= `parcelaTotal`
   - Alerta quando proxima da data de vencimento

3. **Socios**
   - Soma de `percentualSociedade` de todos socios ativos <= 100%
   - Distribuicao de lucros deve respeitar percentual de cada socio

4. **Multi-Loja**
   - Registro sem `lojaId` = registro geral do tenant
   - Balanco consolidado soma todas as lojas
   - Usuario so ve lojas que tem acesso

5. **Soft Delete**
   - Registros nao sao removidos fisicamente
   - Campo `is_active` ou `deleted_at` para controle
   - Queries padrao filtram apenas registros ativos

---

## 9. Filtros e Paginacao

### 9.1 Paginacao Padrao

```
GET /endpoint?page=1&perPage=20&sortBy=createdAt&sortOrder=desc
```

### 9.2 Filtros de Data

```
GET /endpoint?dataInicio=2026-01-01&dataFim=2026-01-31
```

### 9.3 Busca Textual

```
GET /endpoint?search=aluguel
```

### 9.4 Filtros Multiplos

```
GET /despesas?categoria=fixa&lojaId=uuid&dataInicio=2026-01-01
```

---

## 10. Tratamento de Erros

### 10.1 Codigos de Erro

| Codigo | HTTP Status | Descricao |
|--------|-------------|-----------|
| VALIDATION_ERROR | 400 | Dados invalidos |
| UNAUTHORIZED | 401 | Token invalido ou expirado |
| FORBIDDEN | 403 | Sem permissao |
| NOT_FOUND | 404 | Recurso nao encontrado |
| CONFLICT | 409 | Conflito (ex: email duplicado) |
| INTERNAL_ERROR | 500 | Erro interno do servidor |

### 10.2 Exemplos de Respostas de Erro

#### Erro de Validacao (400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dados invalidos",
    "details": [
      { "field": "email", "message": "Email invalido" },
      { "field": "valor", "message": "Valor deve ser positivo" }
    ]
  }
}
```

#### Nao Autorizado (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token expirado ou invalido"
  }
}
```

#### Sem Permissao (403)
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Voce nao tem permissao para acessar este recurso"
  }
}
```

---

## 11. Consideracoes de Seguranca

### 11.1 Autenticacao

- Senhas armazenadas com bcrypt (cost factor >= 12)
- Access Token: JWT com expiracao de 1 hora
- Refresh Token: JWT com expiracao de 7 dias
- Refresh tokens armazenados em banco e invalidados no logout

### 11.2 Autorizacao

- Validar `tenant_id` em TODA query
- Validar permissoes antes de cada operacao
- Super Admin precisa enviar header `X-Tenant-Id` para acessar dados

### 11.3 Rate Limiting

- Login: 5 tentativas por IP por minuto
- API geral: 100 requests por minuto por usuario
- Endpoints pesados (balanco): 10 requests por minuto

### 11.4 Headers de Seguranca

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 11.5 CORS

- Apenas origens autorizadas
- Credentials permitidos para cookies/tokens

---

## Anexos

### A. Variaveis de Ambiente Necessarias

```env
# Aplicacao
NODE_ENV=production
PORT=3000
API_PREFIX=/api/v1

# Banco de Dados
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT
JWT_SECRET=sua-chave-secreta-muito-segura
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=outra-chave-secreta
JWT_REFRESH_EXPIRES_IN=7d

# Redis (opcional)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=https://app.seudominio.com

# Rate Limit
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### B. Checklist de Integracao Frontend

- [ ] Configurar base URL da API
- [ ] Implementar interceptor para adicionar token no header
- [ ] Implementar refresh token automatico
- [ ] Adicionar header X-Tenant-Id para Super Admin
- [ ] Substituir stores mockadas por chamadas reais
- [ ] Implementar tratamento de erros padronizado
- [ ] Testar todos os endpoints

### C. Contato

Para duvidas sobre esta especificacao, entrar em contato com o time de frontend.

---

**Versao:** 1.0.0  
**Data:** 2026-01-14  
**Status:** Aprovado para desenvolvimento
