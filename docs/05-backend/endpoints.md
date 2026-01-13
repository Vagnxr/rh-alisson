# Endpoints da API

## Visao Geral

Documentacao dos endpoints esperados pela aplicacao.

## Autenticacao

### POST /api/auth/login
```typescript
// Request
{ email: string; password: string }

// Response
{
  token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    tenantId: string;
    lojas: string[];
    permissoes: string[];
  }
}
```

### POST /api/auth/logout
```typescript
// Request
Authorization: Bearer {token}

// Response
{ success: true }
```

## Financeiro

### GET /api/financeiro
```typescript
// Query params
?lojaId=xxx&page=1&limit=20&sort=createdAt&order=desc

// Response
{
  data: FinanceiroItem[];
  meta: { page, limit, total, totalPages }
}
```

### POST /api/financeiro
```typescript
// Request
FinanceiroInput

// Response
{ data: FinanceiroItem }
```

### PUT /api/financeiro/:id
```typescript
// Request
Partial<FinanceiroInput>

// Response
{ data: FinanceiroItem }
```

### DELETE /api/financeiro/:id
```typescript
// Response
{ success: true }
```

## Despesas

### GET /api/despesas
```typescript
// Query params
?lojaId=xxx&status=pendente&page=1&limit=20

// Response
{
  data: DespesaItem[];
  meta: { page, limit, total, totalPages }
}
```

### POST /api/despesas
### PUT /api/despesas/:id
### DELETE /api/despesas/:id

## Fluxo de Caixa

### GET /api/fluxo-caixa
```typescript
// Query params
?lojaId=xxx&dataInicio=2024-01-01&dataFim=2024-01-31

// Response
{
  data: FluxoCaixaItem[];
  meta: { page, limit, total, totalPages }
}
```

### POST /api/fluxo-caixa
### PUT /api/fluxo-caixa/:id
### DELETE /api/fluxo-caixa/:id

## Consolidacao

### GET /api/consolidacao
```typescript
// Query params
?periodo=2024-01

// Response
{
  data: ConsolidacaoItem[];
  totais: {
    receitas: number;
    despesas: number;
    saldo: number;
  }
}
```

## Relatorios

### POST /api/relatorios/gerar
```typescript
// Request
{
  tipo: 'financeiro' | 'despesas' | 'fluxo-caixa' | 'consolidado';
  periodoInicio: string;
  periodoFim: string;
  lojaIds?: string[];
  formato: 'json' | 'pdf' | 'excel' | 'csv';
}

// Response
// Se formato = json: dados direto
// Outros: URL para download
```

## Lojas

### GET /api/lojas
```typescript
// Response
{ data: Loja[] }
```

## Usuarios

### GET /api/usuarios
### POST /api/usuarios
### PUT /api/usuarios/:id
### DELETE /api/usuarios/:id

## Codigos de Erro

| Codigo | Significado |
|--------|-------------|
| 400 | Bad Request - dados invalidos |
| 401 | Unauthorized - nao autenticado |
| 403 | Forbidden - sem permissao |
| 404 | Not Found - recurso nao encontrado |
| 409 | Conflict - conflito de dados |
| 500 | Internal Server Error |
