import { useState, useMemo } from 'react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { parseValorFromInput } from '@/lib/formatValor';
import { PAGE_TITLE, PAGE_SUBTITLE } from '@/lib/uiClasses';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

export function CalculadoraMargemPage() {
  const [precoCusto, setPrecoCusto] = useState<string>('');
  const [precoVenda, setPrecoVenda] = useState<string>('');
  const [margemDesejada, setMargemDesejada] = useState<string>('');

  const custo = parseValorFromInput(precoCusto) || 0;
  const venda = parseValorFromInput(precoVenda) || 0;
  const margemDesejadaPct = parseFloat(margemDesejada.replace(',', '.')) || 0;

  const lucro = useMemo(() => (venda > 0 && custo >= 0 ? venda - custo : 0), [venda, custo]);
  const markup = useMemo(
    () => (custo > 0 && venda > 0 ? ((venda - custo) / custo) * 100 : 0),
    [custo, venda]
  );
  const margem = useMemo(
    () => (venda > 0 && custo >= 0 ? ((venda - custo) / venda) * 100 : 0),
    [venda, custo]
  );

  const precoVendaSugerido = useMemo(() => {
    if (custo <= 0 || margemDesejadaPct <= 0 || margemDesejadaPct >= 100) return 0;
    return custo / (1 - margemDesejadaPct / 100);
  }, [custo, margemDesejadaPct]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className={PAGE_TITLE}>Calculadora de Margem</h1>
        <p className={PAGE_SUBTITLE}>
          Margem e markup a partir do custo e venda; ou descubra o preco de venda pela margem desejada.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tabela 1: Margem e Markup */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border bg-muted px-4 py-2">
            <h2 className="text-sm font-semibold text-foreground">Margem e Markup</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-[1fr_1fr] gap-2 text-sm">
              <label className="text-muted-foreground">Preco de custo (R$)</label>
              <CurrencyInput
                value={precoCusto}
                onChange={setPrecoCusto}
                className="rounded-lg border border-input bg-background px-3 py-2 text-foreground"
              />
              <label className="text-muted-foreground">Preco de venda (R$)</label>
              <CurrencyInput
                value={precoVenda}
                onChange={setPrecoVenda}
                className="rounded-lg border border-input bg-background px-3 py-2 text-foreground"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Preco de custo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Preco de venda</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Lucro</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Markup</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 font-medium text-foreground">{formatCurrency(custo)}</td>
                    <td className="px-3 py-2 font-medium text-foreground">{formatCurrency(venda)}</td>
                    <td className="px-3 py-2 font-medium text-foreground">{formatCurrency(lucro)}</td>
                    <td className="px-3 py-2">{formatPercent(markup)}</td>
                    <td className="px-3 py-2">{formatPercent(margem)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tabela 2: Descubra o preco de venda - Margem */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border bg-muted px-4 py-2">
            <h2 className="text-sm font-semibold text-foreground">Descubra o preco de venda (margem)</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-[1fr_1fr] gap-2 text-sm">
              <label className="text-muted-foreground">Preco de custo (R$)</label>
              <CurrencyInput
                value={precoCusto}
                onChange={setPrecoCusto}
                className="rounded-lg border border-input bg-background px-3 py-2 text-foreground"
              />
              <label className="text-muted-foreground">Margem desejada (%)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={margemDesejada}
                onChange={(e) => setMargemDesejada(e.target.value)}
                className="rounded-lg border border-input bg-background px-3 py-2 text-foreground"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Preco de custo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Margem desejada</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Preco de venda</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border">
                    <td className="px-3 py-2 font-medium text-foreground">{formatCurrency(custo)}</td>
                    <td className="px-3 py-2">{margemDesejadaPct ? formatPercent(margemDesejadaPct) : '-'}</td>
                    <td className="px-3 py-2 font-semibold text-emerald-700">
                      {precoVendaSugerido > 0 ? formatCurrency(precoVendaSugerido) : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
