/** Linha da tabela Caixa */
export interface CaixaRow {
  id: string;
  dia: string;
  dinheiroDeposito: number;
  pagamentoPdv: number;
  pix: number;
  credito: number;
  debito: number;
  voucher: number;
  ifood: number;
  total: number;
}

/** Linha da tabela Controle Cartoes (prazo, taxa %, data a receber, bruto, liquido; a receber calculado pelo backend) */
export interface ControleCartoesRow {
  id: string;
  diaSemana?: string;
  data: string;
  valor: number;
  /** Prazo em dias (ex.: 30) */
  prazo?: number;
  /** Taxa em percentual (ex.: 2.5) */
  taxaPercent?: number;
  /** Apenas credito: a-vista | parcelado-vista | parcelado-prazo */
  tipoCredito?: 'a-vista' | 'parcelado-vista' | 'parcelado-prazo';
  aReceber: number;
  dataAReceber: string;
  diaSemanaAReceber?: string;
}

/** Bandeiras para Credito/Debito */
export type BandeiraCartao =
  | 'amex'
  | 'elo-credito'
  | 'hipercard'
  | 'mastercard'
  | 'visa'
  | 'electron'
  | 'elo-debito'
  | 'maestro';

/** Linha Vendas */
export interface VendasRow {
  id: string;
  dia: string;
  valor: number;
}

/** Linha Controle Dinheiro */
export interface ControleDinheiroRow {
  id: string;
  data: string;
  dia: string;
  deposito: number;
  sobra: number;
  pagPdv: number;
  totalDia: number;
}

/** Linha Controle Deposito - Tabela 1 (deposito) */
export interface ControleDepositoRow {
  id: string;
  data: string;
  dia: string;
  dinheiro: number;
  sobra: number;
  total: number;
}

/** Linha Controle Deposito - Tabela 2 (valor depositado) */
export interface ValorDepositadoRow {
  id: string;
  data: string;
  dia: string;
  dinheiro: number;
}

/** Linha Venda Cartoes */
export interface VendaCartoesRow {
  id: string;
  dia: string;
  credito: number;
  debito: number;
  voucher: number;
  pix: number;
  food: number;
  totalDia: number;
}

/** Linha Ativo Imobilizado (Entrada ou Saida) */
export interface AtivoImobilizadoRow {
  id: string;
  data: string;
  nf: string;
  descricaoFornecedor: string;
  valor: number;
  /** Periodicidade (ex.: Mensal, Anual). Backend pode usar para gerar parcelas. */
  recorrencia?: string;
  /** Quando true, item aparece na Agenda e so registra saida ao marcar como pago. */
  comunicarAgenda?: boolean;
}

/** Valor por categoria na Entrada */
export interface EntradaValorItem {
  categoriaId: string;
  categoriaNome?: string;
  valor: number;
}

/** Linha Entrada */
export interface EntradaRow {
  id: string;
  data: string;
  fornecedor: string;
  /** Modelo da nota: NF-e, NFC-e, etc. */
  modeloNota?: string;
  /** Forma de pagamento */
  formaPagamento?: string;
  /** Valor informado no pagamento (dinheiro/pix), para conferencia */
  valorPago?: number;
  /** Valores por categoria (substitui industrializacao, embalagem, etc.) */
  valores?: EntradaValorItem[];
  /** Total da nota (soma dos valores). Backend pode retornar. */
  total?: number;
  /** Campos legados (backend pode ainda enviar) */
  industrializacao?: number;
  comercializacao?: number;
  embalagem?: number;
  materialUsoCons?: number;
  mercadoriaUsoCons?: number;
  gas?: number;
}

/** Linha Saida */
export interface SaidaRow {
  id: string;
  data: string;
  fornecedor: string;
  industrializacao: number;
  comercializacao: number;
  embalagem: number;
  materialUsoCons: number;
  mercadoriaUsoCons: number;
  gas: number;
}

/** Linha Pago em Dinheiro */
export interface PagoDinheiroRow {
  id: string;
  data: string;
  descricaoFornecedor: string;
  valor: number;
}

/** Outras funcoes - A receber: linha por bandeira (Credito, Debito ou Voucher) */
export interface AReceberRow {
  bandeira: string;
  aReceber: number;
}

/** Outras funcoes - Venda e perda: resumo por tabela */
export interface VendaPerdaCreditoRow {
  totalBruto: number;
  descontos: number;
  totalLiquido: number;
}

export interface VendaPerdaDebitoPixRow {
  totalBruto: number;
  descontos: number;
  totalLiquido: number;
}

export interface VendaPerdaAlimRefRow {
  totalBruto: number;
  descontos: number;
  totalLiquido: number;
}

export interface VendaPerdaFoodRow {
  totalBruto: number;
  descontos: number;
  totalLiquido: number;
  viaLoja?: string;
}

export interface VendaPerdaTotalCartoesRow {
  valorBruto: number;
  descontos: number;
  totalLiquido: number;
}

export interface VendaPerdaPosAluguelRow {
  valor: number;
}

export interface VendaPerdaPerdaTotalRow {
  valor: number;
}
