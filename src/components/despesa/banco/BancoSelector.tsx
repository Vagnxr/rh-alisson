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
      <label className="text-sm font-medium text-foreground">
        Banco <span className="text-destructive">*</span>
      </label>
      <div className="grid max-h-48 grid-cols-4 gap-2 overflow-y-auto p-1">
        {bancos.map((banco) => (
          <button
            key={banco.id}
            type="button"
            onClick={() => onChange(banco.id)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all hover:shadow-md',
              value === banco.id
                ? 'border-primary bg-primary/10 dark:bg-primary/15'
                : 'border-border bg-card hover:border-primary/40',
            )}
          >
            <BancoLogo banco={banco} size="md" />
            <span className="text-center text-xs font-medium leading-tight text-foreground">
              {banco.nome.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
