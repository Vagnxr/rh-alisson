import { useState, useMemo, useCallback } from 'react';
import { Store, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Loja } from '@/types/loja';

export interface LojaSelectorProps {
  lojas: Loja[];
  lojaAtual: string | null;
  onChange?: (lojaId: string | null) => void;
  className?: string;
  showLabel?: boolean;
  /**
   * Se true, mostra o apelido da loja ao invés do nome
   * Requer que Loja tenha campo 'apelido'
   */
  useApelido?: boolean;
}

/**
 * Componente reutilizável para seleção de loja
 * Similar ao DateFilter, mas para lojas
 * 
 * Exibe "Todas" quando lojaAtual é null
 * Exibe loja específica quando lojaAtual tem valor
 */
export function LojaSelector({
  lojas,
  lojaAtual,
  onChange,
  className,
  showLabel = false,
  useApelido = false,
}: LojaSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const lojaSelecionada = useMemo(() => {
    if (lojaAtual === null) return null;
    return lojas.find((l) => l.id === lojaAtual) || null;
  }, [lojas, lojaAtual]);

  const displayText = useMemo(() => {
    if (lojaSelecionada === null) {
      return 'Todas as lojas';
    }
    
    // Usa apelido se disponivel
    if ('apelido' in lojaSelecionada && lojaSelecionada.apelido) {
      return lojaSelecionada.apelido;
    }
    
    // Fallback para nomeFantasia se existir
    if ('nomeFantasia' in lojaSelecionada && lojaSelecionada.nomeFantasia) {
      return lojaSelecionada.nomeFantasia;
    }
    
    return lojaSelecionada.razaoSocial;
  }, [lojaSelecionada, useApelido]);

  const handleSelect = useCallback(
    (lojaId: string | null) => {
      onChange?.(lojaId);
      setIsOpen(false);
    },
    [onChange]
  );

  if (lojas.length === 0) {
    return null;
  }

  // Se só tem uma loja, não mostra seletor
  if (lojas.length === 1) {
    return null;
  }

  return (
    <div className={cn('relative', className)}>
      {showLabel && (
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Loja</label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm',
          'text-slate-700 transition-colors',
          'hover:border-emerald-300 hover:bg-slate-50',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
          isOpen && 'border-emerald-500 ring-1 ring-emerald-500'
        )}
      >
        <div className="flex items-center gap-2">
          <Store className="h-4 w-4 text-slate-400" />
          <span className="font-medium">{displayText}</span>
        </div>
        <ChevronDown
          className={cn('h-4 w-4 text-slate-400 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="max-h-60 overflow-y-auto p-1">
              {/* Opção "Todas" */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={cn(
                  'w-full rounded px-3 py-2 text-left text-sm transition-colors',
                  lojaAtual === null
                    ? 'bg-emerald-50 text-emerald-700 font-medium'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  <span>Todas as lojas</span>
                </div>
              </button>

              {/* Lista de lojas */}
              {lojas.map((loja) => {
                const displayName = 'apelido' in loja && loja.apelido
                  ? loja.apelido
                  : 'nomeFantasia' in loja && loja.nomeFantasia
                    ? loja.nomeFantasia
                    : loja.razaoSocial;

                return (
                  <button
                    key={loja.id}
                    type="button"
                    onClick={() => handleSelect(loja.id)}
                    className={cn(
                      'w-full rounded px-3 py-2 text-left text-sm transition-colors',
                      lojaAtual === loja.id
                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                        : 'text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {displayName}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
