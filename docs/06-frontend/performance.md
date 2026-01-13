# Performance

## Principios

### Renderizacao Eficiente
- Seletores granulares em stores
- Memoizacao quando necessario
- Evitar re-renders desnecessarios

### Carregamento Otimizado
- Code splitting por rota
- Lazy loading de componentes pesados
- Imagens otimizadas

## Tabelas com Muitos Dados

### Virtualizacao
Para tabelas com muitas linhas, usar TanStack Virtual:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualTable({ data }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
  });

  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <Row key={item.key} data={data[item.index]} />
        ))}
      </div>
    </div>
  );
}
```

### Paginacao Server-side
Para volumes muito grandes, paginar no servidor:
```typescript
// Request
GET /api/financeiro?page=1&limit=50

// Response inclui metadados de paginacao
{ data: [], meta: { page, limit, total, totalPages } }
```

## Formularios

### Debounce em Filtros
```typescript
import { useDebouncedCallback } from 'use-debounce';

function SearchInput() {
  const search = useStore((s) => s.search);
  const setSearch = useStore((s) => s.setSearch);

  const debouncedSearch = useDebouncedCallback((value) => {
    setSearch(value);
  }, 300);

  return <input onChange={(e) => debouncedSearch(e.target.value)} />;
}
```

## Metricas

### Core Web Vitals
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

### Monitoramento
- Lighthouse para auditoria
- React DevTools Profiler para renderizacoes
- Network tab para requests

## Boas Praticas

### Evitar
- Fetch em cascata (waterfall)
- Importacoes desnecessarias
- Componentes muito grandes
- Re-renders por referencia quebrada

### Preferir
- Fetch paralelo quando possivel
- Tree shaking de libs
- Componentes pequenos e focados
- Memoizacao seletiva
