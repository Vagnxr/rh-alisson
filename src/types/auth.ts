export interface User {
  id: string;
  nome: string;
  email: string;
  tenantId: string | null; // null = super admin que precisa selecionar tenant
  lojas: string[];
  permissoes: string[];
  isSuperAdmin: boolean; // true = pode acessar multiplos tenants
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  nome: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Response do login (mock)
export interface LoginResponse {
  user: User;
  token: string;
  tenantId: string | null; // null se for super admin
}

/** Item de submenu retornado pelo GET /auth/acessos (menu). */
export interface MenuSubItemFromApi {
  label: string;
  href: string;
  permissionId: string;
}

/** Item de menu retornado pelo GET /auth/acessos. Icon = nome do icone Lucide (ex.: LayoutDashboard). */
export interface MenuItemFromApi {
  label: string;
  icon: string;
  href?: string;
  permissionId: string;
  subItems?: MenuSubItemFromApi[];
}

/** Resposta do GET /auth/acessos - permissoes, tenant e menu para a sidebar. */
export interface AcessosResponse {
  permissoes: string[];
  tenant: TenantAuth | null;
  menu?: MenuItemFromApi[];
}

/** Tenant retornado pelo endpoint de acessos (mesma logica do login). */
export interface TenantAuth {
  id: string;
  name: string;
  nomeFantasia?: string | null;
  cnpj?: string | null;
  isActive?: boolean;
  isMultiloja?: boolean;
  urlLogo?: string | null;
  paginasPermitidas?: string[] | null;
  createdAt?: string;
}
