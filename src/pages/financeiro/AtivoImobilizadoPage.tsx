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
import type { AtivoImobilizadoRow, AtivoImobilizadoFormaPagto } from '@/types/financeiro';
import { ExportButtons } from '@/components/ui/export-buttons';
import { formatDateStringToBR } from '@/lib/date';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseNum(v: string): number {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

const inputClass =
  'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function AtivoImobilizadoPage() {
  const [sorting1, setSorting1] = useState<SortingState>([]);
  const [sorting2, setSorting2] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [entradas, setEntradas] = useState<AtivoImobilizadoRow[]>([]);
  const [saidas, setSaidas] = useState<AtivoImobilizadoRow[]>([]);
  const [loading1, setLoading1] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [dialogEntrada, setDialogEntrada] = useState(false);
  const [dialogSaida, setDialogSaida] = useState(false);
  const [editingEntrada, setEditingEntrada] = useState<AtivoImobilizadoRow | null>(null);
  const [editingSaida, setEditingSaida] = useState<AtivoImobilizadoRow | null>(null);
  const [deleteEntradaId, setDeleteEntradaId] = useState<string | null>(null);
  const [deleteSaidaId, setDeleteSaidaId] = useState<string | null>(null);
  const [formEntrada, setFormEntrada] = useState({
    data: new Date().toISOString().split('T')[0],
    nf: '',
    descricaoFornecedor: '',
    valor: '',
    formaPagto: 'Dinheiro' as AtivoImobilizadoFormaPagto,
  });
  const [formSaida, setFormSaida] = useState({
    data: new Date().toISOString().split('T')[0],
    nf: '',
    descricaoFornecedor: '',
    valor: '',
    recorrencia: '',
    comunicarAgenda: false,
  });

  const handleOpenDialogEntrada = (item?: AtivoImobilizadoRow) => {
    if (item) {
      setEditingEntrada(item);
      setFormEntrada({
        data: item.data.split('T')[0] || item.data.slice(0, 10),
        nf: item.nf,
        descricaoFornecedor: item.descricaoFornecedor,
        valor: String(item.valor),
        formaPagto: item.formaPagto ?? 'Dinheiro',
      });
    } else {
      setEditingEntrada(null);
      setFormEntrada({
        data: new Date().toISOString().split('T')[0],
        nf: '',
        descricaoFornecedor: '',
        valor: '',
        formaPagto: 'Dinheiro',
      });
    }
    setDialogEntrada(true);
  };

  const handleOpenDialogSaida = (item?: AtivoImobilizadoRow) => {
    if (item) {
      setEditingSaida(item);
      setFormSaida({
        data: item.data.split('T')[0] || item.data.slice(0, 10),
        nf: item.nf,
        descricaoFornecedor: item.descricaoFornecedor,
        valor: String(item.valor),
        recorrencia: item.recorrencia ?? '',
        comunicarAgenda: item.comunicarAgenda ?? false,
      });
    } else {
      setEditingSaida(null);
      setFormSaida({
        data: new Date().toISOString().split('T')[0],
        nf: '',
        descricaoFornecedor: '',
        valor: '',
        recorrencia: '',
        comunicarAgenda: false,
      });
    }
    setDialogSaida(true);
  };

  const params = useMemo(() => dateFilterToParams(dateFilter), [dateFilter]);

  const fetchEntradas = useCallback(() => {
    setLoading1(true);
    api
      .get<AtivoImobilizadoRow[]>('financeiro/ativo-imobilizado', { params: { ...params, tipo: 'entrada' } })
      .then((res) => setEntradas(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar entradas'))
      .finally(() => setLoading1(false));
  }, [params]);

  const fetchSaidas = useCallback(() => {
    setLoading2(true);
    api
      .get<AtivoImobilizadoRow[]>('financeiro/ativo-imobilizado', { params: { ...params, tipo: 'saida' } })
      .then((res) => setSaidas(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar saidas'))
      .finally(() => setLoading2(false));
  }, [params]);

  useEffect(() => {
    fetchEntradas();
  }, [fetchEntradas]);

  useEffect(() => {
    fetchSaidas();
  }, [fetchSaidas]);

  const handleSubmitEntrada = (e: React.FormEvent) => {
    e.preventDefault();
    const descricao = formEntrada.descricaoFornecedor.trim().toUpperCase();
    if (!formEntrada.nf.trim()) {
      toast.error('Preencha Data, N.F., Descricao/Fornecedor e Valor.');
      return;
    }
    if (!descricao) {
      toast.error('Preencha Data, N.F., Descricao/Fornecedor e Valor.');
      return;
    }
    const valorNum = parseNum(formEntrada.valor);
    if (formEntrada.valor.trim() === '' || !Number.isFinite(valorNum)) {
      toast.error('Preencha Data, N.F., Descricao/Fornecedor e Valor.');
      return;
    }
    const data = formEntrada.data.slice(0, 10);
    const body = {
      tipo: 'entrada' as const,
      data,
      nf: formEntrada.nf.trim(),
      descricaoFornecedor: descricao,
      valor: valorNum,
      formaPagto: formEntrada.formaPagto,
    };
    if (editingEntrada) {
      api
        .patch<AtivoImobilizadoRow>(`financeiro/ativo-imobilizado/${editingEntrada.id}`, { data, nf: formEntrada.nf.trim(), descricaoFornecedor: descricao, valor: valorNum, formaPagto: formEntrada.formaPagto })
        .then(() => {
          toast.success('Registro atualizado.');
          fetchEntradas();
          setDialogEntrada(false);
          setEditingEntrada(null);
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao atualizar'));
    } else {
      api
        .post<AtivoImobilizadoRow>('financeiro/ativo-imobilizado', body)
        .then((res) => {
          toast.success('Registro adicionado.');
          setEntradas((prev) => [...prev, res.data]);
          setDialogEntrada(false);
          setEditingEntrada(null);
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao criar'));
    }
  };

  const handleSubmitSaida = (e: React.FormEvent) => {
    e.preventDefault();
    const data = formSaida.data.slice(0, 10);
    const body = {
      tipo: 'saida' as const,
      data,
      nf: formSaida.nf,
      descricaoFornecedor: formSaida.descricaoFornecedor,
      valor: parseNum(formSaida.valor),
      recorrencia: formSaida.recorrencia.trim() || undefined,
      comunicarAgenda: formSaida.comunicarAgenda,
    };
    if (editingSaida) {
      api
        .patch<AtivoImobilizadoRow>(`financeiro/ativo-imobilizado/${editingSaida.id}`, {
          data,
          nf: formSaida.nf,
          descricaoFornecedor: formSaida.descricaoFornecedor,
          valor: parseNum(formSaida.valor),
          recorrencia: formSaida.recorrencia.trim() || undefined,
          comunicarAgenda: formSaida.comunicarAgenda,
        })
        .then(() => {
          toast.success('Registro atualizado.');
          fetchSaidas();
          setDialogSaida(false);
          setEditingSaida(null);
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao atualizar'));
    } else {
      api
        .post<AtivoImobilizadoRow>('financeiro/ativo-imobilizado', body)
        .then((res) => {
          toast.success('Registro adicionado.');
          setSaidas((prev) => [...prev, { ...res.data, recorrencia: formSaida.recorrencia || undefined, comunicarAgenda: formSaida.comunicarAgenda }]);
          setDialogSaida(false);
          setEditingSaida(null);
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao criar'));
    }
  };

  const handleDeleteEntrada = () => {
    if (!deleteEntradaId) return;
    api
      .delete(`financeiro/ativo-imobilizado/${deleteEntradaId}`)
      .then(() => {
        setEntradas((prev) => prev.filter((r) => r.id !== deleteEntradaId));
        setDeleteEntradaId(null);
        toast.success('Registro excluido.');
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao excluir'));
  };

  const handleDeleteSaida = () => {
    if (!deleteSaidaId) return;
    api
      .delete(`financeiro/ativo-imobilizado/${deleteSaidaId}`)
      .then(() => {
        setSaidas((prev) => prev.filter((r) => r.id !== deleteSaidaId));
        setDeleteSaidaId(null);
        toast.success('Registro excluido.');
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao excluir'));
  };

  const columnsWithActions = useMemo<ColumnDef<AtivoImobilizadoRow>[]>(
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
        cell: ({ row }) => formatDateStringToBR(String(row.getValue('data') ?? '')),
      },
      { accessorKey: 'nf', header: 'N.F.' },
      { accessorKey: 'descricaoFornecedor', header: 'Descricao / Fornecedor' },
      {
        accessorKey: 'valor',
        header: 'Valor',
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">
            {formatCurrency(row.getValue('valor'))}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acoes</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Editar" onClick={() => handleOpenDialogEntrada(row.original)}>
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Excluir" onClick={() => setDeleteEntradaId(row.original.id)}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const columnsSaidaWithActions = useMemo<ColumnDef<AtivoImobilizadoRow>[]>(
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
        cell: ({ row }) => formatDateStringToBR(String(row.getValue('data') ?? '')),
      },
      { accessorKey: 'nf', header: 'N.F.' },
      { accessorKey: 'descricaoFornecedor', header: 'Descricao / Fornecedor' },
      {
        accessorKey: 'valor',
        header: 'Valor',
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">
            {formatCurrency(row.getValue('valor'))}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acoes</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Editar" onClick={() => handleOpenDialogSaida(row.original)}>
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Excluir" onClick={() => setDeleteSaidaId(row.original.id)}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const tableEntrada = useReactTable({
    data: entradas,
    columns: columnsWithActions,
    state: { sorting: sorting1 },
    onSortingChange: setSorting1,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const tableSaida = useReactTable({
    data: saidas,
    columns: columnsSaidaWithActions,
    state: { sorting: sorting2 },
    onSortingChange: setSorting2,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalEntrada = useMemo(() => entradas.reduce((acc, r) => acc + r.valor, 0), [entradas]);
  const totalSaida = useMemo(() => saidas.reduce((acc, r) => acc + r.valor, 0), [saidas]);

  function renderTable(
    table: ReturnType<typeof useReactTable<AtivoImobilizadoRow>>,
    total: number,
    hasRows: boolean,
    colCount: number
  ) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
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
                <td colSpan={colCount} className="px-6 py-8 text-center text-sm text-slate-500">
                  Nenhum registro
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
          {hasRows && (
            <tfoot className="border-t border-slate-200 bg-slate-50">
              <tr>
                <td colSpan={colCount - 2} className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                  Total:
                </td>
                <td className="px-4 py-3 text-sm font-bold text-slate-900">
                  {formatCurrency(total)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Ativo Imobilizado</h1>
          <p className="mt-1 text-sm text-slate-500">
            Entrada e saida: data, N.F., descricao/fornecedor e valor
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={entradas.map((r) => ({
              data: formatDateStringToBR(r.data),
              nf: r.nf,
              descricaoFornecedor: r.descricaoFornecedor,
              valor: formatCurrency(r.valor),
            }))}
            columns={[
              { key: 'data', label: 'Data' },
              { key: 'nf', label: 'N.F.' },
              { key: 'descricaoFornecedor', label: 'Descricao/Fornecedor' },
              { key: 'valor', label: 'Valor' },
            ]}
            filename="ativo-imobilizado-entrada"
            title="Ativo Imobilizado - Entrada"
          />
          <ExportButtons
            data={saidas.map((r) => ({
              data: formatDateStringToBR(r.data),
              nf: r.nf,
              descricaoFornecedor: r.descricaoFornecedor,
              valor: formatCurrency(r.valor),
            }))}
            columns={[
              { key: 'data', label: 'Data' },
              { key: 'nf', label: 'N.F.' },
              { key: 'descricaoFornecedor', label: 'Descricao/Fornecedor' },
              { key: 'valor', label: 'Valor' },
            ]}
            filename="ativo-imobilizado-saida"
            title="Ativo Imobilizado - Saida"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-100 px-4 py-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Ativo Imobilizado - Entrada</h2>
            <button type="button" onClick={() => handleOpenDialogEntrada()} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
              <Plus className="h-3 w-3" />
              Novo
            </button>
          </div>
          {loading1 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            renderTable(tableEntrada, totalEntrada, entradas.length > 0, columnsWithActions.length)
          )}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-100 px-4 py-2">
            <h2 className="text-sm font-semibold text-slate-800">Ativo Imobilizado - Saida</h2>
            <p className="text-xs text-slate-500 mt-0.5">Preenchido automaticamente conforme Entrada e pagamentos na Agenda.</p>
          </div>
          {loading2 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            renderTable(tableSaida, totalSaida, saidas.length > 0, columnsSaidaWithActions.length)
          )}
        </div>
      </div>

      <Dialog open={dialogEntrada} onOpenChange={setDialogEntrada}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntrada ? 'Editar Entrada' : 'Nova Entrada'}</DialogTitle>
            <DialogDescription>Preencha data, N.F., descricao/fornecedor, valor e forma de pagto.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEntrada} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
            <div className="space-y-4 mt-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Data <span className="text-red-500">*</span></label>
                <input type="date" value={formEntrada.data} onChange={(e) => setFormEntrada({ ...formEntrada, data: e.target.value })} className={inputClass} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">N.F. <span className="text-red-500">*</span></label>
                <input type="text" value={formEntrada.nf} onChange={(e) => setFormEntrada({ ...formEntrada, nf: e.target.value })} className={inputClass} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Descricao / Fornecedor <span className="text-red-500">*</span></label>
                <input type="text" value={formEntrada.descricaoFornecedor} onChange={(e) => setFormEntrada({ ...formEntrada, descricaoFornecedor: e.target.value.toUpperCase() })} className={`${inputClass} uppercase`} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Valor (R$) <span className="text-red-500">*</span></label>
                <input type="text" inputMode="decimal" placeholder="0,00" value={formEntrada.valor} onChange={(e) => setFormEntrada({ ...formEntrada, valor: e.target.value })} className={inputClass} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Forma de Pagto <span className="text-red-500">*</span></label>
                <select
                  value={formEntrada.formaPagto}
                  onChange={(e) => setFormEntrada({ ...formEntrada, formaPagto: e.target.value as AtivoImobilizadoFormaPagto })}
                  className={inputClass}
                  required
                >
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto</option>
                </select>
              </div>
            </div>
            </DialogBody>
            <DialogFooter>
              <button type="button" onClick={() => setDialogEntrada(false)} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">Cancelar</button>
              <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">{editingEntrada ? 'Salvar' : 'Adicionar'}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogSaida} onOpenChange={setDialogSaida}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSaida ? 'Editar Saida' : 'Nova Saida'}</DialogTitle>
            <DialogDescription>Preencha data, N.F., descricao/fornecedor e valor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitSaida} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
            <div className="space-y-4 mt-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Data</label>
                <input type="date" value={formSaida.data} onChange={(e) => setFormSaida({ ...formSaida, data: e.target.value })} className={inputClass} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">N.F.</label>
                <input type="text" value={formSaida.nf} onChange={(e) => setFormSaida({ ...formSaida, nf: e.target.value })} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Descricao / Fornecedor</label>
                <input type="text" value={formSaida.descricaoFornecedor} onChange={(e) => setFormSaida({ ...formSaida, descricaoFornecedor: e.target.value })} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Valor (R$)</label>
                <input type="text" inputMode="decimal" placeholder="0,00" value={formSaida.valor} onChange={(e) => setFormSaida({ ...formSaida, valor: e.target.value })} className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Recorrencia</label>
                <select
                  value={formSaida.recorrencia}
                  onChange={(e) => setFormSaida({ ...formSaida, recorrencia: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Nenhuma</option>
                  <option value="Mensal">Mensal</option>
                  <option value="Trimestral">Trimestral</option>
                  <option value="Semestral">Semestral</option>
                  <option value="Anual">Anual</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="comunicarAgendaSaida"
                  type="checkbox"
                  checked={formSaida.comunicarAgenda}
                  onChange={(e) => setFormSaida({ ...formSaida, comunicarAgenda: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="comunicarAgendaSaida" className="text-sm font-medium text-slate-700">
                  Comunicar Agenda (registra saida ao marcar como pago na agenda)
                </label>
              </div>
            </div>
            </DialogBody>
            <DialogFooter>
              <button type="button" onClick={() => setDialogSaida(false)} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">Cancelar</button>
              <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">{editingSaida ? 'Salvar' : 'Adicionar'}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteEntradaId} onOpenChange={(open) => !open && setDeleteEntradaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este registro?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEntrada}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteSaidaId} onOpenChange={(open) => !open && setDeleteSaidaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este registro?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSaida}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
