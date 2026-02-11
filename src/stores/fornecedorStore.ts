import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import type {
  Fornecedor,
  CreateFornecedorDto,
  UpdateFornecedorDto,
} from '@/types/fornecedor';
import { api } from '@/lib/api';

interface FornecedorState {
  fornecedores: Fornecedor[];
  columns: TableColumnConfigFromApi[] | null;
  isLoading: boolean;
  error: string | null;
}

interface FornecedorActions {
  fetchFornecedores: () => Promise<void>;
  getFornecedor: (id: string) => Fornecedor | undefined;
  addFornecedor: (data: CreateFornecedorDto) => Promise<Fornecedor>;
  updateFornecedor: (id: string, data: UpdateFornecedorDto) => Promise<void>;
  deleteFornecedor: (id: string) => Promise<void>;
  toggleFornecedorStatus: (id: string) => Promise<void>;
  getFornecedoresByTipo: (tipo: 'cnpj' | 'cpf') => Fornecedor[];
  reset: () => void;
}

type FornecedorStore = FornecedorState & FornecedorActions;

export const useFornecedorStore = create<FornecedorStore>()(
  persist(
    (set, get) => ({
      fornecedores: [],
      columns: null,
      isLoading: false,
      error: null,

      fetchFornecedores: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.get<Fornecedor[]>('fornecedores');
          const list = Array.isArray(res.data) ? res.data : [];
          set({ fornecedores: list, columns: res.columns ?? null, isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Erro ao carregar fornecedores',
            isLoading: false,
          });
        }
      },

      getFornecedor: (id: string) => get().fornecedores.find((f) => f.id === id),

      addFornecedor: async (data: CreateFornecedorDto) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post<Fornecedor>('fornecedores', data);
          const novo = res.data;
          set((state) => ({ fornecedores: [...state.fornecedores, novo], isLoading: false }));
          return novo;
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Erro ao salvar fornecedor',
            isLoading: false,
          });
          throw err;
        }
      },

      updateFornecedor: async (id: string, data: UpdateFornecedorDto) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.patch<Fornecedor>(`fornecedores/${id}`, data);
          const updated = res.data;
          set((state) => ({
            fornecedores: state.fornecedores.map((f) => (f.id === id ? updated : f)),
            isLoading: false,
          }));
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Erro ao atualizar fornecedor',
            isLoading: false,
          });
          throw err;
        }
      },

      deleteFornecedor: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.delete(`fornecedores/${id}`);
          set((state) => ({
            fornecedores: state.fornecedores.filter((f) => f.id !== id),
            isLoading: false,
          }));
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Erro ao excluir fornecedor',
            isLoading: false,
          });
          throw err;
        }
      },

      toggleFornecedorStatus: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await api.patch(`fornecedores/${id}/toggle-status`);
          set((state) => ({
            fornecedores: state.fornecedores.map((f) =>
              f.id === id ? { ...f, isAtivo: !f.isAtivo } : f
            ),
            isLoading: false,
          }));
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Erro ao alterar status',
            isLoading: false,
          });
          throw err;
        }
      },

      getFornecedoresByTipo: (tipo: 'cnpj' | 'cpf') =>
        get().fornecedores.filter((f) => f.tipo === tipo),

      reset: () =>
        set({
          fornecedores: [],
          columns: null,
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: 'fornecedor-storage',
      partialize: () => ({}),
    }
  )
);
