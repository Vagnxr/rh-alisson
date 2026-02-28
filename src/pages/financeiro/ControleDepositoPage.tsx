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
import type { ControleDepositoRow, ValorDepositadoRow } from '@/types/financeiro';
import { ExportButtons } from '@/components/ui/export-buttons';
import { formatDateStringToBR } from '@/lib/date';
import { formatValorForInput, parseValorFromInput } from '@/lib/formatValor';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseNum(v: string): number {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Permite apenas digitos e no maximo um separador decimal (virgula ou ponto). */
function sanitizeDecimal(value: string): string {
  const cleaned = value.replace(/[^\d,.]/g, '');
  const sepIndex = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'));
  if (sepIndex < 0) return cleaned;
  const intPart = cleaned.slice(0, sepIndex).replace(/[,.]/g, '');
  const decPart = cleaned.slice(sepIndex + 1).replace(/\D/g, '');
  return intPart + cleaned[sepIndex] + decPart;
}

/** Retorna o dia da semana por extenso (ex: Quarta-feira). Usa data local para evitar erro de fuso. */
function diaSemanaFromDate(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  const dias = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado'];
  return dias[date.getDay()];
}

const inputClass =
  'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

export function ControleDepositoPage() {
  const [sorting1, setSorting1] = useState<SortingState>([]);
  const [sorting2, setSorting2] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [depositos, setDepositos] = useState<ControleDepositoRow[]>([]);
  const [valoresDepositados, setValoresDepositados] = useState<ValorDepositadoRow[]>([]);
  const [loading1, setLoading1] = useState(true);
  const [loading2, setLoading2] = useState(true);
  const [dialogDeposito, setDialogDeposito] = useState(false);
  const [dialogValor, setDialogValor] = useState(false);
  const [editingDeposito, setEditingDeposito] = useState<ControleDepositoRow | null>(null);
  const [editingValor, setEditingValor] = useState<ValorDepositadoRow | null>(null);
  const [deleteDepositoId, setDeleteDepositoId] = useState<string | null>(null);
  const [deleteValorId, setDeleteValorId] = useState<string | null>(null);
  const [formDeposito, setFormDeposito] = useState({
    data: new Date().toISOString().split('T')[0],
    dia: '',
    dinheiro: '',
    responsavelDeposito: '',
  });
  const [formValor, setFormValor] = useState({
    data: new Date().toISOString().split('T')[0],
    dia: '',
    dinheiro: '',
  });

  const handleOpenDialogDeposito = (item?: ControleDepositoRow) => {
    if (item) {
      setEditingDeposito(item);
      const dataStr = item.data.split('T')[0] || item.data.slice(0, 10);
      setFormDeposito({
        data: dataStr,
        dia: (item.dia || diaSemanaFromDate(dataStr)).toUpperCase(),
        dinheiro: formatValorForInput(Number(item.dinheiro) || 0),
        responsavelDeposito: (item.responsavelDeposito ?? '').toUpperCase(),
      });
    } else {
      setEditingDeposito(null);
      const hoje = new Date().toISOString().split('T')[0];
      setFormDeposito({
        data: hoje,
        dia: diaSemanaFromDate(hoje).toUpperCase(),
        dinheiro: '',
        responsavelDeposito: '',
      });
    }
    setDialogDeposito(true);
  };

  const handleOpenDialogValor = (item?: ValorDepositadoRow) => {
    if (item) {
      setEditingValor(item);
      setFormValor({
        data: item.data.split('T')[0] || item.data.slice(0, 10),
        dia: item.dia.toUpperCase(),
        dinheiro: formatValorForInput(Number(item.dinheiro) || 0),
      });
    } else {
      setEditingValor(null);
      const hoje = new Date().toISOString().split('T')[0];
      setFormValor({
        data: hoje,
        dia: diaSemanaFromDate(hoje).toUpperCase(),
        dinheiro: '',
      });
    }
    setDialogValor(true);
  };

  const params = useMemo(() => dateFilterToParams(dateFilter), [dateFilter]);

  const fetchDepositos = useCallback(() => {
    setLoading1(true);
    api
      .get<ControleDepositoRow[]>('financeiro/controle-deposito', { params })
      .then((res) => setDepositos(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar depositos'))
      .finally(() => setLoading1(false));
  }, [params]);

  const fetchValores = useCallback(() => {
    setLoading2(true);
    api
      .get<ValorDepositadoRow[]>('financeiro/valor-depositado', { params })
      .then((res) => setValoresDepositados(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar valor depositado'))
      .finally(() => setLoading2(false));
  }, [params]);

  useEffect(() => {
    fetchDepositos();
  }, [fetchDepositos]);

  useEffect(() => {
    fetchValores();
  }, [fetchValores]);

  const handleSubmitDeposito = (e: React.FormEvent) => {
    e.preventDefault();
    const data = formDeposito.data.slice(0, 10);
    const dia = formDeposito.dia.trim() || diaSemanaFromDate(formDeposito.data);
    const body = {
      data,
      dia: dia.toUpperCase(),
      dinheiro: parseValorFromInput(formDeposito.dinheiro),
      responsavelDeposito: formDeposito.responsavelDeposito.trim().toUpperCase(),
    };
    if (editingDeposito) {
      api
        .patch<ControleDepositoRow>(`financeiro/controle-deposito/${editingDeposito.id}`, body)
        .then(() => {
          toast.success('Registro atualizado.');
          fetchDepositos();
          setDialogDeposito(false);
          setEditingDeposito(null);
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao atualizar'));
    } else {
      api
        .post<ControleDepositoRow>('financeiro/controle-deposito', body)
        .then((res) => {
          toast.success('Registro adicionado.');
          setDepositos((prev) => [...prev, res.data]);
          setDialogDeposito(false);
          setEditingDeposito(null);
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao criar'));
    }
  };

  const handleSubmitValor = (e: React.FormEvent) => {
    e.preventDefault();
    const data = formValor.data.slice(0, 10);
    const dia = (formValor.dia || diaSemanaFromDate(formValor.data)).toUpperCase();
    const body = { data, dia, dinheiro: parseValorFromInput(formValor.dinheiro) };
    if (editingValor) {
      api
        .patch<ValorDepositadoRow>(`financeiro/valor-depositado/${editingValor.id}`, body)
        .then(() => {
          toast.success('Registro atualizado.');
          fetchValores();
          setDialogValor(false);
          setEditingValor(null);
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao atualizar'));
    } else {
      api
        .post<ValorDepositadoRow>('financeiro/valor-depositado', body)
        .then((res) => {
          toast.success('Registro adicionado.');
          setValoresDepositados((prev) => [...prev, res.data]);
          setDialogValor(false);
          setEditingValor(null);
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao criar'));
    }
  };

  const handleDeleteDeposito = () => {
    if (!deleteDepositoId) return;
    api
      .delete(`financeiro/controle-deposito/${deleteDepositoId}`)
      .then(() => {
        setDepositos((prev) => prev.filter((r) => r.id !== deleteDepositoId));
        setDeleteDepositoId(null);
        toast.success('Registro excluido.');
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao excluir'));
  };

  const handleDeleteValor = () => {
    if (!deleteValorId) return;
    api
      .delete(`financeiro/valor-depositado/${deleteValorId}`)
      .then(() => {
        setValoresDepositados((prev) => prev.filter((r) => r.id !== deleteValorId));
        setDeleteValorId(null);
        toast.success('Registro excluido.');
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao excluir'));
  };

  const columnsDeposito = useMemo<ColumnDef<ControleDepositoRow>[]>(
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
      { accessorKey: 'dia', header: 'Dia' },
      {
        accessorKey: 'dinheiro',
        header: 'Dinheiro',
        cell: ({ row }) => formatCurrency(row.getValue('dinheiro')),
      },
      { accessorKey: 'responsavelDeposito', header: 'Responsavel' },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acoes</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Editar" onClick={() => handleOpenDialogDeposito(row.original)}>
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Excluir" onClick={() => setDeleteDepositoId(row.original.id)}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const columnsValor = useMemo<ColumnDef<ValorDepositadoRow>[]>(
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
      { accessorKey: 'dia', header: 'Dia' },
      {
        accessorKey: 'dinheiro',
        header: 'Dinheiro',
        cell: ({ row }) => formatCurrency(row.getValue('dinheiro')),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acoes</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Editar" onClick={() => handleOpenDialogValor(row.original)}>
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Excluir" onClick={() => setDeleteValorId(row.original.id)}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const table1 = useReactTable({
    data: depositos,
    columns: columnsDeposito,
    state: { sorting: sorting1 },
    onSortingChange: setSorting1,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const table2 = useReactTable({
    data: valoresDepositados,
    columns: columnsValor,
    state: { sorting: sorting2 },
    onSortingChange: setSorting2,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalDeposito = useMemo(() => depositos.reduce((acc, r) => acc + (r.dinheiro ?? 0), 0), [depositos]);
  const totalValorDepositado = useMemo(
    () => valoresDepositados.reduce((acc, r) => acc + r.dinheiro, 0),
    [valoresDepositados]
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Controle Deposito</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tabela Deposito: reflexo da parte de deposito do caixa. Valor depositado: valor efetivamente depositado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-100 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Depósito</h2>
            <div className="flex items-center gap-2">
              <ExportButtons
                data={depositos.map((r) => ({
                  data: formatDateStringToBR(r.data),
                  dia: r.dia,
                  dinheiro: formatCurrency(r.dinheiro),
                  responsavel: r.responsavelDeposito ?? '',
                }))}
                columns={[
                  { key: 'data', label: 'Data' },
                  { key: 'dia', label: 'Dia' },
                  { key: 'dinheiro', label: 'Dinheiro' },
                  { key: 'responsavel', label: 'Responsável' },
                ]}
                filename="controle-deposito"
                title="Controle Depósito"
              />
              <button
              type="button"
              onClick={() => handleOpenDialogDeposito()}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="h-3 w-3" />
              Novo
            </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading1 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
            <table className="w-full min-w-[400px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                {table1.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-200">
                {table1.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columnsDeposito.length} className="px-6 py-8 text-center text-sm text-slate-500">
                      Nenhum registro
                    </td>
                  </tr>
                ) : (
                  table1.getRowModel().rows.map((row) => (
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
              {depositos.length > 0 && (
                <tfoot className="border-t border-slate-200 bg-slate-50">
                  <tr>
                    <td colSpan={columnsDeposito.length - 2} className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">
                      {formatCurrency(totalDeposito)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
            )}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-100 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Valor depositado</h2>
            <div className="flex items-center gap-2">
              <ExportButtons
                data={valoresDepositados.map((r) => ({
                  data: formatDateStringToBR(r.data),
                  dia: r.dia,
                  dinheiro: formatCurrency(r.dinheiro),
                }))}
                columns={[
                  { key: 'data', label: 'Data' },
                  { key: 'dia', label: 'Dia' },
                  { key: 'dinheiro', label: 'Valor depositado' },
                ]}
                filename="valor-depositado"
                title="Valor Depositado"
              />
              <button
                type="button"
                onClick={() => handleOpenDialogValor()}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                <Plus className="h-3 w-3" />
                Novo
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {loading2 ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : (
            <table className="w-full min-w-[300px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                {table2.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th key={header.id} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-200">
                {table2.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columnsValor.length} className="px-6 py-8 text-center text-sm text-slate-500">
                      Nenhum registro
                    </td>
                  </tr>
                ) : (
                  table2.getRowModel().rows.map((row) => (
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
              {valoresDepositados.length > 0 && (
                <tfoot className="border-t border-slate-200 bg-slate-50">
                  <tr>
                    <td colSpan={columnsValor.length - 2} className="px-4 py-3 text-right text-sm font-medium text-slate-900">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-slate-900">
                      {formatCurrency(totalValorDepositado)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogDeposito} onOpenChange={setDialogDeposito}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDeposito ? 'Editar Deposito' : 'Novo Deposito'}</DialogTitle>
            <DialogDescription>Lancamento manual do valor depositado. Todos os campos sao obrigatorios.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitDeposito} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Data</label>
                <input type="date" value={formDeposito.data} onChange={(e) => setFormDeposito((prev) => ({ ...prev, data: e.target.value, dia: diaSemanaFromDate(e.target.value).toUpperCase() }))} className={inputClass} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Dia</label>
                <input type="text" readOnly value={formDeposito.dia} className={inputClass + ' bg-slate-50 uppercase'} aria-label="Dia da semana (preenchido pela data)" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Dinheiro (R$)</label>
                <input type="text" inputMode="decimal" placeholder="0,00" value={formDeposito.dinheiro} onChange={(e) => setFormDeposito({ ...formDeposito, dinheiro: sanitizeDecimal(e.target.value) })} className={inputClass} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Responsável pelo Depósito</label>
                <input type="text" placeholder="Nome de quem foi depositar" value={formDeposito.responsavelDeposito} onChange={(e) => setFormDeposito({ ...formDeposito, responsavelDeposito: e.target.value.toUpperCase() })} className={inputClass + ' uppercase'} required />
              </div>
            </div>
            </DialogBody>
            <DialogFooter>
              <button type="button" onClick={() => setDialogDeposito(false)} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">Cancelar</button>
              <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">{editingDeposito ? 'Salvar' : 'Adicionar'}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogValor} onOpenChange={setDialogValor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingValor ? 'Editar Valor Depositado' : 'Novo Valor Depositado'}</DialogTitle>
            <DialogDescription>Preencha data, dia e dinheiro.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitValor} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Data</label>
                <input type="date" value={formValor.data} onChange={(e) => setFormValor((prev) => ({ ...prev, data: e.target.value, dia: diaSemanaFromDate(e.target.value).toUpperCase() }))} className={inputClass} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Dia</label>
                <input type="text" readOnly value={formValor.dia} className={inputClass + ' bg-slate-50 uppercase'} aria-label="Dia da semana (preenchido pela data)" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Dinheiro (R$)</label>
                <input type="text" inputMode="decimal" placeholder="0,00" value={formValor.dinheiro} onChange={(e) => setFormValor({ ...formValor, dinheiro: sanitizeDecimal(e.target.value) })} className={inputClass} />
              </div>
            </div>
            </DialogBody>
            <DialogFooter>
              <button type="button" onClick={() => setDialogValor(false)} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">Cancelar</button>
              <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">{editingValor ? 'Salvar' : 'Adicionar'}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteDepositoId} onOpenChange={(open) => !open && setDeleteDepositoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este registro?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteDeposito}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={!!deleteValorId} onOpenChange={(open) => !open && setDeleteValorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este registro?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteValor}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
