import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Loader2, LogOut, ChevronRight } from 'lucide-react';
import { useTenantStore } from '@/stores/tenantStore';
import { useAuthStore } from '@/stores/authStore';
import type { Tenant } from '@/types/tenant';

export function TenantSelectPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  
  const availableTenants = useTenantStore((s) => s.availableTenants);
  const isLoading = useTenantStore((s) => s.isLoading);
  const fetchAvailableTenants = useTenantStore((s) => s.fetchAvailableTenants);
  const setCurrentTenant = useTenantStore((s) => s.setCurrentTenant);

  useEffect(() => {
    fetchAvailableTenants();
  }, [fetchAvailableTenants]);

  const handleSelectTenant = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">FinControl</h1>
              <p className="text-xs text-slate-500">Plataforma Financeira</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">{user?.nome}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900">
            Selecione uma Empresa
          </h2>
          <p className="mt-2 text-slate-600">
            Escolha a empresa que deseja acessar
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableTenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => handleSelectTenant(tenant)}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:border-emerald-300 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                  <Building2 className="h-6 w-6" />
                </div>
                
                <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700">
                  {tenant.name}
                </h3>
                
                {tenant.cnpj && (
                  <p className="mt-1 text-sm text-slate-500">
                    CNPJ: {tenant.cnpj}
                  </p>
                )}
                
                <div className="mt-4 flex items-center text-sm font-medium text-emerald-600 opacity-0 transition-opacity group-hover:opacity-100">
                  Acessar
                  <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        )}

        {!isLoading && availableTenants.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-300" />
            <h3 className="mt-4 font-semibold text-slate-900">
              Nenhuma empresa disponivel
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Entre em contato com o administrador do sistema
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
