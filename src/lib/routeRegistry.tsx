import { createElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { ComponentType } from 'react';
import type { MenuItemFromApi } from '@/types/auth';
import { DashboardPage } from '@/pages/DashboardPage';
import { DespesaFixaPage } from '@/pages/DespesaFixaPage';
import { DespesaExtraPage } from '@/pages/DespesaExtraPage';
import { DespesaFuncionarioPage } from '@/pages/DespesaFuncionarioPage';
import { DespesaImpostoPage } from '@/pages/DespesaImpostoPage';
import { DespesaVeiculoPage } from '@/pages/DespesaVeiculoPage';
import { DespesaBancoPage } from '@/pages/DespesaBancoPage';
import {
  DespesaCategoriaPage,
  type DespesaCategoriaPageProps,
} from '@/pages/DespesaCategoriaPage';
import { ParcelamentoPage } from '@/pages/ParcelamentoPage';
import { RendaExtraPage } from '@/pages/RendaExtraPage';
import { InvestimentoPage } from '@/pages/InvestimentoPage';
import { SociosPage } from '@/pages/SociosPage';
import { BalancoGeralPage } from '@/pages/BalancoGeralPage';
import { ConfiguracoesPage } from '@/pages/ConfiguracoesPage';
import { CriarDespesaPage } from '@/pages/CriarDespesaPage';
import { FornecedoresPage } from '@/pages/FornecedoresPage';
import { LojasPage } from '@/pages/LojasPage';
import { RelatoriosPage } from '@/pages/RelatoriosPage';
import { LembretesPage } from '@/pages/LembretesPage';
import {
  CaixaPage,
  ControleCartoesPage,
  TaxasPrazosPage,
  VendasPage,
  ControleDepositoPage,
  VendaCartoesPage,
  AtivoImobilizadoPage,
  EntradaPage,
  SaidaPage,
  PagoDinheiroPage,
  CalculadoraMargemPage,
  PedidoVendaPage,
  AReceberPage,
  VendaPerdaPage,
  AgendaPage,
} from '@/pages/financeiro';
import { TelaBrancaPage } from '@/pages/TelaBrancaPage';

/** Pagina placeholder para rotas do menu que ainda nao tem componente registrado. */
function PlaceholderPage({ path }: { path: string }) {
  const title = path === '/' ? 'Início' : path.split('/').filter(Boolean).pop() ?? path;
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">Página em desenvolvimento</p>
      </div>
    </div>
  );
}

/** Mapa path exato -> componente. Novas paginas: adicionar aqui. */
export const PATH_TO_COMPONENT: Record<string, ComponentType<any>> = {
  '/dashboard': DashboardPage,
  '/despesa-fixa': DespesaFixaPage,
  '/despesa-extra': DespesaExtraPage,
  '/despesa-funcionario': DespesaFuncionarioPage,
  '/despesa-imposto': DespesaImpostoPage,
  '/despesa-veiculo': DespesaVeiculoPage,
  '/despesa-banco': DespesaBancoPage,
  '/parcelamento': ParcelamentoPage,
  '/renda-extra': RendaExtraPage,
  '/investimento': InvestimentoPage,
  '/socios': SociosPage,
  '/balanco-geral': BalancoGeralPage,
  '/fornecedores': FornecedoresPage,
  '/lojas': LojasPage,
  '/relatorios': RelatoriosPage,
  '/lembretes': LembretesPage,
  '/configuracoes': ConfiguracoesPage,
  '/configuracoes/criar-despesa': CriarDespesaPage,
  '/financeiro/caixa': CaixaPage,
  '/financeiro/vendas': VendasPage,
  '/financeiro/controle-deposito': ControleDepositoPage,
  '/financeiro/venda-cartoes': VendaCartoesPage,
  '/financeiro/pago-dinheiro': PagoDinheiroPage,
  '/controle-cartoes': ControleCartoesPage,
  '/controle-cartoes-home': ControleCartoesPage,
  '/controle-cartoes/taxas-prazos': TaxasPrazosPage,
  '/controle-cartoes/a-receber': AReceberPage,
  '/controle-cartoes/venda-perda': VendaPerdaPage,
  '/entrada': EntradaPage,
  '/saida': SaidaPage,
  '/agenda': AgendaPage,
  '/ativo-imobilizado': AtivoImobilizadoPage,
  '/calculadora-margem': CalculadoraMargemPage,
  '/pedido-venda': PedidoVendaPage,
  '/outras-funcoes/a-receber': AReceberPage,
  '/outras-funcoes/venda-perda': VendaPerdaPage,
  '/tela-branca': TelaBrancaPage,
};

/** Rotas com parametro (path do React Router). Uma rota por padrao. */
export const PATTERN_ROUTES: Array<{ path: string; component: ComponentType<any> }> = [
  { path: '/despesa/:categoria', component: DespesaCategoriaPage },
];

/**
 * Extrai o slug da categoria a partir do pathname.
 * - /despesa/marketing -> "marketing"
 * - /despesa/despesa-marketing -> "despesa-marketing"
 * - /despesa-marketing -> "despesa-marketing"
 */
function getCategoriaFromPathname(pathname: string): string | null {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 2 && parts[0] === 'despesa') return parts[1] || null;
  if (parts.length === 1 && parts[0].startsWith('despesa-')) return parts[0];
  return null;
}

/**
 * Wrapper que injeta a categoria extraida do pathname (rota catch-all nao preenche useParams).
 */
function DespesaCategoriaPageWrapper() {
  const { pathname } = useLocation();
  const categoriaFromPath = getCategoriaFromPathname(pathname);
  if (!categoriaFromPath) {
    return createElement(PlaceholderPage, { path: pathname });
  }
  return createElement(DespesaCategoriaPage as ComponentType<DespesaCategoriaPageProps>, {
    categoriaFromPath,
  });
}

/** Redirecionamentos fixos (path -> redirect to). */
const REDIRECTS: Record<string, string> = {
  '/financeiro': '/financeiro/caixa',
};

function matchesPattern(pathname: string, pattern: string): boolean {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return false;
  return patternParts.every((part, i) => part.startsWith(':') || part === pathParts[i]);
}

/** Extrai todos os hrefs do menu (itens e subitens). */
export function flattenHrefsFromMenu(menu: MenuItemFromApi[]): string[] {
  const hrefs: string[] = [];
  for (const item of menu) {
    if (item.href) hrefs.push(item.href);
    for (const sub of item.subItems ?? []) {
      hrefs.push(sub.href);
    }
  }
  return [...new Set(hrefs)];
}

/** Retorna o componente para um path: primeiro exato, depois por padrao. */
export function getComponentForPath(pathname: string): ComponentType<any> {
  if (REDIRECTS[pathname]) {
    return () => createElement(Navigate, { to: REDIRECTS[pathname], replace: true });
  }
  if (PATH_TO_COMPONENT[pathname]) return PATH_TO_COMPONENT[pathname];
  for (const { path, component } of PATTERN_ROUTES) {
    if (matchesPattern(pathname, path)) return DespesaCategoriaPageWrapper;
  }
  // Pagina customizada de despesa: um segmento tipo /despesa-marketing (nao e rota fixa)
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1 && segments[0].startsWith('despesa-')) {
    return DespesaCategoriaPageWrapper;
  }
  return () => createElement(PlaceholderPage, { path: pathname });
}

export interface RouteDef {
  path: string;
  element: React.ReactNode;
}

/** Paths minimos quando o backend nao retorna menu (fallback). */
const FALLBACK_PATHS = [
  '/dashboard',
  '/despesa-fixa',
  '/configuracoes',
  '/financeiro/caixa',
  '/controle-cartoes',
  '/controle-cartoes-home',
];

/**
 * Gera as definicoes de rota a partir do menu (backend).
 * Inclui rotas exatas do menu, rotas de padrao quando algum href do menu bate, e redirects fixos.
 * Se menu for null/vazio, usa um conjunto minimo de rotas para nao quebrar.
 */
export function getRouteDefinitionsFromMenu(menu: MenuItemFromApi[] | null): RouteDef[] {
  const defs: RouteDef[] = [];
  const seenPaths = new Set<string>();

  if (!menu || menu.length === 0) {
    for (const path of FALLBACK_PATHS) {
      const Component = PATH_TO_COMPONENT[path];
      if (Component) defs.push({ path, element: createElement(Component) });
    }
    defs.push({
      path: '/despesa/:categoria',
      element: createElement(DespesaCategoriaPage),
    });
    defs.push({
      path: '/financeiro',
      element: createElement(Navigate, { to: '/financeiro/caixa', replace: true }),
    });
    return defs;
  }

  const hrefs = flattenHrefsFromMenu(menu);

  // Redirects fixos (so incluir se algum href do menu estiver sob esse prefixo)
  for (const [from, to] of Object.entries(REDIRECTS)) {
    if (hrefs.some((h) => h === from || h.startsWith(from + '/'))) {
      defs.push({ path: from, element: createElement(Navigate, { to, replace: true }) });
      seenPaths.add(from);
    }
  }

  // Rotas por padrao: uma Route por padrao se algum href do menu bater
  for (const { path, component } of PATTERN_ROUTES) {
    const someMatches = hrefs.some((h) => matchesPattern(h, path));
    if (someMatches && !seenPaths.has(path)) {
      defs.push({ path, element: createElement(component) });
      seenPaths.add(path);
    }
  }

  // Rotas exatas: uma Route por href do menu (pula se ja coberto por um padrao)
  const pathMatchesSomePattern = (p: string) =>
    PATTERN_ROUTES.some(({ path: pattern }) => matchesPattern(p, pattern));
  for (const path of hrefs) {
    if (seenPaths.has(path) || pathMatchesSomePattern(path)) continue;
    const Component = PATH_TO_COMPONENT[path];
    defs.push({
      path,
      element: Component ? createElement(Component) : createElement(PlaceholderPage, { path }),
    });
    seenPaths.add(path);
  }

  return defs;
}
