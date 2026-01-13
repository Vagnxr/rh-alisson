import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Tenant } from '@/types/tenant';

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

// Mock de tenants para desenvolvimento
const mockTenants: Tenant[] = [
  {
    id: 'tenant-001',
    name: 'Empresa Alpha Ltda',
    cnpj: '12.345.678/0001-90',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'tenant-002',
    name: 'Beta Comercio SA',
    cnpj: '98.765.432/0001-10',
    isActive: true,
    createdAt: '2025-02-15T00:00:00Z',
  },
  {
    id: 'tenant-003',
    name: 'Gamma Servicos ME',
    cnpj: '11.222.333/0001-44',
    isActive: true,
    createdAt: '2025-03-20T00:00:00Z',
  },
];

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
        
        // Simula chamada API
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        set({ 
          availableTenants: mockTenants, 
          isLoading: false 
        });
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
