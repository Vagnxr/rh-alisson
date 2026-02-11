// Tipos para configuracoes de colunas dinamicas

/** Formato retornado pela API no campo `columns` das listagens (colunas visiveis, ordenadas). */
export interface TableColumnConfigFromApi {
  id: string;
  label: string;
  order: number;
  isRequired?: boolean;
}

export interface ColunaConfig {
  id: string;
  label: string;
  isVisible: boolean;
  order: number;
  width?: number;
  isRequired?: boolean; // Colunas obrigatorias nao podem ser ocultadas
  /** Quando true, o valor da coluna entra no total (ex.: Caixa, Balanco). Backend deve suportar. */
  somarNoTotal?: boolean;
  /** Quando true, o valor da coluna SUBTRAI do total (ex.: Caixa). Mutuamente exclusivo com somarNoTotal. */
  subtrairNoTotal?: boolean;
}

export interface TabelaConfig {
  id: string;
  nome: string;
  descricao: string;
  colunas: ColunaConfig[];
}

/** Id da tabela Caixa (permite adicionar/remover colunas). */
/** tabelaId do Caixa (contrato backend: GET /financeiro/caixa retorna columns com este id). */
export const ID_TABELA_CAIXA = 'financeiro-caixa';

// Configuracoes padrao de cada tabela
export const TABELAS_CONFIGURACOES: TabelaConfig[] = [
  {
    id: 'despesa-fixa',
    nome: 'Despesa Fixa',
    descricao: 'Configuracoes da tabela de despesas fixas',
    colunas: [
      { id: 'data', label: 'Data', isVisible: true, order: 1, isRequired: true },
      { id: 'tipo', label: 'Tipo', isVisible: true, order: 2 },
      { id: 'descricao', label: 'Descricao', isVisible: true, order: 3, isRequired: true },
      { id: 'valor', label: 'Valor', isVisible: true, order: 4, isRequired: true },
      { id: 'recorrencia', label: 'Recorrencia', isVisible: true, order: 5 },
      { id: 'categoria', label: 'Categoria', isVisible: false, order: 6 },
      { id: 'observacao', label: 'Observacao', isVisible: false, order: 7 },
    ],
  },
  {
    id: 'despesa-extra',
    nome: 'Despesa Extra',
    descricao: 'Configuracoes da tabela de despesas extras',
    colunas: [
      { id: 'data', label: 'Data', isVisible: true, order: 1, isRequired: true },
      { id: 'tipo', label: 'Tipo', isVisible: true, order: 2 },
      { id: 'descricao', label: 'Descricao', isVisible: true, order: 3, isRequired: true },
      { id: 'valor', label: 'Valor', isVisible: true, order: 4, isRequired: true },
      { id: 'categoria', label: 'Categoria', isVisible: false, order: 5 },
      { id: 'observacao', label: 'Observacao', isVisible: false, order: 6 },
    ],
  },
  {
    id: 'despesa-funcionario',
    nome: 'Despesa Funcionario',
    descricao: 'Configuracoes da tabela de despesas com funcionarios',
    colunas: [
      { id: 'data', label: 'Data', isVisible: true, order: 1, isRequired: true },
      { id: 'descricao', label: 'Descricao', isVisible: true, order: 2, isRequired: true },
      { id: 'valor', label: 'Valor', isVisible: true, order: 3, isRequired: true },
      { id: 'funcionario', label: 'Funcionario', isVisible: false, order: 4 },
      { id: 'tipo', label: 'Tipo', isVisible: false, order: 5 },
    ],
  },
  {
    id: 'parcelamento',
    nome: 'Parcelamento',
    descricao: 'Configuracoes da tabela de parcelamentos',
    colunas: [
      { id: 'data', label: 'Data', isVisible: true, order: 1, isRequired: true },
      { id: 'descricao', label: 'Descricao', isVisible: true, order: 2, isRequired: true },
      { id: 'parcela', label: 'Parcela', isVisible: true, order: 3, isRequired: true },
      { id: 'valor', label: 'Valor', isVisible: true, order: 4, isRequired: true },
      { id: 'status', label: 'Status', isVisible: false, order: 5 },
    ],
  },
  {
    id: 'balanco',
    nome: 'Balanco Geral',
    descricao: 'Configuracoes do balanco mensal',
    colunas: [
      { id: 'descricao', label: 'Descricao', isVisible: true, order: 1, isRequired: true },
      { id: 'valor', label: 'Valor', isVisible: true, order: 2, isRequired: true },
      { id: 'percentual', label: '% Venda', isVisible: true, order: 3 },
      { id: 'loja', label: 'Loja', isVisible: true, order: 4 },
    ],
  },
  {
    id: ID_TABELA_CAIXA,
    nome: 'Caixa',
    descricao: 'Configuracoes da tabela de caixa (colunas e campos do formulario). Idêntico à planilha.',
    colunas: [
      { id: 'dia', label: 'Dia', isVisible: true, order: 1, isRequired: true },
      { id: 'dinheiroDeposito', label: 'Dinheiro (dep.)', isVisible: true, order: 2, somarNoTotal: true },
      { id: 'pagamentoPdv', label: 'Pag. (PDV)', isVisible: true, order: 3, somarNoTotal: true },
      { id: 'pix', label: 'PIX', isVisible: true, order: 4, somarNoTotal: true },
      { id: 'credito', label: 'Credito', isVisible: true, order: 5, somarNoTotal: true },
      { id: 'debito', label: 'Debito', isVisible: true, order: 6, somarNoTotal: true },
      { id: 'voucher', label: 'Voucher', isVisible: true, order: 7, somarNoTotal: true },
      { id: 'ifood', label: 'iFood', isVisible: true, order: 8, somarNoTotal: true },
      { id: 'total', label: 'Total', isVisible: true, order: 9, isRequired: true, somarNoTotal: false },
    ],
  },
];

export interface ConfiguracaoState {
  tabelas: TabelaConfig[];
  fetchConfiguracoes: () => Promise<void>;
  updateColunaVisibilidade: (tabelaId: string, colunaId: string, isVisible: boolean) => void;
  updateColunaSomarNoTotal?: (tabelaId: string, colunaId: string, somarNoTotal: boolean) => void;
  updateColunaSubtrairNoTotal?: (tabelaId: string, colunaId: string, subtrairNoTotal: boolean) => void;
  updateColunaOrdem: (tabelaId: string, colunas: ColunaConfig[]) => void;
  resetTabela: (tabelaId: string) => void;
  getColunasVisiveis: (tabelaId: string) => ColunaConfig[];
  /** Adiciona uma nova coluna (ex.: tabela Caixa). */
  addColuna: (tabelaId: string, coluna: Omit<ColunaConfig, 'order'> & { order?: number }) => void;
  /** Remove uma coluna (apenas se !isRequired). */
  removeColuna: (tabelaId: string, colunaId: string) => void;
  /** Retorna todas as colunas da tabela (para checar se pode adicionar/remover). */
  getTabela: (tabelaId: string) => TabelaConfig | undefined;
}
