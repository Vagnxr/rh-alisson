import { create } from 'zustand';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import type {
  Socio,
  MovimentacaoSocio,
  ResumoSocio,
} from '@/types/socio';
import { api } from '@/lib/api';

interface SociosState {
  socios: Socio[];
  resumos: ResumoSocio[];
  movimentacoes: MovimentacaoSocio[];
  movimentacoesColumns: TableColumnConfigFromApi[] | null;
  isLoading: boolean;
  error: string | null;
}

interface SociosActions {
  fetchSocios: () => Promise<void>;
  fetchResumo: () => Promise<void>;
  fetchMovimentacoes: (socioId?: string, params?: { dataInicio?: string; dataFim?: string }) => Promise<void>;
  addSocio: (data: Omit<Socio, 'id'>) => Promise<void>;
  updateSocio: (id: string, data: Partial<Omit<Socio, 'id'>>) => Promise<void>;
  deleteSocio: (id: string) => Promise<void>;
  addMovimentacao: (data: Omit<MovimentacaoSocio, 'id' | 'socioNome' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMovimentacao: (id: string, data: Partial<Omit<MovimentacaoSocio, 'id' | 'socioNome' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteMovimentacao: (id: string) => Promise<void>;
  getResumosPorSocio: () => ResumoSocio[];
  getMovimentacoesPorSocio: (socioId: string) => MovimentacaoSocio[];
}

type SociosStore = SociosState & SociosActions;

export const useSociosStore = create<SociosStore>((set, get) => ({
  socios: [],
  resumos: [],
  movimentacoes: [],
  movimentacoesColumns: null,
  isLoading: false,
  error: null,

  fetchSocios: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<Socio[]>('socios');
      set({ socios: Array.isArray(res.data) ? res.data : [], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao carregar socios',
        isLoading: false,
      });
    }
  },

  fetchResumo: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<ResumoSocio[]>('socios/resumo');
      set({ resumos: Array.isArray(res.data) ? res.data : [], isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao carregar resumo',
        isLoading: false,
      });
    }
  },

  fetchMovimentacoes: async (socioId?: string, params?: { dataInicio?: string; dataFim?: string }) => {
    set({ isLoading: true, error: null });
    try {
      const search = new URLSearchParams();
      if (socioId) search.set('socioId', socioId);
      if (params?.dataInicio) search.set('dataInicio', params.dataInicio);
      if (params?.dataFim) search.set('dataFim', params.dataFim);
      const path = search.toString() ? `movimentacoes-socios?${search.toString()}` : 'movimentacoes-socios';
      const res = await api.get<MovimentacaoSocio[]>(path);
      const list = Array.isArray(res.data) ? res.data : [];
      set({
        movimentacoes: list,
        movimentacoesColumns: res.columns ?? null,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao carregar movimentacoes',
        isLoading: false,
      });
    }
  },

  addSocio: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<Socio>('socios', data);
      set((state) => ({ socios: [...state.socios, res.data], isLoading: false }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao adicionar socio',
        isLoading: false,
      });
      throw err;
    }
  },

  updateSocio: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.patch<Socio>(`socios/${id}`, data);
      set((state) => ({
        socios: state.socios.map((s) => (s.id === id ? res.data : s)),
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao atualizar socio',
        isLoading: false,
      });
      throw err;
    }
  },

  deleteSocio: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`socios/${id}`);
      set((state) => ({
        socios: state.socios.filter((s) => s.id !== id),
        resumos: state.resumos.filter((r) => r.socio.id !== id),
        movimentacoes: state.movimentacoes.filter((m) => m.socioId !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao excluir socio',
        isLoading: false,
      });
      throw err;
    }
  },

  addMovimentacao: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<MovimentacaoSocio>('movimentacoes-socios', {
        socioId: data.socioId,
        data: data.data,
        tipo: data.tipo,
        descricao: data.descricao,
        valor: data.valor,
      });
      set((state) => ({
        movimentacoes: [...state.movimentacoes, res.data],
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao adicionar movimentacao',
        isLoading: false,
      });
      throw err;
    }
  },

  updateMovimentacao: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.patch<MovimentacaoSocio>(`movimentacoes-socios/${id}`, data);
      set((state) => ({
        movimentacoes: state.movimentacoes.map((m) => (m.id === id ? res.data : m)),
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao atualizar movimentacao',
        isLoading: false,
      });
      throw err;
    }
  },

  deleteMovimentacao: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`movimentacoes-socios/${id}`);
      set((state) => ({
        movimentacoes: state.movimentacoes.filter((m) => m.id !== id),
        isLoading: false,
      }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao excluir movimentacao',
        isLoading: false,
      });
      throw err;
    }
  },

  getResumosPorSocio: () => get().resumos,

  getMovimentacoesPorSocio: (socioId: string) =>
    get().movimentacoes.filter((m) => m.socioId === socioId),
}));
