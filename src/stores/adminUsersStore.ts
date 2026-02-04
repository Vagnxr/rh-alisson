import { create } from 'zustand';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import type { AdminUser, AdminUserFormData } from '@/types/admin';
import { api } from '@/lib/api';

interface AdminUsersState {
  users: AdminUser[];
  columns: TableColumnConfigFromApi[] | null;
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

export const useAdminUsersStore = create<AdminUsersStore>((set, get) => ({
  users: [],
  columns: null,
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get<AdminUser[]>('admin/users');
      set({ users: Array.isArray(res.data) ? res.data : [], columns: res.columns ?? null, isLoading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao carregar usuarios',
        isLoading: false,
      });
    }
  },

  addUser: async (data: AdminUserFormData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<AdminUser>('admin/users', data);
      set((state) => ({ users: [...state.users, res.data], isLoading: false }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao criar usuario',
        isLoading: false,
      });
      return false;
    }
  },

  updateUser: async (id: string, data: Partial<AdminUserFormData>) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.patch<AdminUser>(`admin/users/${id}`, data);
      set((state) => ({
        users: state.users.map((u) => (u.id === id ? res.data : u)),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao atualizar usuario',
        isLoading: false,
      });
      return false;
    }
  },

  deleteUser: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`admin/users/${id}`);
      set((state) => ({
        users: state.users.filter((u) => u.id !== id),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Erro ao excluir usuario',
        isLoading: false,
      });
      return false;
    }
  },

  toggleUserStatus: async (id: string) => {
    const user = get().users.find((u) => u.id === id);
    if (!user) return false;
    try {
      await api.patch(`admin/users/${id}/toggle-status`);
      set((state) => ({
        users: state.users.map((u) =>
          u.id === id ? { ...u, isActive: !u.isActive } : u
        ),
      }));
      return true;
    } catch {
      return false;
    }
  },
}));
