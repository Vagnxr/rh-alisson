# Contratos de API

## Estrategia

### Fase Atual: Frontend Mockado
O frontend define os contratos que a API devera seguir. Isso permite:
- Validar UX antes do backend
- Definir payloads esperados
- Reduzir retrabalho

### Fase Futura: Integracao com Backend
Os contratos definidos aqui serao a base para o desenvolvimento do backend.

## Padrao de Endpoints

### Estrutura REST
```
GET    /api/{recurso}          # Listar
GET    /api/{recurso}/:id      # Detalhe
POST   /api/{recurso}          # Criar
PUT    /api/{recurso}/:id      # Atualizar
DELETE /api/{recurso}/:id      # Excluir
```

### Query Parameters Comuns
- `lojaId`: filtrar por loja
- `page`, `limit`: paginacao
- `sort`, `order`: ordenacao
- `search`: busca textual
- `status`: filtro por status

## Contratos Base

### Response Padrao
```typescript
interface ApiResponse<T> {
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

### Entidades Comuns
```typescript
interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

interface TenantEntity extends BaseEntity {
  tenantId: string;
}

interface LojaEntity extends TenantEntity {
  lojaId: string;
}
```

## Autenticacao (Futuro)
```typescript
// Headers obrigatorios
Authorization: Bearer {token}

// Response de login
interface LoginResponse {
  token: string;
  user: {
    id: string;
    nome: string;
    email: string;
    tenantId: string;
    lojas: string[];
    permissoes: string[];
  };
}
```

## Documentacao de Endpoints
Cada modulo documenta seus endpoints em:
- `docs/02-modulos/{modulo}.md` - secao "Contrato de API"

## Mock de Dados
Mocks ficam em `src/mocks/`:
```text
src/mocks/
├── financeiro.mock.json
├── despesas.mock.json
├── fluxo-caixa.mock.json
├── consolidacao.mock.json
└── dashboard.mock.json
```
