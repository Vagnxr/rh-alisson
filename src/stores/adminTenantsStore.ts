import { create } from 'zustand';
import type { AdminTenant, AdminTenantFormData } from '@/types/admin';

interface AdminTenantsState {
  tenants: AdminTenant[];
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

// Mock de tenants
const mockTenants: AdminTenant[] = [
  {
    id: 'tenant-001',
    name: 'Empresa Alpha Ltda',
    nomeFantasia: 'Alpha',
    cnpj: '12.345.678/0001-90',
    email: 'contato@alpha.com',
    telefone: '(11) 3333-4444',
    endereco: 'Av. Paulista, 1000 - Sao Paulo/SP',
    responsavel: 'Joao Silva',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    usersCount: 2,
  },
  {
    id: 'tenant-002',
    name: 'Beta Comercio SA',
    nomeFantasia: 'Beta',
    cnpj: '98.765.432/0001-10',
    email: 'contato@beta.com',
    telefone: '(21) 2222-5555',
    endereco: 'Rua do Comercio, 500 - Rio de Janeiro/RJ',
    responsavel: 'Pedro Costa',
    isActive: true,
    createdAt: '2025-02-15T00:00:00Z',
    usersCount: 2,
  },
  {
    id: 'tenant-003',
    name: 'Gamma Servicos ME',
    nomeFantasia: 'Gamma',
    cnpj: '11.222.333/0001-44',
    email: 'contato@gamma.com',
    telefone: '(31) 3111-6666',
    endereco: 'Praca da Liberdade, 200 - Belo Horizonte/MG',
    responsavel: 'Carlos Ferreira',
    isActive: true,
    createdAt: '2025-03-20T00:00:00Z',
    usersCount: 1,
  },
];

export const useAdminTenantsStore = create<AdminTenantsStore>((set, get) => ({
  tenants: [],
  isLoading: false,
  error: null,

  fetchTenants: async () => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 500));
    set({ tenants: mockTenants, isLoading: false });
  },

  addTenant: async (data) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 500));

    const newTenant: AdminTenant = {
      id: `tenant-${Date.now()}`,
      name: data.name,
      nomeFantasia: data.name,
      cnpj: data.cnpj,
      email: data.email,
      telefone: data.telefone,
      endereco: data.endereco,
      responsavel: data.responsavel,
      isActive: data.isActive,
      createdAt: new Date().toISOString(),
      usersCount: 0,
    };

    set((state) => ({
      tenants: [...state.tenants, newTenant],
      isLoading: false,
    }));

    return true;
  },

  updateTenant: async (id, data) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 500));

    set((state) => ({
      tenants: state.tenants.map((tenant) =>
        tenant.id === id ? { ...tenant, ...data } : tenant
      ),
      isLoading: false,
    }));

    return true;
  },

  deleteTenant: async (id) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 500));

    set((state) => ({
      tenants: state.tenants.filter((tenant) => tenant.id !== id),
      isLoading: false,
    }));

    return true;
  },

  toggleTenantStatus: async (id) => {
    const tenant = get().tenants.find((t) => t.id === id);
    if (!tenant) return false;

    return get().updateTenant(id, { isActive: !tenant.isActive });
  },
}));
