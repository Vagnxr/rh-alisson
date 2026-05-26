import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Loader2, Pencil, Trash2 } from 'lucide-react';
import { buildTableColumns } from '@/lib/buildTableColumns';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import type { EntradaRow } from '@/types/financeiro';
import { formatDateStringToBR } from '@/lib/date';
import { onlyNumbers, maskCPF, maskCNPJ } from '@/lib/masks';
import { formatCurrency } from './constants';

function formatCnpjCpf(value: string | undefined): string {
  if (!value) return '-';
  const digits = onlyNumbers(value);
  if (digits.length === 11) return maskCPF(digits);
  if (digits.length === 14) return maskCNPJ(digits);
  return value;
}

const ENTRADA_DEFAULT_ORDER = [
  'modeloNota',
  'cnpjCpf',
  'fornecedor',
  'data',
  'dataEmissao',
  'numeroNota',
  'valor',
  'categoria',
  'formaPagamento',
];

export interface EntradaTableProps {
  items: EntradaRow[];
  columnsFromApi: TableColumnConfigFromApi[] | null;
  loading: boolean;
  getRowTotal: (row: EntradaRow) => number;
  onEdit?: (row: EntradaRow) => void;
  onDelete?: (row: EntradaRow) => void;
}

export function EntradaTable({
  items,
  columnsFromApi,
  loading,
  getRowTotal,
  onEdit,
  onDelete,
}: EntradaTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const columnDefsByKey = useMemo<Record<string, ColumnDef<EntradaRow>>>(
    () => ({
      modeloNota: {
        accessorKey: 'modeloNota',
        header: 'Modelo',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.modeloNota ?? '-'}</span>
        ),
      },
      cnpjCpf: {
        accessorKey: 'cnpjCpf',
        id: 'cnpjCpf',
        header: 'CNPJ/CPF',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{formatCnpjCpf(row.original.cnpjCpf) ?? '-'}</span>
        ),
      },
      fornecedor: {
        accessorKey: 'fornecedor',
        header: 'Fornecedor',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.fornecedor ?? '-'}</span>
        ),
      },
      data: {
        accessorKey: 'data',
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-medium"
            onClick={column.getToggleSortingHandler()}
          >
            DATA ENTRADA <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => formatDateStringToBR(String(row.getValue('data') ?? '')),
      },
      dataEmissao: {
        accessorKey: 'dataEmissao',
        header: 'Data emissao',
        cell: ({ row }) =>
          row.original.dataEmissao
            ? formatDateStringToBR(String(row.original.dataEmissao))
            : '-',
      },
      numeroNota: {
        accessorKey: 'numeroNota',
        header: 'Nº nota',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.numeroNota ?? '-'}</span>
        ),
      },
      valor: {
        accessorFn: row => getRowTotal(row),
        id: 'valor',
        header: 'Valor',
        cell: ({ row }) => formatCurrency(getRowTotal(row.original)),
      },
      categoria: {
        accessorKey: 'valores',
        id: 'categoria',
        header: 'Categoria',
        cell: ({ row }) => {
          const valores = row.original.valores;
          if (!valores?.length) return '-';
          const labels = valores.map(v => v.categoriaNome ?? v.categoriaId);
          return (
            <span
              className="text-muted-foreground"
              title={valores.map(v => `${v.categoriaNome ?? v.categoriaId}: ${v.valor}`).join(', ')}
            >
              {labels.join(', ')}
            </span>
          );
        },
      },
      formaPagamento: {
        accessorKey: 'formaPagamento',
        header: 'Forma pag.',
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.formaPagamento ?? '-'}</span>
        ),
      },
    }),
    [getRowTotal],
  );

  const actionsColumn: ColumnDef<EntradaRow> = useMemo(
    () => ({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(row.original)}
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(row.original)}
              className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Excluir"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    }),
    [onEdit, onDelete],
  );

  const columns = useMemo(
    () =>
      buildTableColumns<EntradaRow>(
        columnDefsByKey,
        columnsFromApi ?? null,
        ENTRADA_DEFAULT_ORDER,
        actionsColumn,
      ),
    [columnDefsByKey, columnsFromApi, actionsColumn],
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <table className="w-full min-w-[800px]">
            <thead className="border-b border-border bg-muted/40">
              {table.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(header => (
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
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-sm text-muted-foreground"
                  >
                    <p>Nenhum registro no periodo.</p>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="hover:bg-muted/40">
                    {row.getVisibleCells().map(cell => (
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
          </table>
        )}
      </div>
    </div>
  );
}
