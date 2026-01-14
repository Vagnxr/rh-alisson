import { cn } from '@/lib/cn';
import { RECORRENCIAS, type TipoRecorrencia } from '@/types/recorrencia';
import { Repeat, CalendarClock } from 'lucide-react';

interface SelectRecorrenciaProps {
  value?: TipoRecorrencia;
  onChange?: (value: TipoRecorrencia) => void;
  disabled?: boolean;
  label?: string;
  showDescription?: boolean;
  className?: string;
}

export function SelectRecorrencia({
  value = 'unica',
  onChange,
  disabled,
  label = 'Recorrencia',
  showDescription = false,
  className,
}: SelectRecorrenciaProps) {
  const selectedConfig = RECORRENCIAS[value];

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <Repeat className="h-4 w-4" />
          {label}
        </label>
      )}

      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value as TipoRecorrencia)}
        disabled={disabled}
        className={cn(
          'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900',
          'focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500',
          'disabled:bg-slate-50 disabled:text-slate-500'
        )}
      >
        {Object.values(RECORRENCIAS).map((config) => (
          <option key={config.tipo} value={config.tipo}>
            {config.label}
          </option>
        ))}
      </select>

      {showDescription && selectedConfig && (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <CalendarClock className="h-3.5 w-3.5" />
          {selectedConfig.descricao}
        </p>
      )}
    </div>
  );
}

// Versao compacta para uso em tabelas/formularios menores
interface RecorrenciaBadgeProps {
  value: TipoRecorrencia;
  className?: string;
}

export function RecorrenciaBadge({ value, className }: RecorrenciaBadgeProps) {
  const config = RECORRENCIAS[value];

  if (value === 'unica') {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700',
        className
      )}
    >
      <Repeat className="h-3 w-3" />
      {config.label}
    </span>
  );
}
