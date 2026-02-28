import { getBancoIcon, type Banco } from '@/types/banco';
import { cn } from '@/lib/cn';

interface BancoLogoProps {
  banco: Banco;
  size?: 'sm' | 'md' | 'lg';
}

export function BancoLogo({ banco, size = 'md' }: BancoLogoProps) {
  const sizeClass = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  if (banco.logo) {
    return (
      <img
        src={banco.logo}
        alt=""
        className={cn('rounded-lg object-contain bg-white shrink-0', sizeClass)}
      />
    );
  }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white',
        sizeClass
      )}
      style={{ backgroundColor: banco.cor }}
    >
      {getBancoIcon(banco)}
    </div>
  );
}
