# Estrategia de Backend

## Fase Atual: Backend a Implementar

O frontend ja esta preparado para consumir a API (stores com `columns`, paginas usando contrato). A pasta **docs/05-backend/** e a fonte de verdade para o agent implementar o backend.

### Stack Definida
- **Runtime:** Node.js 18+
- **Framework:** NestJS
- **ORM:** Prisma
- **Banco:** PostgreSQL 14+
- **Auth:** JWT (access + refresh token)

### Documentos da Pasta 05-backend (ordem para o agent)
1. **01-contrato-frontend-backend.md** – Contrato por pagina (endpoints, request/response, colunas de tabela).
2. **02-prisma-nestjs-implementacao.md** – Schema Prisma completo e ordem de implementacao dos modulos.
3. **api-specification.md** – Padroes gerais (resposta, erros, auth, multi-tenancy).
4. **dtos-e-tipos.md** – DTOs e tipos para validacao e resposta.
5. **endpoints.md** – Resumo historico; detalhes em 01-contrato.
6. **modelo-de-dados.md** – Visao conceitual; schema de implementacao no 02-prisma.

---

## Fase Anterior: Frontend Mockado

O frontend foi desenvolvido mockado (stores com dados locais). Objetivos cumpridos:
- Validar UX e regras
- Definir contratos de API (01-contrato)
- Reduzir retrabalho no backend

## Requisitos do Backend

- API REST (padrao success/data/error conforme api-specification.md)
- Autenticacao JWT e autorizacao por role/tenant
- Multi-tenant (isolamento por empresa; Super Admin com X-Tenant-Id)
- Multi-loja (dados por loja quando aplicavel)
- **Colunas de tabela:** listagens que alimentam tabelas devem retornar `columns` (configuracao do usuario) – ver 01-contrato.

## Consideracoes sobre Offline (Futuro)

O sistema sera preparado para evolucao offline (cache, Service Workers). Nao e requisito da implementacao inicial.
