import { create } from 'zustand';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import type { DespesaBase, DespesaInput, DespesaComParcelasInput, DespesaCategoria } from '@/types/despesa';
import { api } from '@/lib/api';

/** Resposta da API GET /despesas: lista em data, columns e meta opcionais. */
interface DespesasListResponse {
  success?: boolean;
  data: DespesaBase[] | Record<string, unknown>[];
  columns?: TableColumnConfigFromApi[] | null;
  meta?: { total?: number; page?: number; perPage?: number; totalPages?: number };
}

interface DespesaState {
  items: DespesaBase[];
  columns: TableColumnConfigFromApi[] | null;
  isLoading: boolean;
  error: string | null;
}

interface DespesaActions {
  fetchItems: (params?: { dataInicio?: string; dataFim?: string }) => Promise<void>;
  addItem: (data: DespesaInput) => Promise<void>;
  /** Modo B: criar série em um único POST com array parcelas. */
  addItemComParcelas: (data: DespesaComParcelasInput) => Promise<void>;
  updateItem: (id: string, data: Partial<DespesaInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  reset: () => void;
}

type DespesaStore = DespesaState & DespesaActions;

function normalizeDespesa(item: Record<string, unknown>): DespesaBase {
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
  if (item.bancoId != null) base.bancoId = String(item.bancoId);
  if (item.bancoNome != null) base.bancoNome = String(item.bancoNome);
  if (item.recorrenciaIndice != null) base.recorrenciaIndice = String(item.recorrenciaIndice);
  if (item.categoria != null) base.categoria = String(item.categoria);
  if (item.observacao != null) base.observacao = String(item.observacao);
  return base;
}

function createDespesaStore(categoria: DespesaCategoria) {
  return create<DespesaStore>((set, get) => ({
    items: [],
    columns: null,
    isLoading: false,
    error: null,

    fetchItems: async (params?: { dataInicio?: string; dataFim?: string }) => {
      if (get().isLoading) return;
      set({ isLoading: true, error: null });
      try {
        const requestParams: Record<string, string> = { categoria };
        if (params?.dataInicio) requestParams.dataInicio = params.dataInicio;
        if (params?.dataFim) requestParams.dataFim = params.dataFim;
        const res = await api.get<DespesasListResponse>('despesas', {
          params: requestParams,
        });
        const body = res as unknown as DespesasListResponse;
        const list = Array.isArray(body?.data) ? body.data : (Array.isArray(res) ? res : []);
        const items = list.map((x) => normalizeDespesa(x as unknown as Record<string, unknown>));
        const columns = body?.columns ?? null;
        set({ items, columns, isLoading: false });
      } catch (err) {
        set({
          error: err instanceof Error ? err.message : 'Erro ao carregar despesas',
          isLoading: false,
        });
      }
    },

    addItem: async (data: DespesaInput) => {
      set({ isLoading: true, error: null });
      try {
        const res = await api.post<DespesaBase>('despesas', { ...data, categoria });
        const newItem = normalizeDespesa(res.data as unknown as Record<string, unknown>);
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
        await api.post<DespesaBase[]>('despesas', {
          categoria,
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
        const res = await api.patch<DespesaBase>(`despesas/${id}`, data);
        const updated = normalizeDespesa(res.data as unknown as Record<string, unknown>);
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
        await api.delete(`despesas/${id}`);
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
}

export const useDespesaFixaStore = createDespesaStore('despesa-fixa');
export const useDespesaExtraStore = createDespesaStore('despesa-extra');
export const useDespesaFuncionarioStore = createDespesaStore('despesa-funcionario');
export const useDespesaImpostoStore = createDespesaStore('despesa-imposto');
export const useDespesaVeiculoStore = createDespesaStore('despesa-veiculo');
export const useDespesaBancoStore = createDespesaStore('despesa-banco');

export const despesaStores = {
  'despesa-fixa': useDespesaFixaStore,
  'despesa-extra': useDespesaExtraStore,
  'despesa-funcionario': useDespesaFuncionarioStore,
  'despesa-imposto': useDespesaImpostoStore,
  'despesa-veiculo': useDespesaVeiculoStore,
  'despesa-banco': useDespesaBancoStore,
} as const;

/** Store para categorias de despesa dinamicas (ex.: despesa-marketing). Usa categoria atual em cada chamada. */
interface DespesaDinamicaStore extends DespesaState, DespesaActions {
  categoria: string | null;
  setCategoria: (c: string | null) => void;
}

export const useDespesaDinamicaStore = create<DespesaDinamicaStore>((set, get) => ({
  items: [],
  columns: null,
  isLoading: false,
  error: null,
  categoria: null,

  setCategoria: (c) => set({ categoria: c }),

  fetchItems: async (params?: { dataInicio?: string; dataFim?: string }) => {
    const categoria = get().categoria;
    if (!categoria) return;
    set({ isLoading: true, error: null });
    try {
      const requestParams: Record<string, string> = { categoria };
      if (params?.dataInicio) requestParams.dataInicio = params.dataInicio;
      if (params?.dataFim) requestParams.dataFim = params.dataFim;
      const res = await api.get<DespesasListResponse>('despesas', { params: requestParams });
      const body = res as unknown as DespesasListResponse;
      const list = Array.isArray(body?.data) ? body.data : (Array.isArray(res) ? res : []);
      const items = list.map((x) => normalizeDespesa(x as unknown as Record<string, unknown>));
      const columns = body?.columns ?? null;
      set({ items, columns, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao carregar despesas',
        isLoading: false,
      });
    }
  },

  addItem: async (data: DespesaInput) => {
    const categoria = get().categoria;
    if (!categoria) return;
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<DespesaBase>('despesas', { ...data, categoria });
      const newItem = normalizeDespesa(res.data as unknown as Record<string, unknown>);
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
    const categoria = get().categoria;
    if (!categoria) return;
    set({ isLoading: true, error: null });
    try {
      await api.post<DespesaBase[]>('despesas', {
        categoria,
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
      const res = await api.patch<DespesaBase>(`despesas/${id}`, data);
      const updated = normalizeDespesa(res.data as unknown as Record<string, unknown>);
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
      await api.delete(`despesas/${id}`);
      set((state) => ({ items: state.items.filter((item) => item.id !== id), isLoading: false }));
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao excluir',
        isLoading: false,
      });
      throw err;
    }
  },

  reset: () => set({ items: [], columns: null, isLoading: false, error: null, categoria: null }),
}));
