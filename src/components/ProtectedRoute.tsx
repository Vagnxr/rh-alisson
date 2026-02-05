import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useTenantStore } from '@/stores/tenantStore';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const currentTenant = useTenantStore((s) => s.currentTenant);

  // Nao autenticado -> login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Super admin sem tenant selecionado -> pagina de selecao
  if (user?.isSuperAdmin && !currentTenant) {
    return <Navigate to="/selecionar-empresa" replace />;
  }

  // Usuario com tenantId mas sem tenant carregado (ex.: tenant inexistente) -> selecao para recarregar
  if (user?.tenantId && !currentTenant) {
    return <Navigate to="/selecionar-empresa" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}

// Rota que requer apenas autenticacao (sem verificar tenant)
// Usada para a pagina de selecao de tenant
export function AuthOnlyRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// Rota exclusiva para super admin (com layout)
// Usada para paginas administrativas (Usuarios, Empresas)
export function SuperAdminRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  // Nao autenticado -> login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nao e super admin -> dashboard
  if (!user?.isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
