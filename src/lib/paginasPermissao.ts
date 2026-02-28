import { api } from '@/lib/api';

export interface PaginaPermissaoItem {
  id: string;
  label: string;
  custom?: boolean;
  /** Preenchido pela API em GET /admin/paginas?tenantId= para preencher os checkboxes. */
  permitido?: boolean;
}

/** Resposta do backend: usa "nome" e "permitido". */
interface AdminPaginaFromApi {
  id: string;
  nome: string;
  custom?: boolean;
  permitido?: boolean;
}

/**
 * Busca paginas permitidas no backend (inclui custom, ex.: despesa-marketing).
 * Usado nos formularios de Empresa e Usuario. Fallback para PAGINAS_PERMISSAO se a API falhar.
 * Normaliza "nome" da API para "label" usado no front.
 */
export async function fetchAdminPaginas(tenantId?: string | null): Promise<PaginaPermissaoItem[]> {
  try {
    const params = tenantId ? { tenantId } : {};
    const res = await api.get<AdminPaginaFromApi[]>(
      'admin/paginas',
      Object.keys(params).length ? { params: params as Record<string, string> } : undefined
    );
    if (!Array.isArray(res.data)) return PAGINAS_PERMISSAO;
    return res.data.map((p) => ({
      id: p.id,
      label: p.nome ?? p.id,
      custom: p.custom,
      permitido: p.permitido,
    }));
  } catch {
    return PAGINAS_PERMISSAO;
  }
}

/**
 * Lista de paginas (ids de permissao) usada na Sidebar e no admin (Empresas e Usuarios).
 * Empresas: selecao de telas permitidas (paginasPermitidas).
 * Usuarios: selecao de paginas que o usuario acessa (subconjunto das da empresa).
 */
export const PAGINAS_PERMISSAO: PaginaPermissaoItem[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'despesa-fixa', label: 'Despesa Fixa' },
  { id: 'despesa-extra', label: 'Despesa Extra' },
  { id: 'despesa-funcionario', label: 'Despesa Funcionario' },
  { id: 'despesa-imposto', label: 'Despesa Imposto' },
  { id: 'despesa-veiculo', label: 'Despesa Veiculo' },
  { id: 'despesa-banco', label: 'Despesa Banco' },
  { id: 'parcelamento', label: 'Parcelamento' },
  { id: 'renda-extra', label: 'Renda Extra' },
  { id: 'investimento', label: 'Investimento' },
  { id: 'financeiro-caixa', label: 'Financeiro - Caixa' },
  { id: 'financeiro-vendas', label: 'Financeiro - Vendas' },
  { id: 'financeiro-controle-deposito', label: 'Financeiro - Controle Depósito' },
  { id: 'financeiro-venda-cartoes', label: 'Financeiro - Venda Cartões' },
  { id: 'financeiro-pago-dinheiro', label: 'Financeiro - Pago em Dinheiro' },
  { id: 'controle-cartoes', label: 'Controle Cartões' },
  { id: 'controle-cartoes-home', label: 'Controle Cartões (home)' },
  { id: 'controle-cartoes-taxas-prazos', label: 'Controle Cartões - Taxas e prazos' },
  { id: 'a-receber', label: 'A receber' },
  { id: 'venda-perda', label: 'Venda e perda' },
  { id: 'entrada', label: 'Entrada' },
  { id: 'saida', label: 'Saída' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'ativo-imobilizado', label: 'Ativo Imobilizado' },
  { id: 'calculadora-margem', label: 'Calculadora de Margem' },
  { id: 'pedido-venda', label: 'Pedido de Venda' },
  { id: 'fornecedores', label: 'Fornecedores' },
  { id: 'lojas', label: 'Lojas' },
  { id: 'recursos-humanos', label: 'Recursos Humanos' },
  { id: 'socios', label: 'Socios' },
  { id: 'balanco-geral', label: 'Balanco Geral' },
  { id: 'relatorios', label: 'Relatorios' },
  { id: 'lembretes', label: 'Lembretes' },
  { id: 'configuracoes', label: 'Configuracoes' },
];

/** Mapa permissionId -> path (para redirecionamento pos-login e protecao de rotas). */
export const PERMISSION_ID_TO_PATH: Record<string, string> = {
  dashboard: '/dashboard',
  'despesa-fixa': '/despesa-fixa',
  'despesa-extra': '/despesa-extra',
  'despesa-funcionario': '/despesa-funcionario',
  'despesa-imposto': '/despesa-imposto',
  'despesa-veiculo': '/despesa-veiculo',
  'despesa-banco': '/despesa-banco',
  parcelamento: '/parcelamento',
  'renda-extra': '/renda-extra',
  investimento: '/investimento',
  'financeiro-caixa': '/financeiro/caixa',
  'financeiro-vendas': '/financeiro/vendas',
  'financeiro-controle-deposito': '/financeiro/controle-deposito',
  'financeiro-venda-cartoes': '/financeiro/venda-cartoes',
  'financeiro-pago-dinheiro': '/financeiro/pago-dinheiro',
  'controle-cartoes': '/controle-cartoes',
  'controle-cartoes-home': '/controle-cartoes-home',
  'controle-cartoes-taxas-prazos': '/controle-cartoes/taxas-prazos',
  'a-receber': '/outras-funcoes/a-receber',
  'venda-perda': '/outras-funcoes/venda-perda',
  'entrada': '/entrada',
  'saida': '/saida',
  'agenda': '/agenda',
  'ativo-imobilizado': '/ativo-imobilizado',
  'calculadora-margem': '/calculadora-margem',
  'pedido-venda': '/pedido-venda',
  fornecedores: '/fornecedores',
  lojas: '/lojas',
  'recursos-humanos': '/recursos-humanos',
  socios: '/socios',
  'balanco-geral': '/balanco-geral',
  relatorios: '/relatorios',
  lembretes: '/lembretes',
  configuracoes: '/configuracoes',
};

/** Mapa path -> permissionId (inverso de PERMISSION_ID_TO_PATH) para protecao de rotas. */
export const PATH_TO_PERMISSION_ID: Record<string, string> = Object.fromEntries(
  Object.entries(PERMISSION_ID_TO_PATH).map(([id, path]) => [path, id])
);

/** Path para permissao de despesa dinamica (ex.: despesa-marketing). */
export function pathForDespesaPermission(permissionId: string): string {
  return `/despesa/${permissionId}`;
}

/** Retorna a rota para a primeira permissao do array que tiver path, ou /dashboard. */
export function getFirstAllowedPath(permissoes: string[]): string {
  if (permissoes?.includes('dashboard')) return '/dashboard';
  const first = permissoes?.[0];
  if (first && PERMISSION_ID_TO_PATH[first]) return PERMISSION_ID_TO_PATH[first];
  if (first?.startsWith('despesa-')) return pathForDespesaPermission(first);
  return '/dashboard';
}

/** Obtem permissionId a partir do pathname. Usa pathMap quando fornecido (ex.: menu da API), senao fallback estatico. */
export function getPermissionIdFromPath(
  pathname: string,
  pathMap?: Record<string, string> | null
): string | undefined {
  if (pathname.startsWith('/despesa/')) {
    const slug = pathname.slice(9).replace(/\/$/, '');
    return slug || undefined;
  }
  if (pathMap && pathname in pathMap) return pathMap[pathname];
  return PATH_TO_PERMISSION_ID[pathname];
}

/** Verifica se o usuario tem permissao para acessar o pathname. pathToPermissionId opcional (vindo do menu da API). */
export function hasRoutePermission(
  permissoes: string[] | undefined,
  pathname: string,
  pathToPermissionId?: Record<string, string> | null
): boolean {
  const permissionId = getPermissionIdFromPath(pathname, pathToPermissionId);
  if (!permissionId) return true; // rota sem mapeamento (ex.: redirect) deixa passar
  if (!permissoes || permissoes.length === 0) return true;
  if (permissoes.includes('*')) return true;
  return permissoes.includes(permissionId);
}
