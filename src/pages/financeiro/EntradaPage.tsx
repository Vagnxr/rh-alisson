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
import { onlyNumbers, isValidCNPJ, maskCNPJ } from '@/lib/masks';
import type { EntradaRow } from '@/types/financeiro';
import { useFornecedorStore } from '@/stores/fornecedorStore';
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

const CAMPOS_NUMERICOS = [
  'industrializacao',
  'comercializacao',
  'embalagem',
  'materialUsoCons',
  'mercadoriaUsoCons',
  'gas',
] as const;

const defaultForm = () => ({
  data: new Date().toISOString().split('T')[0],
  fornecedor: '',
  industrializacao: '',
  comercializacao: '',
  embalagem: '',
  materialUsoCons: '',
  mercadoriaUsoCons: '',
  gas: '',
});

export function EntradaPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [items, setItems] = useState<EntradaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EntradaRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultForm());
  const { fornecedores, fetchFornecedores } = useFornecedorStore();

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get<EntradaRow[]>('financeiro/entrada', { params: dateFilterToParams(dateFilter) })
      .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [dateFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (isDialogOpen) fetchFornecedores().catch(() => {});
  }, [isDialogOpen, fetchFornecedores]);

  const handleOpenDialog = (item?: EntradaRow) => {
    if (item) {
      setEditingItem(item);
      const fornecedorVal = item.fornecedor || '';
      const cnpjDisplay =
        onlyNumbers(fornecedorVal).length === 14 ? maskCNPJ(fornecedorVal) : fornecedorVal;
      setFormData({
        data: item.data.split('T')[0] || item.data.slice(0, 10),
        fornecedor: cnpjDisplay,
        industrializacao: String(item.industrializacao),
        comercializacao: String(item.comercializacao),
        embalagem: String(item.embalagem),
        materialUsoCons: String(item.materialUsoCons),
        mercadoriaUsoCons: String(item.mercadoriaUsoCons),
        gas: String(item.gas),
      });
    } else {
      setEditingItem(null);
      setFormData(defaultForm());
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fornecedorRaw = formData.fornecedor.trim();
    const fornecedorNumeros = onlyNumbers(fornecedorRaw);
    if (fornecedorNumeros.length !== 14) {
      toast.error('Informe o CNPJ do fornecedor (14 digitos).');
      return;
    }
    if (!isValidCNPJ(fornecedorRaw)) {
      toast.error('CNPJ do fornecedor invalido. Verifique os digitos.');
      return;
    }
    const existeFornecedor = fornecedores.some((f) => {
      if (f.tipo !== 'cnpj') return false;
      return onlyNumbers(f.cnpj) === fornecedorNumeros;
    });
    if (!existeFornecedor) {
      toast.error('Fornecedor nao cadastrado. Cadastre o fornecedor em Fornecedores antes de lançar a entrada.');
      return;
    }
    const data = formData.data.slice(0, 10);
    const body = {
      data,
      fornecedor: fornecedorNumeros.length === 14 ? fornecedorNumeros : fornecedorRaw,
      industrializacao: parseNum(formData.industrializacao),
      comercializacao: parseNum(formData.comercializacao),
      embalagem: parseNum(formData.embalagem),
      materialUsoCons: parseNum(formData.materialUsoCons),
      mercadoriaUsoCons: parseNum(formData.mercadoriaUsoCons),
      gas: parseNum(formData.gas),
    };
    if (editingItem) {
      api
        .patch<EntradaRow>(`financeiro/entrada/${editingItem.id}`, body)
        .then(() => {
          toast.success('Registro atualizado.');
          fetchList();
          handleCloseDialog();
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar'));
    } else {
      api
        .post<EntradaRow>('financeiro/entrada', body)
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
      .delete(`financeiro/entrada/${deleteId}`)
      .then(() => {
        setItems((prev) => prev.filter((r) => r.id !== deleteId));
        setDeleteId(null);
        toast.success('Registro excluido.');
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao excluir'));
  };

  const columns = useMemo<ColumnDef<EntradaRow>[]>(
    () => [
      {
        accessorKey: 'data',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Data <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => formatDate(row.getValue('data')),
      },
      { accessorKey: 'fornecedor', header: 'Fornecedor' },
      {
        accessorKey: 'industrializacao',
        header: 'Industrializacao',
        cell: ({ row }) => formatCurrency(row.getValue('industrializacao')),
      },
      {
        accessorKey: 'comercializacao',
        header: 'Comercializacao',
        cell: ({ row }) => formatCurrency(row.getValue('comercializacao')),
      },
      {
        accessorKey: 'embalagem',
        header: 'Embalagem',
        cell: ({ row }) => formatCurrency(row.getValue('embalagem')),
      },
      {
        accessorKey: 'materialUsoCons',
        header: 'Material uso/cons.',
        cell: ({ row }) => formatCurrency(row.getValue('materialUsoCons')),
      },
      {
        accessorKey: 'mercadoriaUsoCons',
        header: 'Mercadoria uso/cons.',
        cell: ({ row }) => formatCurrency(row.getValue('mercadoriaUsoCons')),
      },
      {
        accessorKey: 'gas',
        header: 'Gas',
        cell: ({ row }) => formatCurrency(row.getValue('gas')),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acoes</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Editar" onClick={() => handleOpenDialog(row.original)}>
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Excluir" onClick={() => setDeleteId(row.original.id)}>
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Entrada</h1>
          <p className="mt-1 text-sm text-slate-500">
            Data, fornecedor, industrializacao, comercializacao, embalagem, material uso/cons., mercadoria uso/cons., gas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={items.map((r) => ({
              data: formatDate(r.data),
              fornecedor: r.fornecedor,
              industrializacao: formatCurrency(Number(r.industrializacao)),
              comercializacao: formatCurrency(Number(r.comercializacao)),
              embalagem: formatCurrency(Number(r.embalagem)),
              materialUsoCons: formatCurrency(Number(r.materialUsoCons)),
              mercadoriaUsoCons: formatCurrency(Number(r.mercadoriaUsoCons)),
              gas: formatCurrency(Number(r.gas)),
            }))}
            columns={[
              { key: 'data', label: 'Data' },
              { key: 'fornecedor', label: 'Fornecedor' },
              { key: 'industrializacao', label: 'Industrializacao' },
              { key: 'comercializacao', label: 'Comercializacao' },
              { key: 'embalagem', label: 'Embalagem' },
              { key: 'materialUsoCons', label: 'Material uso/cons.' },
              { key: 'mercadoriaUsoCons', label: 'Mercadoria uso/cons.' },
              { key: 'gas', label: 'Gas' },
            ]}
            filename="entrada"
            title="Entrada"
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
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                      <td key={cell.id} className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Entrada' : 'Nova Entrada'}</DialogTitle>
            <DialogDescription>Preencha os dados da entrada.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
            <div className="space-y-4 mt-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Data</label>
                <input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} className={inputClass} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">CNPJ do fornecedor</label>
                <input
                  type="text"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                  value={formData.fornecedor}
                  onChange={(e) =>
                    setFormData({ ...formData, fornecedor: maskCNPJ(e.target.value) })
                  }
                  className={inputClass}
                />
              </div>
              {CAMPOS_NUMERICOS.map((key) => (
                <div key={key} className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    {key === 'materialUsoCons' ? 'Material uso/cons. (R$)' : key === 'mercadoriaUsoCons' ? 'Mercadoria uso/cons. (R$)' : `${key.charAt(0).toUpperCase() + key.slice(1)} (R$)`}
                  </label>
                  <input type="text" inputMode="decimal" placeholder="0,00" value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} className={inputClass} />
                </div>
              ))}
            </div>
            </DialogBody>
            <DialogFooter>
              <button type="button" onClick={handleCloseDialog} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">Cancelar</button>
              <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">{editingItem ? 'Salvar' : 'Adicionar'}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este registro?</AlertDialogDescription>
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
