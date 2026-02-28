import type { Banco } from '@/types/banco';
import { BancoLogo } from './BancoLogo';
import { cn } from '@/lib/cn';

interface BancoSelectorProps {
  value: string;
  onChange: (bancoId: string) => void;
  bancos: Banco[];
}

export function BancoSelector({ value, onChange, bancos }: BancoSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">
        Banco <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
        {bancos.map((banco) => (
          <button
            key={banco.id}
            type="button"
            onClick={() => onChange(banco.id)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all hover:shadow-md',
              value === banco.id
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <BancoLogo banco={banco} size="md" />
            <span className="text-xs font-medium text-slate-700 text-center leading-tight">
              {banco.nome.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
