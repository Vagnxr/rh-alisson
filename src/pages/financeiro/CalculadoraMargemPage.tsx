import { useState, useMemo } from 'react';

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

  const custo = parseFloat(precoCusto.replace(',', '.')) || 0;
  const venda = parseFloat(precoVenda.replace(',', '.')) || 0;
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
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Calculadora de Margem</h1>
        <p className="mt-1 text-sm text-slate-500">
          Margem e markup a partir do custo e venda; ou descubra o preco de venda pela margem desejada.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Tabela 1: Margem e Markup */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-slate-800">Margem e Markup</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-[1fr_1fr] gap-2 text-sm">
              <label className="text-slate-600">Preco de custo (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={precoCusto}
                onChange={(e) => setPrecoCusto(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <label className="text-slate-600">Preco de venda (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={precoVenda}
                onChange={(e) => setPrecoVenda(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-slate-500">Preco de custo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-slate-500">Preco de venda</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-slate-500">Lucro</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-slate-500">Markup</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-slate-500">Margem</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900">{formatCurrency(custo)}</td>
                    <td className="px-3 py-2 font-medium text-slate-900">{formatCurrency(venda)}</td>
                    <td className="px-3 py-2 font-medium text-slate-900">{formatCurrency(lucro)}</td>
                    <td className="px-3 py-2">{formatPercent(markup)}</td>
                    <td className="px-3 py-2">{formatPercent(margem)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tabela 2: Descubra o preco de venda - Margem */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-slate-800">Descubra o preco de venda (margem)</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-[1fr_1fr] gap-2 text-sm">
              <label className="text-slate-600">Preco de custo (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={precoCusto}
                onChange={(e) => setPrecoCusto(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
              <label className="text-slate-600">Margem desejada (%)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={margemDesejada}
                onChange={(e) => setMargemDesejada(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 text-slate-900"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-slate-500">Preco de custo</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-slate-500">Margem desejada</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase text-slate-500">Preco de venda</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-slate-100">
                    <td className="px-3 py-2 font-medium text-slate-900">{formatCurrency(custo)}</td>
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
