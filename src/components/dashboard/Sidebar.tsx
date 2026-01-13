import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Users,
  Building2,
  Car,
  Landmark,
  Calendar,
  TrendingUp,
  PiggyBank,
  DollarSign,
  UserCog,
  UsersRound,
  BarChart3,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSidebarStore } from '@/stores/sidebarStore';

interface SubMenuItem {
  label: string;
  href: string;
}

interface MenuItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  subItems?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Despesa Fixa', icon: Receipt, href: '/despesa-fixa' },
  { label: 'Despesa Extra', icon: CreditCard, href: '/despesa-extra' },
  { label: 'Despesa Funcionario', icon: Users, href: '/despesa-funcionario' },
  { label: 'Despesa Imposto', icon: Building2, href: '/despesa-imposto' },
  { label: 'Despesa Veiculo', icon: Car, href: '/despesa-veiculo' },
  { label: 'Despesa Banco', icon: Landmark, href: '/despesa-banco' },
  { label: 'Parcelamento', icon: Calendar, href: '/parcelamento' },
  { label: 'Renda Extra', icon: TrendingUp, href: '/renda-extra' },
  { label: 'Investimento', icon: PiggyBank, href: '/investimento' },
  {
    label: 'Financeiro',
    icon: DollarSign,
    subItems: [
      { label: 'Caixa', href: '/financeiro/caixa' },
      { label: 'Controle Cartoes', href: '/financeiro/controle-cartoes' },
      { label: 'Vendas', href: '/financeiro/vendas' },
      { label: 'Controle Dinheiro', href: '/financeiro/controle-dinheiro' },
      { label: 'Controle Deposito', href: '/financeiro/controle-deposito' },
      { label: 'Venda Cartoes', href: '/financeiro/venda-cartoes' },
      { label: 'Ativo Imobiliario', href: '/financeiro/ativo-imobiliario' },
      { label: 'Entrada', href: '/financeiro/entrada' },
      { label: 'Saida', href: '/financeiro/saida' },
      { label: 'Pago em Dinheiro', href: '/financeiro/pago-dinheiro' },
      { label: 'Calculadora de Margem', href: '/financeiro/calculadora-margem' },
      { label: 'Pedido de Venda', href: '/financeiro/pedido-venda' },
      { label: 'Agenda', href: '/financeiro/agenda' },
    ],
  },
  { label: 'Recursos Humanos', icon: UserCog, href: '/recursos-humanos' },
  { label: 'Socios', icon: UsersRound, href: '/socios' },
  { label: 'Balanco Geral', icon: BarChart3, href: '/balanco-geral' },
];

function MenuItemComponent({ item, isCollapsed }: { item: MenuItem; isCollapsed: boolean }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const close = useSidebarStore((s) => s.close);

  // Verifica se algum submenu está ativo
  const isSubItemActive = item.subItems?.some(
    (sub) => location.pathname === sub.href
  );

  // Abre automaticamente se um submenu está ativo
  useEffect(() => {
    if (isSubItemActive && !isCollapsed) {
      setIsOpen(true);
    }
  }, [isSubItemActive, isCollapsed]);

  // Fecha submenus quando minimiza
  useEffect(() => {
    if (isCollapsed) {
      setIsOpen(false);
    }
  }, [isCollapsed]);

  // Se tem submenus
  if (item.subItems) {
    return (
      <li className="relative group">
        <button
          onClick={() => !isCollapsed && setIsOpen(!isOpen)}
          title={isCollapsed ? item.label : undefined}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:py-2.5',
            isCollapsed ? 'justify-center' : 'justify-between',
            isSubItemActive
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          <span className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
            <item.icon className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span className="truncate">{item.label}</span>}
          </span>
          {!isCollapsed && (
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 transition-transform',
                isOpen && 'rotate-180'
              )}
            />
          )}
        </button>
        
        {/* Submenu - modo expandido */}
        {!isCollapsed && isOpen && (
          <ul className="ml-8 mt-1 space-y-1 border-l border-slate-200 pl-3">
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
        )}

        {/* Tooltip/Popup - modo minimizado */}
        {isCollapsed && (
          <div className="absolute left-full top-0 z-50 ml-2 hidden min-w-48 rounded-lg border border-slate-200 bg-white py-2 shadow-lg group-hover:block">
            <div className="border-b border-slate-100 px-3 pb-2 mb-2">
              <span className="text-sm font-medium text-slate-900">{item.label}</span>
            </div>
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
        )}
      </li>
    );
  }

  // Item simples sem submenus
  return (
    <li className="relative group">
      <NavLink
        to={item.href!}
        onClick={() => close()}
        title={isCollapsed ? item.label : undefined}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:py-2.5',
            isCollapsed && 'justify-center',
            isActive
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )
        }
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!isCollapsed && <span className="truncate">{item.label}</span>}
      </NavLink>

      {/* Tooltip - modo minimizado */}
      {isCollapsed && (
        <div className="absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
          {item.label}
        </div>
      )}
    </li>
  );
}

export function Sidebar() {
  const isOpen = useSidebarStore((s) => s.isOpen);
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const close = useSidebarStore((s) => s.close);
  const toggleCollapse = useSidebarStore((s) => s.toggleCollapse);

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'lg:w-16' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={cn(
          'flex h-14 items-center border-b border-slate-200 sm:h-16',
          isCollapsed ? 'justify-center px-2' : 'justify-between px-4 sm:px-6'
        )}>
          <div className={cn('flex items-center gap-2', isCollapsed && 'justify-center')}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <DollarSign className="h-5 w-5" />
            </div>
            {!isCollapsed && (
              <span className="font-bold text-slate-800">FinControl</span>
            )}
          </div>
          {/* Botao fechar mobile */}
          {!isCollapsed && (
            <button
              onClick={close}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Menu */}
        <nav className={cn('flex-1 overflow-y-auto', isCollapsed ? 'p-2' : 'p-3 sm:p-4')}>
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <MenuItemComponent key={item.label} item={item} isCollapsed={isCollapsed} />
            ))}
          </ul>
        </nav>

        {/* Footer com botao de toggle */}
        <div className={cn(
          'border-t border-slate-200',
          isCollapsed ? 'p-2' : 'p-3 sm:p-4'
        )}>
          {/* Botao de minimizar/expandir - visivel apenas em desktop */}
          <button
            onClick={toggleCollapse}
            className="hidden w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:flex"
            title={isCollapsed ? 'Expandir menu' : 'Minimizar menu'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Minimizar</span>
              </>
            )}
          </button>
          {!isCollapsed && (
            <p className="mt-2 text-xs text-slate-400 lg:mt-3">Versao 1.0.0 (MVP)</p>
          )}
        </div>
      </aside>
    </>
  );
}
