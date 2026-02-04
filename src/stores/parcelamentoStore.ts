import { create } from 'zustand';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import type { Parcelamento, ParcelamentoInput } from '@/types/parcelamento';
import { api } from '@/lib/api';

interface ParcelamentoState {
  items: Parcelamento[];
  columns: TableColumnConfigFromApi[] | null;
  isLoading: boolean;
  error: string | null;
}

interface ParcelamentoActions {
  fetchItems: (params?: { dataInicio?: string; dataFim?: string }) => Promise<void>;
  addItem: (data: ParcelamentoInput) => Promise<void>;
  updateItem: (id: string, data: Partial<ParcelamentoInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

type ParcelamentoStore = ParcelamentoState & ParcelamentoActions;

export const useParcelamentoStore = create<ParcelamentoStore>((set, get) => ({
  items: [],
  columns: null,
  isLoading: false,
  error: null,

  fetchItems: async (params?: { dataInicio?: string; dataFim?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const search = new URLSearchParams();
      if (params?.dataInicio) search.set('dataInicio', params.dataInicio);
      if (params?.dataFim) search.set('dataFim', params.dataFim);
      const path = search.toString() ? `parcelamentos?${search.toString()}` : 'parcelamentos';
      const res = await api.get<Parcelamento[]>(path);
      const list = Array.isArray(res.data) ? res.data : [];
      set({ items: list, columns: res.columns ?? null, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao carregar parcelamentos',
        isLoading: false,
      });
    }
  },

  addItem: async (data: ParcelamentoInput) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<Parcelamento>('parcelamentos', data);
      set((state) => ({ items: [...state.items, res.data], isLoading: false }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao salvar',
        isLoading: false,
      });
      throw err;
    }
  },

  updateItem: async (id: string, data: Partial<ParcelamentoInput>) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.patch<Parcelamento>(`parcelamentos/${id}`, data);
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? res.data : item)),
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
      await api.delete(`parcelamentos/${id}`);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao excluir',
        isLoading: false,
      });
      throw err;
    }
  },
}));
