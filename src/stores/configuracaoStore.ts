import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TabelaConfig, ColunaConfig, ConfiguracaoState } from '@/types/configuracao';
import { TABELAS_CONFIGURACOES } from '@/types/configuracao';
import { api } from '@/lib/api';

export const useConfiguracaoStore = create<ConfiguracaoState>()(
  persist(
    (set, get) => ({
      tabelas: TABELAS_CONFIGURACOES,

      fetchConfiguracoes: async () => {
        try {
          const res = await api.get<TabelaConfig[]>('configuracoes/tabelas');
          const list = Array.isArray(res.data) ? res.data : [];
          if (list.length === 0) {
            set({ tabelas: TABELAS_CONFIGURACOES });
            return;
          }
          const idsFromApi = new Set(list.map((t) => t.id));
          const merged = [...list];
          for (const padrao of TABELAS_CONFIGURACOES) {
            if (!idsFromApi.has(padrao.id)) merged.push(padrao);
          }
          set({ tabelas: merged });
        } catch {
          set({ tabelas: TABELAS_CONFIGURACOES });
        }
      },

      updateColunaVisibilidade: (tabelaId: string, colunaId: string, isVisible: boolean) => {
        set((state) => ({
          tabelas: state.tabelas.map((tabela) => {
            if (tabela.id !== tabelaId) return tabela;
            return {
              ...tabela,
              colunas: tabela.colunas.map((coluna) => {
                if (coluna.id !== colunaId) return coluna;
                if (coluna.isRequired && !isVisible) return coluna;
                return { ...coluna, isVisible };
              }),
            };
          }),
        }));
        const tabela = get().tabelas.find((t) => t.id === tabelaId);
        if (tabela) api.put(`configuracoes/tabelas/${tabelaId}`, { colunas: tabela.colunas }).catch(() => {});
      },

      updateColunaSomarNoTotal: (tabelaId: string, colunaId: string, somarNoTotal: boolean) => {
        set((state) => ({
          tabelas: state.tabelas.map((tabela) => {
            if (tabela.id !== tabelaId) return tabela;
            return {
              ...tabela,
              colunas: tabela.colunas.map((coluna) =>
                coluna.id === colunaId ? { ...coluna, somarNoTotal, subtrairNoTotal: somarNoTotal ? false : coluna.subtrairNoTotal } : coluna
              ),
            };
          }),
        }));
        const tabela = get().tabelas.find((t) => t.id === tabelaId);
        if (tabela) api.put(`configuracoes/tabelas/${tabelaId}`, { colunas: tabela.colunas }).catch(() => {});
      },

      updateColunaSubtrairNoTotal: (tabelaId: string, colunaId: string, subtrairNoTotal: boolean) => {
        set((state) => ({
          tabelas: state.tabelas.map((tabela) => {
            if (tabela.id !== tabelaId) return tabela;
            return {
              ...tabela,
              colunas: tabela.colunas.map((coluna) =>
                coluna.id === colunaId ? { ...coluna, subtrairNoTotal, somarNoTotal: subtrairNoTotal ? false : coluna.somarNoTotal } : coluna
              ),
            };
          }),
        }));
        const tabela = get().tabelas.find((t) => t.id === tabelaId);
        if (tabela) api.put(`configuracoes/tabelas/${tabelaId}`, { colunas: tabela.colunas }).catch(() => {});
      },

      updateColunaOrdem: (tabelaId: string, colunas: ColunaConfig[]) => {
        set((state) => ({
          tabelas: state.tabelas.map((tabela) =>
            tabela.id === tabelaId ? { ...tabela, colunas } : tabela
          ),
        }));
        const tabela = get().tabelas.find((t) => t.id === tabelaId);
        if (tabela) api.put(`configuracoes/tabelas/${tabelaId}`, { colunas: tabela.colunas }).catch(() => {});
      },

      resetTabela: async (tabelaId: string) => {
        const tabelaPadrao = TABELAS_CONFIGURACOES.find((t) => t.id === tabelaId);
        if (!tabelaPadrao) return;
        try {
          await api.post(`configuracoes/tabelas/${tabelaId}/reset`, {});
        } catch {
          // ignore
        }
        set((state) => ({
          tabelas: state.tabelas.map((t) => (t.id === tabelaId ? { ...tabelaPadrao } : t)),
        }));
      },

      getColunasVisiveis: (tabelaId: string) => {
        const tabela = get().tabelas.find((t) => t.id === tabelaId);
        if (!tabela) return [];
        return tabela.colunas
          .filter((c) => c.isVisible)
          .sort((a, b) => a.order - b.order);
      },

      getTabela: (tabelaId: string) => get().tabelas.find((t) => t.id === tabelaId),

      addColuna: (tabelaId: string, coluna: Omit<ColunaConfig, 'order'> & { order?: number }) => {
        set((state) => {
          const tabela = state.tabelas.find((t) => t.id === tabelaId);
          if (!tabela) return state;
          const maxOrder = Math.max(0, ...tabela.colunas.map((c) => c.order));
          const newColuna: ColunaConfig = {
            ...coluna,
            order: coluna.order ?? maxOrder + 1,
          };
          return {
            tabelas: state.tabelas.map((t) =>
              t.id !== tabelaId
                ? t
                : { ...t, colunas: [...t.colunas, newColuna] }
            ),
          };
        });
        const tabela = get().tabelas.find((t) => t.id === tabelaId);
        if (tabela) api.put(`configuracoes/tabelas/${tabelaId}`, { colunas: tabela.colunas }).catch(() => {});
      },

      removeColuna: (tabelaId: string, colunaId: string) => {
        set((state) => {
          const tabela = state.tabelas.find((t) => t.id === tabelaId);
          if (!tabela) return state;
          const coluna = tabela.colunas.find((c) => c.id === colunaId);
          if (coluna?.isRequired) return state;
          return {
            tabelas: state.tabelas.map((t) =>
              t.id !== tabelaId
                ? t
                : { ...t, colunas: t.colunas.filter((c) => c.id !== colunaId) }
            ),
          };
        });
        const tabela = get().tabelas.find((t) => t.id === tabelaId);
        if (tabela) api.put(`configuracoes/tabelas/${tabelaId}`, { colunas: tabela.colunas }).catch(() => {});
      },
    }),
    {
      name: 'configuracao-storage',
    }
  )
);
