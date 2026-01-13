export interface DespesaBase {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  createdAt: string;
  updatedAt: string;
}

export interface DespesaInput {
  data: string;
  descricao: string;
  valor: number;
}

// Tipos específicos (herdam de DespesaBase)
export type DespesaFixa = DespesaBase;
export type DespesaExtra = DespesaBase;
export type DespesaFuncionario = DespesaBase;
export type DespesaImposto = DespesaBase;
export type DespesaVeiculo = DespesaBase;
export type DespesaBanco = DespesaBase;

// Input types
export type DespesaFixaInput = DespesaInput;
export type DespesaExtraInput = DespesaInput;
export type DespesaFuncionarioInput = DespesaInput;
export type DespesaImpostoInput = DespesaInput;
export type DespesaVeiculoInput = DespesaInput;
export type DespesaBancoInput = DespesaInput;

// Tipo de categoria de despesa
export type DespesaCategoria =
  | 'despesa-fixa'
  | 'despesa-extra'
  | 'despesa-funcionario'
  | 'despesa-imposto'
  | 'despesa-veiculo'
  | 'despesa-banco'
  | 'investimento'
  | 'renda-extra'
  | 'socios';

// Configuração de cada categoria
export interface DespesaCategoriaConfig {
  key: DespesaCategoria | string; // Permite outras categorias também
  title: string;
  subtitle: string;
  placeholder: string;
}

export const DESPESA_CATEGORIAS: Record<DespesaCategoria, DespesaCategoriaConfig> = {
  'despesa-fixa': {
    key: 'despesa-fixa',
    title: 'Despesas Fixas',
    subtitle: 'Gerencie suas despesas fixas mensais',
    placeholder: 'Ex: Aluguel, Internet, Energia...',
  },
  'despesa-extra': {
    key: 'despesa-extra',
    title: 'Despesas Extras',
    subtitle: 'Gerencie suas despesas extras e eventuais',
    placeholder: 'Ex: Material de escritorio, Manutencao...',
  },
  'despesa-funcionario': {
    key: 'despesa-funcionario',
    title: 'Despesas com Funcionarios',
    subtitle: 'Gerencie despesas relacionadas a funcionarios',
    placeholder: 'Ex: Salario, Vale transporte, Beneficios...',
  },
  'despesa-imposto': {
    key: 'despesa-imposto',
    title: 'Despesas com Impostos',
    subtitle: 'Gerencie pagamentos de impostos e tributos',
    placeholder: 'Ex: ICMS, ISS, INSS, FGTS...',
  },
  'despesa-veiculo': {
    key: 'despesa-veiculo',
    title: 'Despesas com Veiculos',
    subtitle: 'Gerencie despesas de veiculos da empresa',
    placeholder: 'Ex: Combustivel, Manutencao, IPVA...',
  },
  'despesa-banco': {
    key: 'despesa-banco',
    title: 'Despesas Bancarias',
    subtitle: 'Gerencie tarifas e despesas bancarias',
    placeholder: 'Ex: Tarifa mensal, TED, DOC...',
  },
  'investimento': {
    key: 'investimento',
    title: 'Investimentos',
    subtitle: 'Gerencie seus investimentos e aplicacoes financeiras',
    placeholder: 'Ex: CDB, Tesouro Direto, Fundos Imobiliarios...',
  },
  'renda-extra': {
    key: 'renda-extra',
    title: 'Renda Extra',
    subtitle: 'Gerencie suas rendas extras e receitas eventuais',
    placeholder: 'Ex: Consultoria, Venda de equipamento, Comissao...',
  },
  'socios': {
    key: 'socios',
    title: 'Socios',
    subtitle: 'Gerencie pro-labore, distribuicao de lucros e pagamentos aos socios',
    placeholder: 'Ex: Pro-labore, Distribuicao de lucros, Retirada...',
  },
};
