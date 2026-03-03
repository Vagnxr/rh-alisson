import { createPortal } from 'react-dom';
import { LogOut, User, Bell, Menu, Building2, ChevronDown, Users, Settings, Store } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useTenantStore } from '@/stores/tenantStore';
import { useLojaStore } from '@/stores/lojaStore';
import { clearTenantCache } from '@/lib/clearTenantCache';
import { useNavigate, Link } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo } from 'react';

export function Header() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const toggleSidebar = useSidebarStore((s) => s.toggle);
  const currentTenant = useTenantStore((s) => s.currentTenant);
  const clearTenant = useTenantStore((s) => s.clearTenant);
  const { lojas, lojaAtual, setLojaAtual, fetchLojas } = useLojaStore();
  const navigate = useNavigate();
  
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showLojaMenu, setShowLojaMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [portalDropdown, setPortalDropdown] = useState<{
    type: 'tenant' | 'loja' | 'admin';
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const tenantMenuRef = useRef<HTMLDivElement>(null);
  const lojaMenuRef = useRef<HTMLDivElement>(null);
  const adminMenuRef = useRef<HTMLDivElement>(null);
  const dropdownPortalRef = useRef<HTMLDivElement>(null);

  // Calcula posicao e abre dropdown via Portal (evita scroll no header)
  useEffect(() => {
    if (showTenantMenu && tenantMenuRef.current) {
      const rect = tenantMenuRef.current.getBoundingClientRect();
      setPortalDropdown({ type: 'tenant', top: rect.bottom + 4, left: rect.left, width: 192 });
    } else if (showLojaMenu && lojaMenuRef.current) {
      const rect = lojaMenuRef.current.getBoundingClientRect();
      setPortalDropdown({ type: 'loja', top: rect.bottom + 4, left: rect.left, width: 224 });
    } else if (showAdminMenu && adminMenuRef.current) {
      const rect = adminMenuRef.current.getBoundingClientRect();
      setPortalDropdown({ type: 'admin', top: rect.bottom + 4, left: rect.right - 192, width: 192 });
    } else {
      setPortalDropdown(null);
    }
  }, [showTenantMenu, showLojaMenu, showAdminMenu]);

  // Lojas do tenant atual (API pode nao retornar tenantId; nesse caso considera do tenant atual)
  const lojasDoTenant = useMemo(() => {
    if (!currentTenant) return [];
    return lojas.filter((l) => (l.tenantId === currentTenant.id || l.tenantId == null) && l.isAtiva);
  }, [lojas, currentTenant]);

  // Verifica se o tenant permite multiloja
  const isMultiloja = currentTenant?.isMultiloja && lojasDoTenant.length > 1;

  // Carrega lojas ao montar
  useEffect(() => {
    if (currentTenant) {
      fetchLojas();
    }
  }, [currentTenant, fetchLojas]);

  // Seleciona primeira loja automaticamente se nenhuma selecionada
  useEffect(() => {
    if (lojasDoTenant.length > 0 && !lojaAtual) {
      const matriz = lojasDoTenant.find((l) => l.isMatriz);
      setLojaAtual(matriz?.id || lojasDoTenant[0].id);
    }
  }, [lojasDoTenant, lojaAtual, setLojaAtual]);

  // Fecha menus ao clicar fora (considera dropdown renderizado via Portal)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const inPortal = dropdownPortalRef.current?.contains(target);
      if (showTenantMenu && tenantMenuRef.current && !tenantMenuRef.current.contains(target) && !inPortal) {
        setShowTenantMenu(false);
      }
      if (showLojaMenu && lojaMenuRef.current && !lojaMenuRef.current.contains(target) && !inPortal) {
        setShowLojaMenu(false);
      }
      if (showAdminMenu && adminMenuRef.current && !adminMenuRef.current.contains(target) && !inPortal) {
        setShowAdminMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTenantMenu, showLojaMenu, showAdminMenu]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangeTenant = () => {
    clearTenantCache();
    clearTenant();
    setLojaAtual(null);
    setShowTenantMenu(false);
    navigate('/selecionar-empresa');
  };

  const handleSelectLoja = (lojaId: string) => {
    setLojaAtual(lojaId);
    setShowLojaMenu(false);
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:h-16 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {/* Botao menu mobile - shrink-0 garante area de toque em telas pequenas */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Abrir menu"
          className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Seletor de Empresa */}
        {currentTenant && (
          <div className="relative" ref={tenantMenuRef}>
            <button
              onClick={() => user?.isSuperAdmin && setShowTenantMenu(!showTenantMenu)}
              className={`flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm ${
                user?.isSuperAdmin 
                  ? 'cursor-pointer hover:bg-slate-50' 
                  : 'cursor-default'
              }`}
            >
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span className="hidden text-slate-500 sm:inline">Empresa:</span>
              <span className="hidden font-medium text-slate-700 sm:inline">
                {currentTenant.nomeFantasia || currentTenant.name}
              </span>
              {user?.isSuperAdmin && (
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showTenantMenu ? 'rotate-180' : ''}`} />
              )}
            </button>

          </div>
        )}

        {/* Seletor de Loja */}
        {currentTenant && isMultiloja && (
          <div className="relative" ref={lojaMenuRef}>
            <button
              onClick={() => setShowLojaMenu(!showLojaMenu)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm cursor-pointer hover:bg-slate-50"
            >
              <Store className="h-4 w-4 text-blue-600" />
              <span className="hidden text-slate-500 sm:inline">Loja:</span>
              <span className="hidden font-medium text-slate-700 sm:inline">
                {lojaAtual?.apelido || 'Selecione'}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showLojaMenu ? 'rotate-180' : ''}`} />
            </button>

          </div>
        )}

        <h2 className="hidden text-lg font-semibold text-slate-800 lg:block">
          Plataforma Financeira
        </h2>
      </div>

      <div className="flex min-w-0 items-center gap-2 sm:gap-4">
        {/* Menu Admin: Super Admin (Empresas + Usuarios) ou usuario com permissao admin-usuarios (só Usuarios) */}
        {(user?.isSuperAdmin || user?.permissoes?.includes('admin-usuarios')) && (
          <div className="relative" ref={adminMenuRef}>
            <button
              onClick={() => setShowAdminMenu(!showAdminMenu)}
              className="flex items-center gap-1.5 rounded-lg bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 transition-colors hover:bg-purple-100"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdminMenu ? 'rotate-180' : ''}`} />
            </button>

          </div>
        )}

        {/* Notificacoes */}
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Usuario */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-2 sm:gap-3 sm:pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 sm:h-9 sm:w-9">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700">
              {user?.nome}
              {user?.isSuperAdmin && (
                <span className="ml-1.5 rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">
                  Super
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            title="Sair"
          >
            <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>

      {/* Dropdowns via Portal - fora do header para evitar scroll vertical */}
      {portalDropdown &&
        createPortal(
          <div
            ref={dropdownPortalRef}
            className="fixed z-[9999] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
            style={{
              top: portalDropdown.top,
              left: portalDropdown.left,
              width: portalDropdown.width,
            }}
          >
            {portalDropdown.type === 'tenant' && (
              <button
                onClick={handleChangeTenant}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <Building2 className="h-4 w-4" />
                Trocar empresa
              </button>
            )}
            {portalDropdown.type === 'loja' && (
              <>
                <div className="border-b border-slate-100 px-3 py-2">
                  <span className="text-xs font-medium uppercase text-slate-500">Selecione a loja</span>
                </div>
                {lojasDoTenant.map((loja) => (
                  <button
                    key={loja.id}
                    onClick={() => handleSelectLoja(loja.id)}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors ${
                      lojaAtual?.id === loja.id
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Store className="h-4 w-4" />
                    <span className="flex-1 text-left">{loja.apelido}</span>
                    {loja.isMatriz && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                        MATRIZ
                      </span>
                    )}
                  </button>
                ))}
              </>
            )}
            {portalDropdown.type === 'admin' && (
              <>
                {user?.isSuperAdmin && (
                  <Link
                    to="/admin/empresas"
                    onClick={() => setShowAdminMenu(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    <Building2 className="h-4 w-4" />
                    Empresas
                  </Link>
                )}
                <Link
                  to="/admin/usuarios"
                  onClick={() => setShowAdminMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                >
                  <Users className="h-4 w-4" />
                  Usuarios
                </Link>
              </>
            )}
          </div>,
          document.body
        )}
    </header>
  );
}
