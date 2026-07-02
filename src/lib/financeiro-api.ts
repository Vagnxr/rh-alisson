import type { DateFilterValue } from '@/components/ui/date-filter';
import { formatDateToLocalYYYYMMDD } from '@/lib/date';

/** Converte DateFilterValue em query params para os GETs do modulo financeiro. */
export function dateFilterToParams(value: DateFilterValue): Record<string, string> {
  const fmt = formatDateToLocalYYYYMMDD;
  return {
    dataInicio: fmt(value.startDate),
    dataFim: fmt(value.endDate),
  };
}
