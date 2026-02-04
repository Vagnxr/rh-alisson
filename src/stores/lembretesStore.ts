import { create } from 'zustand';
import { api } from '@/lib/api';

export type LembretePrioridade = 'baixa' | 'media' | 'alta';
export type LembreteStatus = 'pendente' | 'concluido' | 'cancelado';

export interface Lembrete {
  id: string;
  titulo: string;
  descricao?: string;
  data: string;
  hora?: string;
  prioridade: LembretePrioridade;
  status: LembreteStatus;
  createdAt: string;
}

export interface CreateLembreteDTO {
  titulo: string;
  descricao?: string;
  data: string;
  hora?: string;
  prioridade: LembretePrioridade;
}

export interface UpdateLembreteDTO {
  titulo?: string;
  descricao?: string;
  data?: string;
  hora?: string;
  prioridade?: LembretePrioridade;
  status?: LembreteStatus;
}

function normalizeLembrete(raw: Record<string, unknown>): Lembrete {
  return {
    id: String(raw.id ?? ''),
    titulo: String(raw.titulo ?? ''),
    descricao: raw.descricao != null ? String(raw.descricao) : undefined,
    data: String(raw.data ?? ''),
    hora: raw.hora != null ? String(raw.hora) : undefined,
    prioridade: (raw.prioridade as LembretePrioridade) ?? 'media',
    status: (raw.status as LembreteStatus) ?? 'pendente',
    createdAt: String(raw.createdAt ?? ''),
  };
}

interface LembretesState {
  lembretes: Lembrete[];
  isLoading: boolean;
  error: string | null;
  fetchLembretes: (params?: {
    status?: 'pendente' | 'concluido' | 'cancelado';
    dataInicio?: string;
    dataFim?: string;
  }) => Promise<void>;
  createLembrete: (data: CreateLembreteDTO) => Promise<Lembrete>;
  updateLembrete: (id: string, data: UpdateLembreteDTO) => Promise<Lembrete>;
  toggleStatus: (id: string) => Promise<void>;
  deleteLembrete: (id: string) => Promise<void>;
}

export const useLembretesStore = create<LembretesState>()((set, get) => ({
  lembretes: [],
  isLoading: false,
  error: null,

  fetchLembretes: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const search: Record<string, string> = {};
      if (params?.status) search.status = params.status;
      if (params?.dataInicio) search.dataInicio = params.dataInicio;
      if (params?.dataFim) search.dataFim = params.dataFim;
      const res = await api.get<unknown[]>('lembretes', {
        params: Object.keys(search).length ? search : undefined,
      });
      const list = Array.isArray(res.data) ? res.data : [];
      const lembretes = list.map((item) => normalizeLembrete(item as unknown as Record<string, unknown>));
      set({ lembretes, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao carregar lembretes',
        isLoading: false,
      });
    }
  },

  createLembrete: async (data): Promise<Lembrete> => {
    set({ error: null });
    try {
      const res = await api.post<unknown>('lembretes', {
        titulo: data.titulo,
        descricao: data.descricao,
        data: data.data,
        hora: data.hora,
        prioridade: data.prioridade,
      });
      const novo = normalizeLembrete((res.data ?? {}) as unknown as Record<string, unknown>);
      set((state) => ({ lembretes: [novo, ...state.lembretes] }));
      return novo;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao criar lembrete';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  updateLembrete: async (id, data): Promise<Lembrete> => {
    set({ error: null });
    try {
      const res = await api.patch<unknown>(`lembretes/${id}`, data);
      const updated = normalizeLembrete((res.data ?? {}) as unknown as Record<string, unknown>);
      set((state) => ({
        lembretes: state.lembretes.map((l) => (l.id === id ? updated : l)),
      }));
      return updated;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar lembrete';
      set({ error: msg });
      throw new Error(msg);
    }
  },

  toggleStatus: async (id) => {
    const lembrete = get().lembretes.find((l) => l.id === id);
    if (!lembrete) return;
    const newStatus: LembreteStatus =
      lembrete.status === 'pendente' ? 'concluido' : 'pendente';
    try {
      await get().updateLembrete(id, { status: newStatus });
    } catch {
      // error already set in updateLembrete
    }
  },

  deleteLembrete: async (id) => {
    set({ error: null });
    try {
      await api.delete(`lembretes/${id}`);
      set((state) => ({
        lembretes: state.lembretes.filter((l) => l.id !== id),
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Erro ao excluir lembrete',
      });
      throw new Error(error instanceof Error ? error.message : 'Erro ao excluir lembrete');
    }
  },
}));
