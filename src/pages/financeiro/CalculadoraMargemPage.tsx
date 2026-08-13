import { useState, useMemo } from 'react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { NumberField } from '@/components/ui/number-field';
import { parseValorFromInput } from '@/lib/formatValor';
import { PAGE_TITLE, PAGE_SUBTITLE } from '@/lib/uiClasses';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Percentual no padrao brasileiro (virgula decimal), como o resto da tela. */
function formatPercent(value: number) {
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}%`;
}

const CARD_CLASS = 'rounded-xl border border-border bg-card text-card-foreground overflow-hidden';
const TH_CLASS = 'px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground';
const TD_CLASS = 'px-3 py-2 text-foreground';
const INPUT_CLASS = 'rounded-lg border border-input bg-background px-3 py-2 text-foreground';

/**
 * Card esquerdo: a partir de custo e venda, calcula lucro, markup e margem.
 *
 * Estado proprio — os dois cards da pagina sao independentes. Antes ambos
 * compartilhavam o mesmo `precoCusto`, entao digitar em um alterava o outro.
 */
function CardMargemMarkup() {
  const [precoCusto, setPrecoCusto] = useState('');
  const [precoVenda, setPrecoVenda] = useState('');

  const custo = parseValorFromInput(precoCusto) || 0;
  const venda = parseValorFromInput(precoVenda) || 0;

  const lucro = useMemo(() => (venda > 0 && custo >= 0 ? venda - custo : 0), [venda, custo]);
  const markup = useMemo(
    () => (custo > 0 && venda > 0 ? ((venda - custo) / custo) * 100 : 0),
    [custo, venda],
  );
  const margem = useMemo(
    () => (venda > 0 && custo >= 0 ? ((venda - custo) / venda) * 100 : 0),
    [venda, custo],
  );

  return (
    <div className={CARD_CLASS}>
      <div className="border-b border-border bg-muted px-4 py-2">
        <h2 className="text-sm font-semibold text-foreground">Margem e Markup</h2>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-[1fr_1fr] gap-2 text-sm">
          <label htmlFor="markup-custo" className="text-muted-foreground">
            Preco de custo (R$)
          </label>
          <CurrencyInput
            id="markup-custo"
            value={precoCusto}
            onChange={setPrecoCusto}
            className={INPUT_CLASS}
          />
          <label htmlFor="markup-venda" className="text-muted-foreground">
            Preco de venda (R$)
          </label>
          <CurrencyInput
            id="markup-venda"
            value={precoVenda}
            onChange={setPrecoVenda}
            className={INPUT_CLASS}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className={TH_CLASS}>Preco de custo</th>
                <th className={TH_CLASS}>Preco de venda</th>
                <th className={TH_CLASS}>Lucro</th>
                <th className={TH_CLASS}>Markup</th>
                <th className={TH_CLASS}>Margem</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className={`${TD_CLASS} font-medium`}>{formatCurrency(custo)}</td>
                <td className={`${TD_CLASS} font-medium`}>{formatCurrency(venda)}</td>
                <td className={`${TD_CLASS} font-medium`}>{formatCurrency(lucro)}</td>
                <td className={`${TD_CLASS} font-semibold`}>{formatPercent(markup)}</td>
                <td className={`${TD_CLASS} font-semibold`}>{formatPercent(margem)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Card direito: a partir de custo e margem desejada, calcula o preco de venda.
 * Estado proprio, independente do card esquerdo.
 */
function CardPrecoPorMargem() {
  const [precoCusto, setPrecoCusto] = useState('');
  const [margemDesejada, setMargemDesejada] = useState<number | undefined>(undefined);

  const custo = parseValorFromInput(precoCusto) || 0;
  const margemPct = margemDesejada ?? 0;

  const precoVendaSugerido = useMemo(() => {
    if (custo <= 0 || margemPct <= 0 || margemPct >= 100) return 0;
    return custo / (1 - margemPct / 100);
  }, [custo, margemPct]);

  return (
    <div className={CARD_CLASS}>
      <div className="border-b border-border bg-muted px-4 py-2">
        <h2 className="text-sm font-semibold text-foreground">Descubra o preco de venda (margem)</h2>
      </div>
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-[1fr_1fr] gap-2 text-sm">
          <label htmlFor="margem-custo" className="text-muted-foreground">
            Preco de custo (R$)
          </label>
          <CurrencyInput
            id="margem-custo"
            value={precoCusto}
            onChange={setPrecoCusto}
            className={INPUT_CLASS}
          />
          <label htmlFor="margem-desejada" className="text-muted-foreground">
            Margem desejada (%)
          </label>
          <NumberField
            id="margem-desejada"
            value={margemDesejada}
            onCommit={setMargemDesejada}
            min={0}
            max={99.99}
            allowEmpty
            placeholder="0,00"
            className="text-left"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className={TH_CLASS}>Preco de custo</th>
                <th className={TH_CLASS}>Margem desejada</th>
                <th className={TH_CLASS}>Preco de venda</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border">
                <td className={`${TD_CLASS} font-medium`}>{formatCurrency(custo)}</td>
                <td className={`${TD_CLASS} font-semibold`}>
                  {margemPct ? formatPercent(margemPct) : '-'}
                </td>
                <td className="px-3 py-2 font-semibold text-emerald-600 dark:text-emerald-400">
                  {precoVendaSugerido > 0 ? formatCurrency(precoVendaSugerido) : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function CalculadoraMargemPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className={PAGE_TITLE}>Calculadora de Margem</h1>
        <p className={PAGE_SUBTITLE}>
          Margem e markup a partir do custo e venda; ou descubra o preco de venda pela margem
          desejada. Os dois calculos sao independentes.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CardMargemMarkup />
        <CardPrecoPorMargem />
      </div>
    </div>
  );
}
