# State Management

## Tecnologia Principal
- **Zustand**: estado global simples e performatico

## Quando Usar Cada Tipo de Estado

### Estado Global (Zustand)
- Dados de modulos (financeiro, despesas, etc.)
- Usuario autenticado
- Loja selecionada
- Configuracoes da aplicacao

### Estado Local (useState)
- Estado de UI (modal aberto/fechado)
- Valores temporarios
- Estados de loading locais

### Estado de Form (React Hook Form)
- Valores de formulario
- Validacao
- Estado de submissao

## Estrutura de Stores

```text
src/stores/
├── authStore.ts        # Autenticacao e usuario
├── lojaStore.ts        # Loja selecionada
├── financeStore.ts     # Dados financeiros
├── despesaStore.ts     # Dados de despesas
├── fluxoCaixaStore.ts  # Dados de fluxo de caixa
└── uiStore.ts          # Estado global de UI
```

## Padrao de Store

```typescript
import { create } from 'zustand';

interface ExemploState {
  // Estado
  items: Item[];
  isLoading: boolean;
  error: string | null;
  
  // Acoes
  fetchItems: () => Promise<void>;
  addItem: (item: Item) => void;
  updateItem: (id: string, data: Partial<Item>) => void;
  deleteItem: (id: string) => void;
  reset: () => void;
}

const initialState = {
  items: [],
  isLoading: false,
  error: null,
};

export const useExemploStore = create<ExemploState>((set, get) => ({
  ...initialState,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await exemploService.getAll();
      set({ items: data, isLoading: false });
    } catch (e) {
      set({ error: 'Erro ao carregar', isLoading: false });
    }
  },

  addItem: (item) => {
    set((s) => ({ items: [...s.items, item] }));
  },

  updateItem: (id, data) => {
    set((s) => ({
      items: s.items.map((i) => (i.id === id ? { ...i, ...data } : i)),
    }));
  },

  deleteItem: (id) => {
    set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },

  reset: () => set(initialState),
}));
```

## Boas Praticas

### Seletores Granulares
```typescript
// Bom: seleciona apenas o necessario
const items = useFinanceStore((s) => s.items);
const isLoading = useFinanceStore((s) => s.isLoading);

// Evitar: desestruturar toda a store
const { items, isLoading } = useFinanceStore();
```

### Estado Derivado
```typescript
// Computar valores derivados
const itemsFiltrados = useFinanceStore((s) =>
  s.items.filter((i) => i.lojaId === s.selectedLojaId)
);

const total = useFinanceStore((s) =>
  s.items.reduce((acc, i) => acc + i.valor, 0)
);
```

### Imutabilidade
```typescript
// Sempre criar novos objetos
set((s) => ({ items: [...s.items, newItem] }));

// Nunca mutar diretamente
s.items.push(newItem); // ERRADO
```
