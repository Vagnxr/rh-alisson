# Modulo Relatorios

## Descricao
Geracao de relatorios e visualizacoes de dados.

## Funcionalidades

### Tipos de Relatorios
- Relatorio financeiro mensal
- Relatorio de despesas
- Relatorio de fluxo de caixa
- Relatorio consolidado

### Filtros
- Por periodo
- Por loja
- Por categoria
- Por status

### Exportacao
- PDF
- Excel
- CSV

### Graficos
- Evolucao temporal
- Comparativo entre lojas
- Distribuicao por categoria

## Regras de Negocio
[A documentar com base na planilha original]

## Permissoes
- `relatorios.visualizar` - Ver relatorios
- `relatorios.exportar` - Exportar relatorios
- `relatorios.configurar` - Configurar relatorios customizados

## Mock de Dados
```text
src/mocks/relatorios.mock.json
```

## Contrato de API (esperado)
```typescript
interface RelatorioParams {
  tipo: 'financeiro' | 'despesas' | 'fluxo-caixa' | 'consolidado';
  periodoInicio: string;
  periodoFim: string;
  lojaIds?: string[];
  categorias?: string[];
  formato: 'json' | 'pdf' | 'excel' | 'csv';
}

// POST /api/relatorios/gerar
```
