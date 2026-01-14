import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TabelaConfig, ColunaConfig, ConfiguracaoState } from '@/types/configuracao';
import { TABELAS_CONFIGURACOES } from '@/types/configuracao';

export const useConfiguracaoStore = create<ConfiguracaoState>()(
  persist(
    (set, get) => ({
      tabelas: TABELAS_CONFIGURACOES,

      fetchConfiguracoes: async () => {
        // Em producao, buscar do backend
        // Por enquanto, usa as configuracoes padrao se nao houver nada salvo
        const { tabelas } = get();
        if (tabelas.length === 0) {
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
                // Nao permite ocultar colunas obrigatorias
                if (coluna.isRequired && !isVisible) return coluna;
                return { ...coluna, isVisible };
              }),
            };
          }),
        }));
      },

      updateColunaOrdem: (tabelaId: string, colunas: ColunaConfig[]) => {
        set((state) => ({
          tabelas: state.tabelas.map((tabela) => {
            if (tabela.id !== tabelaId) return tabela;
            return { ...tabela, colunas };
          }),
        }));
      },

      resetTabela: (tabelaId: string) => {
        const tabelaPadrao = TABELAS_CONFIGURACOES.find((t) => t.id === tabelaId);
        if (!tabelaPadrao) return;

        set((state) => ({
          tabelas: state.tabelas.map((tabela) =>
            tabela.id === tabelaId ? { ...tabelaPadrao } : tabela
          ),
        }));
      },

      getColunasVisiveis: (tabelaId: string) => {
        const tabela = get().tabelas.find((t) => t.id === tabelaId);
        if (!tabela) return [];
        return tabela.colunas
          .filter((c) => c.isVisible)
          .sort((a, b) => a.order - b.order);
      },
    }),
    {
      name: 'configuracao-storage',
    }
  )
);
