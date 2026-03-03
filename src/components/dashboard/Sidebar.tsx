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
};

function resolveIcon(iconName: string): React.ElementType {
  return ICON_BY_NAME[iconName] ?? FileText;
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

  if (item.subItems && item.subItems.length > 0) {
    const parentHref = item.href;
    const rowClassName = cn(
      'flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
      isSubItemActive
        ? 'bg-emerald-100 text-emerald-800'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
    );
    return (
      <li className="group relative">
        <div className="flex w-full items-center gap-0">
          {parentHref ? (
            <>
              <NavLink
                to={parentHref}
                onClick={() => close()}
                className={({ isActive }) =>
                  cn(
                    'flex flex-1 min-w-0 items-center rounded-lg px-3 py-2.5 text-left transition-opacity duration-150',
                    isActive || isSubItemActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    isExpanded ? 'opacity-100' : 'opacity-0 lg:hidden',
                  )
                }
                title={!isExpanded ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="ml-3 truncate">{item.label}</span>
              </NavLink>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); isExpanded && toggleSubmenu(item.label); }}
                aria-label={isOpen ? 'Fechar submenu' : 'Abrir submenu'}
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-lg p-2 transition-all duration-150',
                  isSubItemActive ? 'text-emerald-800' : 'text-slate-600 hover:bg-slate-100',
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
              className={rowClassName}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span
                className={cn(
                  'ml-3 flex-1 truncate text-left transition-opacity duration-150',
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
          <ul className="mt-1 ml-8 max-h-[calc(50vh-1rem)] space-y-1 overflow-y-auto border-l border-slate-200 pl-3">
            {item.subItems.map(subItem => (
              <li key={subItem.href}>
                <NavLink
                  to={subItem.href}
                  onClick={() => close()}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-emerald-100 font-medium text-emerald-800'
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
              <span className="text-sm font-medium text-slate-900">{item.label}</span>
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
                        ? 'bg-emerald-100 font-medium text-emerald-800'
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

  return (
    <li className="group relative">
      <NavLink
        to={item.href!}
        onClick={() => close()}
        title={!isExpanded ? item.label : undefined}
        className={({ isActive }) =>
          cn(
            'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150',
            isActive
              ? 'bg-emerald-100 text-emerald-800'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
          )
        }
      >
        <item.icon className="h-5 w-5 shrink-0" />
        <span
          className={cn(
            'ml-3 truncate transition-opacity duration-150',
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

        {/* Menu */}
        <nav className="flex-1 overflow-x-hidden overflow-y-auto p-2">
          <ul className="space-y-1">
            {menuItems.map(item => (
              <MenuItemComponent key={item.permissionId} item={item} isExpanded={isExpanded} />
            ))}
          </ul>
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
