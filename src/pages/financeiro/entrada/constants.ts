/** Categorias iniciais para valor/categoria na entrada. */
export const CATEGORIAS_INICIAIS = [
  { id: 'comercializacao', nome: 'COMERCIALIZAÇÃO' },
  { id: 'industrializacao', nome: 'INDUSTRIALIZAÇÃO' },
  { id: 'embalagem', nome: 'EMBALAGEM' },
  { id: 'mat-uso-cons', nome: 'MAT USO/CONS' },
  { id: 'merc-uso-cons', nome: 'MERC USO/CONS' },
  { id: 'gas', nome: 'GLP' },
  { id: 'bonif-preco', nome: 'BONIF PREÇO' },
  { id: 'bonif-troca', nome: 'BONIF TROCA' },
  { id: 'bonif-loja', nome: 'BONIF LOJA' },
];

export const MODELOS_NOTA_INICIAIS = ['NF-e', 'NFC-e', 'NFS-e', 'ENT SN', 'BONIFICAÇÃO'];

export const TIPOS_ENTRADA = ['Compra', 'Outros'];

/** Forma de pagamento retornada pela API GET /financeiro/entrada/formas-pagamento */
export interface FormaPagamentoFromApi {
  id: string;
  nome: string;
  isDefault: boolean;
}

/** @deprecated Usar FormaPagamentoFromApi da API. Mantido para compatibilidade. */
export interface FormaPagamentoItem {
  nome: string;
  comunicaAgenda?: boolean;
}

export const INPUT_CLASS =
  'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function parseNum(v: string): number {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

/** Normaliza vencimento da API para YYYY-MM-DD (input type="date"). Aceita string ou Date. */
export function normalizeVencimentoToYYYYMMDD(val: string | Date | null | undefined): string {
  if (val == null) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const s = String(val).trim();
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return isoMatch[0];
  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return s.slice(0, 10);
}
