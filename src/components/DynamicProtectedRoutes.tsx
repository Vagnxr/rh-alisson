import { createElement, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { getComponentForPath } from '@/lib/routeRegistry';

/**
 * Renderiza o componente correto para o pathname atual.
 * O menu (GET /auth/acessos) define os hrefs permitidos; o registro em routeRegistry
 * mapeia path -> componente (ou placeholder). Usado como unica rota filha de ProtectedRoute
 * para evitar erro "is not a <Route> component" (filhos de Routes devem ser Route).
 */
export function DynamicProtectedRoutes() {
  const location = useLocation();
  const pathname = location.pathname;
  const Component = useMemo(() => getComponentForPath(pathname), [pathname]);
  return createElement(Component);
}
