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
import type { VendasRow } from '@/types/financeiro';
import { formatDateStringToBR } from '@/lib/date';
import { INPUT_CLASS, PAGE_TITLE, PAGE_SUBTITLE, TABLE_CARD } from '@/lib/uiClasses';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseNum(v: string): number {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

const inputClass = INPUT_CLASS;

export function VendasPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [items, setItems] = useState<VendasRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get<VendasRow[]>('financeiro/vendas', { params: dateFilterToParams(dateFilter) })
      .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar vendas'))
      .finally(() => setLoading(false));
  }, [dateFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const exportColumns = useExportColumns<VendasRow>([
    { key: 'dia', label: 'Dia', format: (v) => formatDateStringToBR(String(v)) },
    { key: 'valor', label: 'Valor', format: (v) => formatCurrency(Number(v)) },
  ]);

  const columns = useMemo<ColumnDef<VendasRow>[]>(
    () => [
      {
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
      {
        accessorKey: 'valor',
        header: 'Valor',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {formatCurrency(row.getValue('valor'))}
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

  const total = useMemo(() => items.reduce((acc, r) => acc + r.valor, 0), [items]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={PAGE_TITLE}>Vendas</h1>
          <p className={PAGE_SUBTITLE}>Vendas por dia</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={items.map((r) => ({ dia: r.dia, valor: r.valor }))}
            columns={exportColumns}
            filename="vendas"
            title="Vendas"
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Pagina somente de visualizacao (reflexo do caixa).</p>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
          <table className="w-full min-w-[300px]">
            <thead className="border-b border-border bg-muted/40">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    Nenhum registro no periodo
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/40">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot className="border-t border-border bg-muted/40">
                <tr>
                  <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                    Total:
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-foreground">
                    {formatCurrency(total)}
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
