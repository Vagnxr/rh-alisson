import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { TenantSelectPage } from '@/pages/TenantSelectPage';
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage';
import { AdminTenantsPage } from '@/pages/admin/AdminTenantsPage';
import { TelaBrancaPage } from '@/pages/TelaBrancaPage';
import { ProtectedRoute, AuthOnlyRoute, AdminRoute } from '@/components/ProtectedRoute';
import { DynamicProtectedRoutes } from '@/components/DynamicProtectedRoutes';
import { Toaster } from '@/components/ui/sonner';
import '@/index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas publicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />

        {/* Rota de selecao de tenant (requer autenticacao, mas nao tenant) */}
        <Route element={<AuthOnlyRoute />}>
          <Route path="/selecionar-empresa" element={<TenantSelectPage />} />
        </Route>

        {/* Rotas administrativas: /admin/usuarios para admin-usuarios ou super admin; /admin/empresas só super admin */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/usuarios" element={<AdminUsersPage />} />
          <Route path="/admin/empresas" element={<AdminTenantsPage />} />
        </Route>

        {/* Rotas protegidas: pathname resolve no registro (menu do backend). Ver routeRegistry. */}
        <Route element={<ProtectedRoute />}>
          <Route path="/tela-branca" element={<TelaBrancaPage />} />
          <Route path="*" element={<DynamicProtectedRoutes />} />
        </Route>

        {/* Redirect padrao */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
