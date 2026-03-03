import { create } from 'zustand';
import type {
  DiaAgenda,
  AgendaItem,
  AgendaItemDirectInput,
  AgendaItemDirectComParcelasInput,
} from '@/types/agenda';
import { api } from '@/lib/api';

interface AgendaState {
  dias: DiaAgenda[];
  diaSelecionado: DiaAgenda | null;
  isLoading: boolean;
  isLoadingDetalhe: boolean;
  error: string | null;
}

interface AgendaActions {
  fetchDias: (params?: { dataInicio?: string; dataFim?: string; lojaId?: string }) => Promise<DiaAgenda[]>;
  fetchDia: (data: string) => Promise<DiaAgenda | null>;
  addItemDirect: (data: AgendaItemDirectInput) => Promise<void>;
  addItemDirectComParcelas: (data: AgendaItemDirectComParcelasInput) => Promise<void>;
  updateItemDirect: (itemId: string, data: { data: string; descricao: string; valor: number }) => Promise<void>;
  deleteItemDirect: (itemId: string) => Promise<void>;
  marcarPago: (itemId: string) => Promise<void>;
  marcarPagoLote: (ids: string[]) => Promise<void>;
  desmarcarPago: (itemId: string) => Promise<void>;
  setDiaSelecionado: (dia: DiaAgenda | null) => void;
  clearError: () => void;
  reset: () => void;
}

function normalizeItem(raw: unknown): AgendaItem {
  const o = raw as Record<string, unknown>;
  const parcela = o.parcela != null ? String(o.parcela) : (o.recorrenciaIndice != null ? String(o.recorrenciaIndice) : undefined);
  return {
    id: String(o.id ?? ''),
    descricao: o.descricao != null ? String(o.descricao) : undefined,
    valor: Number(o.valor) || 0,
    tipo: (o.tipo === 'entrada' || o.tipo === 'saida' ? o.tipo : 'saida') as 'entrada' | 'saida',
    origem: o.origem != null ? String(o.origem) : undefined,
    tipoDespesa: o.tipoDespesa != null ? String(o.tipoDespesa) : undefined,
    parcela: parcela || undefined,
    pago: Boolean(o.pago),
  };
}

function normalizeDia(raw: unknown): DiaAgenda {
  const o = raw as Record<string, unknown>;
  const itensRaw = o.itens;
  const itens = Array.isArray(itensRaw)
    ? itensRaw.map(normalizeItem)
    : undefined;
  return {
    data: String(o.data ?? ''),
    totalEntradas: Number(o.totalEntradas) || 0,
    totalSaidas: Number(o.totalSaidas) || 0,
    itens,
  };
}

export const useAgendaStore = create<AgendaState & AgendaActions>((set, get) => ({
  dias: [],
  diaSelecionado: null,
  isLoading: false,
  isLoadingDetalhe: false,
  error: null,

  fetchDias: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<DiaAgenda[] | unknown[]>('agenda/dias', {
        params: params as Record<string, string> | undefined,
      });
      const raw = res.data;
      const list = Array.isArray(raw) ? raw.map(normalizeDia) : [];
      set({ dias: list, isLoading: false });
      return list;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao carregar agenda',
        isLoading: false,
      });
      return [];
    }
  },

  fetchDia: async (data: string) => {
    set({ isLoadingDetalhe: true, error: null });
    try {
      const res = await api.get<DiaAgenda | unknown>(`agenda/dias/${data}`);
      const dia = normalizeDia(res.data);
      set({ diaSelecionado: dia, isLoadingDetalhe: false });
      return dia;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao carregar dia',
        isLoadingDetalhe: false,
      });
      return null;
    }
  },

  addItemDirect: async (payload: AgendaItemDirectInput) => {
    set({ error: null });
    const body: Record<string, unknown> = {
      data: payload.data,
      valor: payload.valor,
      ...(payload.descricao != null && payload.descricao !== '' && { descricao: payload.descricao }),
      ...(payload.lojaId != null && payload.lojaId !== '' && { lojaId: payload.lojaId }),
      ...(payload.recorrencia != null && payload.recorrencia !== 'unica' && { recorrencia: payload.recorrencia }),
      ...(payload.recorrenciaFim != null && payload.recorrenciaFim !== '' && { recorrenciaFim: payload.recorrenciaFim }),
    };
    await api.post('agenda/itens', body);
  },

  addItemDirectComParcelas: async (payload: AgendaItemDirectComParcelasInput) => {
    set({ error: null });
    const body: Record<string, unknown> = {
      descricao: payload.descricao,
      ...(payload.lojaId != null && payload.lojaId !== '' && { lojaId: payload.lojaId }),
      parcelas: payload.parcelas,
    };
    await api.post('agenda/itens', body);
  },

  updateItemDirect: async (itemId: string, data: { data: string; descricao: string; valor: number }) => {
    set({ error: null });
    await api.patch(`agenda/itens/${itemId}`, data);
    const { diaSelecionado } = get();
    if (diaSelecionado?.itens) {
      const updated = diaSelecionado.itens.map((i) =>
        i.id === itemId ? { ...i, data: data.data, descricao: data.descricao, valor: data.valor } : i
      );
      set({ diaSelecionado: { ...diaSelecionado, itens: updated } });
    }
    const { dias } = get();
    set({
      dias: dias.map((d) => {
        if (!d.itens?.some((i) => i.id === itemId)) return d;
        return {
          ...d,
          itens: d.itens.map((i) =>
            i.id === itemId ? { ...i, data: data.data, descricao: data.descricao, valor: data.valor } : i
          ),
        };
      }),
    });
  },

  deleteItemDirect: async (itemId: string) => {
    set({ error: null });
    await api.delete(`agenda/itens/${itemId}`);
    const { diaSelecionado } = get();
    if (diaSelecionado?.itens) {
      const itensRestantes = diaSelecionado.itens.filter((i) => i.id !== itemId);
      set({
        diaSelecionado: {
          ...diaSelecionado,
          itens: itensRestantes,
          totalEntradas: itensRestantes.reduce((s, i) => s + (i.tipo === 'entrada' ? i.valor : 0), 0),
          totalSaidas: itensRestantes.reduce((s, i) => s + (i.tipo === 'saida' ? i.valor : 0), 0),
        },
      });
    }
    const { dias } = get();
    set({
      dias: dias.map((d) => {
        if (!d.itens?.some((i) => i.id === itemId)) return d;
        const itensRestantes = d.itens.filter((i) => i.id !== itemId);
        return {
          ...d,
          itens: itensRestantes,
          totalEntradas: itensRestantes.reduce((s, i) => s + (i.tipo === 'entrada' ? i.valor : 0), 0),
          totalSaidas: itensRestantes.reduce((s, i) => s + (i.tipo === 'saida' ? i.valor : 0), 0),
        };
      }),
    });
  },

  marcarPago: async (itemId: string) => {
    set({ error: null });
    await api.post(`agenda/itens/${itemId}/marcar-pago`);
    const { diaSelecionado } = get();
    if (diaSelecionado?.itens) {
      set({
        diaSelecionado: {
          ...diaSelecionado,
          itens: diaSelecionado.itens.map((i) =>
            i.id === itemId ? { ...i, pago: true } : i
          ),
        },
      });
    }
    const { dias } = get();
    set({
      dias: dias.map((d) => {
        if (d.data !== diaSelecionado?.data || !d.itens) return d;
        return {
          ...d,
          itens: d.itens.map((i) =>
            i.id === itemId ? { ...i, pago: true } : i
          ),
        };
      }),
    });
  },

  marcarPagoLote: async (ids: string[]) => {
    if (ids.length === 0) return;
    set({ error: null });
    await api.post('agenda/itens/marcar-pago', { ids });
    const { diaSelecionado } = get();
    if (diaSelecionado?.itens) {
      const idSet = new Set(ids);
      set({
        diaSelecionado: {
          ...diaSelecionado,
          itens: diaSelecionado.itens.map((i) =>
            idSet.has(i.id) ? { ...i, pago: true } : i
          ),
        },
      });
    }
    const { dias } = get();
    const idSet = new Set(ids);
    set({
      dias: dias.map((d) => {
        if (d.data !== diaSelecionado?.data || !d.itens) return d;
        return {
          ...d,
          itens: d.itens.map((i) =>
            idSet.has(i.id) ? { ...i, pago: true } : i
          ),
        };
      }),
    });
  },

  desmarcarPago: async (itemId: string) => {
    set({ error: null });
    await api.post(`agenda/itens/${itemId}/desmarcar-pago`);
    const { diaSelecionado } = get();
    if (diaSelecionado?.itens) {
      set({
        diaSelecionado: {
          ...diaSelecionado,
          itens: diaSelecionado.itens.map((i) =>
            i.id === itemId ? { ...i, pago: false } : i
          ),
        },
      });
    }
    const { dias } = get();
    set({
      dias: dias.map((d) => {
        if (!d.itens?.some((i) => i.id === itemId)) return d;
        return {
          ...d,
          itens: d.itens.map((i) =>
            i.id === itemId ? { ...i, pago: false } : i
          ),
        };
      }),
    });
  },

  setDiaSelecionado: (dia) => set({ diaSelecionado: dia }),

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      dias: [],
      diaSelecionado: null,
      isLoading: false,
      isLoadingDetalhe: false,
      error: null,
    }),
}));
