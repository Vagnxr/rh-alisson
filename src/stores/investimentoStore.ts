import { create } from 'zustand';
import type { DespesaBase, DespesaInput } from '@/types/despesa';

interface InvestimentoState {
  items: DespesaBase[];
  isLoading: boolean;
  error: string | null;
}

interface InvestimentoActions {
  fetchItems: () => Promise<void>;
  addItem: (data: DespesaInput) => Promise<void>;
  updateItem: (id: string, data: Partial<DespesaInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

type InvestimentoStore = InvestimentoState & InvestimentoActions;

const mockData: DespesaBase[] = [
  { id: '1', data: '2026-01-02', descricao: 'CDB Banco Inter', valor: 5000.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-08', descricao: 'Tesouro Selic', valor: 3000.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-15', descricao: 'Fundo Imobiliario XPML11', valor: 2500.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

export const useInvestimentoStore = create<InvestimentoStore>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ items: mockData, isLoading: false });
  },

  addItem: async (data: DespesaInput) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newItem: DespesaBase = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      items: [...state.items, newItem],
      isLoading: false,
    }));
  },

  updateItem: async (id: string, data: Partial<DespesaInput>) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...item, ...data, updatedAt: new Date().toISOString() }
          : item
      ),
      isLoading: false,
    }));
  },

  deleteItem: async (id: string) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      isLoading: false,
    }));
  },
}));
