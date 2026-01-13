import { create } from 'zustand';
import type { DespesaFixa, DespesaFixaInput } from '@/types/despesa';

interface DespesaFixaState {
  items: DespesaFixa[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchItems: () => Promise<void>;
  addItem: (data: DespesaFixaInput) => Promise<void>;
  updateItem: (id: string, data: Partial<DespesaFixaInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

// Mock de dados iniciais
const mockData: DespesaFixa[] = [
  {
    id: '1',
    data: '2026-01-05',
    descricao: 'Aluguel',
    valor: 2500.0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    data: '2026-01-10',
    descricao: 'Internet',
    valor: 150.0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '3',
    data: '2026-01-15',
    descricao: 'Energia Eletrica',
    valor: 450.0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '4',
    data: '2026-01-20',
    descricao: 'Agua',
    valor: 180.0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '5',
    data: '2026-01-25',
    descricao: 'Telefone',
    valor: 89.9,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

export const useDespesaFixaStore = create<DespesaFixaState>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });

    // Simula delay de API
    await new Promise((resolve) => setTimeout(resolve, 500));

    set({ items: mockData, isLoading: false });
  },

  addItem: async (data: DespesaFixaInput) => {
    set({ isLoading: true, error: null });

    await new Promise((resolve) => setTimeout(resolve, 300));

    const newItem: DespesaFixa = {
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

  updateItem: async (id: string, data: Partial<DespesaFixaInput>) => {
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
