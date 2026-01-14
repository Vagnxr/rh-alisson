import { create } from 'zustand';
import type {
  Socio,
  MovimentacaoSocio,
  ResumoSocio,
  TipoMovimentacaoSocio,
} from '@/types/socio';

interface SociosState {
  socios: Socio[];
  movimentacoes: MovimentacaoSocio[];
  isLoading: boolean;
  error: string | null;
}

interface SociosActions {
  fetchSocios: () => Promise<void>;
  fetchMovimentacoes: () => Promise<void>;
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

// Mock de socios
const mockSocios: Socio[] = [
  { id: 'socio-1', nome: 'Joao Silva', cpf: '123.456.789-00', percentualSociedade: 50, isAtivo: true },
  { id: 'socio-2', nome: 'Maria Santos', cpf: '987.654.321-00', percentualSociedade: 30, isAtivo: true },
  { id: 'socio-3', nome: 'Pedro Oliveira', cpf: '456.789.123-00', percentualSociedade: 20, isAtivo: true },
];

// Mock de movimentacoes
const mockMovimentacoes: MovimentacaoSocio[] = [
  {
    id: 'm-1',
    socioId: 'socio-1',
    socioNome: 'Joao Silva',
    data: '2026-01-05',
    tipo: 'pro-labore',
    descricao: 'Pro-labore Janeiro',
    valor: 8000.0,
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'm-2',
    socioId: 'socio-2',
    socioNome: 'Maria Santos',
    data: '2026-01-05',
    tipo: 'pro-labore',
    descricao: 'Pro-labore Janeiro',
    valor: 6000.0,
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'm-3',
    socioId: 'socio-3',
    socioNome: 'Pedro Oliveira',
    data: '2026-01-05',
    tipo: 'pro-labore',
    descricao: 'Pro-labore Janeiro',
    valor: 4000.0,
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-01-05T00:00:00Z',
  },
  {
    id: 'm-4',
    socioId: 'socio-1',
    socioNome: 'Joao Silva',
    data: '2026-01-20',
    tipo: 'distribuicao',
    descricao: 'Distribuicao Lucros Q4 2025',
    valor: 15000.0,
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z',
  },
  {
    id: 'm-5',
    socioId: 'socio-2',
    socioNome: 'Maria Santos',
    data: '2026-01-20',
    tipo: 'distribuicao',
    descricao: 'Distribuicao Lucros Q4 2025',
    valor: 9000.0,
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z',
  },
  {
    id: 'm-6',
    socioId: 'socio-3',
    socioNome: 'Pedro Oliveira',
    data: '2026-01-20',
    tipo: 'distribuicao',
    descricao: 'Distribuicao Lucros Q4 2025',
    valor: 6000.0,
    createdAt: '2026-01-20T00:00:00Z',
    updatedAt: '2026-01-20T00:00:00Z',
  },
  {
    id: 'm-7',
    socioId: 'socio-1',
    socioNome: 'Joao Silva',
    data: '2026-01-10',
    tipo: 'retirada',
    descricao: 'Retirada pessoal',
    valor: 2000.0,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-01-10T00:00:00Z',
  },
];

export const useSociosStore = create<SociosStore>((set, get) => ({
  socios: [],
  movimentacoes: [],
  isLoading: false,
  error: null,

  fetchSocios: async () => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ socios: mockSocios, isLoading: false });
  },

  fetchMovimentacoes: async () => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ movimentacoes: mockMovimentacoes, isLoading: false });
  },

  addSocio: async (data) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newSocio: Socio = {
      id: `socio-${Date.now()}`,
      ...data,
    };

    set((state) => ({
      socios: [...state.socios, newSocio],
      isLoading: false,
    }));
  },

  updateSocio: async (id, data) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      socios: state.socios.map((s) => (s.id === id ? { ...s, ...data } : s)),
      isLoading: false,
    }));
  },

  deleteSocio: async (id) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      socios: state.socios.filter((s) => s.id !== id),
      isLoading: false,
    }));
  },

  addMovimentacao: async (data) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const socio = get().socios.find((s) => s.id === data.socioId);
    const newMov: MovimentacaoSocio = {
      id: `m-${Date.now()}`,
      ...data,
      socioNome: socio?.nome || 'Desconhecido',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      movimentacoes: [...state.movimentacoes, newMov],
      isLoading: false,
    }));
  },

  updateMovimentacao: async (id, data) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      movimentacoes: state.movimentacoes.map((m) =>
        m.id === id
          ? {
              ...m,
              ...data,
              socioNome: data.socioId
                ? (state.socios.find((s) => s.id === data.socioId)?.nome || m.socioNome)
                : m.socioNome,
              updatedAt: new Date().toISOString(),
            }
          : m
      ),
      isLoading: false,
    }));
  },

  deleteMovimentacao: async (id) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      movimentacoes: state.movimentacoes.filter((m) => m.id !== id),
      isLoading: false,
    }));
  },

  getResumosPorSocio: () => {
    const { socios, movimentacoes } = get();

    return socios.map((socio) => {
      const movsSocio = movimentacoes.filter((m) => m.socioId === socio.id);

      const totalProLabore = movsSocio
        .filter((m) => m.tipo === 'pro-labore')
        .reduce((acc, m) => acc + m.valor, 0);

      const totalDistribuicao = movsSocio
        .filter((m) => m.tipo === 'distribuicao')
        .reduce((acc, m) => acc + m.valor, 0);

      const totalRetiradas = movsSocio
        .filter((m) => m.tipo === 'retirada')
        .reduce((acc, m) => acc + m.valor, 0);

      const totalAportes = movsSocio
        .filter((m) => m.tipo === 'aporte')
        .reduce((acc, m) => acc + m.valor, 0);

      const saldoTotal = totalProLabore + totalDistribuicao + totalRetiradas - totalAportes;

      return {
        socio,
        totalProLabore,
        totalDistribuicao,
        totalRetiradas,
        totalAportes,
        saldoTotal,
      };
    });
  },

  getMovimentacoesPorSocio: (socioId: string) => {
    return get().movimentacoes.filter((m) => m.socioId === socioId);
  },
}));

// Manter compatibilidade com a interface antiga
export const useSociosLegacyStore = create<{
  items: MovimentacaoSocio[];
  isLoading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (data: { data: string; descricao: string; valor: number }) => Promise<void>;
  updateItem: (id: string, data: Partial<{ data: string; descricao: string; valor: number }>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}>((set) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 500));
    set({ items: mockMovimentacoes, isLoading: false });
  },

  addItem: async (data) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));

    const newItem: MovimentacaoSocio = {
      id: `m-${Date.now()}`,
      socioId: 'socio-1',
      socioNome: 'Joao Silva',
      tipo: 'outro',
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      items: [...state.items, newItem],
      isLoading: false,
    }));
  },

  updateItem: async (id, data) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? { ...item, ...data, updatedAt: new Date().toISOString() }
          : item
      ),
      isLoading: false,
    }));
  },

  deleteItem: async (id) => {
    set({ isLoading: true, error: null });
    await new Promise((resolve) => setTimeout(resolve, 300));

    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      isLoading: false,
    }));
  },
}));
