import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { api } from '@/lib/api';
import { dateFilterToParams } from '@/lib/financeiro-api';
import { ExportButtons } from '@/components/ui/export-buttons';
import type {
  VendaPerdaCreditoRow,
  VendaPerdaDebitoPixRow,
  VendaPerdaAlimRefRow,
  VendaPerdaFoodRow,
  VendaPerdaTotalCartoesRow,
  VendaPerdaPosAluguelRow,
  VendaPerdaPerdaTotalRow,
} from '@/types/financeiro';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const defaultCredito = (): VendaPerdaCreditoRow => ({ totalBruto: 0, descontos: 0, totalLiquido: 0 });
const defaultDebitoPix = (): VendaPerdaDebitoPixRow => ({ totalBruto: 0, descontos: 0, totalLiquido: 0 });
const defaultAlimRef = (): VendaPerdaAlimRefRow => ({ totalBruto: 0, descontos: 0, totalLiquido: 0 });
const defaultFood = (): VendaPerdaFoodRow => ({ totalBruto: 0, descontos: 0, totalLiquido: 0 });
const defaultTotalCartoes = (): VendaPerdaTotalCartoesRow => ({ valorBruto: 0, descontos: 0, totalLiquido: 0 });
const defaultPosAluguel = (): VendaPerdaPosAluguelRow => ({ valor: 0 });
const defaultPerdaTotal = (): VendaPerdaPerdaTotalRow => ({ valor: 0 });

export function VendaPerdaPage() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [loading, setLoading] = useState(true);
  const [credito, setCredito] = useState<VendaPerdaCreditoRow>(defaultCredito());
  const [debitoPix, setDebitoPix] = useState<VendaPerdaDebitoPixRow>(defaultDebitoPix());
  const [alimRef, setAlimRef] = useState<VendaPerdaAlimRefRow>(defaultAlimRef());
  const [food, setFood] = useState<VendaPerdaFoodRow>(defaultFood());
  const [totalCartoes, setTotalCartoes] = useState<VendaPerdaTotalCartoesRow>(defaultTotalCartoes());
  const [posAluguel, setPosAluguel] = useState<VendaPerdaPosAluguelRow>(defaultPosAluguel());
  const [perdaTotal, setPerdaTotal] = useState<VendaPerdaPerdaTotalRow>(defaultPerdaTotal());

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = dateFilterToParams(dateFilter);
    api
      .get<{
        credito?: VendaPerdaCreditoRow;
        debitoPix?: VendaPerdaDebitoPixRow;
        alimRef?: VendaPerdaAlimRefRow;
        food?: VendaPerdaFoodRow;
        totalCartoes?: VendaPerdaTotalCartoesRow;
        posAluguel?: VendaPerdaPosAluguelRow;
        perdaTotal?: VendaPerdaPerdaTotalRow;
      }>('financeiro/outras-funcoes/venda-perda', { params })
      .then((res) => {
        const d = res.data;
        if (d?.credito) setCredito(d.credito);
        if (d?.debitoPix) setDebitoPix(d.debitoPix);
        if (d?.alimRef) setAlimRef(d.alimRef);
        if (d?.food) setFood(d.food);
        if (d?.totalCartoes) setTotalCartoes(d.totalCartoes);
        if (d?.posAluguel) setPosAluguel(d.posAluguel);
        if (d?.perdaTotal) setPerdaTotal(d.perdaTotal);
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [dateFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportData = useMemo(
    () => [
      { tipo: 'Credito', totalBruto: formatCurrency(credito.totalBruto), descontos: formatCurrency(credito.descontos), totalLiquido: formatCurrency(credito.totalLiquido) },
      { tipo: 'Debito/PIX', totalBruto: formatCurrency(debitoPix.totalBruto), descontos: formatCurrency(debitoPix.descontos), totalLiquido: formatCurrency(debitoPix.totalLiquido) },
      { tipo: 'Alim/ref', totalBruto: formatCurrency(alimRef.totalBruto), descontos: formatCurrency(alimRef.descontos), totalLiquido: formatCurrency(alimRef.totalLiquido) },
      { tipo: 'Food', totalBruto: formatCurrency(food.totalBruto), descontos: formatCurrency(food.descontos), totalLiquido: formatCurrency(food.totalLiquido) },
      { tipo: 'Total cartoes', totalBruto: formatCurrency(totalCartoes.valorBruto), descontos: formatCurrency(totalCartoes.descontos), totalLiquido: formatCurrency(totalCartoes.totalLiquido) },
      { tipo: 'POS aluguel', valor: formatCurrency(posAluguel.valor) },
      { tipo: 'Perda total', valor: formatCurrency(perdaTotal.valor) },
    ],
    [credito, debitoPix, alimRef, food, totalCartoes, posAluguel, perdaTotal]
  );

  function renderTabelaCreditoDebito(
    titulo: string,
    row: VendaPerdaCreditoRow | VendaPerdaDebitoPixRow | VendaPerdaAlimRefRow
  ) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
          <h2 className="text-sm font-semibold text-slate-800">{titulo}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Total bruto</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Descontos</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Total liquido</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">{formatCurrency(row.totalBruto)}</td>
                <td className="px-4 py-3 text-right text-sm text-slate-700">{formatCurrency(row.descontos)}</td>
                <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrency(row.totalLiquido)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Outras funcoes – Venda e perda</h1>
          <p className="mt-1 text-sm text-slate-500">
            Resumo por tipo: credito, debito/PIX, alim/ref, food, total cartoes, POS aluguel e perda total.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={exportData}
            columns={[
              { key: 'tipo', label: 'Tipo' },
              { key: 'totalBruto', label: 'Total bruto' },
              { key: 'descontos', label: 'Descontos' },
              { key: 'totalLiquido', label: 'Total liquido' },
              { key: 'valor', label: 'Valor' },
            ]}
            filename="venda-perda"
            title="Venda e perda"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {renderTabelaCreditoDebito('Credito', credito)}
          {renderTabelaCreditoDebito('Debito/PIX', debitoPix)}
          {renderTabelaCreditoDebito('Alim/ref', alimRef)}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
              <h2 className="text-sm font-semibold text-slate-800">Tabela 4 – Food</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[280px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Total bruto</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Descontos</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Total liquido</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Via loja</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{formatCurrency(food.totalBruto)}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">{formatCurrency(food.descontos)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrency(food.totalLiquido)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{food.viaLoja ?? '-'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
              <h2 className="text-sm font-semibold text-slate-800">Tabela 5 – Total cartoes</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[280px]">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Valor bruto</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Descontos</th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Total liquido</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{formatCurrency(totalCartoes.valorBruto)}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">{formatCurrency(totalCartoes.descontos)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrency(totalCartoes.totalLiquido)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
              <h2 className="text-sm font-semibold text-slate-800">Tabela 6 – POS aluguel</h2>
            </div>
            <div className="p-4">
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(posAluguel.valor)}</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
              <h2 className="text-sm font-semibold text-slate-800">Tabela 7 – Perda total</h2>
            </div>
            <div className="p-4">
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(perdaTotal.valor)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
