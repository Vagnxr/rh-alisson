import { create } from 'zustand';
import type { DashboardResumo, DashboardTransacao, DashboardFiltros } from '@/types/dashboard';
import { api } from '@/lib/api';

function buildParams(filtros?: DashboardFiltros): Record<string, string> {
  const params: Record<string, string> = {};
  if (filtros?.dataInicio) params.dataInicio = filtros.dataInicio;
  if (filtros?.dataFim) params.dataFim = filtros.dataFim;
  if (filtros?.lojaId) params.lojaId = filtros.lojaId;
  if (filtros?.limit != null) params.limit = String(filtros.limit);
  return params;
}

export interface DashboardState {
  resumo: DashboardResumo | null;
  transacoes: DashboardTransacao[];
  isLoadingResumo: boolean;
  isLoadingTransacoes: boolean;
  errorResumo: string | null;
  errorTransacoes: string | null;

  fetchResumo: (filtros?: DashboardFiltros) => Promise<void>;
  fetchTransacoes: (filtros?: DashboardFiltros) => Promise<void>;
  fetchAll: (filtros?: DashboardFiltros) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>()((set) => ({
  resumo: null,
  transacoes: [],
  isLoadingResumo: false,
  isLoadingTransacoes: false,
  errorResumo: null,
  errorTransacoes: null,

  fetchResumo: async (filtros) => {
    set({ isLoadingResumo: true, errorResumo: null });
    try {
      const params = buildParams(filtros);
      const res = await api.get<DashboardResumo>('dashboard/resumo', {
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      set({ resumo: res.data, isLoadingResumo: false });
    } catch (error) {
      set({
        errorResumo: error instanceof Error ? error.message : 'Erro ao carregar resumo',
        isLoadingResumo: false,
      });
    }
  },

  fetchTransacoes: async (filtros) => {
    set({ isLoadingTransacoes: true, errorTransacoes: null });
    try {
      const params = buildParams(filtros);
      const res = await api.get<DashboardTransacao[]>('dashboard/transacoes-recentes', {
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      set({
        transacoes: Array.isArray(res.data) ? res.data : [],
        isLoadingTransacoes: false,
      });
    } catch (error) {
      set({
        errorTransacoes: error instanceof Error ? error.message : 'Erro ao carregar transacoes',
        isLoadingTransacoes: false,
      });
    }
  },

  fetchAll: async (filtros) => {
    await Promise.all([
      useDashboardStore.getState().fetchResumo(filtros),
      useDashboardStore.getState().fetchTransacoes({ ...filtros, limit: 20 }),
    ]);
  },
}));
