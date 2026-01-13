# Modelo de Dados

## Entidades Principais

### Tenant (Empresa)
```typescript
interface Tenant {
  id: string;
  nome: string;
  cnpj: string;
  configuracoes: TenantConfig;
  createdAt: string;
  updatedAt: string;
}

interface TenantConfig {
  moeda: string;
  timezone: string;
  // outras configuracoes
}
```

### Loja
```typescript
interface Loja {
  id: string;
  tenantId: string;
  nome: string;
  codigo: string;
  endereco?: string;
  ativa: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Usuario
```typescript
interface Usuario {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  lojas: string[];  // IDs das lojas que pode acessar
  permissoes: string[];
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Permissao
```typescript
type Permissao = 
  | 'financeiro.visualizar'
  | 'financeiro.editar'
  | 'financeiro.excluir'
  | 'despesas.visualizar'
  | 'despesas.editar'
  | 'despesas.aprovar'
  // ... outras permissoes
```

## Entidades de Negocio

### FinanceiroItem
[A definir com base na planilha]

### DespesaItem
[A definir com base na planilha]

### FluxoCaixaItem
[A definir com base na planilha]

## Relacionamentos

```text
Tenant (1) -> (N) Loja
Tenant (1) -> (N) Usuario
Usuario (N) -> (N) Loja (via lojas[])
Loja (1) -> (N) FinanceiroItem
Loja (1) -> (N) DespesaItem
Loja (1) -> (N) FluxoCaixaItem
```

## Isolamento Multi-tenant

### Row Level Security (RLS)
Todas as queries devem filtrar por `tenantId`:
```sql
-- Exemplo de politica RLS
CREATE POLICY tenant_isolation ON financeiro
  USING (tenant_id = current_tenant_id());
```

### Validacao na API
Toda requisicao deve validar:
1. Usuario autenticado
2. Usuario pertence ao tenant
3. Usuario tem permissao para a acao
4. Se multi-loja, usuario tem acesso a loja

## Auditoria (Futuro)
```typescript
interface AuditLog {
  id: string;
  tenantId: string;
  usuarioId: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  dadosAntigos?: object;
  dadosNovos?: object;
  ip?: string;
  createdAt: string;
}
```
