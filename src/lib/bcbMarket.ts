/** Series do Banco Central (SGS) — API publica, sem auth. */

export type BcbPoint = { date: string; value: number };

type BcbRow = { data: string; valor: string };

const BCB_BASE = 'https://api.bcb.gov.br/dados/serie/bcdata.sgs';

export const BCB_SERIES = {
  selic: 432,
  cdi: 12,
  usd: 1,
  ipca12: 13522,
} as const;

export async function fetchBcbSeries(code: number, count = 20): Promise<BcbPoint[]> {
  const res = await fetch(`${BCB_BASE}.${code}/dados/ultimos/${count}?formato=json`);
  if (!res.ok) throw new Error(`BCB serie ${code}: HTTP ${res.status}`);
  const rows = (await res.json()) as BcbRow[];
  return rows.map((r) => ({
    date: r.data,
    value: Number.parseFloat(r.valor.replace(',', '.')),
  }));
}

export function pctChange(current: number, previous: number): number {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

export function formatPctBr(value: number, decimals = 2, suffix = '%') {
  return `${value.toFixed(decimals).replace('.', ',')}${suffix}`;
}

export function formatSelicMeta(value: number) {
  return `${formatPctBr(value)} a.a.`;
}

export function formatCdiDaily(value: number) {
  return `${formatPctBr(value, 4)} a.d.`;
}

export function formatUsd(value: number) {
  return `R$ ${value.toFixed(4).replace('.', ',')}`;
}

export function formatChange(change: number) {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2).replace('.', ',')}%`;
}
