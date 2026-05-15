import { useState } from 'react';
import { CalendarBlank } from '@phosphor-icons/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface DateInputProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

function parseDateLocal(dateStr: string): Date | undefined {
  if (!dateStr) return undefined;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DateInput({
  value = '',
  onChange,
  className,
  placeholder = 'Selecione uma data',
  required,
  disabled,
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDateLocal(value);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange?.(toYYYYMMDD(date));
      setOpen(false);
    }
  };

  const handleClear = () => {
    onChange?.('');
    setOpen(false);
  };

  const handleToday = () => {
    onChange?.(toYYYYMMDD(new Date()));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            !value && 'text-slate-400',
            className,
          )}
        >
          <span>{value ? formatDateBR(value) : placeholder}</span>
          <CalendarBlank className="h-4 w-4 opacity-60 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        collisionPadding={16}
        avoidCollisions
        className={cn(
          'flex w-max max-h-[min(28rem,min(85dvh,calc(100dvh-2rem)))] max-w-[min(20rem,calc(100vw-1rem))] flex-col overflow-hidden p-0 shadow-lg',
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
          <Calendar mode="single" selected={selected} onSelect={handleSelect} initialFocus />
        </div>
        <div className="flex shrink-0 gap-2 border-t border-slate-200 p-2.5">
          <button
            type="button"
            onClick={handleToday}
            className="flex-1 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Limpar
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
