import type { ReactNode } from 'react';

export interface HomeInfoCardProps {
  title: string;
  value: string;
  icon?: ReactNode;
  imageSrc?: string;
  align?: 'left' | 'right';
}

export function HomeInfoCard({ title, value, icon, imageSrc, align = 'left' }: HomeInfoCardProps) {
  return (
    <div className="relative flex items-center p-1 px-3 bg-neutral-900/90 border-2 border-slate-600 rounded-lg shadow-lg w-full lg:w-80 h-24">
      {/* Portrait Image Placeholder */}
      <div
        className={`size-16 shrink-0 bg-slate-800 rounded border-2 border-slate-500 overflow-hidden flex items-center justify-center ${
          align === 'right' ? 'order-2 ml-3' : 'mr-3'
        }`}
      >
        {imageSrc ? (
          <img src={imageSrc} alt="Character" className="w-full h-full object-cover" />
        ) : (
          <div className="text-xs text-center text-slate-500 font-pixel">IMG</div>
        )}
      </div>

      {/* Text Content */}
      <div
        className={`flex flex-col flex-1 ${align === 'right' ? 'items-end text-right' : 'items-start text-left'}`}
      >
        <span className="text-slate-300 font-pixel text-xs leading-tight mb-1">{title}</span>
        <div className="flex items-center gap-1 text-yellow-400 font-pixel text-xs">
          {icon}
          <span>{value}</span>
        </div>
      </div>

      {/* Corner Screw Decoration */}
      <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-slate-500 rounded-full" />
      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-slate-500 rounded-full" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-slate-500 rounded-full" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-slate-500 rounded-full" />
    </div>
  );
}
