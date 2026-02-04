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
