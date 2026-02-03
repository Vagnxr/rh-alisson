import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, Building2, Store, Filter } from 'lucide-react';
import { DateFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { useLojaStore } from '@/stores/lojaStore';
import type { Loja } from '@/types/loja';
import { cn } from '@/lib/cn';

// Tipos para o balanco
interface BalancoItem {
  descricao: string;
  valor: number;
  percentual: number;
  lojaId?: string;
  lojaNome?: string;
}

interface BalancoSecao {
  items: BalancoItem[];
  total: number;
}

interface MockBalancoData {
  mes: string;
  ano: number;
  valorTotal: number;
  despesas: BalancoSecao;
  vendas: BalancoSecao;
  outrosValores: BalancoSecao;
  mercadoriaEntrada: BalancoSecao;
  mercadoriaSaida: BalancoSecao;
  ativoImobilizado: { entrada: number; saida: number };
  investimento: number;
  rendaExtra: number;
}

// Mock data baseado na planilha - COM SUPORTE A MULTI-LOJA
function getMockBalanco(isMultiLoja: boolean): MockBalancoData {
  const baseItems = [
    { descricao: 'DESP - FIXA', valor: 3369.9, percentual: 6.32 },
    { descricao: 'DESP - EXTRA', valor: 1050.0, percentual: 1.97 },
    { descricao: 'DESP - FUNCIONARIO', valor: 7620.0, percentual: 14.29 },
    { descricao: 'DESP - IMPOSTO', valor: 3360.0, percentual: 6.3 },
    { descricao: 'DESP - PARCELAMENTO', valor: 1600.0, percentual: 3.0 },
    { descricao: 'DESP - VEICULO', valor: 1930.0, percentual: 3.62 },
    { descricao: 'DESP - BANCO', valor: 229.5, percentual: 0.43 },
    { descricao: 'DESP - SOCIOS', valor: 5000.0, percentual: 9.37 },
    { descricao: 'DESP - CARTOES - TAXAS', valor: 5066.16, percentual: 9.5 },
  ];

  // Se multi-loja, adiciona loja a cada item
  const despesasItems = isMultiLoja
    ? [
        ...baseItems.map((item) => ({ ...item, lojaId: 'loja-1', lojaNome: 'Loja Centro' })),
        ...baseItems.map((item) => ({
          ...item,
          valor: item.valor * 0.7,
          lojaId: 'loja-2',
          lojaNome: 'Loja Shopping',
        })),
      ]
    : baseItems;

  const vendasItems = isMultiLoja
    ? [
        { descricao: 'DINHEIRO - DEPOSITO', valor: 30000.0, percentual: 56.24, lojaId: 'loja-1', lojaNome: 'Loja Centro' },
        { descricao: 'PIX', valor: 5000.0, percentual: 9.37, lojaId: 'loja-1', lojaNome: 'Loja Centro' },
        { descricao: 'CREDITO', valor: 3000.0, percentual: 5.62, lojaId: 'loja-1', lojaNome: 'Loja Centro' },
        { descricao: 'DEBITO', valor: 2000.0, percentual: 3.75, lojaId: 'loja-1', lojaNome: 'Loja Centro' },
        { descricao: 'DINHEIRO - DEPOSITO', valor: 21000.0, percentual: 39.37, lojaId: 'loja-2', lojaNome: 'Loja Shopping' },
        { descricao: 'PIX', valor: 3000.0, percentual: 5.62, lojaId: 'loja-2', lojaNome: 'Loja Shopping' },
        { descricao: 'CREDITO', valor: 2000.0, percentual: 3.75, lojaId: 'loja-2', lojaNome: 'Loja Shopping' },
        { descricao: 'DEBITO', valor: 1340.0, percentual: 2.51, lojaId: 'loja-2', lojaNome: 'Loja Shopping' },
      ]
    : [
        { descricao: 'DINHEIRO - DEPOSITO', valor: 51000.0, percentual: 95.61 },
        { descricao: 'DINHEIRO - SOBRA', valor: 300.0, percentual: 0.56 },
        { descricao: 'PAGAMENTO PDV', valor: 200.0, percentual: 0.37 },
        { descricao: 'PIX', valor: 100.0, percentual: 0.19 },
        { descricao: 'CREDITO', valor: 350.0, percentual: 0.66 },
        { descricao: 'DEBITO', valor: 800.0, percentual: 1.5 },
        { descricao: 'VOUCHER', valor: 140.0, percentual: 0.26 },
        { descricao: 'IFOOD', valor: 450.0, percentual: 0.84 },
      ];

  const totalDespesas = despesasItems.reduce((acc, item) => acc + item.valor, 0);
  const totalVendas = vendasItems.reduce((acc, item) => acc + item.valor, 0);

  // Recalcula percentuais baseado no total de vendas
  const despesasComPercentual = despesasItems.map((item) => ({
    ...item,
    percentual: (item.valor / totalVendas) * 100,
  }));

  const vendasComPercentual = vendasItems.map((item) => ({
    ...item,
    percentual: (item.valor / totalVendas) * 100,
  }));

  return {
    mes: 'Janeiro',
    ano: 2026,
    valorTotal: totalVendas,
    despesas: {
      items: despesasComPercentual,
      total: totalDespesas,
    },
    vendas: {
      items: vendasComPercentual,
      total: totalVendas,
    },
    outrosValores: {
      items: [
        { descricao: 'DESC. IFOOD', valor: 0, percentual: 0 },
        { descricao: 'DESC. LOJISTA', valor: 0, percentual: 0 },
        { descricao: 'DESC. SOCIOS', valor: 0, percentual: 0 },
      ],
      total: 0,
    },
    mercadoriaEntrada: {
      items: [
        { descricao: 'INDUSTRIALIZACAO', valor: 0, percentual: 0 },
        { descricao: 'COMERCIALIZACAO', valor: 0, percentual: 0 },
        { descricao: 'EMBALAGEM', valor: 0, percentual: 0 },
        { descricao: 'MATERIAL USO/CONS', valor: 0, percentual: 0 },
        { descricao: 'MERCADORIA USO/CONS', valor: 0, percentual: 0 },
        { descricao: 'GAS', valor: 0, percentual: 0 },
      ],
      total: 0,
    },
    mercadoriaSaida: {
      items: [
        { descricao: 'INDUSTRIALIZACAO', valor: 0, percentual: 0 },
        { descricao: 'COMERCIALIZACAO', valor: 0, percentual: 0 },
        { descricao: 'EMBALAGEM', valor: 0, percentual: 0 },
        { descricao: 'MATERIAL USO/CONS', valor: 0, percentual: 0 },
        { descricao: 'MERCADORIA USO/CONS', valor: 0, percentual: 0 },
        { descricao: 'GAS', valor: 0, percentual: 0 },
      ],
      total: 0,
    },
    ativoImobilizado: {
      entrada: 10000.0,
      saida: 5000.0,
    },
    investimento: 10500.0,
    rendaExtra: 4550.0,
  };
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
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
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">{titulo}</h3>
          {valorTotalVendas && (
            <span className="text-xs text-slate-400">
              % sobre vendas: {formatCurrency(valorTotalVendas)}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-slate-500">
                  Descricao
                </th>
                {lojas.map((loja) => (
                  <th key={loja.id} className="px-4 py-2 text-right text-xs font-medium uppercase text-slate-500">
                    <div className="flex items-center justify-end gap-1">
                      <Store className="h-3 w-3" />
                      {loja.apelido}
                    </div>
                  </th>
                ))}
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-slate-500">
                  Total
                </th>
                {showPercent && (
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase text-slate-500">
                    % Venda
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from(dadosAgrupados.entries()).map(([descricao, lojaMap], i) => {
                const totalItem = Array.from(lojaMap.values()).reduce((a, b) => a + b, 0);
                const percentual = valorTotalVendas ? (totalItem / valorTotalVendas) * 100 : 0;
                
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-sm text-slate-700">{descricao}</td>
                    {lojas.map((loja) => (
                      <td key={loja.id} className="px-4 py-2.5 text-sm text-right font-medium text-slate-900">
                        {formatCurrency(lojaMap.get(loja.id) || 0)}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 text-sm text-right font-bold text-slate-900">
                      {formatCurrency(totalItem)}
                    </td>
                    {showPercent && (
                      <td className="px-4 py-2.5 text-sm text-right font-medium text-slate-600">
                        {formatPercent(percentual)}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100">
              <tr>
                <td className="px-4 py-2.5 text-sm font-semibold text-slate-900">TOTAL</td>
                {lojas.map((loja) => (
                  <td key={loja.id} className="px-4 py-2.5 text-sm text-right font-bold text-slate-900">
                    {formatCurrency(totaisPorLoja.get(loja.id) || 0)}
                  </td>
                ))}
                <td className="px-4 py-2.5 text-sm text-right font-bold text-emerald-600">
                  {formatCurrency(total)}
                </td>
                {showPercent && (
                  <td className="px-4 py-2.5 text-sm text-right font-bold text-slate-600">
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
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">{titulo}</h3>
        {valorTotalVendas && (
          <span className="text-xs text-slate-400">
            % sobre vendas: {formatCurrency(valorTotalVendas)}
          </span>
        )}
      </div>
      <div className="divide-y divide-slate-100 overflow-x-auto">
        <div className="grid grid-cols-[1fr_100px_80px] gap-2 bg-slate-100 px-4 py-2 text-xs font-medium uppercase text-slate-500 min-w-[400px]">
          <div>Descricao</div>
          <div className="text-right">Valor</div>
          {showPercent && <div className="text-right">% Venda</div>}
        </div>
        {items.map((item, i) => {
          const percentual = valorTotalVendas ? (item.valor / valorTotalVendas) * 100 : item.percentual;
          return (
            <div
              key={i}
              className="grid grid-cols-[1fr_100px_80px] gap-2 px-4 py-2.5 text-sm hover:bg-slate-50 min-w-[400px]"
            >
              <div className="text-slate-700">{item.descricao}</div>
              <div className="text-right font-medium text-slate-900">{formatCurrency(item.valor)}</div>
              {showPercent && (
                <div className="text-right font-medium text-slate-600">
                  {formatPercent(percentual)}
                </div>
              )}
            </div>
          );
        })}
        <div className="grid grid-cols-[1fr_100px_80px] gap-2 bg-slate-100 px-4 py-2.5 text-sm font-semibold min-w-[400px]">
          <div className="text-slate-900">TOTAL</div>
          <div className="text-right text-slate-900">{formatCurrency(total)}</div>
          {showPercent && (
            <div className="text-right text-slate-600">
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
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1">
      <button
        onClick={() => onChange(null)}
        className={cn(
          'flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors',
          lojaAtual === null
            ? 'bg-emerald-600 text-white'
            : 'text-slate-600 hover:bg-slate-100'
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
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          {loja.apelido}
        </button>
      ))}
    </div>
  );
}

export function BalancoGeralPage() {
  const { lojas, isMultiLoja, fetchLojas, lojaAtual, setLojaAtual } = useLojaStore();
  const [dateFilter, setDateFilter] = useState<DateFilterValue>();
  const [lojaFiltro, setLojaFiltro] = useState<string | null>(null);

  useEffect(() => {
    fetchLojas();
  }, [fetchLojas]);

  const data = useMemo(() => getMockBalanco(isMultiLoja), [isMultiLoja]);

  // Filtra items por loja se necessario
  const filteredData = useMemo(() => {
    if (!lojaFiltro || !isMultiLoja) return data;

    return {
      ...data,
      despesas: {
        ...data.despesas,
        items: data.despesas.items.filter((item) => item.lojaId === lojaFiltro),
        total: data.despesas.items
          .filter((item) => item.lojaId === lojaFiltro)
          .reduce((acc, item) => acc + item.valor, 0),
      },
      vendas: {
        ...data.vendas,
        items: data.vendas.items.filter((item) => item.lojaId === lojaFiltro),
        total: data.vendas.items
          .filter((item) => item.lojaId === lojaFiltro)
          .reduce((acc, item) => acc + item.valor, 0),
      },
    };
  }, [data, lojaFiltro, isMultiLoja]);

  const lucroLiquido = filteredData.vendas.total - filteredData.despesas.total;
  const margemLucro =
    filteredData.vendas.total > 0 ? (lucroLiquido / filteredData.vendas.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Balanco Mensal</h1>
          <p className="mt-1 text-sm text-slate-500">
            Resumo financeiro consolidado do periodo
            {isMultiLoja && !lojaFiltro && ' - Todas as lojas'}
            {isMultiLoja && lojaFiltro && ` - ${lojas.find((l) => l.id === lojaFiltro)?.apelido}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filtro de data */}
          <DateFilter value={dateFilter} onChange={setDateFilter} />

          {/* Seletor de loja (apenas se multi-loja) */}
          {isMultiLoja && (
            <LojaSelector
              lojas={lojas}
              lojaAtual={lojaFiltro}
              onChange={setLojaFiltro}
            />
          )}
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Faturamento</p>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(filteredData.vendas.total)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <TrendingDown className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Despesas</p>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(filteredData.despesas.total)}
              </p>
              <p className="text-xs text-slate-500">
                {formatPercent((filteredData.despesas.total / filteredData.vendas.total) * 100 || 0)} das
                vendas
              </p>
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
              <p
                className={cn(
                  'text-lg font-bold',
                  lucroLiquido >= 0 ? 'text-emerald-600' : 'text-red-600'
                )}
              >
                {formatCurrency(lucroLiquido)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Margem</p>
              <p
                className={cn(
                  'text-lg font-bold',
                  margemLucro >= 20
                    ? 'text-emerald-600'
                    : margemLucro >= 10
                      ? 'text-amber-600'
                      : 'text-red-600'
                )}
              >
                {formatPercent(margemLucro)}
              </p>
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

      {/* Outros Valores */}
      <BalancoTable
        titulo="Outros Valores"
        items={filteredData.outrosValores.items}
        total={filteredData.outrosValores.total}
      />

      {/* Mercadoria */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-slate-900 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Mercadoria</h3>
        </div>
        <div className="grid gap-0 lg:grid-cols-2 lg:divide-x lg:divide-slate-200">
          <div>
            <div className="bg-slate-100 px-4 py-2 text-xs font-medium uppercase text-slate-500 border-b border-slate-200">
              Entrada
            </div>
            <div className="divide-y divide-slate-100">
              {filteredData.mercadoriaEntrada.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">
                  <div className="col-span-6 text-slate-700">{item.descricao}</div>
                  <div className="col-span-3 text-right font-medium text-slate-900">
                    {formatCurrency(item.valor)}
                  </div>
                  <div className="col-span-3 text-right text-slate-500">
                    {formatPercent(item.percentual)}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 bg-slate-100 px-4 py-2.5 text-sm font-semibold">
                <div className="col-span-6 text-slate-900">TOTAL</div>
                <div className="col-span-3 text-right text-slate-900">
                  {formatCurrency(filteredData.mercadoriaEntrada.total)}
                </div>
                <div className="col-span-3 text-right text-slate-500">-</div>
              </div>
            </div>
          </div>
          <div>
            <div className="bg-slate-100 px-4 py-2 text-xs font-medium uppercase text-slate-500 border-b border-slate-200">
              Saida
            </div>
            <div className="divide-y divide-slate-100">
              {filteredData.mercadoriaSaida.items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">
                  <div className="col-span-6 text-slate-700">{item.descricao}</div>
                  <div className="col-span-3 text-right font-medium text-slate-900">
                    {formatCurrency(item.valor)}
                  </div>
                  <div className="col-span-3 text-right text-slate-500">
                    {formatPercent(item.percentual)}
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-12 gap-2 bg-slate-100 px-4 py-2.5 text-sm font-semibold">
                <div className="col-span-6 text-slate-900">TOTAL</div>
                <div className="col-span-3 text-right text-slate-900">
                  {formatCurrency(filteredData.mercadoriaSaida.total)}
                </div>
                <div className="col-span-3 text-right text-slate-500">-</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards inferiores */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Ativo Imobilizado */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden sm:col-span-2">
          <div className="bg-slate-900 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
              Ativo Imobilizado
            </h3>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-200">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium uppercase text-slate-500">Entrada</span>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(filteredData.ativoImobilizado.entrada)}
              </p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium uppercase text-slate-500">Saida</span>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(filteredData.ativoImobilizado.saida)}
              </p>
            </div>
          </div>
        </div>

        {/* Investimento */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="bg-slate-900 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Investimento</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium uppercase text-slate-500">Total</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {formatCurrency(filteredData.investimento)}
            </p>
          </div>
        </div>

        {/* Renda Extra */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="bg-slate-900 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Renda Extra</h3>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="text-xs font-medium uppercase text-slate-500">Total</span>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {formatCurrency(filteredData.rendaExtra)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
