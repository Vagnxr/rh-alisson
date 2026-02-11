import { create } from 'zustand';
import type { BalancoMensal, BalancoFiltros } from '@/types/balanco';
import { api } from '@/lib/api';

function buildParams(filtros?: BalancoFiltros): Record<string, string> {
  const params: Record<string, string> = {};
  if (filtros?.mes != null) params.mes = String(filtros.mes);
  if (filtros?.ano != null) params.ano = String(filtros.ano);
  if (filtros?.lojaId) params.lojaId = filtros.lojaId;
  return params;
}

export interface BalancoState {
  balanco: BalancoMensal | null;
  isLoading: boolean;
  error: string | null;

  fetchBalanco: (filtros?: BalancoFiltros) => Promise<void>;
  reset: () => void;
}

export const useBalancoStore = create<BalancoState>()((set) => ({
  balanco: null,
  isLoading: false,
  error: null,

  reset: () => set({ balanco: null, isLoading: false, error: null }),

  fetchBalanco: async (filtros) => {
    set({ isLoading: true, error: null });
    try {
      const params = buildParams(filtros);
      const res = await api.get<BalancoMensal>('balanco/mensal', {
        params: Object.keys(params).length > 0 ? params : undefined,
      });
      set({ balanco: res.data, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar balanco',
        isLoading: false,
      });
    }
  },
}));
