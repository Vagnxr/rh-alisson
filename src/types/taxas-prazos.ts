/**
 * Tipos compartilhados do JSON de Taxas e Prazos (ControleCartaoTaxasPrazos.taxas, schema v2).
 * Espelho de backend/src/financeiro/helpers/taxas-json.helper.ts — manter em sincronia.
 * Usado por TaxasPrazosPage, ControleCartoesPage e AReceberPage (antes cada uma redeclarava).
 */

export type TipoBandeira = 'credito' | 'debito' | 'voucher';

export type CategoriaCredito = 'a-vista' | 'parcelado-vista' | 'parcelado-prazo';

/** Sub-aba dentro de cada maquininha. Voucher/iFood sao independentes de maquininha na v2. */
export type TipoMaq = 'credito' | 'debito' | 'pix' | 'voucher' | 'ifood';

export type FechamentoVoucher = 'normal' | 'semanal' | 'quinzenal';

/**
 * Corte do fechamento quinzenal, em dia do mes.
 * Ausente = blocos 1-15 e 16-fim (comportamento historico).
 */
export interface CorteQuinzenal {
  /** Dia do mes do primeiro corte (1..28). */
  primeiro: number;
  /** Dia do mes do segundo corte. 0 ou ausente = ultimo dia do mes. */
  segundo?: number;
}

/** Default aplicado quando a bandeira/categoria nao configura o corte quinzenal. */
export const CORTE_QUINZENAL_PADRAO: CorteQuinzenal = { primeiro: 15, segundo: 0 };

/**
 * Categoria de uma bandeira voucher (ex.: Pluxee Alimentacao).
 *
 * Todo campo opcional SOBRESCREVE o da bandeira — inclusive `fechamento`,
 * `corte` e `corteQuinzenal`, para que categorias da mesma bandeira possam ter
 * ciclos proprios. Ausentes, herdam da bandeira.
 */
export interface VoucherCategoria {
  id: string;
  label: string;
  taxa?: number;
  prazo?: number;
  doc?: number;
  porVenda?: number;
  anuidade?: number;
  usaQtdCupons?: boolean;
  fechamento?: FechamentoVoucher;
  /** Dia da semana do corte (1=segunda ... 5=sexta). So para fechamento semanal. */
  corte?: number;
  /** Dias do mes de corte. So para fechamento quinzenal. */
  corteQuinzenal?: CorteQuinzenal;
}

/** Configuracao de voucher por bandeira (independente de maquininha). */
export interface VoucherConfig {
  taxa: number;
  prazo: number;
  fechamento: FechamentoVoucher;
  /** Dia da semana do corte (1=segunda ... 5=sexta). So para fechamento semanal. */
  corte?: number;
  /** Dias do mes de corte. So para fechamento quinzenal. Ausente = 15 e fim do mes. */
  corteQuinzenal?: CorteQuinzenal;
  /** Tarifa em R$ cobrada por bloco de fechamento (DOC). */
  doc?: number;
  /** Tarifa em R$ por lancamento (ou por cupom quando usaQtdCupons). */
  porVenda?: number;
  /** Anuidade em R$ (informativa — nao entra em calculo). */
  anuidade?: number;
  /** Lancamento pede o campo Qtd Cupons (porVenda multiplica pela qtd). */
  usaQtdCupons?: boolean;
  categorias?: VoucherCategoria[];
}

export interface BandeiraCadastro {
  id: string;
  label: string;
  tipo: TipoBandeira;
  voucher?: VoucherConfig;
}

export interface MaquininhaCustom {
  id: string;
  label: string;
  custom?: boolean;
  tipos?: string[];
  bandeirasCredito?: string[];
  bandeirasDebito?: string[];
}

export interface TaxaPrazoMaquininha {
  operadora: string;
  tipo: TipoMaq;
  categoria?: CategoriaCredito | null;
  bandeira?: string | null;
  taxa: number;
  prazo: number;
}

/** Config do iFood (independente de maquininha). */
export interface IfoodConfig {
  taxa: number;
  prazo: number;
  fechamento?: FechamentoVoucher;
  corte?: number;
  /** Dias do mes de corte. So para fechamento quinzenal. Ausente = 15 e fim do mes. */
  corteQuinzenal?: CorteQuinzenal;
}

export interface ModulosHabilitados {
  voucher: boolean;
  ifood: boolean;
}

/** JSON salvo em ControleCartaoTaxasPrazos.taxas (schema v2). */
export interface TaxasJsonShape {
  schemaVersion?: number;
  bandeirasCadastradas?: BandeiraCadastro[];
  maquininhasCustom?: MaquininhaCustom[];
  maquininhasHabilitadas?: string[];
  /** Cor do cabecalho por id de maquininha + chaves especiais 'voucher' e 'ifood'. Valor = id de paleta (cores-maquininha.ts). */
  maquininhasCores?: Record<string, string>;
  /** Ausente = ambos habilitados (retrocompat). */
  modulosHabilitados?: ModulosHabilitados;
  ifoodConfig?: IfoodConfig;
  taxasPorMaquininha?: TaxaPrazoMaquininha[];
  /** @deprecated Formato antigo apenas com credito/debito; ainda lido para retrocompat. */
  taxas?: Array<{ bandeira: string; tipo: string; taxa: number; prazo?: number }>;
  [key: string]: unknown;
}

export interface TaxasPrazosPayload {
  taxas?: TaxasJsonShape | null;
  prazos?: number[] | null;
}

export const FECHAMENTO_OPTIONS: { id: FechamentoVoucher; label: string }[] = [
  { id: 'normal', label: 'Normal' },
  { id: 'semanal', label: 'Semanal' },
  { id: 'quinzenal', label: 'Quinzenal' },
];

export const CORTE_OPTIONS: { id: number; label: string }[] = [
  { id: 1, label: 'Segunda' },
  { id: 2, label: 'Terca' },
  { id: 3, label: 'Quarta' },
  { id: 4, label: 'Quinta' },
  { id: 5, label: 'Sexta' },
];

export function fechamentoLabel(f?: FechamentoVoucher): string {
  return FECHAMENTO_OPTIONS.find((o) => o.id === f)?.label ?? 'Normal';
}

export function corteLabel(c?: number): string {
  return CORTE_OPTIONS.find((o) => o.id === c)?.label ?? '-';
}

/** Modulos habilitados com default (ausente = ambos true). */
export function getModulosHabilitados(json: TaxasJsonShape | null | undefined): ModulosHabilitados {
  return json?.modulosHabilitados ?? { voucher: true, ifood: true };
}

/**
 * Defaults canonicos de voucher conforme tabela do cliente (planilha 27/05/2026).
 * Espelho de DEFAULT_VOUCHER_CONFIGS do backend — manter em sincronia.
 */
export const DEFAULT_VOUCHER_CONFIGS: Record<string, VoucherConfig> = {
  alelo: { taxa: 5, prazo: 30, fechamento: 'normal' },
  ben: { taxa: 6, prazo: 30, fechamento: 'normal' },
  pluxee: {
    taxa: 6.3,
    prazo: 28,
    fechamento: 'semanal',
    corte: 1,
    doc: 10.19,
    anuidade: 178.54,
    categorias: [
      { id: 'alimentacao', label: 'Alimentacao' },
      { id: 'refeicao', label: 'Refeicao', prazo: 23 },
      { id: 'premium', label: 'Premium', taxa: 5.5, anuidade: 204.24 },
      { id: 'gift', label: 'Gift', taxa: 5.5, anuidade: 204.24 },
    ],
  },
  ticket: {
    taxa: 6.3,
    prazo: 26,
    fechamento: 'semanal',
    corte: 4,
    doc: 8.37,
    anuidade: 150,
    categorias: [
      { id: 'alimentacao', label: 'Alimentacao' },
      {
        id: 'restaurante',
        label: 'Restaurante',
        taxa: 6,
        prazo: 30,
        porVenda: 0.78,
        usaQtdCupons: true,
        anuidade: 310.82,
      },
      { id: 'flex', label: 'Flex', taxa: 6, porVenda: 0.78, usaQtdCupons: true, anuidade: 310.82 },
    ],
  },
  vr: {
    taxa: 5.5,
    prazo: 28,
    fechamento: 'semanal',
    corte: 1,
    doc: 6.76,
    anuidade: 232,
    categorias: [
      { id: 'alimentacao', label: 'Alimentacao' },
      { id: 'refeicao', label: 'Refeicao', anuidade: 230.2 },
    ],
  },
  verocard: { taxa: 7.2, prazo: 14, fechamento: 'quinzenal', doc: 4.9, anuidade: 776.95 },
};

/** Espelho de DEFAULT_IFOOD_CONFIG do backend. */
export const DEFAULT_IFOOD_CONFIG: IfoodConfig = {
  taxa: 10.5,
  prazo: 7,
  fechamento: 'semanal',
  corte: 3,
};

/**
 * Seed inicial de bandeiras, usado apenas quando o tenant ainda nao tem
 * `bandeirasCadastradas` no JSON. A fonte da verdade em runtime e sempre o
 * cadastro salvo (ver `useTaxasPrazos`) — nenhuma tela deve manter lista propria.
 *
 * PIX NAO aparece aqui: ele tem secao propria por maquininha
 * (`taxasPorMaquininha[tipo='pix']`) e nao e bandeira de debito.
 */
export const DEFAULT_BANDEIRAS: BandeiraCadastro[] = [
  { id: 'visa', label: 'Visa', tipo: 'credito' },
  { id: 'mastercard', label: 'Mastercard', tipo: 'credito' },
  { id: 'elo-credito', label: 'Elo Credito', tipo: 'credito' },
  { id: 'amex', label: 'Amex', tipo: 'credito' },
  { id: 'hipercard', label: 'Hipercard', tipo: 'credito' },
  { id: 'electron', label: 'Electron', tipo: 'debito' },
  { id: 'elo-debito', label: 'Elo Debito', tipo: 'debito' },
  { id: 'maestro', label: 'Maestro', tipo: 'debito' },
  { id: 'alelo', label: 'Alelo', tipo: 'voucher', voucher: DEFAULT_VOUCHER_CONFIGS.alelo },
  { id: 'ben', label: 'Ben Alim/Ref', tipo: 'voucher', voucher: DEFAULT_VOUCHER_CONFIGS.ben },
  { id: 'ticket', label: 'Ticket', tipo: 'voucher', voucher: DEFAULT_VOUCHER_CONFIGS.ticket },
  { id: 'vr', label: 'VR', tipo: 'voucher', voucher: DEFAULT_VOUCHER_CONFIGS.vr },
  { id: 'verocard', label: 'Verocard', tipo: 'voucher', voucher: DEFAULT_VOUCHER_CONFIGS.verocard },
  { id: 'pluxee', label: 'Pluxee', tipo: 'voucher', voucher: DEFAULT_VOUCHER_CONFIGS.pluxee },
];

/** Garante config voucher em toda bandeira voucher (seed a partir dos defaults do cliente). */
export function comVoucherSeed(b: BandeiraCadastro): BandeiraCadastro {
  if (b.tipo !== 'voucher' || b.voucher) return b;
  return { ...b, voucher: DEFAULT_VOUCHER_CONFIGS[b.id] ?? { taxa: 0, prazo: 0, fechamento: 'normal' } };
}

/**
 * Config efetiva de uma bandeira voucher, aplicando overrides da categoria.
 * Espelho de resolverVoucherConfig do backend — manter em sincronia.
 *
 * Fechamento e corte tambem sao herdaveis: sem override, valem os da bandeira.
 */
export function resolverVoucherConfig(
  bandeira: BandeiraCadastro | undefined,
  categoriaId?: string | null,
): VoucherConfig | null {
  const cfg = bandeira?.voucher;
  if (!cfg) return null;
  if (!categoriaId) return { ...cfg };
  const cat = (cfg.categorias ?? []).find((c) => c.id === categoriaId);
  if (!cat) return { ...cfg };
  return {
    ...cfg,
    taxa: cat.taxa ?? cfg.taxa,
    prazo: cat.prazo ?? cfg.prazo,
    doc: cat.doc ?? cfg.doc,
    porVenda: cat.porVenda ?? cfg.porVenda,
    anuidade: cat.anuidade ?? cfg.anuidade,
    usaQtdCupons: cat.usaQtdCupons ?? cfg.usaQtdCupons,
    fechamento: cat.fechamento ?? cfg.fechamento,
    corte: cat.corte ?? cfg.corte,
    corteQuinzenal: cat.corteQuinzenal ?? cfg.corteQuinzenal,
  };
}

/** Rotulo curto do corte quinzenal (ex.: "10 e 25", "15 e fim do mes"). */
export function corteQuinzenalLabel(c?: CorteQuinzenal): string {
  const primeiro = c?.primeiro ?? CORTE_QUINZENAL_PADRAO.primeiro;
  const segundo = c?.segundo ?? 0;
  return `${primeiro} e ${segundo > 0 ? segundo : 'fim do mes'}`;
}
