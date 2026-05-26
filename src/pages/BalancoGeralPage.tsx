import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Building2, Store, Loader2 } from 'lucide-react';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { useLojaStore } from '@/stores/lojaStore';
import { useBalancoStore } from '@/stores/balancoStore';
import type { Loja } from '@/types/loja';
import type { BalancoItem, BalancoSecao } from '@/types/balanco';
import { cn } from '@/lib/cn';
import { PAGE_TITLE } from '@/lib/uiClasses';

function safeNumber(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return value;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(safeNumber(value));
}

function formatPercent(value: number) {
  return `${safeNumber(value).toFixed(2)}%`;
}

// Agrupa items por descricao e retorna valores por loja
function agruparPorLoja(items: BalancoItem[], lojas: Loja[]): Map<string, Map<string, number>> {
  const grupos = new Map<string, Map<string, number>>();
  
  items.forEach((item) => {
    if (!grupos.has(item.descricao)) {
      grupos.set(item.descricao, new Map());
    }
    const lojaMap = grupos.get(item.descricao)!;
    const lojaId = item.lojaId || 'total';
    lojaMap.set(lojaId, (lojaMap.get(lojaId) || 0) + item.valor);
  });
  
  return grupos;
}

// Componente de tabela com suporte a multi-loja (lojas como colunas)
interface BalancoTableProps {
  titulo: string;
  items: BalancoItem[];
  total: number;
  showPercent?: boolean;
  showLoja?: boolean;
  valorTotalVendas?: number;
  lojas?: Loja[];
}

function BalancoTable({
  titulo,
  items,
  total,
  showPercent = true,
  showLoja = false,
  valorTotalVendas,
  lojas = [],
}: BalancoTableProps) {
  // Agrupa dados por loja se multi-loja
  const dadosAgrupados = useMemo(() => {
    if (!showLoja || lojas.length === 0) return null;
    return agruparPorLoja(items, lojas);
  }, [items, showLoja, lojas]);

  // Se multi-loja, renderiza com lojas como colunas
  if (showLoja && dadosAgrupados && lojas.length > 0) {
    // Calcula totais por loja
    const totaisPorLoja = new Map<string, number>();
    lojas.forEach((loja) => totaisPorLoja.set(loja.id, 0));
    
    dadosAgrupados.forEach((lojaMap) => {
      lojaMap.forEach((valor, lojaId) => {
        if (lojaId !== 'total') {
          totaisPorLoja.set(lojaId, (totaisPorLoja.get(lojaId) || 0) + valor);
        }
      });
    });

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="bg-muted px-4 py-2.5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{titulo}</h3>
          {valorTotalVendas && (
            <span className="text-xs text-muted-foreground">
              % sobre vendas: {formatCurrency(valorTotalVendas)}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                  Descricao
                </th>
                {lojas.map((loja) => (
                  <th key={loja.id} className="px-4 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                    <div className="flex items-center justify-end gap-1">
                      <Store className="h-3 w-3" />
                      {loja.apelido}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                  Total
                </th>
                {showPercent && (
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                    % Venda
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from(dadosAgrupados.entries()).map(([descricao, lojaMap], i) => {
                const totalItem = Array.from(lojaMap.values()).reduce((a, b) => a + b, 0);
                const percentual = valorTotalVendas ? (totalItem / valorTotalVendas) * 100 : 0;
                
                return (
                  <tr key={i} className="hover:bg-muted/40">
                    <td className="px-4 py-2.5 text-sm text-foreground">{descricao}</td>
                    {lojas.map((loja) => (
                      <td key={loja.id} className="px-4 py-2.5 text-sm text-right font-medium text-foreground">
                        {formatCurrency(lojaMap.get(loja.id) || 0)}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-sm text-right font-bold text-foreground">
                      {formatCurrency(totalItem)}
                    </td>
                    {showPercent && (
                      <td className="px-4 py-2.5 text-sm text-right font-medium text-muted-foreground">
                        {formatPercent(percentual)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-muted">
              <tr>
                <td className="px-4 py-2.5 text-sm font-semibold text-foreground">TOTAL</td>
                {lojas.map((loja) => (
                  <td key={loja.id} className="px-4 py-2.5 text-sm text-right font-bold text-foreground">
                    {formatCurrency(totaisPorLoja.get(loja.id) || 0)}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-sm text-right font-bold text-emerald-600">
                  {formatCurrency(total)}
                </td>
                {showPercent && (
                  <td className="px-4 py-2.5 text-sm text-right font-bold text-muted-foreground">
                    {valorTotalVendas ? formatPercent((total / valorTotalVendas) * 100) : '-'}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  // Renderizacao padrao (sem multi-loja)
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="bg-muted px-4 py-2.5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{titulo}</h3>
        {valorTotalVendas && (
          <span className="text-xs text-muted-foreground">
            % sobre vendas: {formatCurrency(valorTotalVendas)}
          </span>
        )}
      </div>
      <div className="divide-y divide-border overflow-x-auto">
        <div className="grid grid-cols-[1fr_100px_80px] gap-2 bg-muted px-4 py-2 text-xs font-medium uppercase text-muted-foreground min-w-[400px]">
          <div>Descricao</div>
          <div className="text-right">Valor</div>
          {showPercent && <div className="text-right">% Venda</div>}
        </div>
        {items.map((item, i) => {
          const percentual = valorTotalVendas ? (item.valor / valorTotalVendas) * 100 : safeNumber(item.percentual ?? 0);
          return (
            <div
              key={i}
              className="grid grid-cols-[1fr_100px_80px] gap-2 px-4 py-2.5 text-sm hover:bg-muted/40 min-w-[400px]"
            >
              <div className="text-foreground">{item.descricao}</div>
              <div className="text-right font-medium text-foreground">{formatCurrency(item.valor)}</div>
              {showPercent && (
                <div className="text-right font-medium text-muted-foreground">
                  {formatPercent(percentual)}
                </div>
              )}
            </div>
          );
        })}
        <div className="grid grid-cols-[1fr_100px_80px] gap-2 bg-muted px-4 py-2.5 text-sm font-semibold min-w-[400px]">
          <div className="text-foreground">TOTAL</div>
          <div className="text-right text-foreground">{formatCurrency(total)}</div>
          {showPercent && (
            <div className="text-right text-muted-foreground">
              {valorTotalVendas ? formatPercent((total / valorTotalVendas) * 100) : '-'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente de seletor de loja
interface LojaSelectorProps {
  lojas: Loja[];
  lojaAtual: string | null;
  onChange: (lojaId: string | null) => void;
}

function LojaSelector({ lojas, lojaAtual, onChange }: LojaSelectorProps) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-1">
      <button
        onClick={() => onChange(null)}
        className={cn(
          'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors',
          lojaAtual === null
            ? 'bg-emerald-600 text-white'
            : 'text-muted-foreground hover:bg-muted'
        )}
      >
        <Store className="h-4 w-4" />
        Todas
      </button>
      {lojas.map((loja) => (
        <button
          key={loja.id}
          onClick={() => onChange(loja.id)}
          className={cn(
            'rounded px-3 py-1.5 text-sm font-medium transition-colors',
            lojaAtual === loja.id
              ? 'bg-emerald-600 text-white'
              : 'text-muted-foreground hover:bg-muted'
          )}
        >
          {loja.apelido}
        </button>
      ))}
    </div>
  );
}

function getMesAnoFromFilter(dateFilter: DateFilterValue | undefined): { mes: number; ano: number } {
  const d = dateFilter?.startDate ?? new Date();
  return { mes: d.getMonth() + 1, ano: d.getFullYear() };
}

export function BalancoGeralPage() {
  const { lojas, isMultiLoja } = useLojaStore();
  const { balanco, isLoading, error, fetchBalanco } = useBalancoStore();
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [lojaFiltro, setLojaFiltro] = useState<string | null>(null);
  const [cardEntradaSaida, setCardEntradaSaida] = useState<'entrada' | 'saida'>('entrada');

  const { mes, ano } = useMemo(() => getMesAnoFromFilter(dateFilter), [dateFilter]);

  // Lojas sao carregadas pelo Header; aqui apenas usamos o store

  useEffect(() => {
    fetchBalanco({ mes, ano, lojaId: lojaFiltro ?? undefined });
  }, [fetchBalanco, mes, ano, lojaFiltro]);

  const filteredData = balanco;
  const totalVendas = filteredData?.vendas.total ?? 0;
  const totalEntrada =
    (filteredData?.mercadoriaEntrada.total ?? 0) + (filteredData?.ativoImobilizado.entrada ?? 0);
  const totalSaida =
    (filteredData?.despesas.total ?? 0) +
    (filteredData?.mercadoriaSaida.total ?? 0) +
    (filteredData?.ativoImobilizado.saida ?? 0);
  const resultado = filteredData
    ? filteredData.vendas.total - filteredData.despesas.total - totalEntrada
    : 0;

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className={PAGE_TITLE}>Balanco Mensal</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (isLoading && !balanco) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!filteredData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className={PAGE_TITLE}>Balanco Mensal</h1>
            <p className="mt-1 text-sm text-muted-foreground">Resumo financeiro consolidado do periodo</p>
          </div>
          <DateFilter value={dateFilter} onChange={setDateFilter} />
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground">
          Nenhum dado disponivel para o periodo. Ajuste o filtro de data.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Filtros + 4 cards fixos no scroll */}
      <div className="sticky top-0 z-10 -mx-4 -mt-4 bg-muted/40 px-4 pt-4 pb-4 sm:-mx-6 sm:px-6 sm:pt-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className={PAGE_TITLE}>Balanco Mensal</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Resumo financeiro consolidado do periodo
              {isMultiLoja && !lojaFiltro && ' - Todas as lojas'}
              {isMultiLoja && lojaFiltro && ` - ${lojas.find((l) => l.id === lojaFiltro)?.apelido}`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <DateFilter value={dateFilter} onChange={setDateFilter} />
            {isMultiLoja && (
              <LojaSelector lojas={lojas} lojaAtual={lojaFiltro} onChange={setLojaFiltro} />
            )}
          </div>
        </div>

        {/* Cards de Resumo (Faturamento, Despesas, Entrada/Saida, Resultado) */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Faturamento</p>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(filteredData.vendas.total)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Despesas</p>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(filteredData.despesas.total)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatPercent(filteredData.vendas.total ? (filteredData.despesas.total / filteredData.vendas.total) * 100 : 0)} das
                vendas
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted-foreground">Entrada / Saida</p>
                <div className="flex rounded-lg border border-border bg-muted/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setCardEntradaSaida('entrada')}
                    className={cn(
                      'rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
                      cardEntradaSaida === 'entrada'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setCardEntradaSaida('saida')}
                    className={cn(
                      'rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
                      cardEntradaSaida === 'saida'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Saida
                  </button>
                </div>
              </div>
              <p className="mt-1 text-lg font-bold text-foreground">
                {formatCurrency(cardEntradaSaida === 'entrada' ? totalEntrada : totalSaida)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Resultado</p>
              <p
                className={cn(
                  'text-lg font-bold',
                  resultado >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {formatCurrency(resultado)}
              </p>
              <p className="text-xs text-muted-foreground">
                Faturamento - Despesas - Entrada
              </p>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Secoes principais */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Despesas com % sobre vendas */}
        <BalancoTable
          titulo="Despesas"
          items={filteredData.despesas.items}
          total={filteredData.despesas.total}
          showLoja={isMultiLoja && !lojaFiltro}
          valorTotalVendas={filteredData.vendas.total}
          lojas={lojas}
        />

        {/* Vendas */}
        <BalancoTable
          titulo="Vendas"
          items={filteredData.vendas.items}
          total={filteredData.vendas.total}
          showLoja={isMultiLoja && !lojaFiltro}
          lojas={lojas}
        />
      </div>

      {/* Mercadoria */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="bg-muted px-4 py-2.5">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Mercadoria</h3>
        </div>
        <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-border">
          <div>
            <div className="bg-muted px-4 py-2 text-xs font-medium uppercase text-muted-foreground border-b border-border">
              Entrada
            </div>
            <div className="divide-y divide-border">
              {filteredData.mercadoriaEntrada.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-sm hover:bg-muted/40">
                  <div className="col-span-6 text-foreground">{item.descricao}</div>
                  <div className="col-span-3 text-right font-medium text-foreground">
                    {formatCurrency(item.valor)}
                  </div>
                  <div className="col-span-3 text-right text-muted-foreground">
                    {formatPercent(item.percentual)}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 bg-muted px-4 py-2.5 text-sm font-semibold">
                <div className="col-span-6 text-foreground">TOTAL</div>
                <div className="col-span-3 text-right text-foreground">
                  {formatCurrency(filteredData.mercadoriaEntrada.total)}
                </div>
                <div className="col-span-3 text-right text-muted-foreground">-</div>
              </div>
            </div>
          </div>
          <div>
            <div className="bg-muted px-4 py-2 text-xs font-medium uppercase text-muted-foreground border-b border-border">
              Saida
            </div>
            <div className="divide-y divide-border">
              {filteredData.mercadoriaSaida.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-sm hover:bg-muted/40">
                  <div className="col-span-6 text-foreground">{item.descricao}</div>
                  <div className="col-span-3 text-right font-medium text-foreground">
                    {formatCurrency(item.valor)}
                  </div>
                  <div className="col-span-3 text-right text-muted-foreground">
                    {formatPercent(item.percentual)}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 bg-muted px-4 py-2.5 text-sm font-semibold">
                <div className="col-span-6 text-foreground">TOTAL</div>
                <div className="col-span-3 text-right text-foreground">
                  {formatCurrency(filteredData.mercadoriaSaida.total)}
                </div>
                <div className="col-span-3 text-right text-muted-foreground">-</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards inferiores */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Ativo Imobilizado */}
        <div className="rounded-xl border border-border bg-card overflow-hidden sm:col-span-2">
          <div className="bg-muted px-4 py-2.5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Ativo Imobilizado
            </h3>
          </div>
          <div className="grid grid-cols-2 divide-x divide-border">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium uppercase text-muted-foreground">Entrada</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(filteredData.ativoImobilizado.entrada)}
              </p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium uppercase text-muted-foreground">Saida</span>
              </div>
              <p className="text-lg font-bold text-foreground">
                {formatCurrency(filteredData.ativoImobilizado.saida)}
              </p>
            </div>
          </div>
        </div>

        {/* Investimento */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="bg-muted px-4 py-2.5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Investimento</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium uppercase text-muted-foreground">Total</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(filteredData.investimento)}
            </p>
          </div>
        </div>

        {/* Renda Extra */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="bg-muted px-4 py-2.5">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Renda Extra</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium uppercase text-muted-foreground">Total</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(filteredData.rendaExtra)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
