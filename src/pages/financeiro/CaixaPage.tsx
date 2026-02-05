import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { ExportButtons } from '@/components/ui/export-buttons';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR');
}

function parseNum(v: string): number {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

const inputClass =
  'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function CaixaPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [items, setItems] = useState<CaixaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CaixaRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    dia: new Date().toISOString().split('T')[0],
    dinheiroDeposito: '',
    pagamentoPdv: '',
    pix: '',
    credito: '',
    debito: '',
    voucher: '',
    ifood: '',
  });

  const totalFromForm = useMemo(() => {
    const d = parseNum(formData.dinheiroDeposito);
    const p = parseNum(formData.pagamentoPdv);
    const px = parseNum(formData.pix);
    const c = parseNum(formData.credito);
    const db = parseNum(formData.debito);
    const v = parseNum(formData.voucher);
    const i = parseNum(formData.ifood);
    return d + p + px + c + db + v + i;
  }, [formData]);

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get<CaixaRow[]>('financeiro/caixa', { params: dateFilterToParams(dateFilter) })
      .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar caixa'))
      .finally(() => setLoading(false));
  }, [dateFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleOpenDialog = (item?: CaixaRow) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        dia: item.dia.split('T')[0] || item.dia.slice(0, 10),
        dinheiroDeposito: String(item.dinheiroDeposito),
        pagamentoPdv: String(item.pagamentoPdv),
        pix: String(item.pix),
        credito: String(item.credito),
        debito: String(item.debito),
        voucher: String(item.voucher),
        ifood: String(item.ifood),
      });
    } else {
      setEditingItem(null);
      setFormData({
        dia: new Date().toISOString().split('T')[0],
        dinheiroDeposito: '',
        pagamentoPdv: '',
        pix: '',
        credito: '',
        debito: '',
        voucher: '',
        ifood: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dia = formData.dia.slice(0, 10);
    const total = totalFromForm;
    const body = {
      dia,
      dinheiroDeposito: parseNum(formData.dinheiroDeposito),
      pagamentoPdv: parseNum(formData.pagamentoPdv),
      pix: parseNum(formData.pix),
      credito: parseNum(formData.credito),
      debito: parseNum(formData.debito),
      voucher: parseNum(formData.voucher),
      ifood: parseNum(formData.ifood),
      total,
    };
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

  const columns = useMemo<ColumnDef<CaixaRow>[]>(
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
        accessorKey: 'dinheiroDeposito',
        header: 'Dinheiro (dep.)',
        cell: ({ row }) => formatCurrency(row.getValue('dinheiroDeposito')),
      },
      {
        accessorKey: 'pagamentoPdv',
        header: 'Pag. (PDV)',
        cell: ({ row }) => formatCurrency(row.getValue('pagamentoPdv')),
      },
      {
        accessorKey: 'pix',
        header: 'PIX',
        cell: ({ row }) => formatCurrency(row.getValue('pix')),
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
        accessorKey: 'ifood',
        header: 'iFood',
        cell: ({ row }) => formatCurrency(row.getValue('ifood')),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900">
            {formatCurrency(row.getValue('total'))}
          </span>
        ),
      },
      {
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
    () => items.reduce((acc, r) => acc + r.total, 0),
    [items]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Caixa</h1>
          <p className="mt-1 text-sm text-slate-500">
            Dinheiro (deposito), pagamento PDV, PIX, credito, debito, voucher, iFood e total por dia
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={items.map((r) => ({
              dia: formatDate(r.dia),
              dinheiroDeposito: formatCurrency(r.dinheiroDeposito),
              pagamentoPdv: formatCurrency(r.pagamentoPdv),
              pix: formatCurrency(r.pix),
              credito: formatCurrency(r.credito),
              debito: formatCurrency(r.debito),
              voucher: formatCurrency(r.voucher),
              ifood: formatCurrency(r.ifood),
              total: formatCurrency(r.total),
            }))}
            columns={[
              { key: 'dia', label: 'Dia' },
              { key: 'dinheiroDeposito', label: 'Dinheiro (dep.)' },
              { key: 'pagamentoPdv', label: 'Pag. (PDV)' },
              { key: 'pix', label: 'PIX' },
              { key: 'credito', label: 'Credito' },
              { key: 'debito', label: 'Debito' },
              { key: 'voucher', label: 'Voucher' },
              { key: 'ifood', label: 'iFood' },
              { key: 'total', label: 'Total' },
            ]}
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

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
          <table className="w-full min-w-[800px]">
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Caixa' : 'Novo Caixa'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Altere os dados do registro.' : 'Preencha os dados do dia.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
            <div className="space-y-4 mt-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Dia</label>
                <input
                  type="date"
                  value={formData.dia}
                  onChange={(e) => setFormData({ ...formData, dia: e.target.value })}
                  className={inputClass}
                />
              </div>
              {[
                { key: 'dinheiroDeposito', label: 'Dinheiro (deposito)' },
                { key: 'pagamentoPdv', label: 'Pag. (PDV)' },
                { key: 'pix', label: 'PIX' },
                { key: 'credito', label: 'Credito' },
                { key: 'debito', label: 'Debito' },
                { key: 'voucher', label: 'Voucher' },
                { key: 'ifood', label: 'iFood' },
              ].map(({ key, label }) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">{label}</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              ))}
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
