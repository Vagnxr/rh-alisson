import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { formatDateToLocalYYYYMMDD } from '@/lib/date';
import { useDashboardStore } from '@/stores/dashboardStore';
import { useLojaStore } from '@/stores/lojaStore';

interface StatCardProps {
  label: string;
  value: string;
  change: number;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

function StatCard({
  label,
  value,
  change,
  icon: Icon,
  iconColor,
  iconBg,
}: StatCardProps) {
  const isPositive = change >= 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-slate-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-slate-900 sm:mt-2 sm:text-2xl">
            {value}
          </p>
        </div>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12',
            iconBg
          )}
        >
          <Icon className={cn('h-5 w-5 sm:h-6 sm:w-6', iconColor)} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 sm:mt-4">
        {isPositive ? (
          <ArrowUpRight className="h-4 w-4 text-emerald-500" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-red-500" />
        )}
        <span
          className={cn(
            'text-sm font-medium',
            isPositive ? 'text-emerald-500' : 'text-red-500'
          )}
        >
          {Math.abs(change).toFixed(1)}%
        </span>
        <span className="text-sm text-slate-400">vs mes anterior</span>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Math.abs(value));
}

function formatDateDisplay(iso: string): string {
  const [y, m, day] = iso.split('-');
  return `${day}/${m}/${y}`;
}

export function DashboardPage() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const { resumo, transacoes, isLoadingResumo, isLoadingTransacoes, errorResumo, errorTransacoes, fetchAll } =
    useDashboardStore();
  const { lojaAtual } = useLojaStore();

  const filtros = useMemo(() => ({
    dataInicio: formatDateToLocalYYYYMMDD(dateFilter.startDate),
    dataFim: formatDateToLocalYYYYMMDD(dateFilter.endDate),
    lojaId: lojaAtual?.id,
  }), [dateFilter.startDate, dateFilter.endDate, lojaAtual?.id]);

  useEffect(() => {
    fetchAll(filtros);
  }, [fetchAll, filtros.dataInicio, filtros.dataFim, filtros.lojaId]);

  const stats = useMemo(() => {
    if (!resumo) return null;
    return [
      {
        label: 'Receita Total',
        value: formatCurrency(resumo.receitaTotal.valor),
        change: resumo.receitaTotal.variacaoPercentual,
        icon: TrendingUp,
        iconColor: 'text-emerald-600',
        iconBg: 'bg-emerald-50',
      },
      {
        label: 'Despesas',
        value: formatCurrency(resumo.despesas.valor),
        change: resumo.despesas.variacaoPercentual,
        icon: TrendingDown,
        iconColor: 'text-red-600',
        iconBg: 'bg-red-50',
      },
      {
        label: 'Saldo Atual',
        value: formatCurrency(resumo.saldoAtual.valor),
        change: resumo.saldoAtual.variacaoPercentual,
        icon: DollarSign,
        iconColor: 'text-blue-600',
        iconBg: 'bg-blue-50',
      },
      {
        label: 'Investimentos',
        value: formatCurrency(resumo.investimentos.valor),
        change: resumo.investimentos.variacaoPercentual,
        icon: Wallet,
        iconColor: 'text-purple-600',
        iconBg: 'bg-purple-50',
      },
    ];
  }, [resumo]);

  const isLoading = isLoadingResumo || isLoadingTransacoes;
  const hasError = errorResumo || errorTransacoes;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Visao geral das suas financas
          </p>
        </div>
        <DateFilter value={dateFilter} onChange={setDateFilter} />
      </div>

      {hasError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorResumo || errorTransacoes}
        </div>
      )}

      {isLoading && !resumo && !transacoes.length ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {stats?.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
              <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
                Transacoes Recentes
              </h2>
            </div>

            {isLoadingTransacoes && transacoes.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : transacoes.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-slate-500">
                Nenhuma transacao no periodo
              </div>
            ) : (
              <>
                <div className="hidden sm:block">
                  <table className="w-full">
                    <thead className="border-b border-slate-200 bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Descricao
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                          Data
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {transacoes.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                            {tx.description}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                            {tx.category}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                            {formatDateDisplay(tx.date)}
                          </td>
                          <td
                            className={cn(
                              'whitespace-nowrap px-6 py-4 text-right text-sm font-medium',
                              tx.type === 'income'
                                ? 'text-emerald-600'
                                : 'text-red-600'
                            )}
                          >
                            {tx.type === 'income' ? '+' : '-'}
                            {formatCurrency(tx.value)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="divide-y divide-slate-200 sm:hidden">
                  {transacoes.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {tx.description}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {tx.category} - {formatDateDisplay(tx.date)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'ml-4 text-sm font-semibold',
                          tx.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                        )}
                      >
                        {tx.type === 'income' ? '+' : '-'}
                        {formatCurrency(tx.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
