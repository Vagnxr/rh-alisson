/**
 * Formato brasileiro: milhar com ponto (1.234.567), decimal com virgula (,89).
 * Usar ao exibir valor em campos editaveis e ao parsear o que o usuario digitou.
 */

/** Formata numero para exibir em input (ex.: 10000 -> "10.000,00", 10.82 -> "10,82"). */
export function formatValorForInput(value: number): string {
  if (value == null || Number.isNaN(value)) return '';
  const fixed = value.toFixed(2);
  const parts = fixed.split('.');
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decPart = parts[1] ?? '00';
  return `${intPart},${decPart}`;
}

/**
 * Parseia string digitada pelo usuario para numero.
 * Aceita formato BR (10.000,00 ou 10,82) e formato com ponto decimal (10000 ou 10.82).
 */
export function parseValorFromInput(str: string): number {
  if (!str || typeof str !== 'string') return 0;
  const trimmed = str.trim();
  if (!trimmed) return 0;
  const semMilhar = trimmed.replace(/\./g, '');
  const comPontoDecimal = semMilhar.replace(',', '.');
  const n = parseFloat(comPontoDecimal);
  return Number.isNaN(n) ? 0 : n;
}
