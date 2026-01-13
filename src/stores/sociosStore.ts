import { create } from 'zustand';
import type { DespesaBase, DespesaInput } from '@/types/despesa';

interface SociosState {
  items: DespesaBase[];
  isLoading: boolean;
  error: string | null;
}

interface SociosActions {
  fetchItems: () => Promise<void>;
  addItem: (data: DespesaInput) => Promise<void>;
  updateItem: (id: string, data: Partial<DespesaInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

type SociosStore = SociosState & SociosActions;

const mockData: DespesaBase[] = [
  { id: '1', data: '2026-01-05', descricao: 'Pro-labore - Socio 1', valor: 8000.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-05', descricao: 'Pro-labore - Socio 2', valor: 8000.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-20', descricao: 'Distribuicao Lucros', valor: 15000.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

export const useSociosStore = create<SociosStore>((set) => ({
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
