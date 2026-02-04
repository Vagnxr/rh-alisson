import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData } from '@/types/auth';
import { useTenantStore } from './tenantStore';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

function mapUser(u: {
  id: string;
  nome: string;
  email: string;
  tenantId?: string | null;
  lojas?: string[];
  permissoes?: string[];
  isSuperAdmin?: boolean;
}): User {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    tenantId: u.tenantId ?? null,
    lojas: Array.isArray(u.lojas) ? u.lojas : [],
    permissoes: Array.isArray(u.permissoes) ? u.permissoes : [],
    isSuperAdmin: Boolean(u.isSuperAdmin),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post<{
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
            user: {
              id: string;
              nome: string;
              email: string;
              tenantId?: string | null;
              lojas?: string[];
              permissoes?: string[];
              isSuperAdmin?: boolean;
            };
          }>('auth/login', {
            email: credentials.email,
            password: credentials.password,
          });

          const data = res.data;
          const user = mapUser(data.user);

          set({
            user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          if (user.tenantId) {
            const tenantStore = useTenantStore.getState();
            const tenants = tenantStore.availableTenants;
            const tenant = tenants.find((t) => t.id === user.tenantId!) ?? {
              id: user.tenantId,
              name: 'Empresa',
              nomeFantasia: '',
              cnpj: '',
              isActive: true,
              isMultiloja: false,
              createdAt: new Date().toISOString(),
            };
            tenantStore.setCurrentTenant(tenant);
          }

          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Email ou senha invalidos';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.post<{
            accessToken: string;
            refreshToken: string;
            expiresIn: number;
            user: {
              id: string;
              nome: string;
              email: string;
              tenantId?: string | null;
              lojas?: string[];
              permissoes?: string[];
              isSuperAdmin?: boolean;
            };
          }>('auth/register', {
            nome: data.nome,
            email: data.email,
            password: data.password,
            confirmPassword: data.confirmPassword,
          });

          const responseData = res.data;
          const user = mapUser(responseData.user);

          set({
            user,
            accessToken: responseData.accessToken,
            refreshToken: responseData.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          if (user.tenantId) {
            const tenantStore = useTenantStore.getState();
            const tenants = tenantStore.availableTenants;
            const tenant = tenants.find((t) => t.id === user.tenantId!) ?? {
              id: user.tenantId,
              name: 'Empresa',
              nomeFantasia: '',
              cnpj: '',
              isActive: true,
              isMultiloja: false,
              createdAt: new Date().toISOString(),
            };
            tenantStore.setCurrentTenant(tenant);
          }

          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erro ao criar conta';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      logout: () => {
        const { refreshToken: rt } = get();
        if (rt) {
          api.post('auth/logout', { refreshToken: rt }).catch(() => {});
        }
        const tenantStore = useTenantStore.getState();
        tenantStore.clearTenant();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export function needsTenantSelection(): boolean {
  const authStore = useAuthStore.getState();
  const tenantStore = useTenantStore.getState();
  return (
    authStore.isAuthenticated &&
    authStore.user?.isSuperAdmin === true &&
    tenantStore.currentTenant === null
  );
}
