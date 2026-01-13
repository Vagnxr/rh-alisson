import { create } from 'zustand';
import type { AdminUser, AdminUserFormData } from '@/types/admin';

interface AdminUsersState {
  users: AdminUser[];
  isLoading: boolean;
  error: string | null;
}

interface AdminUsersActions {
  fetchUsers: () => Promise<void>;
  addUser: (data: AdminUserFormData) => Promise<boolean>;
  updateUser: (id: string, data: Partial<AdminUserFormData>) => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  toggleUserStatus: (id: string) => Promise<boolean>;
}

type AdminUsersStore = AdminUsersState & AdminUsersActions;

// Mock de usuarios
const mockUsers: AdminUser[] = [
  {
    id: 'user-001',
    nome: 'Joao Silva',
    email: 'joao@alpha.com',
    telefone: '(11) 99999-1111',
    tenantId: 'tenant-001',
    tenantName: 'Empresa Alpha Ltda',
    role: 'admin',
    isActive: true,
    createdAt: '2025-01-01T10:00:00Z',
    lastLogin: '2026-01-13T08:30:00Z',
  },
  {
    id: 'user-002',
    nome: 'Maria Santos',
    email: 'maria@alpha.com',
    telefone: '(11) 99999-2222',
    tenantId: 'tenant-001',
    tenantName: 'Empresa Alpha Ltda',
    role: 'manager',
    isActive: true,
    createdAt: '2025-02-15T14:00:00Z',
    lastLogin: '2026-01-12T17:45:00Z',
  },
  {
    id: 'user-003',
    nome: 'Pedro Costa',
    email: 'pedro@beta.com',
    telefone: '(21) 98888-3333',
    tenantId: 'tenant-002',
    tenantName: 'Beta Comercio SA',
    role: 'admin',
    isActive: true,
    createdAt: '2025-03-20T09:00:00Z',
    lastLogin: '2026-01-10T11:20:00Z',
  },
  {
    id: 'user-004',
    nome: 'Ana Oliveira',
    email: 'ana@beta.com',
    tenantId: 'tenant-002',
    tenantName: 'Beta Comercio SA',
    role: 'user',
    isActive: false,
    createdAt: '2025-04-10T16:00:00Z',
  },
  {
    id: 'user-005',
    nome: 'Carlos Ferreira',
    email: 'carlos@gamma.com',
    telefone: '(31) 97777-5555',
    tenantId: 'tenant-003',
    tenantName: 'Gamma Servicos ME',
    role: 'admin',
    isActive: true,
    createdAt: '2025-05-05T11:00:00Z',
    lastLogin: '2026-01-11T14:00:00Z',
  },
];

export const useAdminUsersStore = create<AdminUsersStore>((set, get) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 500));
    set({ users: mockUsers, isLoading: false });
  },

  addUser: async (data) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 500));

    const newUser: AdminUser = {
      id: `user-${Date.now()}`,
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      tenantId: data.tenantId,
      tenantName: data.tenantId === 'tenant-001' ? 'Empresa Alpha Ltda' 
        : data.tenantId === 'tenant-002' ? 'Beta Comercio SA' 
        : 'Gamma Servicos ME',
      role: data.role,
      isActive: data.isActive,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      users: [...state.users, newUser],
      isLoading: false,
    }));

    return true;
  },

  updateUser: async (id, data) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 500));

    set((state) => ({
      users: state.users.map((user) =>
        user.id === id
          ? {
              ...user,
              ...data,
              tenantName: data.tenantId === 'tenant-001' ? 'Empresa Alpha Ltda'
                : data.tenantId === 'tenant-002' ? 'Beta Comercio SA'
                : data.tenantId === 'tenant-003' ? 'Gamma Servicos ME'
                : user.tenantName,
            }
          : user
      ),
      isLoading: false,
    }));

    return true;
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    await new Promise((r) => setTimeout(r, 500));

    set((state) => ({
      users: state.users.filter((user) => user.id !== id),
      isLoading: false,
    }));

    return true;
  },

  toggleUserStatus: async (id) => {
    const user = get().users.find((u) => u.id === id);
    if (!user) return false;

    return get().updateUser(id, { isActive: !user.isActive });
  },
}));
