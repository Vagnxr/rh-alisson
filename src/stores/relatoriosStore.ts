import { create } from 'zustand';
import type {
  RelatorioDespesasPorCategoria,
  RelatorioVendasPorPeriodo,
  RelatorioFluxoCaixa,
  RelatorioLucro,
  RelatoriosFiltros,
} from '@/types/relatorios';
import { api } from '@/lib/api';

function buildParams(filtros?: RelatoriosFiltros): Record<string, string> {
  const params: Record<string, string> = {};
  if (filtros?.dataInicio) params.dataInicio = filtros.dataInicio;
  if (filtros?.dataFim) params.dataFim = filtros.dataFim;
  if (filtros?.lojaId) params.lojaId = filtros.lojaId;
  return params;
}

export type TipoRelatorioApi = 'despesas-por-categoria' | 'vendas-por-periodo' | 'fluxo-caixa' | 'lucro';

export interface RelatoriosState {
  despesasPorCategoria: RelatorioDespesasPorCategoria | null;
  vendasPorPeriodo: RelatorioVendasPorPeriodo | null;
  fluxoCaixa: RelatorioFluxoCaixa | null;
  lucro: RelatorioLucro | null;
  isLoading: boolean;
  error: string | null;

  fetchDespesasPorCategoria: (filtros?: RelatoriosFiltros) => Promise<void>;
  fetchVendasPorPeriodo: (filtros?: RelatoriosFiltros) => Promise<void>;
  fetchFluxoCaixa: (filtros?: RelatoriosFiltros) => Promise<void>;
  fetchLucro: (filtros?: RelatoriosFiltros) => Promise<void>;
}

export const useRelatoriosStore = create<RelatoriosState>()((set, get) => ({
  despesasPorCategoria: null,
  vendasPorPeriodo: null,
  fluxoCaixa: null,
  lucro: null,
  isLoading: false,
  error: null,

  fetchDespesasPorCategoria: async (filtros) => {
    set({ isLoading: true, error: null });
    try {
      const params = buildParams(filtros);
      const res = await api.get<RelatorioDespesasPorCategoria>('relatorios/despesas-por-categoria', {
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      set({ despesasPorCategoria: res.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar relatorio',
        isLoading: false,
      });
    }
  },

  fetchVendasPorPeriodo: async (filtros) => {
    set({ isLoading: true, error: null });
    try {
      const params = buildParams(filtros);
      const res = await api.get<RelatorioVendasPorPeriodo>('relatorios/vendas-por-periodo', {
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      set({ vendasPorPeriodo: res.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar relatorio',
        isLoading: false,
      });
    }
  },

  fetchFluxoCaixa: async (filtros) => {
    set({ isLoading: true, error: null });
    try {
      const params = buildParams(filtros);
      const res = await api.get<RelatorioFluxoCaixa>('relatorios/fluxo-caixa', {
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      set({ fluxoCaixa: res.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar relatorio',
        isLoading: false,
      });
    }
  },

  fetchLucro: async (filtros) => {
    set({ isLoading: true, error: null });
    try {
      const params = buildParams(filtros);
      const res = await api.get<RelatorioLucro>('relatorios/lucro', {
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      set({ lucro: res.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar relatorio',
        isLoading: false,
      });
    }
  },
}));
