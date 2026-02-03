import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginCredentials, RegisterData } from '@/types/auth';
import { useTenantStore } from './tenantStore';

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

// Mock de usuario normal (tem tenantId fixo)
const mockNormalUser: User = {
  id: '1',
  nome: 'Usuario Teste',
  email: 'teste@email.com',
  tenantId: 'tenant-001', // Usuario normal ja tem tenant associado
  lojas: ['loja-1'],
  permissoes: ['*'],
  isSuperAdmin: false,
};

// Mock de super admin (nao tem tenantId, precisa selecionar)
const mockSuperAdmin: User = {
  id: '0',
  nome: 'Super Admin',
  email: 'admin@msystem.com',
  tenantId: null, // Super admin precisa selecionar tenant
  lojas: [],
  permissoes: ['*'],
  isSuperAdmin: true,
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

        // Mock: verifica tipo de usuario
        if (credentials.email && credentials.password) {
          // Se email contem "admin" = super admin
          const isSuperAdmin = credentials.email.toLowerCase().includes('admin@msystem');
          
          if (isSuperAdmin) {
            // Super admin - nao seta tenant automaticamente
            set({
              user: { ...mockSuperAdmin, email: credentials.email },
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            // Usuario normal - ja tem tenant associado
            // Seta o tenant automaticamente baseado no retorno do login
            const tenantStore = useTenantStore.getState();
            tenantStore.setCurrentTenant({
              id: mockNormalUser.tenantId!,
              name: 'Empresa Alpha Ltda',
              nomeFantasia: 'Alpha',
              cnpj: '12.345.678/0001-90',
              isActive: true,
              createdAt: '2025-01-01T00:00:00Z',
            });
            
            set({
              user: { ...mockNormalUser, email: credentials.email },
              isAuthenticated: true,
              isLoading: false,
            });
          }
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

        // Mock: aceita qualquer registro (como usuario normal)
        if (data.email && data.password && data.nome) {
          // Seta tenant padrao para novo usuario
          const tenantStore = useTenantStore.getState();
          tenantStore.setCurrentTenant({
            id: 'tenant-001',
            name: 'Empresa Alpha Ltda',
            nomeFantasia: 'Alpha',
            cnpj: '12.345.678/0001-90',
            isActive: true,
            createdAt: '2025-01-01T00:00:00Z',
          });

          set({
            user: { 
              ...mockNormalUser, 
              email: data.email, 
              nome: data.nome,
              tenantId: 'tenant-001',
            },
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
        // Limpa tenant ao fazer logout
        const tenantStore = useTenantStore.getState();
        tenantStore.clearTenant();

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

// Helper para verificar se precisa selecionar tenant
export function needsTenantSelection(): boolean {
  const authStore = useAuthStore.getState();
  const tenantStore = useTenantStore.getState();
  
  // Precisa selecionar tenant se:
  // 1. Usuario esta autenticado
  // 2. Usuario e super admin (isSuperAdmin = true)
  // 3. Nenhum tenant foi selecionado
  return (
    authStore.isAuthenticated &&
    authStore.user?.isSuperAdmin === true &&
    tenantStore.currentTenant === null
  );
}
