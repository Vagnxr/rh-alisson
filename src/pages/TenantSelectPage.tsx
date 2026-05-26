import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, LogOut, ChevronRight } from 'lucide-react';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import { clearTenantCache } from '@/lib/clearTenantCache';
import type { Tenant } from '@/types/tenant';

export function TenantSelectPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);

  const availableTenants = useTenantStore(s => s.availableTenants);
  const isLoading = useTenantStore(s => s.isLoading);
  const fetchAvailableTenants = useTenantStore(s => s.fetchAvailableTenants);
  const setCurrentTenant = useTenantStore(s => s.setCurrentTenant);

  useEffect(() => {
    fetchAvailableTenants();
  }, [fetchAvailableTenants]);

  const handleSelectTenant = (tenant: Tenant) => {
    clearTenantCache();
    setCurrentTenant(tenant);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">MSystem</h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestao</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.nome}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">Selecione uma Empresa</h2>
          <p className="mt-2 text-muted-foreground">Escolha a empresa que deseja acessar</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableTenants.map(tenant => (
              <button
                key={tenant.id}
                type="button"
                onClick={() => handleSelectTenant(tenant)}
                className="group flex flex-col rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <Building2 className="h-6 w-6" />
                </div>

                <h3 className="font-semibold text-foreground group-hover:text-primary">
                  {tenant.name}
                </h3>

                {tenant.cnpj && <p className="mt-1 text-sm text-muted-foreground">CNPJ: {tenant.cnpj}</p>}

                <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Acessar
                  <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        )}

        {!isLoading && availableTenants.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold text-foreground">Nenhuma empresa disponivel</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre em contato com o administrador do sistema
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
