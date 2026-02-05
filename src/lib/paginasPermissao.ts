/**
 * Lista de paginas (ids de permissao) usada na Sidebar e no admin (Empresas e Usuarios).
 * Empresas: selecao de telas permitidas (paginasPermitidas).
 * Usuarios: selecao de paginas que o usuario acessa (subconjunto das da empresa).
 */
export const PAGINAS_PERMISSAO: { id: string; label: string }[] = [
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
  { id: 'financeiro-controle-cartoes', label: 'Financeiro - Controle Cartoes' },
  { id: 'financeiro-vendas', label: 'Financeiro - Vendas' },
  { id: 'financeiro-controle-dinheiro', label: 'Financeiro - Controle Dinheiro' },
  { id: 'financeiro-controle-deposito', label: 'Financeiro - Controle Deposito' },
  { id: 'financeiro-venda-cartoes', label: 'Financeiro - Venda Cartoes' },
  { id: 'financeiro-ativo-imobilizado', label: 'Financeiro - Ativo Imobilizado' },
  { id: 'financeiro-entrada', label: 'Financeiro - Entrada' },
  { id: 'financeiro-saida', label: 'Financeiro - Saida' },
  { id: 'financeiro-pago-dinheiro', label: 'Financeiro - Pago em Dinheiro' },
  { id: 'financeiro-calculadora-margem', label: 'Financeiro - Calculadora de Margem' },
  { id: 'financeiro-pedido-venda', label: 'Financeiro - Pedido de Venda' },
  { id: 'financeiro-a-receber', label: 'Financeiro - A receber' },
  { id: 'financeiro-venda-perda', label: 'Financeiro - Venda e perda' },
  { id: 'financeiro-agenda', label: 'Financeiro - Agenda' },
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
  'financeiro-controle-cartoes': '/financeiro/controle-cartoes',
  'financeiro-vendas': '/financeiro/vendas',
  'financeiro-controle-dinheiro': '/financeiro/controle-dinheiro',
  'financeiro-controle-deposito': '/financeiro/controle-deposito',
  'financeiro-venda-cartoes': '/financeiro/venda-cartoes',
  'financeiro-ativo-imobilizado': '/financeiro/ativo-imobilizado',
  'financeiro-entrada': '/financeiro/entrada',
  'financeiro-saida': '/financeiro/saida',
  'financeiro-pago-dinheiro': '/financeiro/pago-dinheiro',
  'financeiro-calculadora-margem': '/financeiro/calculadora-margem',
  'financeiro-pedido-venda': '/financeiro/pedido-venda',
  'financeiro-a-receber': '/financeiro/outras-funcoes/a-receber',
  'financeiro-venda-perda': '/financeiro/outras-funcoes/venda-perda',
  'financeiro-agenda': '/financeiro/agenda',
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

/** Retorna a rota para a primeira permissao do array que tiver path, ou /dashboard. */
export function getFirstAllowedPath(permissoes: string[]): string {
  if (permissoes?.includes('dashboard')) return '/dashboard';
  const first = permissoes?.[0];
  if (first && PERMISSION_ID_TO_PATH[first]) return PERMISSION_ID_TO_PATH[first];
  return '/dashboard';
}

/** Verifica se o usuario tem permissao para acessar o pathname. Mesma regra do Sidebar. */
export function hasRoutePermission(permissoes: string[] | undefined, pathname: string): boolean {
  const permissionId = PATH_TO_PERMISSION_ID[pathname];
  if (!permissionId) return true; // rota sem mapeamento (ex.: redirect) deixa passar
  if (!permissoes || permissoes.length === 0) return true;
  if (permissoes.includes('*')) return true;
  return permissoes.includes(permissionId);
}
