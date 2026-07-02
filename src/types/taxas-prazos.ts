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

/** Categoria de uma bandeira voucher (ex.: Pluxee Alimentacao). Campos opcionais sobrescrevem a bandeira. */
export interface VoucherCategoria {
  id: string;
  label: string;
  taxa?: number;
  prazo?: number;
  doc?: number;
  porVenda?: number;
  anuidade?: number;
  usaQtdCupons?: boolean;
}

/** Configuracao de voucher por bandeira (independente de maquininha). */
export interface VoucherConfig {
  taxa: number;
  prazo: number;
  fechamento: FechamentoVoucher;
  /** Dia da semana do corte (1=segunda ... 5=sexta). So para fechamento semanal. */
  corte?: number;
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

/** Config efetiva de uma bandeira voucher, aplicando overrides da categoria. */
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
  };
}
