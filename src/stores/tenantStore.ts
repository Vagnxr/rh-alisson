import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tenant } from '@/types/tenant';
import { api } from '@/lib/api';

interface TenantState {
  currentTenant: Tenant | null;
  availableTenants: Tenant[];
  isLoading: boolean;
  error: string | null;
}

interface TenantActions {
  setCurrentTenant: (tenant: Tenant | null) => void;
  setAvailableTenants: (tenants: Tenant[]) => void;
  fetchAvailableTenants: () => Promise<void>;
  clearTenant: () => void;
  getTenantId: () => string | null;
}

type TenantStore = TenantState & TenantActions;

export const useTenantStore = create<TenantStore>()(
  persist(
    (set, get) => ({
      currentTenant: null,
      availableTenants: [],
      isLoading: false,
      error: null,

      setCurrentTenant: (tenant) => {
        set({ currentTenant: tenant, error: null });
      },

      setAvailableTenants: (tenants) => {
        set({ availableTenants: tenants });
      },

      fetchAvailableTenants: async () => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.get<Tenant[]>('tenants/available');
          set({ availableTenants: res.data ?? [], isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Erro ao carregar empresas',
            isLoading: false,
          });
        }
      },

      clearTenant: () => {
        set({ 
          currentTenant: null, 
          availableTenants: [],
          error: null 
        });
      },

      getTenantId: () => {
        return get().currentTenant?.id ?? null;
      },
    }),
    {
      name: 'tenant-storage',
      partialize: (state) => ({ 
        currentTenant: state.currentTenant 
      }),
    }
  )
);

// Hook helper para usar em requisicoes
export function useTenantId(): string | null {
  return useTenantStore((state) => state.currentTenant?.id ?? null);
}
