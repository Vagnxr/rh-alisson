import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
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
  CreditCard,
  ArrowUp,
  ArrowDown,
  Building,
  Plus,
  Wallet,
  Banknote,
  Calculator,
  ClipboardList,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useAuthStore } from '@/stores/authStore';
import { useTenantStore } from '@/stores/tenantStore';
import type { MenuItemFromApi } from '@/types/auth';

interface SubMenuItem {
  label: string;
  href: string;
  permissionId: string;
}

/** Item de menu com icon ja resolvido para componente (uso interno da Sidebar). */
interface MenuItem {
  label: string;
  icon: React.ElementType;
  href?: string;
  permissionId: string;
  subItems?: SubMenuItem[];
}

/** Mapa nome do icone (string da API) -> componente Lucide. */
const ICON_BY_NAME: Record<string, React.ElementType> = {
  LayoutDashboard,
  Receipt,
  Calendar,
  TrendingUp,
  PiggyBank,
  DollarSign,
  UserCog,
  UsersRound,
  BarChart3,
  Settings,
  Truck,
  Store,
  FileText,
  Bell,
  CreditCard,
  ArrowUp,
  ArrowDown,
  Building,
  Plus,
  Wallet,
  Banknote,
  Calculator,
  ClipboardList,
  Sparkles,
};

function resolveIcon(iconName: string): React.ElementType {
  return ICON_BY_NAME[iconName] ?? FileText;
}

/** Grupos da sidebar (categorias visuais). */
type SidebarGroup = 'Operacional' | 'Vendas' | 'Compras' | 'Financeiro' | 'Analise' | 'Cadastros' | 'Sistema';

/** Configuracao de tema por modulo (grupo + cores Tailwind para icone). */
interface ModuleTheme {
  group: SidebarGroup;
  /** Cor base usada no fundo do icone quando inativo. */
  bgColor: string;
  /** Cor base usada no icone. */
  iconColor: string;
  /** Cor base do estado ativo (fundo). */
  activeBg: string;
  /** Cor base do estado ativo (texto). */
  activeText: string;
  /** Cor da barra lateral no estado ativo. */
  activeBar: string;
}

/** Tema padrao quando o modulo nao esta mapeado. */
const DEFAULT_THEME: ModuleTheme = {
  group: 'Operacional',
  bgColor: 'bg-slate-100',
  iconColor: 'text-slate-600',
  activeBg: 'bg-slate-100',
  activeText: 'text-slate-900',
  activeBar: 'bg-slate-500',
};

/** Cor por modulo. Cada modulo tem sua cor distintiva, mas a paleta e harmoniosa. */
const MODULE_THEME: Record<string, ModuleTheme> = {
  // Operacional
  dashboard: {
    group: 'Operacional',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    activeBg: 'bg-indigo-50',
    activeText: 'text-indigo-900',
    activeBar: 'bg-indigo-500',
  },
  agenda: {
    group: 'Operacional',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
    activeBg: 'bg-blue-50',
    activeText: 'text-blue-900',
    activeBar: 'bg-blue-500',
  },
  lembretes: {
    group: 'Operacional',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-600',
    activeBg: 'bg-amber-50',
    activeText: 'text-amber-900',
    activeBar: 'bg-amber-500',
  },
  'recursos-humanos': {
    group: 'Operacional',
    bgColor: 'bg-violet-50',
    iconColor: 'text-violet-600',
    activeBg: 'bg-violet-50',
    activeText: 'text-violet-900',
    activeBar: 'bg-violet-500',
  },
  'outras-funcoes': {
    group: 'Operacional',
    bgColor: 'bg-slate-100',
    iconColor: 'text-slate-600',
    activeBg: 'bg-slate-100',
    activeText: 'text-slate-900',
    activeBar: 'bg-slate-500',
  },

  // Vendas
  'controle-cartoes': {
    group: 'Vendas',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
    activeBg: 'bg-purple-50',
    activeText: 'text-purple-900',
    activeBar: 'bg-purple-500',
  },

  // Compras
  entrada: {
    group: 'Compras',
    bgColor: 'bg-sky-50',
    iconColor: 'text-sky-600',
    activeBg: 'bg-sky-50',
    activeText: 'text-sky-900',
    activeBar: 'bg-sky-500',
  },
  saida: {
    group: 'Compras',
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-600',
    activeBg: 'bg-rose-50',
    activeText: 'text-rose-900',
    activeBar: 'bg-rose-500',
  },
  fornecedores: {
    group: 'Compras',
    bgColor: 'bg-teal-50',
    iconColor: 'text-teal-600',
    activeBg: 'bg-teal-50',
    activeText: 'text-teal-900',
    activeBar: 'bg-teal-500',
  },
  'ativo-imobilizado': {
    group: 'Compras',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
    activeBg: 'bg-orange-50',
    activeText: 'text-orange-900',
    activeBar: 'bg-orange-500',
  },

  // Financeiro
  despesas: {
    group: 'Financeiro',
    bgColor: 'bg-red-50',
    iconColor: 'text-red-600',
    activeBg: 'bg-red-50',
    activeText: 'text-red-900',
    activeBar: 'bg-red-500',
  },
  socios: {
    group: 'Financeiro',
    bgColor: 'bg-fuchsia-50',
    iconColor: 'text-fuchsia-600',
    activeBg: 'bg-fuchsia-50',
    activeText: 'text-fuchsia-900',
    activeBar: 'bg-fuchsia-500',
  },
  financeiro: {
    group: 'Financeiro',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    activeBg: 'bg-emerald-50',
    activeText: 'text-emerald-900',
    activeBar: 'bg-emerald-500',
  },
  parcelamento: {
    group: 'Financeiro',
    bgColor: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    activeBg: 'bg-yellow-50',
    activeText: 'text-yellow-900',
    activeBar: 'bg-yellow-500',
  },
  'renda-extra': {
    group: 'Financeiro',
    bgColor: 'bg-green-50',
    iconColor: 'text-green-600',
    activeBg: 'bg-green-50',
    activeText: 'text-green-900',
    activeBar: 'bg-green-500',
  },
  investimento: {
    group: 'Financeiro',
    bgColor: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    activeBg: 'bg-cyan-50',
    activeText: 'text-cyan-900',
    activeBar: 'bg-cyan-500',
  },

  // Analise
  'balanco-geral': {
    group: 'Analise',
    bgColor: 'bg-violet-50',
    iconColor: 'text-violet-600',
    activeBg: 'bg-violet-50',
    activeText: 'text-violet-900',
    activeBar: 'bg-violet-500',
  },
  relatorios: {
    group: 'Analise',
    bgColor: 'bg-pink-50',
    iconColor: 'text-pink-600',
    activeBg: 'bg-pink-50',
    activeText: 'text-pink-900',
    activeBar: 'bg-pink-500',
  },

  // Cadastros
  lojas: {
    group: 'Cadastros',
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-700',
    activeBg: 'bg-amber-50',
    activeText: 'text-amber-900',
    activeBar: 'bg-amber-600',
  },

  // Sistema
  configuracoes: {
    group: 'Sistema',
    bgColor: 'bg-slate-100',
    iconColor: 'text-slate-500',
    activeBg: 'bg-slate-100',
    activeText: 'text-slate-900',
    activeBar: 'bg-slate-500',
  },
};

/** Ordem de exibicao dos grupos na sidebar. */
const GROUP_ORDER: SidebarGroup[] = [
  'Operacional',
  'Vendas',
  'Compras',
  'Financeiro',
  'Analise',
  'Cadastros',
  'Sistema',
];

function getTheme(permissionId: string): ModuleTheme {
  return MODULE_THEME[permissionId] ?? DEFAULT_THEME;
}

/** Palavras de ligacao (2+ letras) que ficam em minusculo no titulo. */
const TITLE_CASE_SKIP = new Set([
  'de', 'da', 'do', 'das', 'dos', 'e', 'a', 'o', 'em', 'no', 'na', 'nos', 'nas',
  'ao', 'aos', 'à', 'às', 'um', 'uma', 'para', 'por', 'com', 'que', 'se', 'ou', 'mas',
]);

/**
 * Formata label para exibicao: acentos preservados, titulo com iniciais maiusculas.
 * Palavras de 1 letra e de ligacao (de, da, e, etc.) ficam em minusculo.
 */
function formatSidebarLabel(text: string): string {
  if (!text || !text.trim()) return text;
  return text
    .trim()
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (word.length === 1) return lower;
      if (TITLE_CASE_SKIP.has(lower)) return lower;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/** Converte menu da API (icon como string) em itens com icon como componente. */
function mapMenuFromApi(menu: MenuItemFromApi[]): MenuItem[] {
  return menu.map((item) => ({
    label: formatSidebarLabel(item.label ?? ''),
    icon: resolveIcon(item.icon),
    href: item.href,
    permissionId: item.permissionId,
    subItems: item.subItems?.map((sub) => ({
      ...sub,
      label: formatSidebarLabel(sub.label ?? ''),
    })),
  }));
}

function MenuItemComponent({ item, isExpanded }: { item: MenuItem; isExpanded: boolean }) {
  const location = useLocation();
  const close = useSidebarStore(s => s.close);
  const openSubmenus = useSidebarStore(s => s.openSubmenus);
  const toggleSubmenu = useSidebarStore(s => s.toggleSubmenu);
  const setSubmenuOpen = useSidebarStore(s => s.setSubmenuOpen);
  const theme = getTheme(item.permissionId);

  const isOpen = openSubmenus.includes(item.label);

  const isSubItemActive =
    item.subItems?.some(sub => location.pathname === sub.href) ||
    (!!item.href && location.pathname === item.href);

  const prevPathnameRef = useRef(location.pathname);

  // Abre submenu apenas quando o usuario navega para uma pagina filha (nao reabre se ele minimizou)
  useEffect(() => {
    const pathChanged = prevPathnameRef.current !== location.pathname;
    prevPathnameRef.current = location.pathname;
    if (isSubItemActive && !isOpen && pathChanged) {
      setSubmenuOpen(item.label, true);
    }
  }, [location.pathname, isSubItemActive, isOpen, item.label, setSubmenuOpen]);

  /** Renderiza apenas o icone com fundo colorido (chip). Reutilizado em ambos os tipos de item. */
  const IconChip = ({ active }: { active: boolean }) => (
    <span
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
        active ? theme.activeBg : theme.bgColor,
      )}
    >
      <item.icon className={cn('h-[18px] w-[18px]', theme.iconColor)} />
    </span>
  );

  if (item.subItems && item.subItems.length > 0) {
    const parentHref = item.href;
    return (
      <li className="group relative">
        <div className="relative flex w-full items-center gap-0">
          {/* Barra lateral colorida quando ativo */}
          <span
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full transition-opacity',
              isSubItemActive ? `${theme.activeBar} opacity-100` : 'opacity-0',
            )}
            aria-hidden
          />
          {parentHref ? (
            <>
              <NavLink
                to={parentHref}
                onClick={() => close()}
                className={({ isActive }) =>
                  cn(
                    'flex flex-1 min-w-0 items-center gap-2 rounded-lg px-2 py-2 text-left transition-all duration-150',
                    isActive || isSubItemActive
                      ? `${theme.activeBg} ${theme.activeText} font-semibold`
                      : 'text-slate-700 hover:bg-slate-50',
                    isExpanded ? 'opacity-100' : 'opacity-0 lg:hidden',
                  )
                }
                title={!isExpanded ? item.label : undefined}
              >
                <IconChip active={isSubItemActive} />
                <span className="truncate text-sm">{item.label}</span>
              </NavLink>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); isExpanded && toggleSubmenu(item.label); }}
                aria-label={isOpen ? 'Fechar submenu' : 'Abrir submenu'}
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-lg p-2 transition-all duration-150',
                  isSubItemActive ? theme.activeText : 'text-slate-500 hover:bg-slate-100',
                  isOpen && 'rotate-180',
                  isExpanded ? 'opacity-100' : 'opacity-0 lg:hidden',
                )}
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => isExpanded && toggleSubmenu(item.label)}
              title={!isExpanded ? item.label : undefined}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors duration-150',
                isSubItemActive
                  ? `${theme.activeBg} ${theme.activeText} font-semibold`
                  : 'text-slate-700 hover:bg-slate-50',
              )}
            >
              <IconChip active={isSubItemActive} />
              <span
                className={cn(
                  'flex-1 truncate text-left transition-opacity duration-150',
                  isExpanded ? 'opacity-100' : 'opacity-0 lg:hidden',
                )}
              >
                {item.label}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 shrink-0 transition-all duration-150',
                  isOpen && 'rotate-180',
                  isExpanded ? 'opacity-100' : 'opacity-0 lg:hidden',
                )}
              />
            </button>
          )}
        </div>

        <div
          className={cn(
            'transition-all duration-200',
            isExpanded && isOpen ? 'max-h-[50vh] opacity-100' : 'max-h-0 overflow-hidden opacity-0',
          )}
        >
          <ul className="mt-1 ml-10 max-h-[calc(50vh-1rem)] space-y-0.5 overflow-y-auto border-l-2 border-slate-200 pl-3">
            {item.subItems.map(subItem => (
              <li key={subItem.href}>
                <NavLink
                  to={subItem.href}
                  onClick={() => close()}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-1.5 text-sm transition-colors',
                      isActive
                        ? `${theme.activeBg} ${theme.activeText} font-semibold`
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
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
          <div className="absolute top-0 left-full z-50 ml-2 hidden max-h-[70vh] min-w-48 flex-col rounded-lg border border-slate-200 bg-white shadow-lg group-hover:flex">
            <div className="shrink-0 border-b border-slate-100 px-3 py-2">
              <span className="text-sm font-semibold text-slate-900">{item.label}</span>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {item.subItems.map(subItem => (
                <NavLink
                  key={subItem.href}
                  to={subItem.href}
                  onClick={() => close()}
                  className={({ isActive }) =>
                    cn(
                      'block px-3 py-1.5 text-sm transition-colors',
                      isActive
                        ? `${theme.activeBg} ${theme.activeText} font-semibold`
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
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

  const isActive = !!item.href && location.pathname === item.href;
  return (
    <li className="group relative">
      {/* Barra lateral colorida quando ativo */}
      <span
        className={cn(
          'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full transition-opacity',
          isActive ? `${theme.activeBar} opacity-100` : 'opacity-0',
        )}
        aria-hidden
      />
      <NavLink
        to={item.href!}
        onClick={() => close()}
        title={!isExpanded ? item.label : undefined}
        className={cn(
          'flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-150',
          isActive
            ? `${theme.activeBg} ${theme.activeText} font-semibold`
            : 'text-slate-700 hover:bg-slate-50',
        )}
      >
        <IconChip active={isActive} />
        <span
          className={cn(
            'truncate transition-opacity duration-150',
            isExpanded ? 'opacity-100' : 'opacity-0 lg:hidden',
          )}
        >
          {item.label}
        </span>
      </NavLink>

      {!isExpanded && (
        <div className="absolute top-1/2 left-full z-50 ml-2 hidden -translate-y-1/2 rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium whitespace-nowrap text-white shadow-lg group-hover:block">
          {item.label}
          <div className="absolute top-1/2 -left-1 h-2 w-2 -translate-y-1/2 rotate-45 bg-slate-900" />
        </div>
      )}
    </li>
  );
}

export function Sidebar() {
  const isOpen = useSidebarStore(s => s.isOpen);
  const close = useSidebarStore(s => s.close);
  const isPinned = useSidebarStore(s => s.isPinned);
  const togglePin = useSidebarStore(s => s.togglePin);
  const [isHovered, setIsHovered] = useState(false);
  const location = useLocation();
  const menuFromApi = useAuthStore(s => s.menu);
  const currentTenant = useTenantStore(s => s.currentTenant);

  const menuItems = useMemo(() => {
    if (!menuFromApi || menuFromApi.length === 0) return [];
    const items = mapMenuFromApi(menuFromApi);
    if (!currentTenant?.isMultiloja) {
      return items.filter(item => item.permissionId !== 'lojas');
    }
    return items;
  }, [menuFromApi, currentTenant?.isMultiloja]);

  /** Agrupa items por categoria visual (sem alterar o conteudo). */
  const groupedMenu = useMemo(() => {
    const map = new Map<SidebarGroup, MenuItem[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const item of menuItems) {
      const group = getTheme(item.permissionId).group;
      const list = map.get(group) ?? [];
      list.push(item);
      map.set(group, list);
    }
    return Array.from(map.entries())
      .filter(([, list]) => list.length > 0);
  }, [menuItems]);

  // Fechar sidebar no mobile ao trocar de rota (evita ficar fixa/aberta)
  useEffect(() => {
    close();
  }, [location.pathname, close]);

  // Desktop: expande se pinned OU hover
  const isDesktop =
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;
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
          onKeyDown={e => e.key === 'Enter' && close()}
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
          'w-64',
        )}
      >
        {/* Header: logo clicavel -> tela em branco (privacidade) ou voltar ao dashboard */}
        <div className="flex h-16 items-center border-b border-slate-200 px-3">
          <Link
            to={location.pathname === '/tela-branca' ? '/dashboard' : '/tela-branca'}
            title={location.pathname === '/tela-branca' ? 'Voltar' : 'Tela em branco (privacidade)'}
            className={cn('flex shrink-0 items-center justify-around overflow-hidden rounded-lg transition-opacity hover:opacity-90')}
          >
            {isExpanded ? (
              <img
                src="/logotipo-colorido.svg"
                alt=""
                className={cn('object-contain object-left', isExpanded ? 'h-36 w-36' : 'h-20 w-20')}
              />
            ) : (
              <img
                src="/logo.svg"
                alt=""
                className={cn(
                  'ml-[-20px] object-contain object-left',
                  isExpanded ? 'h-36 w-36' : 'h-20 w-20',
                )}
              />
            )}
          </Link>

          {/* Botao Pin (desktop) - sempre visivel quando expandido */}
          <button
            onClick={togglePin}
            title={isPinned ? 'Recolher menu' : 'Fixar menu aberto'}
            className={cn(
              'ml-auto hidden rounded-lg p-1.5 transition-all lg:block',
              isPinned
                ? 'text-emerald-600 hover:bg-emerald-50'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600',
              isExpanded ? 'opacity-100' : 'w-0 overflow-hidden opacity-0',
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

        {/* Menu agrupado por categoria visual */}
        <nav className="flex-1 overflow-x-hidden overflow-y-auto p-2">
          {groupedMenu.map(([group, items], groupIndex) => (
            <div key={group} className={cn('space-y-1', groupIndex > 0 && 'mt-4')}>
              <div
                className={cn(
                  'flex items-center px-3 transition-all duration-150',
                  isExpanded ? 'opacity-100' : 'lg:opacity-0 lg:h-0 lg:overflow-hidden',
                )}
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                  {group}
                </span>
              </div>
              <ul className="space-y-0.5">
                {items.map(item => (
                  <MenuItemComponent
                    key={item.permissionId}
                    item={item}
                    isExpanded={isExpanded}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-3">
          <p
            className={cn(
              'text-center text-xs whitespace-nowrap text-slate-400 transition-opacity duration-150',
              isExpanded ? 'opacity-100' : 'w-0 overflow-hidden opacity-0',
            )}
          >
            Versão 1.0.0 (MVP)
          </p>
        </div>
      </aside>
    </>
  );
}
