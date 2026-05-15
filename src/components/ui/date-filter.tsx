import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export type FilterPeriod = 'day' | 'month' | 'year' | 'custom';

export interface DateFilterValue {
  period: FilterPeriod;
  startDate: Date;
  endDate: Date;
}

interface DateFilterProps {
  value?: DateFilterValue;
  onChange?: (value: DateFilterValue) => void;
  className?: string;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function atLocalMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Calendario compacto dentro do popover do filtro */
const FILTER_CALENDAR_CLASS =
  'max-w-[17rem] min-w-0 w-full p-2 [--cell-size:2.25rem] sm:max-w-[18rem] sm:p-2.5 sm:[--cell-size:2.45rem]';

export function getDefaultFilter(): DateFilterValue {
  const now = new Date();
  return {
    period: 'month',
    startDate: new Date(now.getFullYear(), now.getMonth(), 1),
    endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0),
  };
}

export function DateFilter({ value, onChange, className }: DateFilterProps) {
  const [filter, setFilter] = useState<DateFilterValue>(value || getDefaultFilter());
  const [isOpen, setIsOpen] = useState(false);
  const [customFieldOpen, setCustomFieldOpen] = useState<'start' | 'end' | null>(null);
  const startCalendarWrapRef = useRef<HTMLDivElement>(null);
  const endCalendarWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) setCustomFieldOpen(null);
  }, [isOpen]);

  useEffect(() => {
    const el =
      customFieldOpen === 'start'
        ? startCalendarWrapRef.current
        : customFieldOpen === 'end'
          ? endCalendarWrapRef.current
          : null;
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [customFieldOpen]);

  const updateFilter = useCallback((newFilter: DateFilterValue) => {
    setFilter(newFilter);
    onChange?.(newFilter);
  }, [onChange]);

  const handlePeriodChange = useCallback((period: FilterPeriod) => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'custom':
        startDate = filter.startDate;
        endDate = filter.endDate;
        break;
      default:
        startDate = filter.startDate;
        endDate = filter.endDate;
    }

    updateFilter({ period, startDate, endDate });
  }, [filter, updateFilter]);

  const navigate = useCallback((direction: 'prev' | 'next') => {
    const { period, startDate, endDate } = filter;
    let newStart: Date;
    let newEnd: Date;

    switch (period) {
      case 'day': {
        const dayDiff = direction === 'prev' ? -1 : 1;
        newStart = new Date(startDate);
        newStart.setDate(newStart.getDate() + dayDiff);
        newEnd = new Date(newStart);
        newEnd.setHours(23, 59, 59);
        break;
      }
      case 'month': {
        const monthDiff = direction === 'prev' ? -1 : 1;
        newStart = new Date(startDate.getFullYear(), startDate.getMonth() + monthDiff, 1);
        newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 0);
        break;
      }
      case 'year': {
        const yearDiff = direction === 'prev' ? -1 : 1;
        newStart = new Date(startDate.getFullYear() + yearDiff, 0, 1);
        newEnd = new Date(newStart.getFullYear(), 11, 31);
        break;
      }
      default:
        return;
    }

    updateFilter({ ...filter, startDate: newStart, endDate: newEnd });
  }, [filter, updateFilter]);

  const displayText = useMemo(() => {
    const { period, startDate, endDate } = filter;

    switch (period) {
      case 'day':
        return startDate.toLocaleDateString('pt-BR');
      case 'month':
        return `${MONTHS[startDate.getMonth()]} ${startDate.getFullYear()}`;
      case 'year':
        return `${startDate.getFullYear()}`;
      case 'custom':
        return `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;
      default:
        return '';
    }
  }, [filter]);

  const triggerFieldClass =
    'flex h-9 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-left text-sm text-slate-800 transition-colors hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1';

  return (
    <div className={cn('relative', className)}>
      <div
        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1"
        data-testid="despesa-categoria-filtro-mes"
      >
        <button
          type="button"
          onClick={() => navigate('prev')}
          disabled={filter.period === 'custom'}
          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          data-testid="despesa-categoria-filtro-prev"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
              data-testid="despesa-categoria-filtro-periodo-mes"
            >
              <CalendarIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{displayText}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            sideOffset={6}
            collisionPadding={12}
            avoidCollisions
            className={cn(
              'flex w-[min(18.5rem,calc(100vw-1.25rem))] max-w-[calc(100vw-1rem)] flex-col overflow-hidden p-0 shadow-lg',
              'max-h-[min(70dvh,calc(100dvh-2rem))]',
            )}
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-2.5 [scrollbar-gutter:stable]">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-700">Periodo</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {(['day', 'month', 'year'] as FilterPeriod[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      handlePeriodChange(p);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
                      filter.period === p
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                    )}
                  >
                    {p === 'day' ? 'Dia' : p === 'month' ? 'Mes' : 'Ano'}
                  </button>
                ))}
              </div>

              <div className="mt-2.5 border-t border-slate-200 pt-2.5">
                <p className="mb-2 text-xs font-medium text-slate-500">Periodo personalizado</p>
                <div className="flex flex-col gap-3">
                  <div className="min-w-0">
                    <label htmlFor="date-filter-start" className="mb-1 block text-xs text-slate-500">
                      Inicio
                    </label>
                    <button
                      id="date-filter-start"
                      type="button"
                      aria-expanded={customFieldOpen === 'start'}
                      onClick={() => setCustomFieldOpen((prev) => (prev === 'start' ? null : 'start'))}
                      className={cn(
                        triggerFieldClass,
                        customFieldOpen === 'start' && 'border-emerald-500 ring-1 ring-emerald-500/30',
                      )}
                    >
                      <span className="truncate">{filter.startDate.toLocaleDateString('pt-BR')}</span>
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    </button>
                    {customFieldOpen === 'start' && (
                      <div
                        ref={startCalendarWrapRef}
                        className="mt-1.5 overflow-hidden rounded-md border border-slate-200 bg-slate-50/90"
                      >
                        <Calendar
                          mode="single"
                          selected={atLocalMidnight(filter.startDate)}
                          defaultMonth={filter.startDate}
                          onSelect={(d) => {
                            if (!d) return;
                            const newStart = atLocalMidnight(d);
                            updateFilter({
                              period: 'custom',
                              startDate: newStart,
                              endDate: filter.endDate < newStart ? newStart : filter.endDate,
                            });
                            setCustomFieldOpen(null);
                          }}
                          initialFocus
                          className={cn(
                            'mx-auto border-0 bg-transparent shadow-none',
                            FILTER_CALENDAR_CLASS,
                          )}
                        />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <label htmlFor="date-filter-end" className="mb-1 block text-xs text-slate-500">
                      Fim
                    </label>
                    <button
                      id="date-filter-end"
                      type="button"
                      aria-expanded={customFieldOpen === 'end'}
                      onClick={() => setCustomFieldOpen((prev) => (prev === 'end' ? null : 'end'))}
                      className={cn(
                        triggerFieldClass,
                        customFieldOpen === 'end' && 'border-emerald-500 ring-1 ring-emerald-500/30',
                      )}
                    >
                      <span className="truncate">{filter.endDate.toLocaleDateString('pt-BR')}</span>
                      <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    </button>
                    {customFieldOpen === 'end' && (
                      <div
                        ref={endCalendarWrapRef}
                        className="mt-1.5 overflow-hidden rounded-md border border-slate-200 bg-slate-50/90"
                      >
                        <Calendar
                          mode="single"
                          selected={atLocalMidnight(filter.endDate)}
                          defaultMonth={filter.endDate}
                          onSelect={(d) => {
                            if (!d) return;
                            const newEnd = atLocalMidnight(d);
                            updateFilter({
                              period: 'custom',
                              startDate: filter.startDate,
                              endDate: newEnd,
                            });
                            setCustomFieldOpen(null);
                          }}
                          initialFocus
                          className={cn(
                            'mx-auto border-0 bg-transparent shadow-none',
                            FILTER_CALENDAR_CLASS,
                          )}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <button
          type="button"
          onClick={() => navigate('next')}
          disabled={filter.period === 'custom'}
          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          data-testid="despesa-categoria-filtro-next"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
