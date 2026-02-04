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
import type { ControleCartoesRow, BandeiraCartao } from '@/types/financeiro';
import { cn } from '@/lib/cn';

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

function diaSemanaFromDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  return dias[d.getDay()];
}

const inputClass =
  'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const BANDEIRAS_CREDITO_DEBITO: { id: BandeiraCartao; label: string }[] = [
  { id: 'amex', label: 'Amex' },
  { id: 'elo-credito', label: 'Elo Credito' },
  { id: 'hipercard', label: 'Hipercard' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'visa', label: 'Visa' },
  { id: 'electron', label: 'Electron' },
  { id: 'elo-debito', label: 'Elo Debito' },
  { id: 'maestro', label: 'Maestro' },
];

type TabCartao = 'credito-debito' | 'pix' | 'voucher' | 'ifood' | 'outras';

export function ControleCartoesPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [tab, setTab] = useState<TabCartao>('credito-debito');
  const [bandeira, setBandeira] = useState<BandeiraCartao>('visa');
  const [items, setItems] = useState<ControleCartoesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ControleCartoesRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    valor: '',
    desconto: '',
    dataAReceber: new Date().toISOString().split('T')[0],
  });

  const aReceber = useMemo(() => {
    const v = parseNum(formData.valor);
    const d = parseNum(formData.desconto);
    return Math.max(0, v - d);
  }, [formData.valor, formData.desconto]);

  const fetchList = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = { ...dateFilterToParams(dateFilter), tipo: tab };
    if (tab === 'credito-debito') params.bandeira = bandeira;
    api
      .get<ControleCartoesRow[]>('financeiro/controle-cartoes', { params })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setItems(
          list.map((r: ControleCartoesRow & { data?: string; dataAReceber?: string }) => ({
            ...r,
            data: r.data ?? '',
            dataAReceber: r.dataAReceber ?? '',
            diaSemana: diaSemanaFromDate(r.data ?? ''),
            diaSemanaAReceber: diaSemanaFromDate(r.dataAReceber ?? ''),
          }))
        );
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [dateFilter, tab, bandeira]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const headerResumoFromItems = useMemo(
    () => ({
      prazo: '',
      taxaPercent: 0,
      dataAReceber: '',
      bruto: items.reduce((a, r) => a + r.valor, 0),
      desconto: items.reduce((a, r) => a + r.desconto, 0),
      liquido: items.reduce((a, r) => a + r.aReceber, 0),
    }),
    [items]
  );

  const handleOpenDialog = (item?: ControleCartoesRow) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        data: item.data.split('T')[0] || item.data.slice(0, 10),
        valor: String(item.valor),
        desconto: String(item.desconto),
        dataAReceber: item.dataAReceber.split('T')[0] || item.dataAReceber.slice(0, 10),
      });
    } else {
      setEditingItem(null);
      setFormData({
        data: new Date().toISOString().split('T')[0],
        valor: '',
        desconto: '',
        dataAReceber: new Date().toISOString().split('T')[0],
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
    const data = formData.data.slice(0, 10);
    const dataAReceber = formData.dataAReceber.slice(0, 10);
    const valor = parseNum(formData.valor);
    const desconto = parseNum(formData.desconto);
    const body = {
      tipo: tab,
      ...(tab === 'credito-debito' && { bandeira }),
      data,
      valor,
      desconto,
      dataAReceber,
    };
    if (editingItem) {
      api
        .patch<ControleCartoesRow & { data: string; dataAReceber: string }>(`financeiro/controle-cartoes/${editingItem.id}`, body)
        .then((res) => {
          toast.success('Registro atualizado.');
          setItems((prev) =>
            prev.map((r) =>
              r.id === editingItem.id
                ? {
                    ...res.data,
                    diaSemana: diaSemanaFromDate(res.data.data ?? ''),
                    diaSemanaAReceber: diaSemanaFromDate(res.data.dataAReceber ?? ''),
                  }
                : r
            )
          );
          handleCloseDialog();
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao atualizar'));
    } else {
      api
        .post<ControleCartoesRow & { data: string; dataAReceber: string }>('financeiro/controle-cartoes', body)
        .then((res) => {
          toast.success('Registro adicionado.');
          setItems((prev) => [
            ...prev,
            {
              ...res.data,
              diaSemana: diaSemanaFromDate(res.data.data ?? ''),
              diaSemanaAReceber: diaSemanaFromDate(res.data.dataAReceber ?? ''),
            },
          ]);
          handleCloseDialog();
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao criar'));
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    api
      .delete(`financeiro/controle-cartoes/${deleteId}`)
      .then(() => {
        setItems((prev) => prev.filter((r) => r.id !== deleteId));
        setDeleteId(null);
        toast.success('Registro excluido.');
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao excluir'));
  };

  const columns = useMemo<ColumnDef<ControleCartoesRow>[]>(
    () => [
      {
        accessorKey: 'diaSemana',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Dia da semana <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
      },
      {
        accessorKey: 'data',
        header: 'Data',
        cell: ({ row }) => formatDate(row.getValue('data')),
      },
      {
        accessorKey: 'valor',
        header: 'Valor',
        cell: ({ row }) => formatCurrency(row.getValue('valor')),
      },
      {
        accessorKey: 'desconto',
        header: 'Desconto',
        cell: ({ row }) => formatCurrency(row.getValue('desconto')),
      },
      {
        accessorKey: 'aReceber',
        header: 'A receber',
        cell: ({ row }) => formatCurrency(row.getValue('aReceber')),
      },
      {
        accessorKey: 'dataAReceber',
        header: 'Data a receber',
        cell: ({ row }) => formatDate(row.getValue('dataAReceber')),
      },
      {
        accessorKey: 'diaSemanaAReceber',
        header: 'Dia da semana',
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

  const showBandeiras = tab === 'credito-debito';

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Controle Cartoes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Credito/Debito, PIX, Voucher, iFood e outras funcoes. Prazo, taxa, bruto, desconto e liquido.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
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

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {([
          { id: 'credito-debito' as TabCartao, label: 'Credito/Debito' },
          { id: 'pix' as TabCartao, label: 'PIX' },
          { id: 'voucher' as TabCartao, label: 'Voucher' },
          { id: 'ifood' as TabCartao, label: 'iFood' },
          { id: 'outras' as TabCartao, label: 'Outras funcoes' },
        ]).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-slate-100 text-slate-900 border border-slate-200 border-b-white -mb-px'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {showBandeiras && (
        <div className="flex flex-wrap gap-2">
          {BANDEIRAS_CREDITO_DEBITO.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBandeira(b.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                bandeira === b.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-medium uppercase text-slate-500 mb-2">Resumo</p>
        <div className="flex flex-wrap gap-6 text-sm">
          <span><strong>Prazo:</strong> {headerResumoFromItems.prazo || '-'}</span>
          <span><strong>Taxa %:</strong> {headerResumoFromItems.taxaPercent ? `${headerResumoFromItems.taxaPercent}%` : '-'}</span>
          <span><strong>Data a receber:</strong> {headerResumoFromItems.dataAReceber || '-'}</span>
          <span><strong>Bruto:</strong> {formatCurrency(headerResumoFromItems.bruto)}</span>
          <span><strong>Desconto:</strong> {formatCurrency(headerResumoFromItems.desconto)}</span>
          <span><strong>Liquido:</strong> {formatCurrency(headerResumoFromItems.liquido)}</span>
        </div>
      </div>

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
          </table>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Registro' : 'Novo Registro'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Altere os dados.' : 'Preencha data, valor, desconto e data a receber.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
            <div className="space-y-4 mt-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Data</label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Valor (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Desconto (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formData.desconto}
                  onChange={(e) => setFormData({ ...formData, desconto: e.target.value })}
                  className={inputClass}
                />
              </div>
              <p className="text-sm text-slate-500">A receber: {formatCurrency(aReceber)}</p>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Data a receber</label>
                <input
                  type="date"
                  value={formData.dataAReceber}
                  onChange={(e) => setFormData({ ...formData, dataAReceber: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
            </div>
            </DialogBody>
            <DialogFooter>
              <button type="button" onClick={handleCloseDialog} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100">
                Cancelar
              </button>
              <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
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
