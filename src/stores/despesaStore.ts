import { create } from 'zustand';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import type { DespesaBase, DespesaInput, DespesaCategoria } from '@/types/despesa';
import { api } from '@/lib/api';

interface DespesaState {
  items: DespesaBase[];
  columns: TableColumnConfigFromApi[] | null;
  isLoading: boolean;
  error: string | null;
}

interface DespesaActions {
  fetchItems: (params?: { dataInicio?: string; dataFim?: string }) => Promise<void>;
  addItem: (data: DespesaInput) => Promise<void>;
  updateItem: (id: string, data: Partial<DespesaInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

type DespesaStore = DespesaState & DespesaActions;

function normalizeDespesa(item: Record<string, unknown>): DespesaBase {
  const base = {
    id: String(item.id),
    data: typeof item.data === 'string' ? item.data : (item.data as Date)?.toString?.()?.slice(0, 10) ?? '',
    tipo: String(item.tipo ?? ''),
    descricao: String(item.descricao ?? ''),
    valor: Number(item.valor ?? 0),
    comunicarAgenda: Boolean(item.comunicarAgenda),
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
  };
  const bancoId = item.bancoId != null ? String(item.bancoId) : undefined;
  const bancoNome = item.bancoNome != null ? String(item.bancoNome) : undefined;
  return { ...base, ...(bancoId !== undefined && { bancoId }), ...(bancoNome !== undefined && { bancoNome }) };
}

function createDespesaStore(categoria: DespesaCategoria) {
  return create<DespesaStore>((set, get) => ({
    items: [],
    columns: null,
    isLoading: false,
    error: null,

    fetchItems: async (params?: { dataInicio?: string; dataFim?: string }) => {
      set({ isLoading: true, error: null });
      try {
        const requestParams: Record<string, string> = { categoria };
        if (params?.dataInicio) requestParams.dataInicio = params.dataInicio;
        if (params?.dataFim) requestParams.dataFim = params.dataFim;
        const res = await api.get<DespesaBase[]>('despesas', {
          params: requestParams,
        });
        const list = Array.isArray(res.data) ? res.data : [];
        const items = list.map((x) => normalizeDespesa(x as unknown as Record<string, unknown>));
        const columns = res.columns ?? null;
        set({ items, columns, isLoading: false });
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'Erro ao carregar despesas',
          isLoading: false,
        });
      }
    },

    addItem: async (data: DespesaInput) => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.post<DespesaBase>('despesas', { ...data, categoria });
        const newItem = normalizeDespesa(res.data as unknown as Record<string, unknown>);
        set((state) => ({ items: [...state.items, newItem], isLoading: false }));
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'Erro ao salvar',
          isLoading: false,
        });
        throw err;
      }
    },

    updateItem: async (id: string, data: Partial<DespesaInput>) => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.patch<DespesaBase>(`despesas/${id}`, data);
        const updated = normalizeDespesa(res.data as unknown as Record<string, unknown>);
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? updated : item)),
          isLoading: false,
        }));
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'Erro ao atualizar',
          isLoading: false,
        });
        throw err;
      }
    },

    deleteItem: async (id: string) => {
      set({ isLoading: true, error: null });
      try {
        await api.delete(`despesas/${id}`);
        set((state) => ({ items: state.items.filter((item) => item.id !== id), isLoading: false }));
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'Erro ao excluir',
          isLoading: false,
        });
        throw err;
      }
    },
  }));
}

export const useDespesaFixaStore = createDespesaStore('despesa-fixa');
export const useDespesaExtraStore = createDespesaStore('despesa-extra');
export const useDespesaFuncionarioStore = createDespesaStore('despesa-funcionario');
export const useDespesaImpostoStore = createDespesaStore('despesa-imposto');
export const useDespesaVeiculoStore = createDespesaStore('despesa-veiculo');
export const useDespesaBancoStore = createDespesaStore('despesa-banco');

export const despesaStores = {
  'despesa-fixa': useDespesaFixaStore,
  'despesa-extra': useDespesaExtraStore,
  'despesa-funcionario': useDespesaFuncionarioStore,
  'despesa-imposto': useDespesaImpostoStore,
  'despesa-veiculo': useDespesaVeiculoStore,
  'despesa-banco': useDespesaBancoStore,
} as const;
