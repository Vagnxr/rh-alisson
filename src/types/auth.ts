export interface User {
  id: string;
  nome: string;
  email: string;
  tenantId: string;
  lojas: string[];
  permissoes: string[];
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
