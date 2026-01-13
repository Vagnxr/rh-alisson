import { cn } from '@/lib/cn';
import type { HeaderProps } from '@/types/header';

const headerContainerClassName = cn(
  'grid',
  'grid-cols-2',
  'items-center',
  'md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]',
  'gap-2 md:gap-4',
  'pb-2 sm:pb-3 md:pb-4',
  'p-2 sm:p-3 md:p-4',
);

// IMPORTANTE: manter o header fixo no topo (desktop) como está hoje.
const headerStickyClassName = cn(
  'z-40 md:sticky md:top-0',
);

const infoBoxClassName = cn(
  'border-2 border-neutral-600 bg-black',
  'px-3 sm:px-4 md:px-6',
  'py-1.5 md:py-2',
  'rounded shadow-lg',
  'flex items-center gap-2 md:gap-3',
  'w-full justify-center md:w-auto',
);

const titleClassName = cn(
  'hidden md:grid md:grid-cols-[1fr_auto_1fr]',
  'text-base text-neutral-500',
  'tracking-[0.2em] uppercase',
  'px-6 lg:px-8',
  'items-center justify-center gap-4',
  'justify-self-center',
);

type InfoBoxProps = {
  icon?: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  placeholder?: React.ReactNode;
  hideLabelOnMobile?: boolean;
};

const InfoBox = ({
  icon,
  label,
  value,
  placeholder = '--',
  hideLabelOnMobile = true,
}: InfoBoxProps) => (
  <div className={infoBoxClassName}>
    {icon ? icon : null}
    <span className={cn('text-xs text-white tracking-widest', hideLabelOnMobile ? 'hidden md:block' : '')}>
      {label}:
    </span>
    <span className="font-normal text-xs text-white">{value ?? placeholder}</span>
  </div>
);

export const Header = ({ left, right, center, className = '', sticky = true }: HeaderProps) => {
  return (
    <div className={cn(headerContainerClassName, sticky ? headerStickyClassName : '', className)}>
      <div className="flex justify-center md:justify-start">
        <InfoBox
          icon={left.icon}
          label={left.label}
          value={left.value}
          placeholder={left.placeholder}
          hideLabelOnMobile={left.hideLabelOnMobile}
        />
      </div>

      <div className={cn(titleClassName, center?.className)}>
        {center?.title ? <span className="flex justify-end text-white">{center.title}</span> : null}
        {center?.artwork ? center.artwork : null}
        {center?.subtitle ? <span className="flex justify-start text-white">{center.subtitle}</span> : null}
      </div>

      <div className="flex justify-center md:justify-end">
        <InfoBox
          icon={right.icon}
          label={right.label}
          value={right.value}
          placeholder={right.placeholder}
          hideLabelOnMobile={right.hideLabelOnMobile}
        />
      </div>
    </div>
  );
};
