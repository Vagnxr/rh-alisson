import { useState, useCallback, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/cn';

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
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

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
      case 'day':
        const dayDiff = direction === 'prev' ? -1 : 1;
        newStart = new Date(startDate);
        newStart.setDate(newStart.getDate() + dayDiff);
        newEnd = new Date(newStart);
        newEnd.setHours(23, 59, 59);
        break;
      case 'month':
        const monthDiff = direction === 'prev' ? -1 : 1;
        newStart = new Date(startDate.getFullYear(), startDate.getMonth() + monthDiff, 1);
        newEnd = new Date(newStart.getFullYear(), newStart.getMonth() + 1, 0);
        break;
      case 'year':
        const yearDiff = direction === 'prev' ? -1 : 1;
        newStart = new Date(startDate.getFullYear() + yearDiff, 0, 1);
        newEnd = new Date(newStart.getFullYear(), 11, 31);
        break;
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

  return (
    <div className={cn('relative', className)}>
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {/* Navegacao */}
        <button
          type="button"
          onClick={() => navigate('prev')}
          disabled={filter.period === 'custom'}
          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Botao principal */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
        >
          <Calendar className="h-4 w-4" />
          <span>{displayText}</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('next')}
          disabled={filter.period === 'custom'}
          className="rounded p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1 w-64 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Periodo</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['day', 'month', 'year'] as FilterPeriod[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    handlePeriodChange(p);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    filter.period === p
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  )}
                >
                  {p === 'day' ? 'Dia' : p === 'month' ? 'Mes' : 'Ano'}
                </button>
              ))}
            </div>

            {/* Personalizado */}
            <div className="mt-3 border-t border-slate-200 pt-3">
              <p className="mb-2 text-xs font-medium text-slate-500">Periodo personalizado</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Inicio</label>
                  <input
                    type="date"
                    value={filter.startDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newStart = new Date(e.target.value);
                      updateFilter({
                        period: 'custom',
                        startDate: newStart,
                        endDate: filter.endDate < newStart ? newStart : filter.endDate,
                      });
                    }}
                    className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-500">Fim</label>
                  <input
                    type="date"
                    value={filter.endDate.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newEnd = new Date(e.target.value);
                      updateFilter({
                        period: 'custom',
                        startDate: filter.startDate,
                        endDate: newEnd,
                      });
                    }}
                    min={filter.startDate.toISOString().split('T')[0]}
                    className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
