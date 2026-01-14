import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Loja, LojaState } from '@/types/loja';
import { mockLojas } from '@/types/loja';

export const useLojaStore = create<LojaState>()(
  persist(
    (set, get) => ({
      lojas: [],
      lojaAtual: null,
      isMultiLoja: false,

      fetchLojas: async () => {
        // Simula delay de API
        await new Promise((resolve) => setTimeout(resolve, 300));
        
        // Em producao, buscar do backend
        const lojas = mockLojas;
        const isMultiLoja = lojas.length > 1;
        
        set({ lojas, isMultiLoja });
      },

      setLojaAtual: (lojaId: string | null) => {
        if (lojaId === null) {
          set({ lojaAtual: null });
          return;
        }
        
        const loja = get().lojas.find((l) => l.id === lojaId);
        set({ lojaAtual: loja || null });
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
