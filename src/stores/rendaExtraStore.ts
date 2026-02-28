import { create } from 'zustand';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import type { DespesaBase, DespesaInput, DespesaComParcelasInput } from '@/types/despesa';
import { api } from '@/lib/api';

function normalizeItem(item: Record<string, unknown>): DespesaBase {
  const base: DespesaBase = {
    id: String(item.id),
    data: typeof item.data === 'string' ? item.data : (item.data as Date)?.toString?.()?.slice(0, 10) ?? '',
    tipo: String(item.tipo ?? ''),
    descricao: String(item.descricao ?? ''),
    valor: Number(item.valor ?? 0),
    comunicarAgenda: Boolean(item.comunicarAgenda),
    recorrencia: item.recorrencia != null ? String(item.recorrencia) : undefined,
    recorrenciaFim: item.recorrenciaFim != null ? String(item.recorrenciaFim).slice(0, 10) : undefined,
    createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
    updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
  };
  if (item.recorrenciaIndice != null) base.recorrenciaIndice = String(item.recorrenciaIndice);
  return base;
}

interface RendaExtraState {
  items: DespesaBase[];
  columns: TableColumnConfigFromApi[] | null;
  isLoading: boolean;
  error: string | null;
}

interface RendaExtraActions {
  fetchItems: (params?: { dataInicio?: string; dataFim?: string }) => Promise<void>;
  addItem: (data: DespesaInput) => Promise<void>;
  addItemComParcelas: (data: DespesaComParcelasInput) => Promise<void>;
  updateItem: (id: string, data: Partial<DespesaInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  reset: () => void;
}

type RendaExtraStore = RendaExtraState & RendaExtraActions;

export const useRendaExtraStore = create<RendaExtraStore>((set) => ({
  items: [],
  columns: null,
  isLoading: false,
  error: null,

  fetchItems: async (params?: { dataInicio?: string; dataFim?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const requestParams: Record<string, string> = {};
      if (params?.dataInicio) requestParams.dataInicio = params.dataInicio;
      if (params?.dataFim) requestParams.dataFim = params.dataFim;
      const res = await api.get<DespesaBase[]>('receitas', { params: requestParams });
      const list = Array.isArray(res.data) ? res.data : [];
      set({ items: list.map((x) => normalizeItem(x as unknown as Record<string, unknown>)), columns: res.columns ?? null, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao carregar receitas',
        isLoading: false,
      });
    }
  },

  addItem: async (data: DespesaInput) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<DespesaBase>('receitas', data);
      const newItem = normalizeItem(res.data as unknown as Record<string, unknown>);
      set((state) => ({ items: [...state.items, newItem], isLoading: false }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao salvar',
        isLoading: false,
      });
      throw err;
    }
  },

  addItemComParcelas: async (data: DespesaComParcelasInput) => {
    set({ isLoading: true, error: null });
    try {
      await api.post<DespesaBase[]>('receitas', {
        tipo: data.tipo,
        descricao: data.descricao,
        comunicarAgenda: data.comunicarAgenda,
        parcelas: data.parcelas,
      });
      set({ isLoading: false });
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
      const res = await api.patch<DespesaBase>(`receitas/${id}`, data);
      const updated = normalizeItem(res.data as unknown as Record<string, unknown>);
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
      await api.delete(`receitas/${id}`);
      set((state) => ({ items: state.items.filter((item) => item.id !== id), isLoading: false }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao excluir',
        isLoading: false,
      });
      throw err;
    }
  },

  reset: () => set({ items: [], columns: null, isLoading: false, error: null }),
}));
