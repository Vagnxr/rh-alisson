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
import { formatDateStringToBR, addOneMonth } from '@/lib/date';
import { formatValorForInput, parseValorFromInput } from '@/lib/formatValor';
import { DataValorList, type DataValorItem } from '@/components/ui/data-valor-list';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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
  const [editingEntrada, setEditingEntrada] = useState<AtivoImobilizadoRow | null>(null);
  const [deleteEntradaId, setDeleteEntradaId] = useState<string | null>(null);
  const [formEntrada, setFormEntrada] = useState({
    data: new Date().toISOString().split('T')[0],
    nf: '',
    descricaoFornecedor: '',
    valor: '',
    formaPagto: 'Dinheiro' as AtivoImobilizadoFormaPagto,
    parcelas: [] as DataValorItem[],
    parcelasIds: [] as string[],
    comunicarAgenda: false,
  });
  const handleOpenDialogEntrada = (item?: AtivoImobilizadoRow) => {
    const hoje = new Date().toISOString().split('T')[0];
    if (item) {
      setEditingEntrada(item);
      const isBoleto = (item.formaPagto ?? '').toString().toLowerCase() === 'boleto';
      const grupoId = item.recorrenciaGrupoId ?? (item as { recorrencia_grupo_id?: string }).recorrencia_grupo_id;
      let parcelas: DataValorItem[] = [];
      let parcelasIds: string[] = [];
      if (isBoleto) {
        let doGrupo: AtivoImobilizadoRow[];
        if (grupoId && entradas.length > 0) {
          doGrupo = entradas.filter((r) => (r.recorrenciaGrupoId ?? (r as { recorrencia_grupo_id?: string }).recorrencia_grupo_id) === grupoId);
        } else if (entradas.length > 0 && item.recorrenciaIndice) {
          doGrupo = entradas.filter(
            (r) =>
              (r.formaPagto ?? '').toString().toLowerCase() === 'boleto' &&
              r.nf === item.nf &&
              r.descricaoFornecedor === item.descricaoFornecedor &&
              r.recorrenciaIndice
          );
        } else {
          doGrupo = [item];
        }
        const ordenados = [...doGrupo].sort((a, b) => {
          const indiceA = parseRecorrenciaIndice(a.recorrenciaIndice);
          const indiceB = parseRecorrenciaIndice(b.recorrenciaIndice);
          if (indiceA != null && indiceB != null) return indiceA - indiceB;
          return (a.data || '').localeCompare(b.data || '');
        });
        parcelas = ordenados.map((r) => ({
          data: r.data.split('T')[0] || r.data.slice(0, 10),
          valor: formatValorForInput(Number(r.valor) || 0),
        }));
        parcelasIds = ordenados.map((r) => r.id);
      }
      setFormEntrada({
        data: item.data.split('T')[0] || item.data.slice(0, 10),
        nf: item.nf,
        descricaoFornecedor: item.descricaoFornecedor,
        valor: formatValorForInput(Number(item.valor) || 0),
        formaPagto: isBoleto ? 'Boleto' : (item.formaPagto ?? 'Dinheiro'),
        parcelas,
        parcelasIds,
        comunicarAgenda: item.comunicarAgenda ?? false,
      });
    } else {
      setEditingEntrada(null);
      setFormEntrada({
        data: hoje,
        nf: '',
        descricaoFornecedor: '',
        valor: '',
        formaPagto: 'Dinheiro',
        parcelas: [{ data: hoje, valor: '' }],
        parcelasIds: [],
        comunicarAgenda: false,
      });
    }
    setDialogEntrada(true);
  };

  /** Extrai o indice do recorrenciaIndice (ex.: "2/3" -> 2) para ordenar. */
  function parseRecorrenciaIndice(s?: string): number | null {
    if (!s?.trim()) return null;
    const m = s.trim().match(/^(\d+)\s*\/\s*\d+$/);
    return m ? parseInt(m[1], 10) : null;
  }

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
      toast.error('Preencha N.F. e Descricao/Fornecedor.');
      return;
    }
    if (!descricao) {
      toast.error('Preencha N.F. e Descricao/Fornecedor.');
      return;
    }
    if (formEntrada.formaPagto === 'Boleto' && !editingEntrada) {
      const validRows = formEntrada.parcelas.filter(
        (p) => p.data?.trim() && parseValorFromInput(p.valor) > 0
      );
      if (validRows.length === 0) {
        toast.error('Adicione ao menos uma parcela com data e valor.');
        return;
      }
      const parcelas = validRows.map((p) => ({
        data: p.data.trim().slice(0, 10),
        valor: parseValorFromInput(p.valor),
      }));
      const body = {
        tipo: 'entrada' as const,
        nf: formEntrada.nf.trim(),
        descricaoFornecedor: descricao,
        formaPagto: 'Boleto' as const,
        parcelas,
        comunicarAgenda: formEntrada.comunicarAgenda,
      };
      api
        .post<AtivoImobilizadoRow[] | { data: AtivoImobilizadoRow | AtivoImobilizadoRow[]; meta?: { criados?: number } }>('financeiro/ativo-imobilizado', body)
        .then((res) => {
          const raw = res.data;
          const meta = (raw as { meta?: { criados?: number } })?.meta?.criados;
          let created: AtivoImobilizadoRow[];
          if (Array.isArray(raw)) {
            created = raw;
          } else if (raw && typeof raw === 'object' && 'data' in raw) {
            const d = (raw as { data: AtivoImobilizadoRow | AtivoImobilizadoRow[] }).data;
            created = Array.isArray(d) ? d : (d ? [d] : []);
          } else {
            created = [];
          }
          const count = meta ?? created.length;
          toast.success(count > 1 ? `${count} parcelas adicionadas.` : 'Registro adicionado.');
          fetchEntradas();
          fetchSaidas();
          setDialogEntrada(false);
          setEditingEntrada(null);
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao criar'));
      return;
    }
    if (editingEntrada) {
      let data = formEntrada.data.slice(0, 10);
      let valorNum = parseValorFromInput(formEntrada.valor);
      if (formEntrada.formaPagto === 'Boleto' && formEntrada.parcelasIds.length > 0) {
        const idx = formEntrada.parcelasIds.indexOf(editingEntrada.id);
        if (idx >= 0 && formEntrada.parcelas[idx]) {
          data = formEntrada.parcelas[idx].data.trim().slice(0, 10);
          valorNum = parseValorFromInput(formEntrada.parcelas[idx].valor);
        }
      } else {
        valorNum = parseValorFromInput(formEntrada.valor);
        if (formEntrada.valor.trim() === '' || !Number.isFinite(valorNum)) {
          toast.error('Preencha Data, N.F., Descricao/Fornecedor e Valor.');
          return;
        }
      }
      const body = { data, nf: formEntrada.nf.trim(), descricaoFornecedor: descricao, valor: valorNum, formaPagto: formEntrada.formaPagto };
      api
        .patch<AtivoImobilizadoRow>(`financeiro/ativo-imobilizado/${editingEntrada.id}`, body)
        .then(() => {
          toast.success('Registro atualizado.');
          fetchEntradas();
          fetchSaidas();
          setDialogEntrada(false);
          setEditingEntrada(null);
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao atualizar'));
    } else {
      const valorNum = parseValorFromInput(formEntrada.valor);
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
      api
        .post<AtivoImobilizadoRow>('financeiro/ativo-imobilizado', body)
        .then((res) => {
          toast.success('Registro adicionado.');
          setEntradas((prev) => [...prev, res.data]);
          fetchSaidas();
          setDialogEntrada(false);
          setEditingEntrada(null);
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
        fetchSaidas();
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
        accessorKey: 'recorrenciaIndice',
        header: 'Parcela',
        cell: ({ row }) => {
          const indice = row.original.recorrenciaIndice;
          return indice ? <span className="text-slate-600">{indice}</span> : null;
        },
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

  /** Colunas da tabela Saida sem acoes (editar/excluir): saida e derivada da entrada. */
  const columnsSaida = useMemo<ColumnDef<AtivoImobilizadoRow>[]>(
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
        accessorKey: 'recorrenciaIndice',
        header: 'Parcela',
        cell: ({ row }) => {
          const indice = row.original.recorrenciaIndice;
          return indice ? <span className="text-slate-600">{indice}</span> : null;
        },
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
    columns: columnsSaida,
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
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-100 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-slate-800">Ativo Imobilizado - Entrada</h2>
            <div className="flex items-center gap-2">
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
              <button type="button" onClick={() => handleOpenDialogEntrada()} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700">
                <Plus className="h-3 w-3" />
                Novo
              </button>
            </div>
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
          <div className="border-b border-slate-200 bg-slate-100 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Ativo Imobilizado - Saida</h2>
              <p className="text-xs text-slate-500 mt-0.5">Preenchido automaticamente conforme Entrada e pagamentos na Agenda.</p>
            </div>
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
          {loading2 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            renderTable(tableSaida, totalSaida, saidas.length > 0, columnsSaida.length)
          )}
        </div>
      </div>

      <Dialog open={dialogEntrada} onOpenChange={setDialogEntrada}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEntrada ? 'Editar Entrada' : 'Nova Entrada'}</DialogTitle>
            <DialogDescription>
              {formEntrada.formaPagto === 'Boleto' && !editingEntrada
                ? 'Para Boleto: preencha N.F., descricao/fornecedor e as parcelas (vencimento e valor).'
                : 'Preencha data, N.F., descricao/fornecedor, valor e forma de pagto.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEntrada} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">N.F. <span className="text-red-500">*</span></label>
                <input type="text" value={formEntrada.nf} onChange={(e) => setFormEntrada({ ...formEntrada, nf: e.target.value })} className={inputClass} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Forma de Pagto <span className="text-red-500">*</span></label>
                <select
                  value={formEntrada.formaPagto}
                  onChange={(e) => {
                    const novaForma = e.target.value as AtivoImobilizadoFormaPagto;
                    if (novaForma === 'Boleto') {
                      setFormEntrada((prev) => {
                        const base = { data: prev.data, valor: prev.valor };
                        const novasParcelas =
                          prev.parcelas.length > 0
                            ? prev.parcelas.map((p, i) => (i === 0 ? base : p))
                            : [base];
                        return { ...prev, formaPagto: novaForma, parcelas: novasParcelas };
                      });
                    } else {
                      const first = formEntrada.parcelas[0];
                      setFormEntrada((prev) => ({
                        ...prev,
                        formaPagto: novaForma,
                        data: first?.data ?? prev.data,
                        valor: first?.valor ?? prev.valor,
                        parcelas: [],
                      }));
                    }
                  }}
                  className={inputClass}
                  required
                >
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto</option>
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">Descricao / Fornecedor <span className="text-red-500">*</span></label>
                <input type="text" value={formEntrada.descricaoFornecedor} onChange={(e) => setFormEntrada({ ...formEntrada, descricaoFornecedor: e.target.value.toUpperCase() })} className={`${inputClass} uppercase`} required />
              </div>
              {(editingEntrada || formEntrada.formaPagto !== 'Boleto') && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Data <span className="text-red-500">*</span></label>
                    <input type="date" value={formEntrada.data} onChange={(e) => setFormEntrada({ ...formEntrada, data: e.target.value })} className={inputClass} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Valor (R$) <span className="text-red-500">*</span></label>
                    <input type="text" inputMode="decimal" placeholder="0,00" value={formEntrada.valor} onChange={(e) => setFormEntrada({ ...formEntrada, valor: e.target.value })} className={inputClass} required />
                  </div>
                </>
              )}
              {formEntrada.formaPagto === 'Boleto' && (
                <>
                  <div className="space-y-2 sm:col-span-2">
                    <DataValorList
                      value={formEntrada.parcelas}
                      onChange={(parcelas) => setFormEntrada({ ...formEntrada, parcelas })}
                      label="Parcelas"
                      addLabel="Adicionar parcela"
                      showTotal
                      countLabel="parcela"
                      getNewItem={(valores) => {
                        const ultima = valores[valores.length - 1];
                        const dataBase = ultima?.data?.trim() || formEntrada.data;
                        const proximaData = dataBase ? addOneMonth(dataBase) : new Date().toISOString().split('T')[0];
                        const ultimoValor = ultima?.valor ?? formEntrada.valor;
                        return { data: proximaData, valor: ultimoValor };
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <input
                      id="comunicarAgendaEntrada"
                      type="checkbox"
                      checked={formEntrada.comunicarAgenda}
                      onChange={(e) => setFormEntrada({ ...formEntrada, comunicarAgenda: e.target.checked })}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="comunicarAgendaEntrada" className="text-sm font-medium text-slate-700">
                      Comunicar Agenda (registra saida ao marcar como pago na agenda)
                    </label>
                  </div>
                </>
              )}
            </div>
            </DialogBody>
            <DialogFooter>
              <button type="button" onClick={() => setDialogEntrada(false)} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">Cancelar</button>
              <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">{editingEntrada ? 'Salvar' : 'Adicionar'}</button>
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
    </div>
  );
}
