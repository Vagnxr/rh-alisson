import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/cn';

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
          {Math.abs(change)}%
        </span>
        <span className="text-sm text-slate-400">vs mes anterior</span>
      </div>
    </div>
  );
}

const stats: StatCardProps[] = [
  {
    label: 'Receita Total',
    value: 'R$ 45.230,00',
    change: 12.5,
    icon: TrendingUp,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
  },
  {
    label: 'Despesas',
    value: 'R$ 28.450,00',
    change: -3.2,
    icon: TrendingDown,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
  },
  {
    label: 'Saldo Atual',
    value: 'R$ 16.780,00',
    change: 8.1,
    icon: DollarSign,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    label: 'Investimentos',
    value: 'R$ 32.100,00',
    change: 5.4,
    icon: Wallet,
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
];

interface Transaction {
  id: string;
  description: string;
  category: string;
  value: number;
  date: string;
  type: 'income' | 'expense';
}

const recentTransactions: Transaction[] = [
  {
    id: '1',
    description: 'Aluguel Loja Centro',
    category: 'Despesa Fixa',
    value: -3500,
    date: '13/01/2026',
    type: 'expense',
  },
  {
    id: '2',
    description: 'Venda Produtos',
    category: 'Receita',
    value: 12500,
    date: '12/01/2026',
    type: 'income',
  },
  {
    id: '3',
    description: 'Folha Pagamento',
    category: 'Funcionarios',
    value: -8200,
    date: '10/01/2026',
    type: 'expense',
  },
  {
    id: '4',
    description: 'Servico Consultoria',
    category: 'Renda Extra',
    value: 4500,
    date: '08/01/2026',
    type: 'income',
  },
  {
    id: '5',
    description: 'Conta de Luz',
    category: 'Despesa Fixa',
    value: -890,
    date: '05/01/2026',
    type: 'expense',
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Math.abs(value));
}

export function DashboardPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Titulo */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Visao geral das suas financas
        </p>
      </div>

      {/* Cards de Estatisticas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Transacoes Recentes */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3 sm:px-6 sm:py-4">
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">
            Transacoes Recentes
          </h2>
        </div>

        {/* Tabela Desktop */}
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
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {tx.description}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {tx.category}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {tx.date}
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

        {/* Lista Mobile */}
        <div className="divide-y divide-slate-200 sm:hidden">
          {recentTransactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {tx.description}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {tx.category} - {tx.date}
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
      </div>
    </div>
  );
}
