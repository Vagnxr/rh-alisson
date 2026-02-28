import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  LoginCredentials,
  RegisterData,
  AcessosResponse,
  TenantAuth,
  MenuItemFromApi,
} from '@/types/auth';
import type { Tenant } from '@/types/tenant';
import { useTenantStore } from './tenantStore';
import { api } from '@/lib/api';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** False ate o primeiro fetchAcessos concluir (nao persistido; no refresh mostra loading ate bater no endpoint). */
  acessosFetchedAtMount: boolean;
  /** Evita chamadas duplicadas (ex.: Strict Mode). */
  _isFetchingAcessos: boolean;
  /** Menu retornado por GET /auth/acessos (sidebar). Nao persistido. */
  menu: MenuItemFromApi[] | null;
  /** Mapa path -> permissionId derivado do menu (para protecao de rotas). Nao persistido. */
  pathToPermissionId: Record<string, string> | null;
  error: string | null;

  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  /** Busca permissoes e tenant (sidebar). Usar apos login e apos criar despesa customizada. */
  fetchAcessos: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

function buildPathToPermissionIdFromMenu(menu: MenuItemFromApi[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const item of menu) {
    if (item.href) map[item.href] = item.permissionId;
    for (const sub of item.subItems ?? []) {
      map[sub.href] = sub.permissionId;
    }
  }
  return map;
}

function mapTenantAuthToTenant(t: TenantAuth | null): Tenant | null {
  if (!t) return null;
  return {
    id: t.id,
    name: t.name,
    nomeFantasia: t.nomeFantasia ?? '',
    cnpj: t.cnpj ?? '',
    logo: t.urlLogo ?? undefined,
    isActive: t.isActive ?? true,
    isMultiloja: t.isMultiloja ?? false,
    paginasPermitidas: t.paginasPermitidas ?? undefined,
    createdAt: t.createdAt ?? new Date().toISOString(),
  };
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
      acessosFetchedAtMount: false,
      _isFetchingAcessos: false,
      menu: null,
      pathToPermissionId: null,
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
          const userPayload = data.user as {
            id: string;
            nome: string;
            email: string;
            tenantId?: string | null;
            lojas?: string[];
            isSuperAdmin?: boolean;
          };
          const user = mapUser({ ...userPayload, permissoes: [] });

          set({
            user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          await get().fetchAcessos();

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
          const userPayload = responseData.user as {
            id: string;
            nome: string;
            email: string;
            tenantId?: string | null;
            lojas?: string[];
            isSuperAdmin?: boolean;
          };
          const user = mapUser({ ...userPayload, permissoes: [] });

          set({
            user,
            accessToken: responseData.accessToken,
            refreshToken: responseData.refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          await get().fetchAcessos();

          return true;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Erro ao criar conta';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      fetchAcessos: async () => {
        const { user, isAuthenticated, _isFetchingAcessos } = get();
        if (!isAuthenticated || !user || _isFetchingAcessos) return;
        set({ _isFetchingAcessos: true });
        try {
          const res = await api.get<AcessosResponse>('auth/acessos');
          const data = res.data ?? {};
          const permissoes = Array.isArray(data.permissoes) ? data.permissoes : [];
          const tenant = data.tenant ?? null;
          const menu = Array.isArray(data.menu) ? data.menu : null;
          const pathToPermissionId = menu ? buildPathToPermissionIdFromMenu(menu) : null;
          set((state) => ({
            user: state.user ? { ...state.user, permissoes } : null,
            menu,
            pathToPermissionId,
          }));
          const tenantStore = useTenantStore.getState();
          tenantStore.setCurrentTenant(mapTenantAuthToTenant(tenant));
        } catch {
          // Silencioso: mantém estado atual (ex.: token inválido será tratado em outra requisição)
        } finally {
          set({ acessosFetchedAtMount: true, _isFetchingAcessos: false });
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
          acessosFetchedAtMount: false,
          menu: null,
          pathToPermissionId: null,
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
