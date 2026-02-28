export interface DespesaBase {
  id: string;
  data: string;
  tipo: string; // Tipo da despesa (obrigatorio)
  descricao: string;
  valor: number;
  comunicarAgenda?: boolean; // Se deve comunicar a agenda
  /** Recorrencia: unica, mensal, bimestral, etc. Se informado e comunicarAgenda, backend gera itens na agenda */
  recorrencia?: string;
  /** Indice da ocorrencia na serie (ex.: "2/3" para a 2a de 3). Opcional; quando enviado, exibido ao lado do badge de recorrência. */
  recorrenciaIndice?: string;
  /** Data limite da recorrencia (YYYY-MM-DD). Opcional */
  recorrenciaFim?: string;
  createdAt: string;
  updatedAt: string;
  /** Despesa banco: id do banco (UUID) */
  bancoId?: string;
  /** Despesa banco: nome do banco (retorno da API) */
  bancoNome?: string;
  /** Categoria (quando retornada pela API) */
  categoria?: string;
  /** Observacao (quando retornada pela API) */
  observacao?: string;
}

export interface DespesaInput {
  data: string;
  tipo: string;
  descricao: string;
  valor: number;
  comunicarAgenda?: boolean;
  recorrencia?: string;
  recorrenciaFim?: string;
}

/** Parcela para POST com array (modo B – recorrência por lista). */
export interface ParcelaDespesaInput {
  data: string;
  valor: number;
}

/** Body para criar despesas em lote (POST com parcelas). data/valor vêm em cada parcela. */
export interface DespesaComParcelasInput {
  tipo: string;
  descricao: string;
  comunicarAgenda?: boolean;
  parcelas: ParcelaDespesaInput[];
}

// Tipos padrao por categoria de despesa (conforme planilha)
export const TIPOS_DESPESA: Record<DespesaCategoria, string[]> = {
  'despesa-fixa': ['AGUA', 'ALUGUEL', 'ENERGIA ELETRICA', 'INTERNET', 'TELEFONIA'],
  'despesa-extra': ['MANUTENCAO'],
  'despesa-funcionario': [
    'ADIANTAMENTO DE SALARIO',
    'EXAMES ADMISSIONAIS',
    'EXAMES PERIODICOS',
    'FERIAS',
    'HORAS EXTRAS',
    'PAGAMENTO DE SALARIO',
    'RESCISAO',
    'VALE ALIMENTACAO',
    'VALE REFEICAO',
    'VALE TRANSPORTE',
    '13º SALARIO',
  ],
  'despesa-imposto': ['CSLL', 'DAS', 'ICMS', 'IPI', 'IRPJ', 'ISS', 'PIS/COFINS'],
  'despesa-veiculo': ['COMBUSTIVEL', 'MANUTENCAO', 'SEGURO', 'IPVA', 'LICENCIAMENTO', 'MULTAS', 'PEDAGIO', 'REVISAO'],
  'despesa-banco': ['ENCARGOS', 'IOF', 'JUROS', 'MENSALIDADE', 'PIX', 'TARIFAS BANCARIAS', 'TED/DOC'],
  'investimento': ['CDB', 'TESOURO DIRETO', 'FUNDOS', 'ACOES', 'IMOVEIS', 'OUTROS'],
  'renda-extra': ['CONSULTORIA', 'VENDA', 'COMISSAO', 'ALUGUEL', 'RENDIMENTOS', 'OUTROS'],
  socios: ['ADIANTAMENTO', 'DISTRIBUICAO DE LUCROS', 'PRO-LABORE', 'RETIRADA'],
};

/** Abreviacoes para exibicao dos tipos em Despesa Funcionario (valor enviado ao backend continua o nome completo). */
export const ABREVIACOES_TIPO_FUNCIONARIO: Record<string, string> = {
  'ADIANTAMENTO DE SALARIO': 'ADIANT. SALARIO',
  'EXAMES ADMISSIONAIS': 'EX. ADMISSIONAL',
  'EXAMES PERIODICOS': 'EX. PERIODICO',
  'PAGAMENTO DE SALARIO': 'PAGTO SALARIO',
};

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
    placeholder: 'Ex: Manutencao, Conserto...',
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
