import { create } from 'zustand';
import type { DespesaCategoria } from '@/types/despesa';
import { api } from '@/lib/api';

export interface DespesaTipo {
  id: string;
  label: string;
  categoria?: string;
}

interface DespesaTiposState {
  tiposByCategoria: Record<string, DespesaTipo[]>;
  isLoading: boolean;
  /** Categoria em que o fetch esta em andamento (evita duplicar para a mesma categoria). */
  _loadingCategoria: string | null;
  error: string | null;
}

interface DespesaTiposActions {
  fetchTipos: (categoria: DespesaCategoria | string) => Promise<DespesaTipo[]>;
  addTipo: (categoria: DespesaCategoria | string, label: string) => Promise<DespesaTipo>;
  deleteTipo: (id: string) => Promise<void>;
  getTipos: (categoria: DespesaCategoria | string) => DespesaTipo[];
  reset: () => void;
}

function normalizeTipo(item: unknown): DespesaTipo {
  const o = item as Record<string, unknown>;
  return {
    id: String(o.id ?? ''),
    label: String(o.label ?? o.nome ?? ''),
    categoria: o.categoria != null ? String(o.categoria) : undefined,
  };
}

export const useDespesaTiposStore = create<DespesaTiposState & DespesaTiposActions>((set, get) => ({
  tiposByCategoria: {},
  isLoading: false,
  _loadingCategoria: null,
  error: null,

  fetchTipos: async (categoria: DespesaCategoria | string) => {
    if (get()._loadingCategoria === categoria) return get().tiposByCategoria[categoria] ?? [];
    set({ isLoading: true, _loadingCategoria: categoria, error: null });
    try {
      const res = await api.get<DespesaTipo[] | string[]>('despesas/tipos', {
        params: { categoria },
      });
      const raw = res.data;
      const list = Array.isArray(raw)
        ? raw.map((x) =>
            typeof x === 'string' ? { id: x, label: x } : normalizeTipo(x)
          )
        : [];
      set((state) => ({
        tiposByCategoria: { ...state.tiposByCategoria, [categoria]: list },
        isLoading: false,
        _loadingCategoria: null,
      }));
      return list;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao carregar tipos',
        isLoading: false,
        _loadingCategoria: null,
      });
      return [];
    }
  },

  addTipo: async (categoria: DespesaCategoria | string, label: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<DespesaTipo>(`despesas/tipos`, { categoria, label });
      const newTipo = normalizeTipo(res.data);
      set((state) => ({
        tiposByCategoria: {
          ...state.tiposByCategoria,
          [categoria]: [...(state.tiposByCategoria[categoria] ?? []), newTipo],
        },
        isLoading: false,
      }));
      return newTipo;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao criar tipo',
        isLoading: false,
      });
      throw err;
    }
  },

  deleteTipo: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`despesas/tipos/${id}`);
      set((state) => {
        const next: Record<string, DespesaTipo[]> = {};
        for (const [cat, list] of Object.entries(state.tiposByCategoria)) {
          next[cat] = list.filter((t) => t.id !== id);
        }
        return { tiposByCategoria: next, isLoading: false };
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao excluir tipo',
        isLoading: false,
      });
      throw err;
    }
  },

  getTipos: (categoria: DespesaCategoria | string) => {
    return get().tiposByCategoria[categoria] ?? [];
  },

  reset: () =>
    set({ tiposByCategoria: {}, isLoading: false, _loadingCategoria: null, error: null }),
}));
