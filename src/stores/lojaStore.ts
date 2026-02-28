import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Loja, LojaState, CreateLojaDTO, UpdateLojaDTO } from '@/types/loja';
import { api } from '@/lib/api';

export const useLojaStore = create<LojaState>()(
  persist(
    (set, get) => ({
      lojas: [],
      columns: null,
      lojaAtual: null,
      isMultiLoja: false,
      isLoading: false,
      error: null,

      fetchLojas: async () => {
        if (get().isLoading) return;
        set({ isLoading: true, error: null });
        try {
          const res = await api.get<Loja[]>('lojas');
          const lojas = Array.isArray(res.data) ? res.data : [];
          const columns = res.columns ?? null;
          set({ lojas, columns, isMultiLoja: lojas.length > 1, isLoading: false });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao carregar lojas',
            isLoading: false,
          });
        }
      },

      setLojaAtual: (lojaId: string | null) => {
        if (lojaId === null) {
          set({ lojaAtual: null });
          return;
        }
        const loja = get().lojas.find((l) => l.id === lojaId);
        set({ lojaAtual: loja || null });
      },

      addLoja: async (data: CreateLojaDTO): Promise<Loja> => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post<Loja>('lojas', data);
          const novaLoja = res.data;
          set((state) => ({
            lojas: [...state.lojas, novaLoja],
            isMultiLoja: state.lojas.length >= 1,
            isLoading: false,
          }));
          return novaLoja;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao adicionar loja',
            isLoading: false,
          });
          throw error;
        }
      },

      updateLoja: async (id: string, data: UpdateLojaDTO): Promise<Loja> => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.patch<Loja>(`lojas/${id}`, data);
          const lojaAtualizada = res.data;
          set((state) => ({
            lojas: state.lojas.map((l) => (l.id === id ? lojaAtualizada : l)),
            lojaAtual: state.lojaAtual?.id === id ? lojaAtualizada : state.lojaAtual,
            isLoading: false,
          }));
          return lojaAtualizada;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao atualizar loja',
            isLoading: false,
          });
          throw error;
        }
      },

      deleteLoja: async (id: string): Promise<void> => {
        set({ isLoading: true, error: null });
        try {
          const loja = get().lojas.find((l) => l.id === id);
          if (loja?.isMatriz) {
            throw new Error('Nao e possivel excluir a loja matriz');
          }
          await api.delete(`lojas/${id}`);
          set((state) => {
            const novasLojas = state.lojas.filter((l) => l.id !== id);
            return {
              lojas: novasLojas,
              isMultiLoja: novasLojas.length > 1,
              lojaAtual: state.lojaAtual?.id === id ? null : state.lojaAtual,
              isLoading: false,
            };
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Erro ao excluir loja',
            isLoading: false,
          });
          throw error;
        }
      },

      getLojasByTenant: (tenantId: string): Loja[] => {
        return get().lojas.filter((l) => l.tenantId === tenantId);
      },

      reset: () =>
        set({
          lojas: [],
          columns: null,
          lojaAtual: null,
          isMultiLoja: false,
          isLoading: false,
          error: null,
        }),
    }),
    {
      name: 'loja-storage',
      partialize: (state) => ({ lojaAtual: state.lojaAtual }),
    }
  )
);

export function useLojaAtual(): Loja | null {
  return useLojaStore((state) => state.lojaAtual);
}

export function useIsMultiLoja(): boolean {
  return useLojaStore((state) => state.isMultiLoja);
}

export function useLojaId(): string | null {
  return useLojaStore((state) => state.lojaAtual?.id ?? null);
}
