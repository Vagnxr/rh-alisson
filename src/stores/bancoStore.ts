import { create } from 'zustand';
import type { Banco } from '@/types/banco';
import { api } from '@/lib/api';

/** Normaliza item da API para o tipo Banco (backend pode enviar codigoBanco em vez de codigo). */
function normalizarBanco(item: Banco & { codigoBanco?: string }): Banco {
  return {
    ...item,
    codigo: item.codigo ?? item.codigoBanco ?? '',
  };
}

interface BancoState {
  bancos: Banco[];
  isLoading: boolean;
  error: string | null;
}

interface BancoActions {
  fetchBancos: () => Promise<void>;
  addBanco: (data: { nome: string; codigo?: string; cor?: string; logo?: string }) => Promise<Banco>;
  updateBanco: (id: string, data: Partial<Pick<Banco, 'nome' | 'codigo' | 'cor' | 'logo' | 'isActive'>>) => Promise<void>;
  deleteBanco: (id: string) => Promise<void>;
  reset: () => void;
}

export const useBancoStore = create<BancoState & BancoActions>((set, get) => ({
  bancos: [],
  isLoading: false,
  error: null,

  reset: () => set({ bancos: [], isLoading: false, error: null }),

  fetchBancos: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<Banco[]>('bancos');
      const raw = Array.isArray(res?.data) ? res.data : [];
      const list = raw.map((b) => normalizarBanco(b as Banco & { codigoBanco?: string }));
      set({ bancos: list, isLoading: false });
    } catch {
      set({ bancos: [], isLoading: false });
    }
  },

  addBanco: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const body = { nome: data.nome, codigo: data.codigo, cor: data.cor, logo: data.logo };
      const res = await api.post<Banco>('bancos', body);
      set((state) => ({ bancos: [...state.bancos, res.data], isLoading: false }));
      return res.data;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao criar banco',
        isLoading: false,
      });
      throw err;
    }
  },

  updateBanco: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.patch<Banco & { codigoBanco?: string }>(`bancos/${id}`, data);
      const updated = res.data as Banco & { codigoBanco?: string };
      set((state) => ({
        bancos: state.bancos.map((b) => {
          if (b.id !== id) return b;
          return {
            ...b,
            ...updated,
            codigo: updated.codigo ?? updated.codigoBanco ?? b.codigo,
            cor: updated.cor ?? b.cor,
            logo: updated.logo !== undefined ? updated.logo : b.logo,
          };
        }),
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao atualizar banco',
        isLoading: false,
      });
      throw err;
    }
  },

  deleteBanco: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`bancos/${id}`);
      set((state) => ({
        bancos: state.bancos.filter((b) => b.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao excluir banco',
        isLoading: false,
      });
      throw err;
    }
  },
}));
