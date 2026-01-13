import { create } from 'zustand';
import type { Parcelamento, ParcelamentoInput } from '@/types/parcelamento';

interface ParcelamentoState {
  items: Parcelamento[];
  isLoading: boolean;
  error: string | null;
}

interface ParcelamentoActions {
  fetchItems: () => Promise<void>;
  addItem: (data: ParcelamentoInput) => Promise<void>;
  updateItem: (id: string, data: Partial<ParcelamentoInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

type ParcelamentoStore = ParcelamentoState & ParcelamentoActions;

const mockData: Parcelamento[] = [
  { id: '1', data: '2026-01-05', descricao: 'Notebook Dell', parcela: '3/12', valor: 450.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-10', descricao: 'Ar Condicionado', parcela: '5/10', valor: 320.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-15', descricao: 'Impressora Multifuncional', parcela: '2/6', valor: 180.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '4', data: '2026-01-20', descricao: 'Moveis Escritorio', parcela: '8/24', valor: 650.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

export const useParcelamentoStore = create<ParcelamentoStore>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ items: mockData, isLoading: false });
  },

  addItem: async (data: ParcelamentoInput) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newItem: Parcelamento = {
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

  updateItem: async (id: string, data: Partial<ParcelamentoInput>) => {
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
