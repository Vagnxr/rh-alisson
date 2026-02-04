import type { DateFilterValue } from '@/components/ui/date-filter';

/** Converte DateFilterValue em query params para os GETs do modulo financeiro. */
export function dateFilterToParams(value: DateFilterValue): Record<string, string> {
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return {
    dataInicio: fmt(value.startDate),
    dataFim: fmt(value.endDate),
  };
}
