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
  { id: '1', data: '2026-01-05', tipo: 'ALUGUEL', descricao: 'Aluguel', valor: 2500.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-10', tipo: 'INTERNET', descricao: 'Internet', valor: 150.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-15', tipo: 'LUZ', descricao: 'Energia Eletrica', valor: 450.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '4', data: '2026-01-20', tipo: 'AGUA', descricao: 'Agua', valor: 180.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '5', data: '2026-01-25', tipo: 'TELEFONE', descricao: 'Telefone', valor: 89.9, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const mockDespesaExtra: DespesaBase[] = [
  { id: '1', data: '2026-01-03', tipo: 'MATERIAL', descricao: 'Material de Escritorio', valor: 320.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-08', tipo: 'MANUTENCAO', descricao: 'Manutencao Ar Condicionado', valor: 450.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-12', tipo: 'SERVICO', descricao: 'Limpeza Especializada', valor: 280.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const mockDespesaFuncionario: DespesaBase[] = [
  { id: '1', data: '2026-01-05', tipo: 'SALARIO', descricao: 'Salario - Joao Silva', valor: 3500.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-05', tipo: 'SALARIO', descricao: 'Salario - Maria Santos', valor: 2800.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-10', tipo: 'VALE TRANSPORTE', descricao: 'Vale Transporte', valor: 440.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '4', data: '2026-01-10', tipo: 'VALE ALIMENTACAO', descricao: 'Vale Alimentacao', valor: 880.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const mockDespesaImposto: DespesaBase[] = [
  { id: '1', data: '2026-01-15', tipo: 'ICMS', descricao: 'ICMS', valor: 1250.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-20', tipo: 'ISS', descricao: 'ISS', valor: 580.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-20', tipo: 'INSS', descricao: 'INSS', valor: 890.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '4', data: '2026-01-20', tipo: 'FGTS', descricao: 'FGTS', valor: 640.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const mockDespesaVeiculo: DespesaBase[] = [
  { id: '1', data: '2026-01-02', tipo: 'COMBUSTIVEL', descricao: 'Combustivel - Gol', valor: 350.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-08', tipo: 'COMBUSTIVEL', descricao: 'Combustivel - Fiorino', valor: 420.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-12', tipo: 'MANUTENCAO', descricao: 'Troca de Oleo - Gol', valor: 180.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '4', data: '2026-01-18', tipo: 'IPVA', descricao: 'IPVA - Gol', valor: 980.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
];

const mockDespesaBanco: DespesaBase[] = [
  { id: '1', data: '2026-01-05', tipo: 'TARIFA MENSAL', descricao: 'Tarifa Mensal - Bradesco', valor: 45.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '2', data: '2026-01-05', tipo: 'TARIFA MENSAL', descricao: 'Tarifa Mensal - Itau', valor: 52.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '3', data: '2026-01-10', tipo: 'TED', descricao: 'TED para Fornecedor', valor: 12.5, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
  { id: '4', data: '2026-01-15', tipo: 'TAXA CARTAO', descricao: 'Anuidade Cartao', valor: 120.0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' },
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
