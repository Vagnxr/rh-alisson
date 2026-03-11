import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '@/lib/api';
import { dateFilterToParams } from '@/lib/financeiro-api';
import type { CaixaRow } from '@/types/financeiro';
import { ID_TABELA_CAIXA } from '@/types/configuracao';
import type { TableColumnConfigFromApi, ColunaConfig } from '@/types/configuracao';
import { ExportButtons } from '@/components/ui/export-buttons';
import { useConfiguracaoStore } from '@/stores/configuracaoStore';
import { buildTableColumns } from '@/lib/buildTableColumns';
import { formatDateStringToBR } from '@/lib/date';
import { formatValorForInput, parseValorFromInput } from '@/lib/formatValor';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

const inputClass =
  'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const CAIXA_TABLE_DEFAULT_ORDER = [
  'dia',
  'dinheiroDeposito',
  'pagamentoPdv',
  'pagamentoEscritorio',
  'pix',
  'credito',
  'debito',
  'voucher',
  'troca',
  'devolucaoDinheiro',
  'desconto',
  'ifood',
  'total',
];

type CaixaRowWithExtras = CaixaRow & Record<string, number>;

const CAIXA_STATIC_COLUMN_DEFS: Record<string, ColumnDef<CaixaRowWithExtras>> = {
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
  dinheiroDeposito: {
    accessorKey: 'dinheiroDeposito',
    header: 'Dinheiro',
    cell: ({ row }) => formatCurrency(Number(row.getValue('dinheiroDeposito'))),
  },
  pagamentoPdv: {
    accessorKey: 'pagamentoPdv',
    header: 'Pag. (PDV)',
    cell: ({ row }) => formatCurrency(Number(row.getValue('pagamentoPdv'))),
  },
  pagamentoEscritorio: {
    accessorKey: 'pagamentoEscritorio',
    header: 'Pag. (Escrit.)',
    cell: ({ row }) => formatCurrency(Number(row.getValue('pagamentoEscritorio') ?? 0)),
  },
  pix: {
    accessorKey: 'pix',
    header: 'PIX',
    cell: ({ row }) => formatCurrency(Number(row.getValue('pix'))),
  },
  credito: {
    accessorKey: 'credito',
    header: 'Credito',
    cell: ({ row }) => formatCurrency(Number(row.getValue('credito'))),
  },
  debito: {
    accessorKey: 'debito',
    header: 'Debito',
    cell: ({ row }) => formatCurrency(Number(row.getValue('debito'))),
  },
  voucher: {
    accessorKey: 'voucher',
    header: 'Voucher',
    cell: ({ row }) => formatCurrency(Number(row.getValue('voucher'))),
  },
  troca: {
    accessorKey: 'troca',
    header: 'Troca',
    cell: ({ row }) => formatCurrency(Number(row.getValue('troca') ?? 0)),
  },
  devolucaoDinheiro: {
    accessorKey: 'devolucaoDinheiro',
    header: 'Devol. Dinheiro',
    cell: ({ row }) => formatCurrency(Number(row.getValue('devolucaoDinheiro') ?? 0)),
  },
  desconto: {
    accessorKey: 'desconto',
    header: 'Desconto',
    cell: ({ row }) => formatCurrency(Number(row.getValue('desconto') ?? 0)),
  },
  ifood: {
    accessorKey: 'ifood',
    header: 'iFood',
    cell: ({ row }) => formatCurrency(Number(row.getValue('ifood'))),
  },
  total: {
    accessorKey: 'total',
    header: 'Total',
    cell: ({ row }) => (
      <span className="font-semibold text-slate-900">
        {formatCurrency(Number(row.getValue('total')))}
      </span>
    ),
  },
};

function columnsApiToColunaConfig(cols: TableColumnConfigFromApi[]): ColunaConfig[] {
  return cols.map((c) => ({
    id: c.id,
    label: c.label,
    order: c.order,
    isVisible: true,
    isRequired: c.id === 'dia' || c.id === 'total',
    somarNoTotal: c.id !== 'dia' && c.id !== 'total' && c.id !== 'desconto',
    subtrairNoTotal: false,
  }));
}

export function CaixaPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [items, setItems] = useState<CaixaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CaixaRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  /** Colunas vindas do GET caixa (prioridade sobre o store) */
  const [colunasFromApi, setColunasFromApi] = useState<TableColumnConfigFromApi[] | null>(null);
  const getColunasVisiveis = useConfiguracaoStore((s) => s.getColunasVisiveis);
  const colunasStore = getColunasVisiveis(ID_TABELA_CAIXA);
  const colunasVisiveis = useMemo<ColunaConfig[]>(() => {
    if (colunasFromApi && colunasFromApi.length > 0) return columnsApiToColunaConfig(colunasFromApi);
    return colunasStore;
  }, [colunasFromApi, colunasStore]);
  const colunasValor = useMemo(
    () => colunasVisiveis.filter((c) => c.id !== 'dia' && c.id !== 'total').sort((a, b) => a.order - b.order),
    [colunasVisiveis]
  );
  const apiColumnsFromConfig = useMemo(() => {
    const list = colunasVisiveis.map((c) => ({
      id: c.id,
      label: c.label,
      order: c.order,
      isRequired: c.isRequired,
    }));
    const maxOrder = Math.max(0, ...list.map((c) => c.order));
    return list.map((c) =>
      c.id === 'total' ? { ...c, order: maxOrder + 1 } : c
    );
  }, [colunasVisiveis]);
  const [formData, setFormData] = useState<Record<string, string>>({
    dia: new Date().toISOString().split('T')[0],
    dinheiroDeposito: '',
    pagamentoPdv: '',
    pagamentoEscritorio: '',
    pix: '',
    credito: '',
    debito: '',
    voucher: '',
    troca: '',
    devolucaoDinheiro: '',
    desconto: '',
    ifood: '',
  });

  const totalFromForm = useMemo(() => {
    return colunasVisiveis
      .filter((c) => c.id !== 'dia' && c.id !== 'total')
      .reduce((sum, c) => {
        if (c.id === 'desconto') return sum;
        const val = parseValorFromInput(formData[c.id] ?? '0');
        if (c.subtrairNoTotal) return sum - val;
        if (c.somarNoTotal) return sum + val;
        return sum;
      }, 0);
  }, [colunasVisiveis, formData]);

  const fetchingRef = useRef(false);
  const fetchList = useCallback(() => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    api
      .get<CaixaRow[]>('financeiro/caixa', { params: dateFilterToParams(dateFilter) })
      .then((res) => {
        setItems(Array.isArray(res.data) ? res.data : []);
        if (res.columns && res.columns.length > 0) setColunasFromApi(res.columns);
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar caixa'))
      .finally(() => {
        setLoading(false);
        fetchingRef.current = false;
      });
  }, [dateFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleOpenDialog = (item?: CaixaRow & Record<string, unknown>) => {
    const base: Record<string, string> = {
      dia: item
        ? (item.dia ?? '').toString().split('T')[0]?.slice(0, 10) ?? ''
        : new Date().toISOString().split('T')[0],
    };
    colunasValor.forEach((c) => {
      const val = item != null ? item[c.id] : '';
      if (val === undefined || val === null || val === '') {
        base[c.id] = '';
      } else {
        const num = Number(val);
        base[c.id] = Number.isFinite(num) ? formatValorForInput(num) : String(val);
      }
    });
    setFormData(base);
    setEditingItem(item ?? null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dia = (formData.dia ?? '').slice(0, 10);
    const total = totalFromForm;
    const body: Record<string, string | number> = {
      dia,
      total,
    };
    colunasValor.forEach((c) => {
      body[c.id] = parseValorFromInput(formData[c.id] ?? '0');
    });
    if (editingItem) {
      api
        .patch<CaixaRow>(`financeiro/caixa/${editingItem.id}`, body)
        .then(() => {
          toast.success('Registro atualizado.');
          fetchList();
          handleCloseDialog();
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar'));
    } else {
      api
        .post<CaixaRow>('financeiro/caixa', body)
        .then((res) => {
          toast.success('Registro adicionado.');
          setItems((prev) => [...prev, res.data]);
          handleCloseDialog();
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar'));
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    api
      .delete(`financeiro/caixa/${deleteId}`)
      .then(() => {
        setItems((prev) => prev.filter((r) => r.id !== deleteId));
        setDeleteId(null);
        toast.success('Registro excluido.');
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao excluir'));
  };

  const columnDefsByKey = useMemo<Record<string, ColumnDef<CaixaRowWithExtras>>>(
    () => {
      const defs = { ...CAIXA_STATIC_COLUMN_DEFS };
      colunasVisiveis.forEach((col) => {
        if (defs[col.id]) return;
        defs[col.id] = {
          accessorKey: col.id,
          header: col.label,
          cell: ({ row }) => {
            const val = (row.original as Record<string, unknown>)[col.id];
            const num = typeof val === 'number' ? val : Number(val) || 0;
            if (col.subtrairNoTotal || col.somarNoTotal !== false) return formatCurrency(num);
            return String(val ?? '');
          },
        };
      });
      return defs;
    },
    [colunasVisiveis]
  );

  const actionsColumn: ColumnDef<CaixaRowWithExtras> = useMemo(
    () => ({
      id: 'actions',
      header: () => <span className="sr-only">Acoes</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Editar"
            onClick={() => handleOpenDialog(row.original)}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Excluir"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    }),
    []
  );

  const columns = useMemo(
    () =>
      buildTableColumns<CaixaRowWithExtras>(
        columnDefsByKey,
        apiColumnsFromConfig.length > 0 ? apiColumnsFromConfig : null,
        CAIXA_TABLE_DEFAULT_ORDER,
        actionsColumn
      ),
    [columnDefsByKey, apiColumnsFromConfig, actionsColumn]
  );

  const table = useReactTable({
    data: items as CaixaRowWithExtras[],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalGeral = useMemo(
    () => items.reduce((acc, r) => acc + r.total, 0),
    [items]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Caixa</h1>
          <p className="mt-1 text-sm text-slate-500">
          
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={items.map((r) => {
              const row = r as CaixaRowWithExtras;
              const out: Record<string, string> = {
                dia: formatDateStringToBR(row.dia),
                total: formatCurrency(row.total),
              };
              colunasVisiveis.forEach((c) => {
                if (c.id !== 'dia' && c.id !== 'total') {
                  const val = row[c.id];
                  out[c.id] = typeof val === 'number' ? formatCurrency(val) : String(val ?? '');
                }
              });
              return out;
            })}
            columns={colunasVisiveis.map((c) => ({ key: c.id, label: c.label }))}
            filename="caixa"
            title="Caixa"
          />
          <button
            type="button"
            onClick={() => handleOpenDialog()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Novo
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden min-w-0">
        <div className="min-w-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="min-w-0 px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 whitespace-normal break-words"
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
                        className="min-w-0 px-3 py-3 text-sm text-slate-600"
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
                  <td colSpan={columns.length - 2} className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                    Total:
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-slate-900">
                    {formatCurrency(totalGeral)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Caixa' : 'Novo Caixa'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Altere os dados do registro.' : 'Preencha os dados do dia.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
            <div className="space-y-4 mt-4 mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Dia</label>
                  <input
                    type="date"
                    value={formData.dia}
                    onChange={(e) => setFormData({ ...formData, dia: e.target.value })}
                    className={inputClass}
                  />
                </div>
                {colunasValor.map((col) => (
                  <div key={col.id} className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">{col.label}</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={formData[col.id] ?? ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [col.id]: e.target.value })
                      }
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500">
                Total: {formatCurrency(totalFromForm)}
              </p>
            </div>
            </DialogBody>
            <DialogFooter>
              <button
                type="button"
                onClick={handleCloseDialog}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                {editingItem ? 'Salvar' : 'Adicionar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
