import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData } from '@/types/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

// Mock de usuario para desenvolvimento
const mockUser: User = {
  id: '1',
  nome: 'Usuario Teste',
  email: 'teste@email.com',
  tenantId: 'tenant-1',
  lojas: ['loja-1'],
  permissoes: ['*'],
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        // Simula delay de API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock: aceita qualquer email/senha
        if (credentials.email && credentials.password) {
          set({
            user: { ...mockUser, email: credentials.email },
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }

        set({
          error: 'Email ou senha invalidos',
          isLoading: false,
        });
        return false;
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true, error: null });

        // Simula delay de API
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock: aceita qualquer registro
        if (data.email && data.password && data.nome) {
          set({
            user: { ...mockUser, email: data.email, nome: data.nome },
            isAuthenticated: true,
            isLoading: false,
          });
          return true;
        }

        set({
          error: 'Erro ao criar conta',
          isLoading: false,
        });
        return false;
      },

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
