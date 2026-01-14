// Tipos para configuracoes de colunas dinamicas

export interface ColunaConfig {
  id: string;
  label: string;
  isVisible: boolean;
  order: number;
  width?: number;
  isRequired?: boolean; // Colunas obrigatorias nao podem ser ocultadas
}

export interface TabelaConfig {
  id: string;
  nome: string;
  descricao: string;
  colunas: ColunaConfig[];
}

// Configuracoes padrao de cada tabela
export const TABELAS_CONFIGURACOES: TabelaConfig[] = [
  {
    id: 'despesa-fixa',
    nome: 'Despesa Fixa',
    descricao: 'Configuracoes da tabela de despesas fixas',
    colunas: [
      { id: 'data', label: 'Data', isVisible: true, order: 1, isRequired: true },
      { id: 'descricao', label: 'Descricao', isVisible: true, order: 2, isRequired: true },
      { id: 'valor', label: 'Valor', isVisible: true, order: 3, isRequired: true },
      { id: 'recorrencia', label: 'Recorrencia', isVisible: true, order: 4 },
      { id: 'categoria', label: 'Categoria', isVisible: false, order: 5 },
      { id: 'observacao', label: 'Observacao', isVisible: false, order: 6 },
    ],
  },
  {
    id: 'despesa-extra',
    nome: 'Despesa Extra',
    descricao: 'Configuracoes da tabela de despesas extras',
    colunas: [
      { id: 'data', label: 'Data', isVisible: true, order: 1, isRequired: true },
      { id: 'descricao', label: 'Descricao', isVisible: true, order: 2, isRequired: true },
      { id: 'valor', label: 'Valor', isVisible: true, order: 3, isRequired: true },
      { id: 'categoria', label: 'Categoria', isVisible: false, order: 4 },
      { id: 'observacao', label: 'Observacao', isVisible: false, order: 5 },
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
];

export interface ConfiguracaoState {
  tabelas: TabelaConfig[];
  fetchConfiguracoes: () => Promise<void>;
  updateColunaVisibilidade: (tabelaId: string, colunaId: string, isVisible: boolean) => void;
  updateColunaOrdem: (tabelaId: string, colunas: ColunaConfig[]) => void;
  resetTabela: (tabelaId: string) => void;
  getColunasVisiveis: (tabelaId: string) => ColunaConfig[];
}
