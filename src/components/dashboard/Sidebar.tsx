import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  Calendar,
  TrendingUp,
  PiggyBank,
  DollarSign,
  UserCog,
  UsersRound,
  BarChart3,
  X,
  ChevronDown,
  Settings,
  Truck,
  Store,
  Pin,
  PinOff,
  FileText,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useAuthStore } from '@/stores/authStore';
import { useTenantStore } from '@/stores/tenantStore';

interface SubMenuItem {
  label: string;
  href: string;
  permissionId: string;
}

interface MenuItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  permissionId: string;
  subItems?: SubMenuItem[];
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', permissionId: 'dashboard' },
  {
    label: 'Despesas',
    icon: Receipt,
    permissionId: 'despesas',
    subItems: [
      { label: 'Despesa Fixa', href: '/despesa-fixa', permissionId: 'despesa-fixa' },
      { label: 'Despesa Extra', href: '/despesa-extra', permissionId: 'despesa-extra' },
      { label: 'Despesa Funcionario', href: '/despesa-funcionario', permissionId: 'despesa-funcionario' },
      { label: 'Despesa Imposto', href: '/despesa-imposto', permissionId: 'despesa-imposto' },
      { label: 'Despesa Veiculo', href: '/despesa-veiculo', permissionId: 'despesa-veiculo' },
      { label: 'Despesa Banco', href: '/despesa-banco', permissionId: 'despesa-banco' },
    ],
  },
  { label: 'Parcelamento', icon: Calendar, href: '/parcelamento', permissionId: 'parcelamento' },
  { label: 'Renda Extra', icon: TrendingUp, href: '/renda-extra', permissionId: 'renda-extra' },
  { label: 'Investimento', icon: PiggyBank, href: '/investimento', permissionId: 'investimento' },
  {
    label: 'Financeiro',
    icon: DollarSign,
    permissionId: 'financeiro',
    subItems: [
      { label: 'Caixa', href: '/financeiro/caixa', permissionId: 'financeiro-caixa' },
      { label: 'Controle Cartoes', href: '/financeiro/controle-cartoes', permissionId: 'financeiro-controle-cartoes' },
      { label: 'Vendas', href: '/financeiro/vendas', permissionId: 'financeiro-vendas' },
      { label: 'Controle Dinheiro', href: '/financeiro/controle-dinheiro', permissionId: 'financeiro-controle-dinheiro' },
      { label: 'Controle Deposito', href: '/financeiro/controle-deposito', permissionId: 'financeiro-controle-deposito' },
      { label: 'Venda Cartoes', href: '/financeiro/venda-cartoes', permissionId: 'financeiro-venda-cartoes' },
      { label: 'Ativo Imobilizado', href: '/financeiro/ativo-imobilizado', permissionId: 'financeiro-ativo-imobilizado' },
      { label: 'Entrada', href: '/financeiro/entrada', permissionId: 'financeiro-entrada' },
      { label: 'Saida', href: '/financeiro/saida', permissionId: 'financeiro-saida' },
      { label: 'Pago em Dinheiro', href: '/financeiro/pago-dinheiro', permissionId: 'financeiro-pago-dinheiro' },
      { label: 'Calculadora de Margem', href: '/financeiro/calculadora-margem', permissionId: 'financeiro-calculadora-margem' },
      { label: 'Pedido de Venda', href: '/financeiro/pedido-venda', permissionId: 'financeiro-pedido-venda' },
      { label: 'A receber', href: '/financeiro/outras-funcoes/a-receber', permissionId: 'financeiro-a-receber' },
      { label: 'Venda e perda', href: '/financeiro/outras-funcoes/venda-perda', permissionId: 'financeiro-venda-perda' },
      { label: 'Agenda', href: '/financeiro/agenda', permissionId: 'financeiro-agenda' },
    ],
  },
  { label: 'Fornecedores', icon: Truck, href: '/fornecedores', permissionId: 'fornecedores' },
  { label: 'Lojas', icon: Store, href: '/lojas', permissionId: 'lojas' },
  { label: 'Recursos Humanos', icon: UserCog, href: '/recursos-humanos', permissionId: 'recursos-humanos' },
  { label: 'Socios', icon: UsersRound, href: '/socios', permissionId: 'socios' },
  { label: 'Balanco Geral', icon: BarChart3, href: '/balanco-geral', permissionId: 'balanco-geral' },
  { label: 'Relatorios', icon: FileText, href: '/relatorios', permissionId: 'relatorios' },
  { label: 'Lembretes', icon: Bell, href: '/lembretes', permissionId: 'lembretes' },
  { label: 'Configuracoes', icon: Settings, href: '/configuracoes', permissionId: 'configuracoes' },
];

function hasPermission(permissoes: string[], permissionId: string): boolean {
  if (!permissoes || permissoes.length === 0) return true;
  if (permissoes.includes('*')) return true;
  return permissoes.includes(permissionId);
}

function MenuItemComponent({ item, isExpanded }: { item: MenuItem; isExpanded: boolean }) {
  const location = useLocation();
  const close = useSidebarStore((s) => s.close);
  const openSubmenus = useSidebarStore((s) => s.openSubmenus);
  const toggleSubmenu = useSidebarStore((s) => s.toggleSubmenu);
  const setSubmenuOpen = useSidebarStore((s) => s.setSubmenuOpen);

  const isOpen = openSubmenus.includes(item.label);

  const isSubItemActive = item.subItems?.some(
    (sub) => location.pathname === sub.href
  );

  // Abre submenu automaticamente se um item filho estiver ativo
  useEffect(() => {
    if (isSubItemActive && !isOpen) {
      setSubmenuOpen(item.label, true);
    }
  }, [isSubItemActive, isOpen, item.label, setSubmenuOpen]);

  if (item.subItems && item.subItems.length > 0) {
    return (
      <li className="relative group">
        <button
          type="button"
          onClick={() => isExpanded && toggleSubmenu(item.label)}
          title={!isExpanded ? item.label : undefined}
          className={cn(
            'flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
            isSubItemActive
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          <span className={cn(
            'ml-3 flex-1 text-left truncate transition-opacity duration-150',
            isExpanded ? 'opacity-100' : 'opacity-0 lg:hidden'
          )}>
            {item.label}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 transition-all duration-150',
              isOpen && 'rotate-180',
              isExpanded ? 'opacity-100' : 'opacity-0 lg:hidden'
            )}
          />
        </button>
        
        <div className={cn(
          'transition-all duration-200',
          isExpanded && isOpen ? 'max-h-[50vh] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}>
          <ul className="ml-8 mt-1 max-h-[calc(50vh-1rem)] space-y-1 overflow-y-auto border-l border-slate-200 pl-3">
            {item.subItems.map((subItem) => (
              <li key={subItem.href}>
                <NavLink
                  to={subItem.href}
                  onClick={() => close()}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-emerald-50 font-medium text-emerald-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                    )
                  }
                >
                  {subItem.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        {!isExpanded && (
          <div className="absolute left-full top-0 z-50 ml-2 hidden min-w-48 max-h-[70vh] flex-col rounded-lg border border-slate-200 bg-white shadow-lg group-hover:flex">
            <div className="shrink-0 border-b border-slate-100 px-3 py-2">
              <span className="text-sm font-medium text-slate-900">{item.label}</span>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {item.subItems.map((subItem) => (
                <NavLink
                  key={subItem.href}
                  to={subItem.href}
                  onClick={() => close()}
                  className={({ isActive }) =>
                    cn(
                      'block px-3 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-emerald-50 font-medium text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    )
                  }
                >
                  {subItem.label}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </li>
    );
  }

  return (
    <li className="relative group">
      <NavLink
        to={item.href!}
        onClick={() => close()}
        title={!isExpanded ? item.label : undefined}
        className={({ isActive }) =>
          cn(
            'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
            isActive
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )
        }
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span className={cn(
          'ml-3 truncate transition-opacity duration-150',
          isExpanded ? 'opacity-100' : 'opacity-0 lg:hidden'
        )}>
          {item.label}
        </span>
      </NavLink>

      {!isExpanded && (
        <div className="absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block">
          {item.label}
          <div className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" />
        </div>
      )}
    </li>
  );
}

export function Sidebar() {
  const isOpen = useSidebarStore((s) => s.isOpen);
  const close = useSidebarStore((s) => s.close);
  const isPinned = useSidebarStore((s) => s.isPinned);
  const togglePin = useSidebarStore((s) => s.togglePin);
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const permissoes = useAuthStore((s) => s.user?.permissoes ?? []);
  const currentTenant = useTenantStore((s) => s.currentTenant);

  const menuItems = useMemo(() => {
    const withPermissions = MENU_ITEMS.map((item) => {
      if (item.subItems) {
        const allowedSub = item.subItems.filter((sub) => hasPermission(permissoes, sub.permissionId));
        if (allowedSub.length === 0) return null;
        return { ...item, subItems: allowedSub };
      }
      return hasPermission(permissoes, item.permissionId) ? item : null;
    }).filter((item): item is MenuItem => item !== null);

    if (!currentTenant?.isMultiloja) {
      return withPermissions.filter((item) => item.permissionId !== 'lojas');
    }
    return withPermissions;
  }, [permissoes, currentTenant?.isMultiloja]);

  // Fechar sidebar no mobile ao trocar de rota (evita ficar fixa/aberta)
  useEffect(() => {
    if (isOpen) close();
  }, [location.pathname, isOpen, close]);

  // Desktop: expande se pinned OU hover
  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
  const isExpanded = isPinned || isHovered || isOpen || !isDesktop;

  return (
    <>
      {isOpen && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Fechar menu"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity lg:hidden"
          onClick={() => close()}
          onKeyDown={(e) => e.key === 'Enter' && close()}
        />
      )}

      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white',
          'transition-all duration-300 ease-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:translate-x-0',
          isExpanded ? 'lg:w-64' : 'lg:w-[68px]',
          'w-64'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center border-b border-slate-200 px-3">
          <div className="flex items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className={cn(
              'ml-3 font-bold text-slate-800 whitespace-nowrap transition-opacity duration-150',
              isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
            )}>
              MSystem
            </span>
          </div>
          
          {/* Botao Pin (desktop) - sempre visivel quando expandido */}
          <button
            onClick={togglePin}
            title={isPinned ? 'Recolher menu' : 'Fixar menu aberto'}
            className={cn(
              'ml-auto rounded-lg p-1.5 transition-all hidden lg:block',
              isPinned 
                ? 'text-emerald-600 hover:bg-emerald-50' 
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
              isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
            )}
          >
            {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
          </button>
          
          {/* Botao Fechar (mobile) */}
          <button
            onClick={close}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <MenuItemComponent 
                key={item.label} 
                item={item} 
                isExpanded={isExpanded} 
              />
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-3">
          <p className={cn(
            'text-xs text-slate-400 text-center whitespace-nowrap transition-opacity duration-150',
            isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
          )}>
            Versao 1.0.0 (MVP)
          </p>
        </div>
      </aside>
    </>
  );
}
