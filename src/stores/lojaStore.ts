import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Loja, LojaState, CreateLojaDTO, UpdateLojaDTO } from '@/types/loja';
import { mockLojas } from '@/types/loja';

// Simula geracao de ID unico
function generateId(): string {
  return `loja-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useLojaStore = create<LojaState>()(
  persist(
    (set, get) => ({
      lojas: [],
      lojaAtual: null,
      isMultiLoja: false,
      isLoading: false,
      error: null,

      fetchLojas: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Simula delay de API
          await new Promise((resolve) => setTimeout(resolve, 300));
          
          // Em producao, buscar do backend filtrando pelo tenant atual
          const lojas = mockLojas;
          const isMultiLoja = lojas.length > 1;
          
          set({ lojas, isMultiLoja, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao carregar lojas', 
            isLoading: false 
          });
        }
      },

      setLojaAtual: (lojaId: string | null) => {
        if (lojaId === null) {
          set({ lojaAtual: null });
          return;
        }
        
        const loja = get().lojas.find((l) => l.id === lojaId);
        set({ lojaAtual: loja || null });
      },

      addLoja: async (data: CreateLojaDTO): Promise<Loja> => {
        set({ isLoading: true, error: null });
        
        try {
          // Simula delay de API
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          const now = new Date().toISOString();
          const novaLoja: Loja = {
            id: generateId(),
            tenantId: data.tenantId,
            cnpj: data.cnpj,
            razaoSocial: data.razaoSocial.toUpperCase(),
            nomeFantasia: data.nomeFantasia.toUpperCase(),
            apelido: data.apelido.toUpperCase(),
            endereco: {
              ...data.endereco,
              logradouro: data.endereco.logradouro.toUpperCase(),
              complemento: data.endereco.complemento?.toUpperCase(),
              bairro: data.endereco.bairro.toUpperCase(),
              cidade: data.endereco.cidade.toUpperCase(),
              uf: data.endereco.uf.toUpperCase(),
            },
            contato: data.contato,
            responsavel: data.responsavel ? {
              ...data.responsavel,
              nome: data.responsavel.nome.toUpperCase(),
            } : undefined,
            observacoes: data.observacoes?.toUpperCase(),
            isAtiva: true,
            isMatriz: data.isMatriz || false,
            createdAt: now,
            updatedAt: now,
          };
          
          set((state) => ({
            lojas: [...state.lojas, novaLoja],
            isMultiLoja: state.lojas.length >= 1, // Agora tera 2+ lojas
            isLoading: false,
          }));
          
          return novaLoja;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao adicionar loja', 
            isLoading: false 
          });
          throw error;
        }
      },

      updateLoja: async (id: string, data: UpdateLojaDTO): Promise<Loja> => {
        set({ isLoading: true, error: null });
        
        try {
          // Simula delay de API
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          const lojaIndex = get().lojas.findIndex((l) => l.id === id);
          if (lojaIndex === -1) {
            throw new Error('Loja nao encontrada');
          }
          
          const lojaAtual = get().lojas[lojaIndex];
          const lojaAtualizada: Loja = {
            ...lojaAtual,
            ...data,
            razaoSocial: data.razaoSocial?.toUpperCase() || lojaAtual.razaoSocial,
            nomeFantasia: data.nomeFantasia?.toUpperCase() || lojaAtual.nomeFantasia,
            apelido: data.apelido?.toUpperCase() || lojaAtual.apelido,
            endereco: data.endereco ? {
              ...data.endereco,
              logradouro: data.endereco.logradouro.toUpperCase(),
              complemento: data.endereco.complemento?.toUpperCase(),
              bairro: data.endereco.bairro.toUpperCase(),
              cidade: data.endereco.cidade.toUpperCase(),
              uf: data.endereco.uf.toUpperCase(),
            } : lojaAtual.endereco,
            responsavel: data.responsavel ? {
              ...data.responsavel,
              nome: data.responsavel.nome.toUpperCase(),
            } : lojaAtual.responsavel,
            observacoes: data.observacoes?.toUpperCase() || lojaAtual.observacoes,
            updatedAt: new Date().toISOString(),
          };
          
          set((state) => ({
            lojas: state.lojas.map((l) => (l.id === id ? lojaAtualizada : l)),
            lojaAtual: state.lojaAtual?.id === id ? lojaAtualizada : state.lojaAtual,
            isLoading: false,
          }));
          
          return lojaAtualizada;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao atualizar loja', 
            isLoading: false 
          });
          throw error;
        }
      },

      deleteLoja: async (id: string): Promise<void> => {
        set({ isLoading: true, error: null });
        
        try {
          // Simula delay de API
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          const loja = get().lojas.find((l) => l.id === id);
          if (!loja) {
            throw new Error('Loja nao encontrada');
          }
          
          // Nao permite excluir a matriz
          if (loja.isMatriz) {
            throw new Error('Nao e possivel excluir a loja matriz');
          }
          
          set((state) => {
            const novasLojas = state.lojas.filter((l) => l.id !== id);
            return {
              lojas: novasLojas,
              isMultiLoja: novasLojas.length > 1,
              lojaAtual: state.lojaAtual?.id === id ? null : state.lojaAtual,
              isLoading: false,
            };
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Erro ao excluir loja', 
            isLoading: false 
          });
          throw error;
        }
      },

      getLojasByTenant: (tenantId: string): Loja[] => {
        return get().lojas.filter((l) => l.tenantId === tenantId);
      },
    }),
    {
      name: 'loja-storage',
      partialize: (state) => ({
        lojaAtual: state.lojaAtual,
      }),
    }
  )
);

// Hook helper para obter loja atual
export function useLojaAtual(): Loja | null {
  return useLojaStore((state) => state.lojaAtual);
}

// Hook helper para verificar se e multi-loja
export function useIsMultiLoja(): boolean {
  return useLojaStore((state) => state.isMultiLoja);
}

// Hook helper para obter ID da loja atual
export function useLojaId(): string | null {
  return useLojaStore((state) => state.lojaAtual?.id ?? null);
}
