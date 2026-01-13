# Modulos do Sistema

Este documento descreve os modulos principais da Plataforma Financeira & Operacional.

## Visao Geral

A plataforma e dividida em modulos que correspondem as abas da planilha original. Cada modulo possui:
- Pagina(s) dedicada(s)
- Tabelas dinamicas configuraveis
- Calculos especificos
- Permissoes granulares

## Modulos Principais

| Modulo | Descricao | Prioridade |
|--------|-----------|------------|
| Financeiro | Controle financeiro geral | P1 |
| Fluxo de Caixa | Entrada e saida de recursos | P1 |
| Despesas | Gestao de despesas | P1 |
| Consolidacao | Visao consolidada multi-loja | P2 |
| Relatorios | Relatorios e dashboards | P2 |

## Documentacao por Modulo
- [Financeiro](financeiro.md)
- [Fluxo de Caixa](fluxo-caixa.md)
- [Despesas](despesas.md)
- [Consolidacao](consolidacao.md)
- [Relatorios](relatorios.md)

## Padrao de Modulo

Cada modulo segue o padrao:

```text
src/modules/[modulo]/
├── components/          # Componentes especificos do modulo
├── hooks/               # Hooks do modulo
├── services/            # Services de API (futuro)
├── types/               # Types do modulo
└── [Modulo]Page.tsx     # Pagina principal
```

## Regras de Negocio

Todas as regras de negocio devem:
1. Ser identicas a planilha original
2. Estar documentadas nesta pasta
3. Ter testes unitarios
4. Ser configuraveis via metadados quando possivel
