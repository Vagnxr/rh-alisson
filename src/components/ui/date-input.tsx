import { useEffect, useRef, useState } from 'react';
import { CalendarBlank } from '@phosphor-icons/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface DateInputProps {
  /** Valor no formato ISO YYYY-MM-DD ('' quando vazio). */
  value?: string;
  /** Recebe sempre ISO YYYY-MM-DD ('' quando limpa). */
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  /** Id opcional para label htmlFor. */
  id?: string;
}

/** ISO YYYY-MM-DD -> BR DD/MM/YYYY. Retorna '' se nao bater. */
function isoToBR(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${y}`;
}

/** BR DD/MM/YYYY -> ISO YYYY-MM-DD se valido (datas reais), senao null. */
function brToISO(br: string): string | null {
  const m = br.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  if (mm < 1 || mm > 12) return null;
  const date = new Date(yyyy, mm - 1, dd);
  // valida que a data nao "rolou" (ex.: 31/02 vira 03/03)
  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
    return null;
  }
  return `${m[3]}-${m[2]}-${m[1]}`;
}

/** Aplica mascara progressiva DD/MM/YYYY enquanto digita. */
function applyDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
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
  placeholder = 'DD/MM/AAAA',
  required,
  disabled,
  id,
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string>(isoToBR(value));
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = parseDateLocal(value);

  // Mantem o input sincronizado quando o valor externo muda (ex.: reset de form).
  useEffect(() => {
    setDraft(isoToBR(value));
  }, [value]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const iso = toYYYYMMDD(date);
      setDraft(isoToBR(iso));
      onChange?.(iso);
      setOpen(false);
    }
  };

  const handleClear = () => {
    setDraft('');
    onChange?.('');
    setOpen(false);
  };

  const handleToday = () => {
    const iso = toYYYYMMDD(new Date());
    setDraft(isoToBR(iso));
    onChange?.(iso);
    setOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = applyDateMask(e.target.value);
    setDraft(masked);
    // Auto-commit quando atinge 10 caracteres (DD/MM/AAAA) e for valido.
    if (masked.length === 10) {
      const iso = brToISO(masked);
      if (iso) onChange?.(iso);
    } else if (masked.length === 0) {
      onChange?.('');
    }
  };

  const handleBlur = () => {
    // Em blur: se nao for data valida, reverte para o ultimo valor commitado.
    if (!draft) {
      onChange?.('');
      return;
    }
    const iso = brToISO(draft);
    if (iso) {
      onChange?.(iso);
      setDraft(isoToBR(iso));
    } else {
      // Reverte para o valor externo (descarta rascunho invalido).
      setDraft(isoToBR(value));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={draft}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={cn(
          'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
          // pr-10 vem por ULTIMO para nao ser sobrescrito por px-3 da className passada (twMerge):
          // garante espaco para o icone do calendario sempre.
          'pr-10',
        )}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="Abrir calendario"
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
            onClick={(e) => {
              e.preventDefault();
              setOpen((o) => !o);
            }}
          >
            <CalendarBlank className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={6}
          avoidCollisions
          collisionPadding={12}
          className={cn(
            'flex w-auto flex-col rounded-xl border border-slate-200 bg-white p-0 shadow-lg',
            'max-w-[calc(100vw-1rem)]',
          )}
        >
          <Calendar
            mode="single"
            showOutsideDays={false}
            selected={selected}
            onSelect={handleSelect}
            initialFocus
          />
          <div className="flex gap-2 border-t border-slate-200 bg-white p-2">
            <button
              type="button"
              onClick={handleToday}
              className="flex-1 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="flex-1 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Limpar
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
