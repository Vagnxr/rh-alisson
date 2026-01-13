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
