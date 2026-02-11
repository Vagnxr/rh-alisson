/**
 * Formata uma Date para YYYY-MM-DD usando a data LOCAL (nao UTC).
 * Evita que o dia mude por timezone ao enviar dataInicio/dataFim para o backend.
 */
export function formatDateToLocalYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Formata string YYYY-MM-DD para DD/MM/YYYY sem usar Date (evita deslocamento por timezone).
 * Usar para exibir datas vindas da API na tabela.
 */
export function formatDateStringToBR(dateStr: string): string {
  if (!dateStr) return '';
  const part = dateStr.split('T')[0];
  const [y, m, d] = part.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
}
