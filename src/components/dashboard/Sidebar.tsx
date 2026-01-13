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
  Wallet,
  ShoppingCart,
  Banknote,
  ArrowDownCircle,
  ArrowUpCircle,
  Calculator,
  ClipboardList,
  CalendarDays,
  Home,
  CreditCardIcon,
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

function MenuItemComponent({ item }: { item: MenuItem }) {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const close = useSidebarStore((s) => s.close);

  // Verifica se algum submenu está ativo
  const isSubItemActive = item.subItems?.some(
    (sub) => location.pathname === sub.href
  );

  // Abre automaticamente se um submenu está ativo
  useEffect(() => {
    if (isSubItemActive) {
      setIsOpen(true);
    }
  }, [isSubItemActive]);

  // Se tem submenus
  if (item.subItems) {
    return (
      <li>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:py-2.5',
            isSubItemActive
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )}
        >
          <span className="flex items-center gap-3">
            <item.icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </button>
        {isOpen && (
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
      </li>
    );
  }

  // Item simples sem submenus
  return (
    <li>
      <NavLink
        to={item.href!}
        onClick={() => close()}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:py-2.5',
            isActive
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          )
        }
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span className="truncate">{item.label}</span>
      </NavLink>
    </li>
  );
}

export function Sidebar() {
  const isOpen = useSidebarStore((s) => s.isOpen);
  const close = useSidebarStore((s) => s.close);

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
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4 sm:h-16 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="font-bold text-slate-800">FinControl</span>
          </div>
          {/* Botao fechar mobile */}
          <button
            onClick={close}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto p-3 sm:p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <MenuItemComponent key={item.label} item={item} />
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-3 sm:p-4">
          <p className="text-xs text-slate-400">Versao 1.0.0 (MVP)</p>
        </div>
      </aside>
    </>
  );
}
