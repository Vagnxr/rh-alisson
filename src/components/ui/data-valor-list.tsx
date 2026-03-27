import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CalendarBlank } from '@phosphor-icons/react';
import { formatDateStringToBR, formatDateToLocalYYYYMMDD } from '@/lib/date';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CurrencyInput } from '@/components/ui/currency-input';

export interface DataValorItem {
  data: string;
  valor: string;
  /** Quando true, desabilita os campos data e valor (ex.: parcela ja paga). */
  disabled?: boolean;
}

const inputBaseClass =
  'relative flex h-10 rounded-xl border border-input bg-transparent px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:z-10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50';

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
  /** Prefixo dos data-testid (ex.: "agenda" -> agenda-recorrencia, agenda-adicionar-valor). Default: "despesa-categoria". */
  testIdPrefix?: string;
  /** Aplica mascara de moeda BR no input de valor. */
  useCurrencyMaskOnValor?: boolean;
}

function parseValor(v: string): number {
  const s = String(v || '').trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function parseDateInput(value?: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
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
  testIdPrefix = 'despesa-categoria',
  useCurrencyMaskOnValor = false,
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
    <div className={cn('space-y-2 min-w-0 pr-2', className)} data-testid={`${testIdPrefix}-recorrencia`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <button
          type="button"
          onClick={addLine}
          className="text-sm text-primary hover:underline shrink-0"
          data-testid={`${testIdPrefix}-adicionar-valor`}
        >
          {addLabel}
        </button>
      </div>
      <div className={cn('space-y-2 overflow-y-auto px-2 py-2 min-w-0', maxHeight)}>
        {value.map((item, i) => {
          const isRowDisabled = !!item.disabled;
          return (
            <div
              key={i}
              className="relative z-0 grid w-full grid-cols-1 items-center gap-2 min-w-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
              data-testid={`${testIdPrefix}-recorrencia-linha`}
            >
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isRowDisabled}
                    className={cn(inputBaseClass, 'w-full min-w-0 justify-between px-3 font-normal')}
                    data-testid={`${testIdPrefix}-recorrencia-data`}
                  >
                    {item.data ? formatDateStringToBR(item.data) : 'Selecionar data'}
                    <CalendarBlank className="h-4 w-4 opacity-60" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={parseDateInput(item.data)}
                    onSelect={(date) => {
                      if (!date) return;
                      updateLine(i, 'data', formatDateToLocalYYYYMMDD(date));
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {useCurrencyMaskOnValor ? (
                <CurrencyInput
                  value={item.valor}
                  onChange={(valor) => updateLine(i, 'valor', valor)}
                  disabled={isRowDisabled}
                  className={cn(inputBaseClass, 'w-full min-w-0')}
                  testId={`${testIdPrefix}-recorrencia-valor`}
                />
              ) : (
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={item.valor}
                  onChange={(e) => updateLine(i, 'valor', e.target.value)}
                  disabled={isRowDisabled}
                  className={cn(inputBaseClass, 'w-full min-w-0')}
                  data-testid={`${testIdPrefix}-recorrencia-valor`}
                />
              )}
              <button
                type="button"
                onClick={() => removeLine(i)}
                disabled={value.length <= 1 || isRowDisabled}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground shrink-0"
                title={isRowDisabled ? 'Parcela paga não pode ser removida' : 'Remover'}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
      {showTotal && (
        <p className="text-xs text-muted-foreground">
          Total: {formatTotal(total)}
          {value.length > 0 && (
            <span className="ml-1.5 text-muted-foreground/60">
              ({value.length} {value.length === 1 ? countLabel : `${countLabel}s`})
            </span>
          )}
        </p>
      )}
    </div>
  );
}
