# Modulo Consolidacao

## Descricao
Visao consolidada de dados de todas as lojas.

## Funcionalidades

### Dashboard Consolidado
- Resumo financeiro geral
- Comparativo entre lojas
- Graficos de desempenho

### Tabelas Consolidadas
- Dados agregados por loja
- Totais gerais
- Drill-down para detalhes

### Calculos
- Totais por loja
- Media entre lojas
- Percentual de participacao
[Detalhes a documentar com base na planilha original]

## Regras de Negocio
[A documentar com base na planilha original]

## Permissoes
- `consolidacao.visualizar` - Ver dados consolidados
- `consolidacao.exportar` - Exportar relatorios

## Mock de Dados
```text
src/mocks/consolidacao.mock.json
```

## Contrato de API (esperado)
```typescript
interface ConsolidacaoItem {
  lojaId: string;
  lojaNome: string;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  percentualParticipacao: number;
  periodo: string;
}

// GET /api/consolidacao?periodo=2024-01
```
