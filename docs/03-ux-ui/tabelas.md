# Tabelas Dinamicas

## Visao Geral
Grande parte do sistema gira em torno de tabelas dinamicas, que devem suportar comportamento semelhante ao Excel.

## Requisitos Funcionais

### Colunas
- Variaveis (ativar/desativar visibilidade)
- Reordenacao (drag and drop)
- Redimensionamento
- Configuracao de quais entram no calculo total

### Linhas
- Destaque por status (cores, icones)
- Selecao multipla
- Acoes em lote

### Ordenacao e Filtragem
- Ordenacao por qualquer coluna
- Filtros por coluna
- Busca global
- Filtros salvos

### Paginacao
- Paginacao server-side (quando necessario)
- Configuracao de itens por pagina
- Navegacao rapida

### Totalizadores
- Total geral
- Total por loja (quando multi-loja)
- Subtotais por grupo (quando agrupado)

## Configuracao via Metadados
Cada tabela deve ser configuravel via metadados, nao fixa em codigo:

```typescript
interface TableConfig {
  columns: ColumnConfig[];
  defaultSort: { column: string; direction: 'asc' | 'desc' };
  filters: FilterConfig[];
  pagination: { defaultPageSize: number };
  totals: { enabled: boolean; columns: string[] };
}

interface ColumnConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'status';
  visible: boolean;
  sortable: boolean;
  filterable: boolean;
  includeInTotal: boolean;
  format?: string;
}
```

## Tecnologia
- TanStack Table (React Table v8)
- Virtualizacao para grandes volumes (TanStack Virtual)

## Acessibilidade
- Navegacao por teclado
- ARIA labels
- Contraste adequado

## Performance
- Virtualizacao para listas grandes
- Debounce em filtros
- Lazy loading de dados
