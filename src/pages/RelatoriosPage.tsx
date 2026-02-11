import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Store,
  FileText,
  Loader2,
} from 'lucide-react';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { formatDateToLocalYYYYMMDD } from '@/lib/date';
import { ExportButtons } from '@/components/ui/export-buttons';
import { cn } from '@/lib/cn';
import { useRelatoriosStore } from '@/stores/relatoriosStore';
import { useLojaStore } from '@/stores/lojaStore';

type TipoRelatorio =
  | 'despesas'
  | 'vendas'
  | 'lucro'
  | 'fluxo-caixa'
  | 'por-tipo'
  | 'por-loja'
  | 'comparativo';

interface RelatorioConfig {
  id: TipoRelatorio;
  titulo: string;
  descricao: string;
  icon: React.ElementType;
  cor: string;
}

const RELATORIOS: RelatorioConfig[] = [
  { id: 'despesas', titulo: 'Despesas por Categoria', descricao: 'Analise detalhada de todas as despesas', icon: TrendingDown, cor: 'bg-red-100 text-red-600' },
  { id: 'vendas', titulo: 'Vendas por Periodo', descricao: 'Evolucao das vendas ao longo do tempo', icon: TrendingUp, cor: 'bg-emerald-100 text-emerald-600' },
  { id: 'lucro', titulo: 'Lucro Liquido', descricao: 'Analise de lucratividade mensal', icon: DollarSign, cor: 'bg-blue-100 text-blue-600' },
  { id: 'fluxo-caixa', titulo: 'Fluxo de Caixa', descricao: 'Entradas e saidas consolidadas', icon: BarChart3, cor: 'bg-purple-100 text-purple-600' },
  { id: 'por-tipo', titulo: 'Por Tipo de Despesa', descricao: 'Distribuicao por tipo de gasto', icon: PieChart, cor: 'bg-amber-100 text-amber-600' },
  { id: 'por-loja', titulo: 'Por Loja', descricao: 'Comparativo entre unidades', icon: Store, cor: 'bg-cyan-100 text-cyan-600' },
  { id: 'comparativo', titulo: 'Comparativo Mensal', descricao: 'Comparacao mes a mes', icon: FileText, cor: 'bg-slate-100 text-slate-600' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function BarraHorizontal({
  label,
  valor,
  max,
  cor,
}: {
  label: string;
  valor: number;
  max: number;
  cor: string;
}) {
  const percentual = max > 0 ? (valor / max) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{formatCurrency(valor)}</span>
      </div>
      <div className="h-3 w-full rounded-full bg-slate-100">
        <div className={cn('h-3 rounded-full transition-all', cor)} style={{ width: `${percentual}%` }} />
      </div>
    </div>
  );
}

function GraficoBarras({
  dados,
  titulo,
}: {
  dados: { label: string; valor: number; valor2?: number }[];
  titulo: string;
}) {
  const max = dados.length ? Math.max(...dados.map((d) => Math.max(d.valor, d.valor2 || 0))) : 1;
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-700">{titulo}</h4>
      <div className="flex h-48 items-end justify-between gap-2">
        {dados.map((item, i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end gap-1">
              <div
                className="flex-1 rounded-t bg-emerald-500 transition-all"
                style={{ height: `${(item.valor / max) * 100}%` }}
                title={formatCurrency(item.valor)}
              />
              {item.valor2 !== undefined && (
                <div
                  className="flex-1 rounded-t bg-red-400 transition-all"
                  style={{ height: `${(item.valor2 / max) * 100}%` }}
                  title={formatCurrency(item.valor2)}
                />
              )}
            </div>
            <span className="text-xs text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-emerald-500" />
          <span className="text-slate-600">Entradas</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-red-400" />
          <span className="text-slate-600">Saidas</span>
        </div>
      </div>
    </div>
  );
}

function RelatorioCard({
  config,
  isSelected,
  onClick,
}: {
  config: RelatorioConfig;
  isSelected: boolean;
  onClick: () => void;
}) {
  const Icon = config.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all hover:shadow-md',
        isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'
      )}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', config.cor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-slate-900">{config.titulo}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{config.descricao}</p>
      </div>
    </button>
  );
}

export function RelatoriosPage() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('despesas');
  const [tipoFiltro, setTipoFiltro] = useState<string>('');

  const { lojaAtual } = useLojaStore();
  const {
    despesasPorCategoria,
    vendasPorPeriodo,
    fluxoCaixa,
    lucro,
    isLoading,
    error,
    fetchDespesasPorCategoria,
    fetchVendasPorPeriodo,
    fetchFluxoCaixa,
    fetchLucro,
  } = useRelatoriosStore();

  const filtros = useMemo(() => ({
    dataInicio: formatDateToLocalYYYYMMDD(dateFilter.startDate),
    dataFim: formatDateToLocalYYYYMMDD(dateFilter.endDate),
    lojaId: lojaAtual?.id,
  }), [dateFilter.startDate, dateFilter.endDate, lojaAtual?.id]);

  // Cards: buscar fluxo-caixa para totais
  useEffect(() => {
    fetchFluxoCaixa(filtros);
  }, [filtros.dataInicio, filtros.dataFim, filtros.lojaId, fetchFluxoCaixa]);

  // Grafico/tabela: buscar relatorio do tipo selecionado (apenas os 4 com endpoint)
  useEffect(() => {
    if (tipoRelatorio === 'despesas') fetchDespesasPorCategoria(filtros);
    else if (tipoRelatorio === 'vendas') fetchVendasPorPeriodo(filtros);
    else if (tipoRelatorio === 'fluxo-caixa') fetchFluxoCaixa(filtros);
    else if (tipoRelatorio === 'lucro') fetchLucro(filtros);
  }, [filtros.dataInicio, filtros.dataFim, filtros.lojaId, tipoRelatorio, fetchDespesasPorCategoria, fetchVendasPorPeriodo, fetchFluxoCaixa, fetchLucro]);

  const totalDespesas = useMemo(
    () => (fluxoCaixa?.itens ? fluxoCaixa.itens.reduce((acc, d) => acc + d.saidas, 0) : 0),
    [fluxoCaixa]
  );
  const totalVendas = useMemo(
    () => (fluxoCaixa?.itens ? fluxoCaixa.itens.reduce((acc, d) => acc + d.entradas, 0) : 0),
    [fluxoCaixa]
  );
  const lucroTotal = useMemo(() => totalVendas - totalDespesas, [totalVendas, totalDespesas]);
  const margemPercentual = totalVendas > 0 ? (lucroTotal / totalVendas) * 100 : 0;

  const despesasItens = despesasPorCategoria?.itens ?? [];
  const vendasItens = vendasPorPeriodo?.itens ?? [];
  const fluxoItens = fluxoCaixa?.itens ?? [];
  const lucroItens = lucro?.itens ?? [];

  const dadosExportacao = useMemo(() => {
    switch (tipoRelatorio) {
      case 'despesas':
        return despesasItens.map((d) => ({
          categoria: d.categoria,
          valor: formatCurrency(d.valor),
          percentual: `${d.percentual.toFixed(1)}%`,
        }));
      case 'vendas':
        return vendasItens.map((d) => ({ mes: d.mes, valor: formatCurrency(d.valor) }));
      case 'fluxo-caixa':
        return fluxoItens.map((d) => ({
          mes: d.mes,
          entradas: formatCurrency(d.entradas),
          saidas: formatCurrency(d.saidas),
          saldo: formatCurrency(d.entradas - d.saidas),
        }));
      default:
        return [];
    }
  }, [tipoRelatorio, despesasItens, vendasItens, fluxoItens]);

  const colunasExportacao = useMemo(() => {
    switch (tipoRelatorio) {
      case 'despesas':
        return [
          { key: 'categoria', label: 'Nome despesas' },
          { key: 'valor', label: 'Valor' },
          { key: 'percentual', label: 'Percentual' },
        ];
      case 'vendas':
        return [
          { key: 'mes', label: 'Mes' },
          { key: 'valor', label: 'Valor' },
        ];
      case 'fluxo-caixa':
        return [
          { key: 'mes', label: 'Mes' },
          { key: 'entradas', label: 'Entradas' },
          { key: 'saidas', label: 'Saidas' },
          { key: 'saldo', label: 'Saldo' },
        ];
      default:
        return [];
    }
  }, [tipoRelatorio]);

  const temDadosGrafico =
    tipoRelatorio === 'despesas'
      ? despesasItens.length > 0
      : tipoRelatorio === 'vendas'
        ? vendasItens.length > 0
        : tipoRelatorio === 'fluxo-caixa'
          ? fluxoItens.length > 0
          : tipoRelatorio === 'lucro'
            ? lucroItens.length > 0
            : false;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Relatorios</h1>
          <p className="mt-1 text-sm text-slate-500">Analise detalhada dos dados financeiros</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <select
            value={tipoFiltro}
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todos os Tipos</option>
            <option value="despesa-fixa">Despesa Fixa</option>
            <option value="despesa-extra">Despesa Extra</option>
            <option value="funcionario">Funcionario</option>
            <option value="imposto">Imposto</option>
          </select>
          <ExportButtons
            data={dadosExportacao}
            columns={colunasExportacao}
            filename={`relatorio-${tipoRelatorio}`}
            title={RELATORIOS.find((r) => r.id === tipoRelatorio)?.titulo || 'Relatorio'}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Despesas</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(totalDespesas)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total Vendas</p>
              <p className="text-lg font-bold text-slate-900">{formatCurrency(totalVendas)}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Lucro Liquido</p>
              <p className={cn('text-lg font-bold', lucroTotal >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                {formatCurrency(lucroTotal)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Margem</p>
              <p className="text-lg font-bold text-slate-900">{margemPercentual.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-slate-700">Selecione o Relatorio</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RELATORIOS.slice(0, 4).map((config) => (
            <RelatorioCard
              key={config.id}
              config={config}
              isSelected={tipoRelatorio === config.id}
              onClick={() => setTipoRelatorio(config.id)}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase text-slate-900">
            {RELATORIOS.find((r) => r.id === tipoRelatorio)?.titulo}
          </h3>

          {isLoading && !temDadosGrafico ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : tipoRelatorio === 'despesas' && despesasItens.length > 0 ? (
            <div className="space-y-4">
              {despesasItens.map((item, i) => (
                <BarraHorizontal
                  key={i}
                  label={item.categoria}
                  valor={item.valor}
                  max={despesasPorCategoria?.total ?? 1}
                  cor="bg-red-500"
                />
              ))}
            </div>
          ) : tipoRelatorio === 'vendas' && vendasItens.length > 0 ? (
            <GraficoBarras
              titulo="Evolucao Mensal"
              dados={vendasItens.map((d) => ({ label: d.mes, valor: d.valor }))}
            />
          ) : tipoRelatorio === 'fluxo-caixa' && fluxoItens.length > 0 ? (
            <GraficoBarras
              titulo="Fluxo de Caixa"
              dados={fluxoItens.map((d) => ({ label: d.mes, valor: d.entradas, valor2: d.saidas }))}
            />
          ) : tipoRelatorio === 'lucro' && lucroItens.length > 0 ? (
            <div className="space-y-4">
              {lucroItens.map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-sm text-slate-600">{item.mes}</span>
                  <div className="text-right">
                    <p className={cn('font-medium', item.lucro >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                      {formatCurrency(item.lucro)}
                    </p>
                    <p className="text-xs text-slate-500">{item.margemPercentual.toFixed(1)}% margem</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (tipoRelatorio === 'por-tipo' || tipoRelatorio === 'por-loja' || tipoRelatorio === 'comparativo') ? (
            <p className="text-sm text-slate-500">Relatorio em breve.</p>
          ) : (
            <p className="text-sm text-slate-500">Nenhum dado no periodo.</p>
          )}
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="bg-slate-900 px-4 py-3">
            <h3 className="text-sm font-semibold uppercase text-white">Detalhamento</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  {colunasExportacao.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dadosExportacao.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    {colunasExportacao.map((col) => (
                      <td key={col.key} className="px-4 py-3 text-sm text-slate-700">
                        {(row as Record<string, string>)[col.key]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {dadosExportacao.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-slate-500">Nenhum dado para exibir</div>
          )}
        </div>
      </div>
    </div>
  );
}
