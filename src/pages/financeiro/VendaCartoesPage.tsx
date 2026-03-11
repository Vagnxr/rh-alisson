import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ExportButtons } from '@/components/ui/export-buttons';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { api } from '@/lib/api';
import { dateFilterToParams } from '@/lib/financeiro-api';
import { buildTableColumns } from '@/lib/buildTableColumns';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import type { VendaCartoesRow } from '@/types/financeiro';
import { formatDateStringToBR } from '@/lib/date';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const VENDA_CARTÕES_DEFAULT_ORDER = ['dia', 'credito', 'debito', 'voucher', 'pix', 'totalDia'];

const DEFAULT_LABELS: Record<string, string> = {
  dia: 'Dia',
  credito: 'Credito',
  debito: 'Debito',
  voucher: 'Voucher',
  pix: 'PIX',
  food: 'iFood',
  ifood: 'iFood',
  totalDia: 'Total dia',
};

type VendaCartoesRowFlex = VendaCartoesRow & Record<string, unknown>;

const COLUMN_DEFS_BY_KEY: Record<string, ColumnDef<VendaCartoesRowFlex>> = {
  dia: {
    accessorKey: 'dia',
    header: ({ column }) => (
      <button
        className="flex items-center gap-1 font-medium"
        onClick={column.getToggleSortingHandler()}
      >
        Dia <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => formatDateStringToBR(String(row.getValue('dia') ?? '')),
  },
  credito: {
    accessorKey: 'credito',
    header: 'Credito',
    cell: ({ row }) => formatCurrency(Number(row.getValue('credito') ?? 0)),
  },
  debito: {
    accessorKey: 'debito',
    header: 'Debito',
    cell: ({ row }) => formatCurrency(Number(row.getValue('debito') ?? 0)),
  },
  voucher: {
    accessorKey: 'voucher',
    header: 'Voucher',
    cell: ({ row }) => formatCurrency(Number(row.getValue('voucher') ?? 0)),
  },
  pix: {
    accessorKey: 'pix',
    header: 'PIX',
    cell: ({ row }) => formatCurrency(Number(row.getValue('pix') ?? 0)),
  },
  food: {
    accessorKey: 'food',
    header: 'iFood',
    cell: ({ row }) => formatCurrency(Number(row.getValue('food') ?? 0)),
  },
  ifood: {
    accessorKey: 'ifood',
    header: 'iFood',
    cell: ({ row }) => formatCurrency(Number(row.getValue('ifood') ?? 0)),
  },
  totalDia: {
    accessorKey: 'totalDia',
    header: 'Total dia',
    cell: ({ row }) => (
      <span className="font-semibold text-slate-900">
        {formatCurrency(Number(row.getValue('totalDia') ?? 0))}
      </span>
    ),
  },
};

export function VendaCartoesPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [items, setItems] = useState<VendaCartoesRowFlex[]>([]);
  const [columnsFromApi, setColumnsFromApi] = useState<TableColumnConfigFromApi[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get<VendaCartoesRow[]>('financeiro/venda-cartoes', { params: dateFilterToParams(dateFilter) })
      .then((res) => {
        setItems(Array.isArray(res.data) ? (res.data as VendaCartoesRowFlex[]) : []);
        if (res.columns && res.columns.length > 0) setColumnsFromApi(res.columns);
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [dateFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const columnDefsByKey = useMemo<Record<string, ColumnDef<VendaCartoesRowFlex>>>(() => {
    const defs = { ...COLUMN_DEFS_BY_KEY };
    const cols = columnsFromApi ?? [];
    for (const col of cols) {
      if (!defs[col.id]) {
        defs[col.id] = {
          accessorKey: col.id,
          header: col.label,
          cell: ({ row }) => {
            const val = (row.original as Record<string, unknown>)[col.id];
            const num = typeof val === 'number' ? val : Number(val) || 0;
            return col.id === 'dia' ? formatDateStringToBR(String(val ?? '')) : formatCurrency(num);
          },
        };
      }
    }
    return defs;
  }, [columnsFromApi]);

  const columns = useMemo(
    () =>
      buildTableColumns<VendaCartoesRowFlex>(
        columnDefsByKey,
        columnsFromApi ?? null,
        VENDA_CARTÕES_DEFAULT_ORDER
      ),
    [columnDefsByKey, columnsFromApi]
  );

  const exportColumnsConfig = useMemo(() => {
    const cols = columnsFromApi && columnsFromApi.length > 0
      ? [...columnsFromApi].sort((a, b) => a.order - b.order)
      : VENDA_CARTÕES_DEFAULT_ORDER.map((id, i) => ({
          id,
          label: DEFAULT_LABELS[id] ?? id,
          order: i + 1,
        }));
    return cols.map((c) => ({
      key: c.id,
      label: typeof c.label === 'string' ? c.label : (DEFAULT_LABELS[c.id] ?? c.id),
      format: (v: unknown) =>
        c.id === 'dia'
          ? formatDateStringToBR(String(v ?? ''))
          : formatCurrency(Number(v ?? 0)),
    }));
  }, [columnsFromApi]);

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalGeral = useMemo(() => {
    return items.reduce((acc, r) => acc + Number((r as Record<string, unknown>).totalDia ?? 0), 0);
  }, [items]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Venda Cartoes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Colunas definidas pela API conforme periodo selecionado
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={items.map((r) => {
              const row = r as Record<string, unknown>;
              const out: Record<string, unknown> = {};
              for (const col of exportColumnsConfig) {
                out[col.key] = row[col.key];
              }
              return out;
            })}
            columns={exportColumnsConfig}
            filename="venda-cartoes"
            title="Venda Cartoes"
          />
        </div>
      </div>
      <p className="text-sm text-slate-500">Pagina somente de visualizacao (reflexo do caixa).</p>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
          <table className="w-full min-w-[700px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-slate-500">
                    Nenhum registro no periodo
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap px-4 py-3 text-sm text-slate-600"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={columns.length - 1} className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                    Total:
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">
                    {formatCurrency(totalGeral)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
          )}
        </div>
      </div>

    </div>
  );
}
