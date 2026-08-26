/** Linha da tabela Caixa */
export interface CaixaRow {
  id: string;
  dia: string;
  dinheiroDeposito: number;
  pagamentoPdv: number;
  pagamentoEscritorio?: number;
  pix: number;
  credito: number;
  debito: number;
  voucher: number;
  troca?: number;
  devolucaoDinheiro?: number;
  desconto?: number;
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
  /** Taxa em percentual (ex.: 2.5). Backend pode retornar como "taxa". */
  taxaPercent?: number;
  /** Taxa em percentual (retorno do backend; normalizar para taxaPercent no front). */
  taxa?: number;
  /** Apenas credito: a-vista | parcelado-vista | parcelado-prazo */
  tipoCredito?: 'a-vista' | 'parcelado-vista' | 'parcelado-prazo';
  /** Apenas credito parcelado-prazo: numero de parcelas */
  numeroParcelas?: number;
  /** Maquininha/operadora: cielo, rede, getnet, stone, pagbank, etc. */
  operadora?: string;
  /** Bandeira (cartao ou voucher) */
  bandeira?: string;
  /** Tipo: credito | debito | pix | voucher | ifood | outras */
  tipo?: string;
  /** iFood: valor recebido na loja (em mãos) — nao soma no a receber. */
  valorLoja?: number;
  /** Voucher: categoria da bandeira (ex.: alimentacao, restaurante, flex). */
  categoriaVoucher?: string;
  /** Voucher com tarifa por cupom: quantidade lancada. */
  qtdCupons?: number;
  /** Diferenca entre o bruto e o a receber (taxa + tarifas). Calculado no backend. */
  desconto: number;
  aReceber: number;
  dataAReceber: string;
  diaSemanaAReceber?: string;
  /**
   * Parcelas do credito PARCELADO A PRAZO, com data de recebimento propria.
   * Ausente nas demais modalidades, que recebem em data unica.
   */
  parcelas?: ParcelaCartaoRow[];
}

/** Uma parcela de venda parcelada a prazo (backend calcula datas e rateio). */
export interface ParcelaCartaoRow {
  numero: number;
  /** YYYY-MM-DD */
  dataAReceber: string;
  valor: number;
  desconto: number;
  aReceber: number;
}

/** Bandeiras para Credito/Debito. O `(string & {})` deixa o union aberto para
 * aceitar bandeiras customizadas cadastradas pelo cliente em Taxas e Prazos
 * (mantendo autocomplete dos defaults). */
export type BandeiraCartao =
  | 'amex'
  | 'elo-credito'
  | 'hipercard'
  | 'mastercard'
  | 'visa'
  | 'electron'
  | 'elo-debito'
  | 'maestro'
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

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
  responsavelDeposito?: string;
  /** @deprecated removido do formulario; backend pode omitir ou manter por compatibilidade */
  sobra?: number;
  /** @deprecated removido do formulario; backend pode omitir ou manter por compatibilidade */
  total?: number;
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

/** Forma de pagamento na Entrada de Ativo Imobilizado. Define se Saida e gerada no mesmo dia (Dinheiro/PIX) ou via Agenda (Boleto). */
export type AtivoImobilizadoFormaPagto = 'Dinheiro' | 'PIX' | 'Boleto';

/** Parcela retornada pelo backend (ativo imobilizado entrada com recorrência). */
export interface AtivoImobilizadoParcela {
  /** Data de vencimento (YYYY-MM-DD). Backend envia como dataVencimento. */
  dataVencimento: string;
  valor: number;
  pago?: boolean;
}

/** Linha Ativo Imobilizado (Entrada ou Saida) */
export interface AtivoImobilizadoRow {
  id: string;
  data: string;
  nf: string;
  descricaoFornecedor: string;
  valor: number;
  /** Apenas entrada. Dinheiro/PIX: saida no mesmo dia; Boleto: saida ao marcar como pago na Agenda. */
  formaPagto?: AtivoImobilizadoFormaPagto;
  /** Periodicidade (ex.: Mensal, Anual). Backend pode usar para gerar parcelas. */
  recorrencia?: string;
  /** Data limite da recorrencia (YYYY-MM-DD). */
  recorrenciaFim?: string;
  /** Indice na serie (ex.: "2/3" = segundo de tres). */
  recorrenciaIndice?: string;
  /** Id do grupo de recorrência (parcelas do mesmo boleto). Backend pode retornar como recorrencia_grupo_id. */
  recorrenciaGrupoId?: string;
  /** Quando true, item aparece na Agenda e so registra saida ao marcar como pago. */
  comunicarAgenda?: boolean;
  /** Lista de parcelas do grupo (entrada Boleto com recorrência). Backend envia quando aplicável. */
  parcelas?: AtivoImobilizadoParcela[];
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
  /** Data da entrada (recebimento) */
  data: string;
  /** Data de emissao da nota fiscal (opcional) */
  dataEmissao?: string;
  /** Numero da nota fiscal (opcional). Ex.: 156. */
  numeroNota?: string;
  /** CNPJ ou CPF do fornecedor (apenas numeros). Backend envia como cnpjCpf. */
  cnpjCpf?: string;
  /** Nome ou razao social do fornecedor. */
  fornecedor: string;
  /** Modelo da nota: NF-e, NFC-e, etc. */
  modeloNota?: string;
  /** Tipo de entrada: compra, devolucao, etc. */
  tipoEntrada?: string;
  /** Forma de pagamento */
  formaPagamento?: string;
  /** Valor informado no pagamento (dinheiro/pix), para conferencia */
  valorPago?: number;
  /** Valores por categoria (substitui industrializacao, embalagem, etc.) */
  valores?: EntradaValorItem[];
  /** Total da nota (soma dos valores). Backend pode retornar. */
  total?: number;
  /** Contas a pagar (parcelas de boleto): vencimento (YYYY-MM-DD) e valor. */
  contasAPagar?: { vencimento: string; valor: number; pago?: boolean }[];
  /** Campos legados (backend pode ainda enviar) */
  industrializacao?: number;
  comercializacao?: number;
  embalagem?: number;
  materialUsoCons?: number;
  mercadoriaUsoCons?: number;
  gas?: number;
}

/** Formas de pagamento permitidas na Saida (apenas boleto ou cartao). */
export type SaidaFormaPagamento = 'BOLETO' | 'CARTAO';

/** Linha Saida */
export interface SaidaRow {
  id: string;
  data: string;
  /** Forma de pagamento: apenas BOLETO ou CARTAO sobem para saida. Opcional para compatibilidade com API. */
  formaPagamento?: SaidaFormaPagamento;
  fornecedor?: string;
  /** Dados da entrada vinculada (quando saida veio de uma entrada). */
  dataEntrada?: string;
  modeloNota?: string;
  numeroNota?: string;
  cnpjCpf?: string;
  industrializacao: number;
  comercializacao: number;
  embalagem: number;
  materialUsoCons: number;
  mercadoriaUsoCons: number;
  gas: number;
  bonifPreco?: number;
  bonifTroca?: number;
  bonifLoja?: number;
  total?: number;
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
  /** Operadora/maquininha origem do lancamento (apenas credito/debito; null em voucher). */
  operadora?: string | null;
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

/** Resumo de voucher (cartoes) no Venda e Perda. */
export interface VendaPerdaVoucherRow {
  totalBruto: number;
  descontos: number;
  totalLiquido: number;
}

/** Resumo de iFood (lancamentos em cartoes) no Venda e Perda. */
export interface VendaPerdaIfoodRow {
  totalBruto: number;
  descontos: number;
  totalLiquido: number;
}

/** @deprecated Use VendaPerdaVoucherRow */
export type VendaPerdaAlimRefRow = VendaPerdaVoucherRow;

/** @deprecated Use VendaPerdaIfoodRow */
export type VendaPerdaFoodRow = VendaPerdaIfoodRow;

/** Config mensal editavel (POS aluguel + quadro iFood manual). */
export interface VendaPerdaIfoodConfig {
  valorBruto: number;
  viaLoja: number;
  descontos: number;
  valorLiquido: number;
}

export interface VendaPerdaConfigMes {
  posAluguel: number;
  ifood: VendaPerdaIfoodConfig;
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
