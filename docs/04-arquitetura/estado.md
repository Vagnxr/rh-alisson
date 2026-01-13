# Gerenciamento de Estado

## Tecnologia
- **Zustand**: estado global simples e performatico

## Tipos de Estado

### Estado Global (Stores)
Dados compartilhados entre componentes:
- Dados de modulos (financeiro, despesas, etc.)
- Usuario autenticado
- Configuracoes da aplicacao
- Loja selecionada (multi-loja)

### Estado Local (useState)
Estado especifico de um componente:
- Estado de UI (aberto/fechado)
- Valores temporarios de formularios
- Estados de loading locais

### Estado de Servidor (React Query - futuro)
Cache de dados da API:
- Dados fetchados
- Estados de loading/error
- Invalidacao automatica

## Estrutura de Store

```typescript
// stores/financeStore.ts
import { create } from 'zustand';
import { FinanceItem } from '@/types';

interface FinanceState {
  items: FinanceItem[];
  isLoading: boolean;
  error: string | null;
  selectedLojaId: string | null;
  
  // Actions
  fetchItems: () => Promise<void>;
  addItem: (item: FinanceItem) => void;
  updateItem: (id: string, data: Partial<FinanceItem>) => void;
  deleteItem: (id: string) => void;
  setSelectedLoja: (lojaId: string | null) => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  selectedLojaId: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await financeService.getAll();
      set({ items: data, isLoading: false });
    } catch (e) {
      set({ error: 'Erro ao carregar dados', isLoading: false });
    }
  },

  addItem: (item) => {
    set((state) => ({ items: [...state.items, item] }));
  },

  updateItem: (id, data) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...data } : item
      ),
    }));
  },

  deleteItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    }));
  },

  setSelectedLoja: (lojaId) => {
    set({ selectedLojaId: lojaId });
  },
}));
```

## Boas Praticas

### Seletores Granulares
```typescript
// Bom: seleciona apenas o que precisa
const items = useFinanceStore((s) => s.items);
const isLoading = useFinanceStore((s) => s.isLoading);

// Evitar: desestruturar toda a store
const { items, isLoading, ... } = useFinanceStore();
```

### Estado Derivado
```typescript
// Derivar dados quando possivel
const totalItems = useFinanceStore((s) => s.items.length);
const itemsFiltered = useFinanceStore((s) => 
  s.items.filter(i => i.lojaId === s.selectedLojaId)
);
```

### Imutabilidade
```typescript
// Sempre criar novos objetos/arrays
set((state) => ({
  items: [...state.items, newItem],  // Correto
}));

// Nunca mutar diretamente
state.items.push(newItem);  // Errado
```
