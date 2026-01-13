# Padroes de Arquitetura

## Padroes Adotados

### Atomic Design (Componentes)
Organizacao de componentes por complexidade:
- **Atoms**: inputs, buttons, badges
- **Molecules**: campos compostos, filtros
- **Organisms**: tabelas, formularios completos
- **Templates**: layouts de pagina

### Hooks Pattern (Logica)
Logica desacoplada da UI:
```typescript
// useFinanceData.ts
export function useFinanceData() {
  const data = useFinanceStore(s => s.data);
  const isLoading = useFinanceStore(s => s.isLoading);
  const fetchData = useFinanceStore(s => s.fetchData);

  return { data, isLoading, fetchData };
}
```

### Service Pattern (API)
Comunicacao com API isolada:
```typescript
// finance.service.ts
export const financeService = {
  async getAll() {
    // Em fase mock: retorna dados do mock
    // Em fase API: fetch real
  },
  async create(data: FinanceInput) {
    // ...
  },
};
```

### Mapper Pattern (Conversao)
Conversao entre formatos de API e UI:
```typescript
// finance.mapper.ts
export function mapApiToUI(apiData: ApiFinanceItem): FinanceItem {
  return {
    id: apiData.id,
    valor: formatCurrency(apiData.valor),
    // ...
  };
}
```

## Fluxo de Dados

```text
Page -> Hook -> Service -> Mapper -> UI
```

### Exemplo Completo

```typescript
// 1. Page
function FinancePage() {
  const { data, isLoading, fetchData } = useFinanceData();
  
  useEffect(() => { fetchData(); }, []);
  
  return <FinanceTable data={data} loading={isLoading} />;
}

// 2. Hook
function useFinanceData() {
  const data = useFinanceStore(s => s.data);
  const fetchData = useFinanceStore(s => s.fetchData);
  return { data, fetchData };
}

// 3. Store
const useFinanceStore = create((set) => ({
  data: [],
  fetchData: async () => {
    const raw = await financeService.getAll();
    const mapped = raw.map(mapApiToUI);
    set({ data: mapped });
  },
}));

// 4. Service
const financeService = {
  getAll: async () => mockData, // ou fetch real
};

// 5. Mapper
const mapApiToUI = (item) => ({ ...item, formatted: true });
```

## Anti-patterns a Evitar

- Logica de negocio em componentes
- Fetch direto em componentes
- Estado local para dados globais
- Acoplamento entre modulos
