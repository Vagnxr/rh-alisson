import { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Package, Building2 } from 'lucide-react';

// Mock data baseado na planilha
const mockBalanco = {
  mes: 'Janeiro',
  ano: 2026,
  valorTotal: 53340.0,

  despesas: {
    items: [
      { descricao: 'DESP - FIXA', valor: 3369.9, percentual: 6.32 },
      { descricao: 'DESP - EXTRA', valor: 1050.0, percentual: 1.97 },
      { descricao: 'DESP - FUNCIONARIO', valor: 7620.0, percentual: 14.29 },
      { descricao: 'DESP - IMPOSTO', valor: 3360.0, percentual: 6.3 },
      { descricao: 'DESP - PARCELAMENTO', valor: 1600.0, percentual: 3.0 },
      { descricao: 'DESP - VEICULO', valor: 1930.0, percentual: 3.62 },
      { descricao: 'DESP - BANCO', valor: 229.5, percentual: 0.43 },
      { descricao: 'DESP - SOCIOS', valor: 5000.0, percentual: 9.37 },
      { descricao: 'DESP - CARTOES - TAXAS', valor: 5066.16, percentual: 9.5 },
    ],
    total: 29225.56,
  },

  vendas: {
    items: [
      { descricao: 'DINHEIRO - DEPOSITO', valor: 51000.0, percentual: 95.61 },
      { descricao: 'DINHEIRO - SOBRA', valor: 300.0, percentual: 0.56 },
      { descricao: 'PAGAMENTO PDV', valor: 200.0, percentual: 0.37 },
      { descricao: 'PIX', valor: 100.0, percentual: 0.19 },
      { descricao: 'CREDITO', valor: 350.0, percentual: 0.66 },
      { descricao: 'DEBITO', valor: 800.0, percentual: 1.5 },
      { descricao: 'VOUCHER', valor: 140.0, percentual: 0.26 },
      { descricao: 'IFOOD', valor: 450.0, percentual: 0.84 },
    ],
    total: 53340.0,
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

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

interface BalancoTableProps {
  titulo: string;
  items: Array<{ descricao: string; valor: number; percentual: number }>;
  total: number;
  showPercent?: boolean;
}

function BalancoTable({ titulo, items, total, showPercent = true }: BalancoTableProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="bg-slate-900 px-4 py-2.5">
        <h3 className="text-sm font-semibold text-white uppercase tracking-wide">{titulo}</h3>
      </div>
      <div className="divide-y divide-slate-100">
        <div className="grid grid-cols-12 gap-2 bg-slate-100 px-4 py-2 text-xs font-medium uppercase text-slate-500">
          <div className="col-span-6">Descricao</div>
          <div className="col-span-3 text-right">Valor</div>
          {showPercent && <div className="col-span-3 text-right">%</div>}
        </div>
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-sm hover:bg-slate-50">
            <div className="col-span-6 text-slate-700">{item.descricao}</div>
            <div className="col-span-3 text-right font-medium text-slate-900">
              {formatCurrency(item.valor)}
            </div>
            {showPercent && (
              <div className="col-span-3 text-right text-slate-500">
                {formatPercent(item.percentual)}
              </div>
            )}
          </div>
        ))}
        <div className="grid grid-cols-12 gap-2 bg-slate-100 px-4 py-2.5 text-sm font-semibold">
          <div className="col-span-6 text-slate-900">TOTAL</div>
          <div className="col-span-3 text-right text-slate-900">
            {formatCurrency(total)}
          </div>
          {showPercent && <div className="col-span-3 text-right text-slate-500">-</div>}
        </div>
      </div>
    </div>
  );
}

export function BalancoGeralPage() {
  const [mesSelecionado] = useState(mockBalanco.mes);
  const [anoSelecionado] = useState(mockBalanco.ano);
  const data = mockBalanco;

  const lucroLiquido = data.valorTotal - data.despesas.total;
  const margemLucro = (lucroLiquido / data.valorTotal) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Balanco Mensal
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Resumo financeiro consolidado do periodo
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-900">
            {mesSelecionado} / {anoSelecionado}
          </span>
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
                {formatCurrency(data.valorTotal)}
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
                {formatCurrency(data.despesas.total)}
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
              <p className="text-lg font-bold text-emerald-600">
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
              <p className="text-lg font-bold text-slate-900">
                {formatPercent(margemLucro)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Secoes principais */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Despesas */}
        <BalancoTable
          titulo="Despesas"
          items={data.despesas.items}
          total={data.despesas.total}
        />

        {/* Vendas */}
        <BalancoTable
          titulo="Vendas"
          items={data.vendas.items}
          total={data.vendas.total}
        />
      </div>

      {/* Outros Valores */}
      <BalancoTable
        titulo="Outros Valores"
        items={data.outrosValores.items}
        total={data.outrosValores.total}
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
              {data.mercadoriaEntrada.items.map((item, i) => (
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
                  {formatCurrency(data.mercadoriaEntrada.total)}
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
              {data.mercadoriaSaida.items.map((item, i) => (
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
                  {formatCurrency(data.mercadoriaSaida.total)}
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
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">Ativo Imobilizado</h3>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-200">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-medium uppercase text-slate-500">Entrada</span>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(data.ativoImobilizado.entrada)}
              </p>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-red-600" />
                <span className="text-xs font-medium uppercase text-slate-500">Saida</span>
              </div>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(data.ativoImobilizado.saida)}
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
              {formatCurrency(data.investimento)}
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
              {formatCurrency(data.rendaExtra)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
