import { create } from 'zustand';
import type { Banco } from '@/types/banco';
import { api } from '@/lib/api';

type BancoApi = Record<string, unknown>;

/** Normaliza item da API para o tipo Banco (backend envia codigoBanco e logo computado). */
function normalizarBanco(item: BancoApi): Banco {
  const codigo =
    (typeof item.codigo === 'string' && item.codigo) ||
    (typeof item.codigoBanco === 'string' && item.codigoBanco) ||
    '';
  return {
    id: String(item.id),
    nome: String(item.nome),
    codigo,
    cor: typeof item.cor === 'string' && item.cor ? item.cor : '#64748B',
    logo: typeof item.logo === 'string' && item.logo ? item.logo : undefined,
    isActive: typeof item.isActive === 'boolean' ? item.isActive : undefined,
  };
}

function mapPatchBody(data: Partial<Pick<Banco, 'nome' | 'codigo' | 'cor' | 'isActive'>> & { logoUrl?: string | null }) {
  const body: Record<string, unknown> = {};
  if (data.nome !== undefined) body.nome = data.nome;
  if (data.codigo !== undefined) body.codigoBanco = data.codigo.trim() || null;
  if (data.cor !== undefined) body.cor = data.cor;
  if (data.isActive !== undefined) body.isActive = data.isActive;
  if (data.logoUrl !== undefined) body.logoUrl = data.logoUrl;
  return body;
}

interface BancoState {
  bancos: Banco[];
  isLoading: boolean;
  error: string | null;
}

interface BancoActions {
  fetchBancos: () => Promise<void>;
  addBanco: (data: { nome: string; codigo?: string; cor?: string }) => Promise<Banco>;
  uploadBancoLogo: (bancoId: string, file: File) => Promise<void>;
  updateBanco: (
    id: string,
    data: Partial<Pick<Banco, 'nome' | 'codigo' | 'cor' | 'isActive'>> & { logoUrl?: string | null },
  ) => Promise<void>;
  deleteBanco: (id: string) => Promise<void>;
  reset: () => void;
}

export const useBancoStore = create<BancoState & BancoActions>((set) => ({
  bancos: [],
  isLoading: false,
  error: null,

  reset: () => set({ bancos: [], isLoading: false, error: null }),

  fetchBancos: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<BancoApi[]>('bancos');
      const raw = Array.isArray(res?.data) ? res.data : [];
      const list = raw.map((b) => normalizarBanco(b));
      set({ bancos: list, isLoading: false });
    } catch {
      set({ bancos: [], isLoading: false });
    }
  },

  addBanco: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<BancoApi>('bancos', {
        nome: data.nome,
        codigoBanco: data.codigo?.trim() || undefined,
        cor: data.cor,
      });
      const created = normalizarBanco(res.data as BancoApi);
      set((state) => ({ bancos: [...state.bancos, created], isLoading: false }));
      return created;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao criar banco',
        isLoading: false,
      });
      throw err;
    }
  },

  uploadBancoLogo: async (bancoId, file) => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.postForm<{ logoUrl: string; banco: BancoApi }>(`bancos/${bancoId}/logo`, form);
    const payload = res.data as { logoUrl: string; banco: BancoApi };
    const normalized = normalizarBanco(payload.banco);
    set((state) => ({
      bancos: state.bancos.map((b) => (b.id === bancoId ? normalized : b)),
    }));
  },

  updateBanco: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const body = mapPatchBody(data);
      const res = await api.patch<BancoApi>(`bancos/${id}`, body);
      const updated = normalizarBanco(res.data as BancoApi);
      set((state) => ({
        bancos: state.bancos.map((b) => (b.id === id ? updated : b)),
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
