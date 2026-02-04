import { create } from 'zustand';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import type { AdminTenant, AdminTenantFormData } from '@/types/admin';
import { api } from '@/lib/api';

interface AdminTenantsState {
  tenants: AdminTenant[];
  columns: TableColumnConfigFromApi[] | null;
  isLoading: boolean;
  error: string | null;
}

interface AdminTenantsActions {
  fetchTenants: () => Promise<void>;
  addTenant: (data: AdminTenantFormData) => Promise<boolean>;
  updateTenant: (id: string, data: Partial<AdminTenantFormData>) => Promise<boolean>;
  deleteTenant: (id: string) => Promise<boolean>;
  toggleTenantStatus: (id: string) => Promise<boolean>;
}

type AdminTenantsStore = AdminTenantsState & AdminTenantsActions;

export const useAdminTenantsStore = create<AdminTenantsStore>((set, get) => ({
  tenants: [],
  columns: null,
  isLoading: false,
  error: null,

  fetchTenants: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<AdminTenant[]>('admin/tenants');
      set({ tenants: Array.isArray(res.data) ? res.data : [], columns: res.columns ?? null, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao carregar empresas',
        isLoading: false,
      });
    }
  },

  addTenant: async (data: AdminTenantFormData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<AdminTenant>('admin/tenants', data);
      set((state) => ({ tenants: [...state.tenants, res.data], isLoading: false }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao criar empresa',
        isLoading: false,
      });
      return false;
    }
  },

  updateTenant: async (id: string, data: Partial<AdminTenantFormData>) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.patch<AdminTenant>(`admin/tenants/${id}`, data);
      set((state) => ({
        tenants: state.tenants.map((t) => (t.id === id ? res.data : t)),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao atualizar empresa',
        isLoading: false,
      });
      return false;
    }
  },

  deleteTenant: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`admin/tenants/${id}`);
      set((state) => ({
        tenants: state.tenants.filter((t) => t.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao excluir empresa',
        isLoading: false,
      });
      return false;
    }
  },

  toggleTenantStatus: async (id: string) => {
    const tenant = get().tenants.find((t) => t.id === id);
    if (!tenant) return false;
    try {
      await api.patch(`admin/tenants/${id}/toggle-status`);
      set((state) => ({
        tenants: state.tenants.map((t) =>
          t.id === id ? { ...t, isActive: !t.isActive } : t
        ),
      }));
      return true;
    } catch {
      return false;
    }
  },
}));
