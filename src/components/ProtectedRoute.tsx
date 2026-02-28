import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useTenantStore } from '@/stores/tenantStore';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { hasRoutePermission, getFirstAllowedPath } from '@/lib/paginasPermissao';

export function ProtectedRoute() {
  const location = useLocation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const acessosFetchedAtMount = useAuthStore((s) => s.acessosFetchedAtMount);
  const fetchAcessos = useAuthStore((s) => s.fetchAcessos);
  const pathToPermissionId = useAuthStore((s) => s.pathToPermissionId);
  const currentTenant = useTenantStore((s) => s.currentTenant);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchAcessos();
    }
  }, [isAuthenticated, user?.id, fetchAcessos]);

  // Nao autenticado -> login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Apos refresh, espera o primeiro GET /auth/acessos para ter permissoes e menu sincronizados
  if (!acessosFetchedAtMount) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden />
      </div>
    );
  }

  // Super admin sem tenant selecionado -> pagina de selecao
  if (user?.isSuperAdmin && !currentTenant) {
    return <Navigate to="/selecionar-empresa" replace />;
  }

  // Usuario com tenantId mas sem tenant carregado (ex.: tenant inexistente) -> selecao para recarregar
  if (user?.tenantId && !currentTenant) {
    return <Navigate to="/selecionar-empresa" replace />;
  }

  // Sem permissao para esta rota -> redireciona para primeira rota permitida
  const permissoes = user?.permissoes ?? [];
  if (!hasRoutePermission(permissoes, location.pathname, pathToPermissionId)) {
    return <Navigate to={getFirstAllowedPath(permissoes)} replace />;
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
