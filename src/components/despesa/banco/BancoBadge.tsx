import type { Banco } from '@/types/banco';
import { BancoLogo } from './BancoLogo';

interface BancoBadgeProps {
  bancoId?: string;
  bancos: Banco[];
}

export function BancoBadge({ bancoId, bancos }: BancoBadgeProps) {
  const banco = bancos.find((b) => b.id === bancoId);
  if (!banco) return <span className="text-slate-400">-</span>;

  return (
    <div className="flex items-center gap-2">
      <BancoLogo banco={banco} size="sm" />
      <span className="text-sm font-medium">{banco.nome}</span>
    </div>
  );
}
