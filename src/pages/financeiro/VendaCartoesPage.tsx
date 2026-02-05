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
import { ExportButtons, useExportColumns } from '@/components/ui/export-buttons';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { api } from '@/lib/api';
import { dateFilterToParams } from '@/lib/financeiro-api';
import type { VendaCartoesRow } from '@/types/financeiro';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR');
}

export function VendaCartoesPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [items, setItems] = useState<VendaCartoesRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get<VendaCartoesRow[]>('financeiro/venda-cartoes', { params: dateFilterToParams(dateFilter) })
      .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [dateFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const exportColumns = useExportColumns<VendaCartoesRow>([
    { key: 'dia', label: 'Dia', format: (v) => formatDate(String(v)) },
    { key: 'credito', label: 'Credito', format: (v) => formatCurrency(Number(v)) },
    { key: 'debito', label: 'Debito', format: (v) => formatCurrency(Number(v)) },
    { key: 'voucher', label: 'Voucher', format: (v) => formatCurrency(Number(v)) },
    { key: 'pix', label: 'PIX', format: (v) => formatCurrency(Number(v)) },
    { key: 'food', label: 'iFood', format: (v) => formatCurrency(Number(v)) },
    { key: 'totalDia', label: 'Total dia', format: (v) => formatCurrency(Number(v)) },
  ]);

  const columns = useMemo<ColumnDef<VendaCartoesRow>[]>(
    () => [
      {
        accessorKey: 'dia',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Dia <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => formatDate(row.getValue('dia')),
      },
      {
        accessorKey: 'credito',
        header: 'Credito',
        cell: ({ row }) => formatCurrency(row.getValue('credito')),
      },
      {
        accessorKey: 'debito',
        header: 'Debito',
        cell: ({ row }) => formatCurrency(row.getValue('debito')),
      },
      {
        accessorKey: 'voucher',
        header: 'Voucher',
        cell: ({ row }) => formatCurrency(row.getValue('voucher')),
      },
      {
        accessorKey: 'pix',
        header: 'PIX',
        cell: ({ row }) => formatCurrency(row.getValue('pix')),
      },
      {
        accessorKey: 'food',
        header: 'iFood',
        cell: ({ row }) => formatCurrency(row.getValue('food')),
      },
      {
        accessorKey: 'totalDia',
        header: 'Total dia',
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900">
            {formatCurrency(row.getValue('totalDia'))}
          </span>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalGeral = useMemo(
    () => items.reduce((acc, r) => acc + r.totalDia, 0),
    [items]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Venda Cartoes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Dia, credito, debito, voucher, PIX, iFood e total do dia
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={items.map((r) => ({
              dia: r.dia,
              credito: r.credito,
              debito: r.debito,
              voucher: r.voucher,
              pix: r.pix,
              food: r.food,
              totalDia: r.totalDia,
            }))}
            columns={exportColumns}
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
