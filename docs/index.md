# Plataforma Financeira & Operacional - Documentacao

Esta pasta contem a documentacao oficial (PT-BR) para o desenvolvimento do frontend da Plataforma Financeira.

## Como ler (ordem recomendada)
- [00-start-here/index.md](00-start-here/index.md)
  - [/dev-workflow.md](00-start-here/dev-workflow.md)
  - [/setup-local.md](00-start-here/setup-local.md)
  - [/estrutura-do-projeto.md](00-start-here/estrutura-do-projeto.md)
- [01-produto/visao-e-pilares.md](01-produto/visao-e-pilares.md)
  - [/requisitos-negocio.md](01-produto/requisitos-negocio.md)
  - [/abas-planilha.md](01-produto/abas-planilha.md)
- [02-modulos/index.md](02-modulos/index.md)
  - [/financeiro.md](02-modulos/financeiro.md)
  - [/fluxo-caixa.md](02-modulos/fluxo-caixa.md)
  - [/despesas.md](02-modulos/despesas.md)
  - [/consolidacao.md](02-modulos/consolidacao.md)
  - [/relatorios.md](02-modulos/relatorios.md)
- [03-ux-ui/design-system.md](03-ux-ui/design-system.md)
  - [/dashboard.md](03-ux-ui/dashboard.md)
  - [/tabelas.md](03-ux-ui/tabelas.md)
  - [/formularios.md](03-ux-ui/formularios.md)
- [04-arquitetura/visao-geral.md](04-arquitetura/visao-geral.md)
  - [/padroes.md](04-arquitetura/padroes.md)
  - [/estado.md](04-arquitetura/estado.md)
  - [/contratos-api.md](04-arquitetura/contratos-api.md)
- [05-backend/estrategia.md](05-backend/estrategia.md)
  - [/modelo-de-dados.md](05-backend/modelo-de-dados.md)
  - [/endpoints.md](05-backend/endpoints.md)
- [06-frontend/stack-e-convencoes.md](06-frontend/stack-e-convencoes.md)
  - [/state-management.md](06-frontend/state-management.md)
  - [/performance.md](06-frontend/performance.md)
  - [/componentes.md](06-frontend/componentes.md)
- [07-qualidade/testing.md](07-qualidade/testing.md)
  - [/observabilidade.md](07-qualidade/observabilidade.md)
- [08-roadmap/mvp.md](08-roadmap/mvp.md)
  - [/backlog.md](08-roadmap/backlog.md)

## Decisoes normativas

### Principios fundamentais
- Interface orientada a tabelas (semelhante ao Excel)
- Entrada rapida de dados
- Multi-tenant (isolamento por empresa)
- Multi-loja (consolidacao e visao individual)
- Sistema de permissoes por modulo e acao

### Estrategia de desenvolvimento
- Frontend 100% mockado inicialmente
- Validacao de UX e regras de calculo antes do backend
- Contratos de API definidos pelo frontend

### Stack tecnologica
- React + Vite + TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Table para tabelas dinamicas
- Zustand para estado global
- React Hook Form + Zod para formularios

## Nota sobre recencia
As fontes foram avaliadas por autoridade + recencia. Veja: [99-apendice/fontes-e-recencia.md](99-apendice/fontes-e-recencia.md)
