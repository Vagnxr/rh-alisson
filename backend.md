# Exemplos Completos de Request/Response

Este documento contem exemplos reais de todas as chamadas da API para facilitar testes e integracao.

---

## Sumario

1. [Autenticacao](#1-autenticacao)
2. [Tenants](#2-tenants)
3. [Usuarios](#3-usuarios)
4. [Lojas](#4-lojas)
5. [Despesas](#5-despesas)
6. [Parcelamentos](#6-parcelamentos)
7. [Receitas](#7-receitas)
8. [Investimentos](#8-investimentos)
9. [Socios](#9-socios)
10. [Movimentacoes Socios](#10-movimentacoes-socios)
11. [Balanco](#11-balanco)
12. [Dashboard](#12-dashboard)
13. [Configuracoes](#13-configuracoes)

---

## 1. Autenticacao

### POST /auth/login - Usuario Normal

**Request:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "joao@empresaalpha.com",
  "password": "Senha@123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBiOGQwMC0xMjM0LTU2NzgtOWFiYy1kZWYwMTIzNDU2NzgiLCJlbWFpbCI6ImpvYW9AZW1wcmVzYWFscGhhLmNvbSIsImlzU3VwZXJBZG1pbiI6ZmFsc2UsInRlbmFudElkIjoiYTFiMmMzZDQtZTVmNi03ODkwLWFiY2QtZWYxMjM0NTY3ODkwIiwibG9qYXMiOlsiNzg5MGFiY2QtMTIzNC01Njc4LTlhYmMtZGVmMDEyMzQ1Njc4Il0sInBlcm1pc3NvZXMiOlsiZGVzcGVzYXM6cmVhZCIsImRlc3Blc2FzOndyaXRlIiwiYmFsYW5jbzpyZWFkIl0sImlhdCI6MTcwNTIzNDgwMCwiZXhwIjoxNzA1MjM4NDAwfQ.signature",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "550b8d00-1234-5678-9abc-def012345678",
      "nome": "Joao Silva",
      "email": "joao@empresaalpha.com",
      "telefone": "(11) 99999-9999",
      "cpf": "123.456.789-00",
      "role": "user",
      "isSuperAdmin": false,
      "isActive": true,
      "tenantId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "tenant": {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "nome": "Empresa Alpha Ltda",
        "cnpj": "12.345.678/0001-90"
      },
      "lojas": ["7890abcd-1234-5678-9abc-def012345678"],
      "permissoes": ["despesas:read", "despesas:write", "balanco:read"],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-10T15:30:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

### POST /auth/login - Super Admin

**Request:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@plataforma.com",
  "password": "SuperAdmin@123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "user": {
      "id": "00000000-0000-0000-0000-000000000001",
      "nome": "Super Admin",
      "email": "admin@plataforma.com",
      "telefone": null,
      "cpf": null,
      "role": "super_admin",
      "isSuperAdmin": true,
      "isActive": true,
      "tenantId": null,
      "tenant": null,
      "lojas": [],
      "permissoes": ["*"],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

### POST /auth/login - Erro

**Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Email ou senha invalidos"
  },
  "meta": {
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

### POST /auth/refresh

**Request:**
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "meta": {
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

---

## 2. Tenants

### GET /tenants (Super Admin Only)

**Request:**
```http
GET /api/v1/tenants?page=1&perPage=10
Authorization: Bearer <super_admin_token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "nome": "Empresa Alpha Ltda",
      "cnpj": "12.345.678/0001-90",
      "email": "contato@alpha.com",
      "telefone": "(11) 3333-4444",
      "responsavel": "Carlos Diretor",
      "endereco": {
        "cep": "01310-100",
        "logradouro": "Av. Paulista",
        "numero": "1000",
        "complemento": "Sala 101",
        "bairro": "Bela Vista",
        "cidade": "Sao Paulo",
        "estado": "SP"
      },
      "isActive": true,
      "usersCount": 5,
      "lojasCount": 3,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-10T00:00:00.000Z"
    },
    {
      "id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
      "nome": "Beta Comercio SA",
      "cnpj": "98.765.432/0001-10",
      "email": "beta@beta.com",
      "telefone": "(21) 2222-3333",
      "responsavel": "Ana Gerente",
      "endereco": null,
      "isActive": true,
      "usersCount": 3,
      "lojasCount": 1,
      "createdAt": "2026-01-05T00:00:00.000Z",
      "updatedAt": "2026-01-05T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "perPage": 10,
    "totalPages": 1,
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

### POST /tenants

**Request:**
```http
POST /api/v1/tenants
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "nome": "Gamma Servicos ME",
  "cnpj": "11.222.333/0001-44",
  "email": "gamma@gamma.com",
  "telefone": "(31) 98765-4321",
  "responsavel": "Pedro Socio",
  "endereco": {
    "cep": "30130-000",
    "logradouro": "Rua da Bahia",
    "numero": "500",
    "complemento": null,
    "bairro": "Centro",
    "cidade": "Belo Horizonte",
    "estado": "MG"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "c3d4e5f6-a7b8-9012-cdef-345678901234",
    "nome": "Gamma Servicos ME",
    "cnpj": "11.222.333/0001-44",
    "email": "gamma@gamma.com",
    "telefone": "(31) 98765-4321",
    "responsavel": "Pedro Socio",
    "endereco": {
      "cep": "30130-000",
      "logradouro": "Rua da Bahia",
      "numero": "500",
      "complemento": null,
      "bairro": "Centro",
      "cidade": "Belo Horizonte",
      "estado": "MG"
    },
    "isActive": true,
    "usersCount": 0,
    "lojasCount": 0,
    "createdAt": "2026-01-14T10:30:00.000Z",
    "updatedAt": "2026-01-14T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

---

## 3. Usuarios

### GET /users

**Request:**
```http
GET /api/v1/users?page=1&perPage=20
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "550b8d00-1234-5678-9abc-def012345678",
      "nome": "Joao Silva",
      "email": "joao@empresaalpha.com",
      "telefone": "(11) 99999-9999",
      "cpf": "123.456.789-00",
      "role": "admin",
      "isSuperAdmin": false,
      "isActive": true,
      "lojas": [
        {
          "id": "7890abcd-1234-5678-9abc-def012345678",
          "nome": "Loja Centro"
        }
      ],
      "permissoes": ["*"],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-10T00:00:00.000Z"
    },
    {
      "id": "660c9e11-2345-6789-abcd-ef0123456789",
      "nome": "Maria Santos",
      "email": "maria@empresaalpha.com",
      "telefone": "(11) 98888-8888",
      "cpf": "987.654.321-00",
      "role": "user",
      "isSuperAdmin": false,
      "isActive": true,
      "lojas": [
        {
          "id": "7890abcd-1234-5678-9abc-def012345678",
          "nome": "Loja Centro"
        },
        {
          "id": "8901bcde-2345-6789-abcd-ef0123456789",
          "nome": "Loja Shopping"
        }
      ],
      "permissoes": ["despesas:read", "despesas:write", "balanco:read"],
      "createdAt": "2026-01-05T00:00:00.000Z",
      "updatedAt": "2026-01-05T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "perPage": 20,
    "totalPages": 1,
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

### POST /users

**Request:**
```http
POST /api/v1/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Pedro Oliveira",
  "email": "pedro@empresaalpha.com",
  "password": "Senha@456",
  "telefone": "(11) 97777-7777",
  "cpf": "456.789.123-00",
  "role": "user",
  "lojas": ["7890abcd-1234-5678-9abc-def012345678"],
  "permissoes": ["despesas:read", "parcelamentos:read", "parcelamentos:write"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "770daf22-3456-7890-bcde-f01234567890",
    "nome": "Pedro Oliveira",
    "email": "pedro@empresaalpha.com",
    "telefone": "(11) 97777-7777",
    "cpf": "456.789.123-00",
    "role": "user",
    "isSuperAdmin": false,
    "isActive": true,
    "lojas": [
      {
        "id": "7890abcd-1234-5678-9abc-def012345678",
        "nome": "Loja Centro"
      }
    ],
    "permissoes": ["despesas:read", "parcelamentos:read", "parcelamentos:write"],
    "createdAt": "2026-01-14T10:30:00.000Z",
    "updatedAt": "2026-01-14T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

---

## 4. Lojas

### GET /lojas

**Request:**
```http
GET /api/v1/lojas
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "7890abcd-1234-5678-9abc-def012345678",
      "nome": "Loja Centro",
      "cnpj": "12.345.678/0001-01",
      "endereco": "Rua Principal, 100 - Centro",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "8901bcde-2345-6789-abcd-ef0123456789",
      "nome": "Loja Shopping",
      "cnpj": "12.345.678/0002-02",
      "endereco": "Shopping Center, Loja 50",
      "isActive": true,
      "createdAt": "2026-01-02T00:00:00.000Z",
      "updatedAt": "2026-01-02T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "perPage": 20,
    "totalPages": 1,
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

---

## 5. Despesas

### GET /despesas

**Request:**
```http
GET /api/v1/despesas?categoria=fixa&dataInicio=2026-01-01&dataFim=2026-01-31&page=1&perPage=20
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "d1e2f3a4-b5c6-7890-defg-h12345678901",
      "categoria": "fixa",
      "data": "2026-01-15",
      "descricao": "Aluguel do escritorio",
      "valor": 3500.00,
      "recorrencia": "mensal",
      "recorrenciaFim": null,
      "loja": {
        "id": "7890abcd-1234-5678-9abc-def012345678",
        "nome": "Loja Centro"
      },
      "observacao": "Contrato renovado em 2026",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "e2f3a4b5-c6d7-8901-efgh-i23456789012",
      "categoria": "fixa",
      "data": "2026-01-20",
      "descricao": "Conta de energia",
      "valor": 890.50,
      "recorrencia": "mensal",
      "recorrenciaFim": null,
      "loja": {
        "id": "7890abcd-1234-5678-9abc-def012345678",
        "nome": "Loja Centro"
      },
      "observacao": null,
      "createdAt": "2026-01-05T00:00:00.000Z",
      "updatedAt": "2026-01-05T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "perPage": 20,
    "totalPages": 1,
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

### POST /despesas

**Request:**
```http
POST /api/v1/despesas
Authorization: Bearer <token>
Content-Type: application/json

{
  "categoria": "fixa",
  "data": "2026-01-25",
  "descricao": "Internet fibra optica",
  "valor": 299.90,
  "recorrencia": "mensal",
  "recorrenciaFim": null,
  "lojaId": "7890abcd-1234-5678-9abc-def012345678",
  "observacao": "Plano empresarial 500MB"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "f3a4b5c6-d7e8-9012-fghi-j34567890123",
    "categoria": "fixa",
    "data": "2026-01-25",
    "descricao": "Internet fibra optica",
    "valor": 299.90,
    "recorrencia": "mensal",
    "recorrenciaFim": null,
    "loja": {
      "id": "7890abcd-1234-5678-9abc-def012345678",
      "nome": "Loja Centro"
    },
    "observacao": "Plano empresarial 500MB",
    "createdAt": "2026-01-14T10:30:00.000Z",
    "updatedAt": "2026-01-14T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

### GET /despesas/totais

**Request:**
```http
GET /api/v1/despesas/totais?dataInicio=2026-01-01&dataFim=2026-01-31
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "fixa": 4690.40,
    "extra": 1250.00,
    "funcionario": 15800.00,
    "imposto": 3200.00,
    "veiculo": 1500.00,
    "banco": 350.00,
    "total": 26790.40
  },
  "meta": {
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

---

## 6. Parcelamentos

### GET /parcelamentos

**Request:**
```http
GET /api/v1/parcelamentos?dataInicio=2026-01-01&dataFim=2026-12-31
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "p1a2b3c4-d5e6-7890-pqrs-t12345678901",
      "data": "2026-01-15",
      "descricao": "Compra de equipamentos",
      "parcela": "3/12",
      "parcelaAtual": 3,
      "parcelaTotal": 12,
      "valor": 500.00,
      "valorTotal": 6000.00,
      "status": "pendente",
      "loja": {
        "id": "7890abcd-1234-5678-9abc-def012345678",
        "nome": "Loja Centro"
      },
      "createdAt": "2025-11-01T00:00:00.000Z",
      "updatedAt": "2026-01-14T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "perPage": 20,
    "totalPages": 1,
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

### POST /parcelamentos

**Request:**
```http
POST /api/v1/parcelamentos
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": "2026-01-20",
  "descricao": "Financiamento veiculo",
  "parcelaAtual": 1,
  "parcelaTotal": 48,
  "valor": 1500.00,
  "valorTotal": 72000.00,
  "lojaId": "7890abcd-1234-5678-9abc-def012345678"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "p2b3c4d5-e6f7-8901-qrst-u23456789012",
    "data": "2026-01-20",
    "descricao": "Financiamento veiculo",
    "parcela": "1/48",
    "parcelaAtual": 1,
    "parcelaTotal": 48,
    "valor": 1500.00,
    "valorTotal": 72000.00,
    "status": "pendente",
    "loja": {
      "id": "7890abcd-1234-5678-9abc-def012345678",
      "nome": "Loja Centro"
    },
    "createdAt": "2026-01-14T10:30:00.000Z",
    "updatedAt": "2026-01-14T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

---

## 7. Receitas

### POST /receitas

**Request:**
```http
POST /api/v1/receitas
Authorization: Bearer <token>
Content-Type: application/json

{
  "categoria": "renda-extra",
  "data": "2026-01-10",
  "descricao": "Consultoria externa",
  "valor": 5000.00,
  "lojaId": null,
  "observacao": "Projeto ABC"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "r1a2b3c4-d5e6-7890-rstu-v12345678901",
    "categoria": "renda-extra",
    "data": "2026-01-10",
    "descricao": "Consultoria externa",
    "valor": 5000.00,
    "loja": null,
    "observacao": "Projeto ABC",
    "createdAt": "2026-01-14T10:30:00.000Z",
    "updatedAt": "2026-01-14T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

---

## 8. Investimentos

### GET /investimentos

**Request:**
```http
GET /api/v1/investimentos?dataInicio=2026-01-01&dataFim=2026-12-31
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "i1a2b3c4-d5e6-7890-ijkl-m12345678901",
      "data": "2026-01-05",
      "descricao": "Aplicacao CDB 120%",
      "valor": 10000.00,
      "tipo": "cdb",
      "loja": null,
      "observacao": "Vencimento em 12 meses",
      "createdAt": "2026-01-05T00:00:00.000Z",
      "updatedAt": "2026-01-05T00:00:00.000Z"
    },
    {
      "id": "i2b3c4d5-e6f7-8901-jklm-n23456789012",
      "data": "2026-01-10",
      "descricao": "Tesouro Selic",
      "valor": 5000.00,
      "tipo": "tesouro",
      "loja": null,
      "observacao": null,
      "createdAt": "2026-01-10T00:00:00.000Z",
      "updatedAt": "2026-01-10T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "perPage": 20,
    "totalPages": 1,
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

### POST /investimentos

**Request:**
```http
POST /api/v1/investimentos
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": "2026-01-15",
  "descricao": "Fundo Imobiliario XPTO11",
  "valor": 3000.00,
  "tipo": "fundo",
  "lojaId": null,
  "observacao": "100 cotas"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "i3c4d5e6-f7a8-9012-klmn-o34567890123",
    "data": "2026-01-15",
    "descricao": "Fundo Imobiliario XPTO11",
    "valor": 3000.00,
    "tipo": "fundo",
    "loja": null,
    "observacao": "100 cotas",
    "createdAt": "2026-01-14T10:30:00.000Z",
    "updatedAt": "2026-01-14T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

---

## 9. Socios

### GET /socios

**Request:**
```http
GET /api/v1/socios
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "s1a2b3c4-d5e6-7890-stuv-w12345678901",
      "nome": "Joao Silva",
      "cpf": "123.456.789-00",
      "percentualSociedade": 50.00,
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "s2b3c4d5-e6f7-8901-tuvw-x23456789012",
      "nome": "Maria Santos",
      "cpf": "987.654.321-00",
      "percentualSociedade": 30.00,
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    },
    {
      "id": "s3c4d5e6-f7a8-9012-uvwx-y34567890123",
      "nome": "Pedro Oliveira",
      "cpf": "456.789.123-00",
      "percentualSociedade": 20.00,
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "perPage": 20,
    "totalPages": 1,
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

### GET /socios/resumo

**Request:**
```http
GET /api/v1/socios/resumo?dataInicio=2026-01-01&dataFim=2026-01-31
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "socio": {
        "id": "s1a2b3c4-d5e6-7890-stuv-w12345678901",
        "nome": "Joao Silva",
        "cpf": "123.456.789-00",
        "percentualSociedade": 50.00,
        "isActive": true
      },
      "totalProLabore": 8000.00,
      "totalDistribuicao": 15000.00,
      "totalRetiradas": 2000.00,
      "totalAportes": 0.00,
      "saldoTotal": 25000.00
    },
    {
      "socio": {
        "id": "s2b3c4d5-e6f7-8901-tuvw-x23456789012",
        "nome": "Maria Santos",
        "cpf": "987.654.321-00",
        "percentualSociedade": 30.00,
        "isActive": true
      },
      "totalProLabore": 6000.00,
      "totalDistribuicao": 9000.00,
      "totalRetiradas": 0.00,
      "totalAportes": 0.00,
      "saldoTotal": 15000.00
    },
    {
      "socio": {
        "id": "s3c4d5e6-f7a8-9012-uvwx-y34567890123",
        "nome": "Pedro Oliveira",
        "cpf": "456.789.123-00",
        "percentualSociedade": 20.00,
        "isActive": true
      },
      "totalProLabore": 4000.00,
      "totalDistribuicao": 6000.00,
      "totalRetiradas": 0.00,
      "totalAportes": 0.00,
      "saldoTotal": 10000.00
    }
  ],
  "meta": {
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

### POST /socios

**Request:**
```http
POST /api/v1/socios
Authorization: Bearer <token>
Content-Type: application/json

{
  "nome": "Ana Costa",
  "cpf": "111.222.333-44",
  "percentualSociedade": 0
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "s4d5e6f7-a8b9-0123-vwxy-z45678901234",
    "nome": "Ana Costa",
    "cpf": "111.222.333-44",
    "percentualSociedade": 0.00,
    "isActive": true,
    "createdAt": "2026-01-14T10:30:00.000Z",
    "updatedAt": "2026-01-14T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

---

## 10. Movimentacoes Socios

### GET /movimentacoes-socios

**Request:**
```http
GET /api/v1/movimentacoes-socios?socioId=s1a2b3c4-d5e6-7890-stuv-w12345678901&dataInicio=2026-01-01&dataFim=2026-01-31
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "m1a2b3c4-d5e6-7890-mnop-q12345678901",
      "socioId": "s1a2b3c4-d5e6-7890-stuv-w12345678901",
      "socioNome": "Joao Silva",
      "data": "2026-01-05",
      "tipo": "pro-labore",
      "descricao": "Pro-labore Janeiro/2026",
      "valor": 8000.00,
      "loja": null,
      "createdAt": "2026-01-05T00:00:00.000Z",
      "updatedAt": "2026-01-05T00:00:00.000Z"
    },
    {
      "id": "m2b3c4d5-e6f7-8901-nopq-r23456789012",
      "socioId": "s1a2b3c4-d5e6-7890-stuv-w12345678901",
      "socioNome": "Joao Silva",
      "data": "2026-01-20",
      "tipo": "distribuicao",
      "descricao": "Distribuicao Lucros Q4/2025",
      "valor": 15000.00,
      "loja": null,
      "createdAt": "2026-01-20T00:00:00.000Z",
      "updatedAt": "2026-01-20T00:00:00.000Z"
    },
    {
      "id": "m3c4d5e6-f7a8-9012-opqr-s34567890123",
      "socioId": "s1a2b3c4-d5e6-7890-stuv-w12345678901",
      "socioNome": "Joao Silva",
      "data": "2026-01-10",
      "tipo": "retirada",
      "descricao": "Retirada pessoal",
      "valor": 2000.00,
      "loja": null,
      "createdAt": "2026-01-10T00:00:00.000Z",
      "updatedAt": "2026-01-10T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 3,
    "page": 1,
    "perPage": 20,
    "totalPages": 1,
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

### POST /movimentacoes-socios

**Request:**
```http
POST /api/v1/movimentacoes-socios
Authorization: Bearer <token>
Content-Type: application/json

{
  "socioId": "s1a2b3c4-d5e6-7890-stuv-w12345678901",
  "data": "2026-01-25",
  "tipo": "pro-labore",
  "descricao": "Bonus performance",
  "valor": 3000.00,
  "lojaId": null
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "m4d5e6f7-a8b9-0123-pqrs-t45678901234",
    "socioId": "s1a2b3c4-d5e6-7890-stuv-w12345678901",
    "socioNome": "Joao Silva",
    "data": "2026-01-25",
    "tipo": "pro-labore",
    "descricao": "Bonus performance",
    "valor": 3000.00,
    "loja": null,
    "createdAt": "2026-01-14T10:30:00.000Z",
    "updatedAt": "2026-01-14T10:30:00.000Z"
  },
  "meta": {
    "timestamp": "2026-01-14T10:30:00.000Z"
  }
}
```

---

## 11. Balanco

### GET /balanco/mensal

**Request:**
```http
GET /api/v1/balanco/mensal?mes=1&ano=2026
Authorization: Bearer <token>
```

**Response (200 OK):**
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
        },
        {
          "categoria": "DESP - EXTRA",
          "valor": 1050.00,
          "percentualVenda": 1.97,
          "loja": null
        },
        {
          "categoria": "DESP - FUNCIONARIO",
          "valor": 7620.00,
          "percentualVenda": 14.29,
          "loja": null
        },
        {
          "categoria": "DESP - IMPOSTO",
          "valor": 3360.00,
          "percentualVenda": 6.30,
          "loja": null
        },
        {
          "categoria": "DESP - PARCELAMENTO",
          "valor": 1600.00,
          "percentualVenda": 3.00,
          "loja": null
        },
        {
          "categoria": "DESP - VEICULO",
          "valor": 1930.00,
          "percentualVenda": 3.62,
          "loja": null
        },
        {
          "categoria": "DESP - BANCO",
          "valor": 229.50,
          "percentualVenda": 0.43,
          "loja": null
        },
        {
          "categoria": "DESP - SOCIOS",
          "valor": 5000.00,
          "percentualVenda": 9.37,
          "loja": null
        },
        {
          "categoria": "DESP - CARTOES - TAXAS",
          "valor": 5066.16,
          "percentualVenda": 9.50,
          "loja": null
        }
      ],
      "total": 29225.56,
      "percentualTotal": 54.79
    },
    "vendas": {
      "items": [
        { "descricao": "DINHEIRO - DEPOSITO", "valor": 51000.00, "percentual": 95.61 },
        { "descricao": "DINHEIRO - SOBRA", "valor": 300.00, "percentual": 0.56 },
        { "descricao": "PAGAMENTO PDV", "valor": 200.00, "percentual": 0.37 },
        { "descricao": "PIX", "valor": 100.00, "percentual": 0.19 },
        { "descricao": "CREDITO", "valor": 350.00, "percentual": 0.66 },
        { "descricao": "DEBITO", "valor": 800.00, "percentual": 1.50 },
        { "descricao": "VOUCHER", "valor": 140.00, "percentual": 0.26 },
        { "descricao": "IFOOD", "valor": 450.00, "percentual": 0.84 }
      ],
      "total": 53340.00
    },
    "socios": {
      "items": [
        { "socio": "Joao Silva", "proLabore": 8000.00, "distribuicao": 15000.00, "total": 23000.00 },
        { "socio": "Maria Santos", "proLabore": 6000.00, "distribuicao": 9000.00, "total": 15000.00 },
        { "socio": "Pedro Oliveira", "proLabore": 4000.00, "distribuicao": 6000.00, "total": 10000.00 }
      ],
      "total": 48000.00
    },
    "investimento": 10500.00,
    "rendaExtra": 4550.00,
    "ativoImobilizado": { "entrada": 10000.00, "saida": 5000.00 }
  },
  "meta": { "timestamp": "2026-01-14T10:30:00.000Z" }
}
```

---

## 12. Dashboard

### GET /dashboard/resumo

**Request:**
```http
GET /api/v1/dashboard/resumo?dataInicio=2026-01-01&dataFim=2026-01-31
Authorization: Bearer <token>
```

**Response (200 OK):**
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
  },
  "meta": { "timestamp": "2026-01-14T10:30:00.000Z" }
}
```

### GET /dashboard/transacoes-recentes

**Request:**
```http
GET /api/v1/dashboard/transacoes-recentes?limit=5
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { "id": "t1", "descricao": "Aluguel Loja Centro", "categoria": "Despesa Fixa", "valor": -3500.00, "data": "2026-01-13", "tipo": "expense" },
    { "id": "t2", "descricao": "Venda Produtos", "categoria": "Receita", "valor": 12500.00, "data": "2026-01-12", "tipo": "income" },
    { "id": "t3", "descricao": "Folha Pagamento", "categoria": "Funcionarios", "valor": -8200.00, "data": "2026-01-10", "tipo": "expense" },
    { "id": "t4", "descricao": "Servico Consultoria", "categoria": "Renda Extra", "valor": 4500.00, "data": "2026-01-08", "tipo": "income" },
    { "id": "t5", "descricao": "Conta de Luz", "categoria": "Despesa Fixa", "valor": -890.00, "data": "2026-01-05", "tipo": "expense" }
  ],
  "meta": { "timestamp": "2026-01-14T10:30:00.000Z" }
}
```

---

## 13. Configuracoes

### PUT /configuracoes/:chave

**Request:**
```http
PUT /api/v1/configuracoes/colunas-despesa-fixa
Authorization: Bearer <token>
Content-Type: application/json

{
  "valor": {
    "colunas": [
      { "id": "data", "isVisible": true, "order": 1 },
      { "id": "descricao", "isVisible": true, "order": 2 },
      { "id": "valor", "isVisible": true, "order": 3 },
      { "id": "recorrencia", "isVisible": false, "order": 4 }
    ]
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "c1a2b3c4",
    "chave": "colunas-despesa-fixa",
    "valor": {
      "colunas": [
        { "id": "data", "isVisible": true, "order": 1 },
        { "id": "descricao", "isVisible": true, "order": 2 },
        { "id": "valor", "isVisible": true, "order": 3 },
        { "id": "recorrencia", "isVisible": false, "order": 4 }
      ]
    },
    "updatedAt": "2026-01-14T10:30:00.000Z"
  },
  "meta": { "timestamp": "2026-01-14T10:30:00.000Z" }
}
```

---

## 14. Erros Comuns

| Status | Codigo | Descricao |
|--------|--------|-----------|
| 400 | VALIDATION_ERROR | Dados invalidos |
| 401 | UNAUTHORIZED | Token invalido/expirado |
| 403 | FORBIDDEN | Sem permissao |
| 404 | NOT_FOUND | Recurso nao encontrado |
| 409 | CONFLICT | Duplicidade |
| 500 | INTERNAL_ERROR | Erro interno |

---

**Versao:** 1.0.0 | **Data:** 2026-01-14