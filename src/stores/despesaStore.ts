import { create } from 'zustand';
import type { DespesaBase, DespesaInput, DespesaCategoria } from '@/types/despesa';

interface DespesaState {
  items: DespesaBase[];
  isLoading: boolean;
  error: string | null;
}

interface DespesaActions {
  fetchItems: () => Promise<void>;
  addItem: (data: DespesaInput) => Promise<void>;
  updateItem: (id: string, data: Partial<DespesaInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

type DespesaStore = DespesaState & DespesaActions;

// Factory para criar stores de despesa
function createDespesaStore(categoria: DespesaCategoria, mockData: DespesaBase[]) {
  return create<DespesaStore>((set) => ({
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
}

// Mock data para cada categoria
const mockDespesaFixa: DespesaBase[] = [
  { id: '1', data: '2026-01-05', descricao: 'Aluguel', valor: 2500.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-10', descricao: 'Internet', valor: 150.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-15', descricao: 'Energia Eletrica', valor: 450.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '4', data: '2026-01-20', descricao: 'Agua', valor: 180.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '5', data: '2026-01-25', descricao: 'Telefone', valor: 89.9, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const mockDespesaExtra: DespesaBase[] = [
  { id: '1', data: '2026-01-03', descricao: 'Material de Escritorio', valor: 320.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-08', descricao: 'Manutencao Ar Condicionado', valor: 450.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-12', descricao: 'Limpeza Especializada', valor: 280.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const mockDespesaFuncionario: DespesaBase[] = [
  { id: '1', data: '2026-01-05', descricao: 'Salario - Joao Silva', valor: 3500.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-05', descricao: 'Salario - Maria Santos', valor: 2800.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-10', descricao: 'Vale Transporte', valor: 440.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '4', data: '2026-01-10', descricao: 'Vale Alimentacao', valor: 880.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const mockDespesaImposto: DespesaBase[] = [
  { id: '1', data: '2026-01-15', descricao: 'ICMS', valor: 1250.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-20', descricao: 'ISS', valor: 580.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-20', descricao: 'INSS', valor: 890.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '4', data: '2026-01-20', descricao: 'FGTS', valor: 640.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const mockDespesaVeiculo: DespesaBase[] = [
  { id: '1', data: '2026-01-02', descricao: 'Combustivel - Gol', valor: 350.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-08', descricao: 'Combustivel - Fiorino', valor: 420.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-12', descricao: 'Troca de Oleo - Gol', valor: 180.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '4', data: '2026-01-18', descricao: 'IPVA - Gol', valor: 980.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const mockDespesaBanco: DespesaBase[] = [
  { id: '1', data: '2026-01-05', descricao: 'Tarifa Mensal - Bradesco', valor: 45.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-05', descricao: 'Tarifa Mensal - Itau', valor: 52.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-10', descricao: 'TED para Fornecedor', valor: 12.5, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '4', data: '2026-01-15', descricao: 'Anuidade Cartao', valor: 120.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

// Exportar stores
export const useDespesaFixaStore = createDespesaStore('despesa-fixa', mockDespesaFixa);
export const useDespesaExtraStore = createDespesaStore('despesa-extra', mockDespesaExtra);
export const useDespesaFuncionarioStore = createDespesaStore('despesa-funcionario', mockDespesaFuncionario);
export const useDespesaImpostoStore = createDespesaStore('despesa-imposto', mockDespesaImposto);
export const useDespesaVeiculoStore = createDespesaStore('despesa-veiculo', mockDespesaVeiculo);
export const useDespesaBancoStore = createDespesaStore('despesa-banco', mockDespesaBanco);

// Mapeamento de stores por categoria
export const despesaStores = {
  'despesa-fixa': useDespesaFixaStore,
  'despesa-extra': useDespesaExtraStore,
  'despesa-funcionario': useDespesaFuncionarioStore,
  'despesa-imposto': useDespesaImpostoStore,
  'despesa-veiculo': useDespesaVeiculoStore,
  'despesa-banco': useDespesaBancoStore,
} as const;
