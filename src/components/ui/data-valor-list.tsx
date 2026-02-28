import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface DataValorItem {
  data: string;
  valor: string;
}

const inputBaseClass =
  'relative flex h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export interface DataValorListProps {
  /** Lista controlada: cada item tem data (YYYY-MM-DD) e valor (string para input). */
  value: DataValorItem[];
  onChange: (items: DataValorItem[]) => void;
  /** Rotulo da secao (ex.: "Data / Valor"). */
  label?: string;
  /** Texto do botao de adicionar linha (ex.: "Adicionar valor"). */
  addLabel?: string;
  /** Exibir total dos valores no rodape. */
  showTotal?: boolean;
  /** Funcao para calcular total a partir dos valores (string). */
  formatTotal?: (total: number) => string;
  /** Classe do container. */
  className?: string;
  /** Altura maxima da lista com scroll (ex.: "max-h-40"). */
  maxHeight?: string;
  /** Quando informado, define o item ao clicar em "Adicionar". Recebe a lista atual (para calcular ex.: proximo mes). */
  getNewItem?: (currentValue: DataValorItem[]) => DataValorItem;
  /** Rotulo no rodape para a contagem (ex.: "parcela" -> "1 parcela" / "3 parcelas"). Default: "recorrência". */
  countLabel?: string;
}

function parseValor(v: string): number {
  const s = String(v || '').trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

export function DataValorList({
  value,
  onChange,
  label = 'Data / Valor',
  addLabel = 'Adicionar valor',
  showTotal = true,
  formatTotal = (n) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n),
  className,
  maxHeight = 'max-h-40',
  getNewItem,
  countLabel = 'recorrência',
}: DataValorListProps) {
  const addLine = () => {
    if (getNewItem) {
      onChange([...value, getNewItem(value)]);
      return;
    }
    const first = value[0];
    const defaultData = first?.data ?? new Date().toISOString().split('T')[0];
    onChange([...value, { data: defaultData, valor: '' }]);
  };

  const removeLine = (index: number) => {
    if (value.length <= 1) return;
    onChange(value.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof DataValorItem, fieldValue: string) => {
    onChange(
      value.map((item, i) =>
        i === index ? { ...item, [field]: fieldValue } : item
      )
    );
  };

  const total = value.reduce((acc, item) => acc + parseValor(item.valor), 0);

  return (
    <div className={cn('space-y-2 min-w-0 pr-2', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <button
          type="button"
          onClick={addLine}
          className="text-sm text-emerald-600 hover:underline shrink-0"
        >
          {addLabel}
        </button>
      </div>
      <div className={cn('space-y-2 overflow-y-auto px-2 py-2 min-w-0', maxHeight)}>
        {value.map((item, i) => (
          <div
            key={i}
            className="relative z-0 grid w-full grid-cols-1 items-center gap-2 min-w-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
          >
            <input
              type="date"
              value={item.data}
              onChange={(e) => updateLine(i, 'data', e.target.value)}
              className={cn(inputBaseClass, 'w-full min-w-0')}
            />
            <input
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={item.valor}
              onChange={(e) => updateLine(i, 'valor', e.target.value)}
              className={cn(inputBaseClass, 'w-full min-w-0')}
            />
            <button
              type="button"
              onClick={() => removeLine(i)}
              disabled={value.length <= 1}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-400 shrink-0"
              title="Remover"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      {showTotal && (
        <p className="text-xs text-slate-500">
          Total: {formatTotal(total)}
          {value.length > 0 && (
            <span className="ml-1.5 text-slate-400">
              ({value.length} {value.length === 1 ? countLabel : `${countLabel}s`})
            </span>
          )}
        </p>
      )}
    </div>
  );
}
