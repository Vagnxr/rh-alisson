import { useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DespesaBase, DespesaInput, DespesaComParcelasInput, DespesaUpdatePayload, DespesaCategoriaConfig, DespesaCategoria } from '@/types/despesa';
import { TIPOS_DESPESA, ABREVIACOES_TIPO_FUNCIONARIO } from '@/types/despesa';
import type { TipoRecorrencia } from '@/types/recorrencia';
import { SelectRecorrencia, RecorrenciaBadge } from '@/components/ui/select-recorrencia';
import { DataValorList, type DataValorItem } from '@/components/ui/data-valor-list';
import { useDespesaTiposStore } from '@/stores/despesaTiposStore';
import { useAgendaStore } from '@/stores/agendaStore';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import { buildTableColumns } from '@/lib/buildTableColumns';
import { ExportButtons } from '@/components/ui/export-buttons';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { formatDateToLocalYYYYMMDD, formatDateStringToBR, addOneMonth } from '@/lib/date';
import { formatValorForInput, parseValorFromInput } from '@/lib/formatValor';
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

/** Ordem padrao quando a API nao envia columns. Inclui parcelas para que row.original.parcelas (com pago) esteja disponivel. */
const DESPESA_TABLE_DEFAULT_ORDER = ['data', 'tipo', 'descricao', 'valor', 'parcelas'];

interface DespesaPageProps {
  config: DespesaCategoriaConfig;
  items: DespesaBase[];
  columns?: TableColumnConfigFromApi[] | null;
  isLoading: boolean;
  fetchItems: (params?: { dataInicio?: string; dataFim?: string }) => Promise<void>;
  addItem: (data: DespesaInput) => Promise<void>;
  updateItem: (id: string, data: DespesaUpdatePayload) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  /** Modo B: criar serie em um unico POST com parcelas. Quando informado e useRecorrenciaDataValorList, usado na criacao. */
  addItemComParcelas?: (data: DespesaComParcelasInput) => Promise<void>;
  /** Exibir opcao "Comunicar agenda" no formulario. Investimento nao usa. Default true. */
  showComunicarAgenda?: boolean;
  /** Usar lista Data/Valor (recorrencia como multiplas linhas com data) em vez de campo unico + checkbox recorrente. */
  useRecorrenciaDataValorList?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(date: string) {
  return formatDateStringToBR(date);
}

function formatDateForInput(date: string) {
  return date.split('T')[0];
}

export function DespesaPage({
  config,
  items,
  columns: columnsFromApi,
  isLoading,
  fetchItems,
  addItem,
  updateItem,
  deleteItem,
  addItemComParcelas,
  showComunicarAgenda = true,
  useRecorrenciaDataValorList = false,
}: DespesaPageProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DespesaBase | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);

  type FormState = Omit<DespesaInput, 'valor'> & { valor: string } & { recorrente: boolean } & { valores?: DataValorItem[] };
  const [formData, setFormData] = useState<FormState>({
    data: '',
    tipo: '',
    descricao: '',
    valor: '',
    comunicarAgenda: false,
    recorrente: false,
  });

  const [isTiposDialogOpen, setIsTiposDialogOpen] = useState(false);
  const [novoTipoLabel, setNovoTipoLabel] = useState('');

  const {
    fetchTipos,
    getTipos,
    addTipo,
    deleteTipo,
    isLoading: isLoadingTipos,
    error: tiposError,
  } = useDespesaTiposStore();
  const fetchAgendaDias = useAgendaStore((s) => s.fetchDias);

  const tiposFromStore = getTipos(config.key);
  const defaultLabels =
    TIPOS_DESPESA[config.key as DespesaCategoria] || ['OUTROS'];
  const customTipos = tiposFromStore.filter(
    (t) => !defaultLabels.includes(t.label)
  );
  const tiposDisponiveis = [...defaultLabels, ...customTipos.map((t) => t.label)].sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );

  // Lista para o dialog: padroes (sem id) + tipos da API que nao sao padrao (com id, podem excluir), em ordem alfabetica
  const tiposParaListar = [
    ...defaultLabels.map((label) => ({ label, id: undefined as string | undefined })),
    ...customTipos.map((t) => ({ label: t.label, id: t.id })),
  ].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  const dateParams = useMemo(() => ({
    dataInicio: formatDateToLocalYYYYMMDD(dateFilter.startDate),
    dataFim: formatDateToLocalYYYYMMDD(dateFilter.endDate),
  }), [dateFilter.startDate, dateFilter.endDate]);

  useEffect(() => {
    fetchItems(dateParams);
  }, [fetchItems, dateParams.dataInicio, dateParams.dataFim]);

  useEffect(() => {
    fetchTipos(config.key).catch(() => {});
  }, [config.key, fetchTipos]);

  // Backend ja retorna itens filtrados por dataInicio/dataFim; nao filtrar de novo no cliente
  const filteredItems = items ?? [];

  const handleOpenDialog = (item?: DespesaBase) => {
    if (item) {
      setEditingItem(item);
      const rec = (item.recorrencia ?? 'unica') as TipoRecorrencia;
      const parcelasFromBackend = item.parcelas && item.parcelas.length > 0;
      const normData = (s: string) => (s ?? '').toString().split('T')[0] || (s ?? '').toString().slice(0, 10);
      let valoresInit: DataValorItem[] | undefined;
      if (useRecorrenciaDataValorList && parcelasFromBackend) {
        console.log('parcelasFromBackend', item.parcelas);
        valoresInit = item.parcelas!.map((p) => ({
          data: normData(p.dataVencimento ?? ''),
          valor: formatValorForInput(Number(p.valor) || 0),
          disabled: !!p.pago,
        }));
      } else if (useRecorrenciaDataValorList && rec !== 'unica') {
        valoresInit = [{ data: formatDateForInput(item.data), valor: formatValorForInput(item.valor) }];
      }
      setFormData({
        data: formatDateForInput(item.data),
        tipo: item.tipo || '',
        descricao: item.descricao,
        valor: formatValorForInput(item.valor),
        comunicarAgenda: item.comunicarAgenda || false,
        recorrencia: item.recorrencia,
        recorrenciaFim: item.recorrenciaFim,
        recorrente: parcelasFromBackend ? true : rec !== 'unica',
        ...(valoresInit ? { valores: valoresInit } : {}),
      });
    } else {
      setEditingItem(null);
      setFormData({
        data: formatDateToLocalYYYYMMDD(new Date()),
        tipo: tiposDisponiveis[0] || '',
        descricao: '',
        valor: '',
        comunicarAgenda: false,
        recorrente: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({
      data: '',
      tipo: '',
      descricao: '',
      valor: '',
      comunicarAgenda: false,
      recorrente: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tipo) {
      toast.error(<span data-testid="despesa-categoria-mensagem-erro">Tipo e obrigatorio</span>);
      return;
    }

    if (useRecorrenciaDataValorList && formData.recorrente && formData.valores?.length) {
      const validRows = formData.valores.filter(
        (r) => r.data.trim() && parseValorFromInput(r.valor) > 0
      );
      if (validRows.length === 0) {
        toast.error(<span data-testid="despesa-categoria-mensagem-erro">Adicione ao menos uma data com valor maior que zero na tabela.</span>);
        return;
      }
      try {
        if (editingItem) {
          await updateItem(editingItem.id, {
            tipo: formData.tipo,
            descricao: formData.descricao,
            comunicarAgenda: formData.comunicarAgenda,
            parcelas: validRows.map((r) => ({
              data: r.data.trim().slice(0, 10),
              valor: parseValorFromInput(r.valor),
            })),
          });
          toast.success(<span data-testid="despesa-categoria-mensagem-sucesso">Registro atualizado com sucesso!</span>);
        } else if (addItemComParcelas && validRows.length > 0) {
          await addItemComParcelas({
            tipo: formData.tipo,
            descricao: formData.descricao,
            comunicarAgenda: formData.comunicarAgenda,
            parcelas: validRows.map((r) => ({
              data: r.data,
              valor: parseValorFromInput(r.valor),
            })),
          });
          toast.success(<span data-testid="despesa-categoria-mensagem-sucesso">{validRows.length > 1 ? `${validRows.length} registros adicionados.` : 'Registro adicionado com sucesso!'}</span>);
        } else {
          for (const row of validRows) {
            await addItem({
              data: row.data,
              tipo: formData.tipo,
              descricao: formData.descricao,
              valor: parseValorFromInput(row.valor),
              comunicarAgenda: formData.comunicarAgenda,
            });
          }
          toast.success(<span data-testid="despesa-categoria-mensagem-sucesso">{validRows.length > 1 ? `${validRows.length} registros adicionados.` : 'Registro adicionado com sucesso!'}</span>);
        }
        handleCloseDialog();
        await fetchItems(dateParams);
        fetchAgendaDias(dateParams).catch(() => {});
      } catch {
        toast.error(<span data-testid="despesa-categoria-mensagem-erro">Erro ao salvar registro</span>);
      }
      return;
    }

    const valorNum = parseValorFromInput(formData.valor);
    if (valorNum <= 0) {
      toast.error(<span data-testid="despesa-categoria-mensagem-erro">Valor deve ser maior que zero</span>);
      return;
    }

    try {
      const payload: DespesaInput = {
        data: formData.data,
        tipo: formData.tipo,
        descricao: formData.descricao,
        valor: valorNum,
        comunicarAgenda: formData.comunicarAgenda,
        ...(formData.recorrente
          ? {
              recorrencia: formData.recorrencia || 'mensal',
              recorrenciaFim: formData.recorrenciaFim,
            }
          : {}),
      };
      if (editingItem) {
        await updateItem(editingItem.id, payload);
        toast.success(<span data-testid="despesa-categoria-mensagem-sucesso">Registro atualizado com sucesso!</span>);
      } else {
        await addItem(payload);
        toast.success(<span data-testid="despesa-categoria-mensagem-sucesso">Registro adicionado com sucesso!</span>);
      }
      handleCloseDialog();
      fetchAgendaDias(dateParams).catch(() => {});
    } catch {
      toast.error(<span data-testid="despesa-categoria-mensagem-erro">Erro ao salvar registro</span>);
    }
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;

    try {
      await deleteItem(deleteItemId);
      toast.success(<span data-testid="despesa-categoria-mensagem-sucesso">Registro excluido com sucesso!</span>);
      setDeleteItemId(null);
    } catch (err) {
      toast.error(<span data-testid="despesa-categoria-mensagem-erro">{err instanceof Error ? err.message : 'Erro ao excluir registro'}</span>);
    }
  };

  const columnDefsByKey = useMemo<Record<string, ColumnDef<DespesaBase>>>(
    () => ({
      data: {
        accessorKey: 'data',
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Data
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => formatDate(row.getValue('data')),
      },
      tipo: {
        accessorKey: 'tipo',
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tipo
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => {
          const tipo = (row.getValue('tipo') as string) || '';
          const label =
            config.key === 'despesa-funcionario' && ABREVIACOES_TIPO_FUNCIONARIO[tipo]
              ? ABREVIACOES_TIPO_FUNCIONARIO[tipo]
              : tipo;
          return (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {label || '-'}
            </span>
          );
        },
      },
      descricao: {
        accessorKey: 'descricao',
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Descricao
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
      },
      valor: {
        accessorKey: 'valor',
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Valor
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">
            {formatCurrency(row.getValue('valor'))}
          </span>
        ),
      },
      recorrencia: {
        accessorKey: 'recorrencia',
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Recorrencia
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => {
          const value = (row.getValue('recorrencia') as string) || 'unica';
          const indice = row.original.recorrenciaIndice;
          if (value === 'unica') {
            if (indice) {
              return (
                <span className="text-sm font-medium text-slate-600" title="Parcela da série">
                  {indice}
                </span>
              );
            }
            return <span className="text-slate-400">-</span>;
          }
          return (
            <span className="inline-flex items-center gap-1.5">
              <RecorrenciaBadge value={value as TipoRecorrencia} />
              {indice ? (
                <span className="text-xs text-slate-500">{indice}</span>
              ) : null}
            </span>
          );
        },
      },
      comunicarAgenda: {
        accessorKey: 'comunicarAgenda',
        header: 'Comunicar agenda',
        cell: ({ row }) => {
          const v = row.original.comunicarAgenda;
          return v ? <span className="text-slate-900">Sim</span> : <span className="text-slate-900">Nao</span>;
        },
      },
      categoria: {
        accessorKey: 'categoria',
        header: 'Categoria',
        cell: ({ row }) => row.original.categoria ?? '-',
      },
      observacao: {
        accessorKey: 'observacao',
        header: 'Observacao',
        cell: ({ row }) => row.original.observacao ?? '-',
      },
      parcelas: {
        accessorKey: 'parcelas',
        header: 'Parcelas',
        cell: ({ row }) => {
          const parcelas = row.original.parcelas;
          if (!parcelas?.length) return <span className="text-slate-400">-</span>;
          const pagas = parcelas.filter((p) => p.pago).length;
          const total = parcelas.length;
          if (pagas === 0) return <span className="text-slate-700">{total} parcela{total !== 1 ? 's' : ''}</span>;
          return (
            <span className="text-slate-700" title={`${pagas} de ${total} pagas`}>
              {pagas}/{total} pagas
            </span>
          );
        },
      },
    }),
    [config.key]
  );

  const actionsColumn: ColumnDef<DespesaBase> = useMemo(
    () => ({
      id: 'actions',
      header: () => <span className="sr-only">Acoes</span>,
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            title="Editar"
            onClick={() => handleOpenDialog(row.original)}
            data-testid="despesa-categoria-linha-editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Excluir"
            onClick={() => setDeleteItemId(row.original.id)}
            data-testid="despesa-categoria-linha-excluir"
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
      buildTableColumns<DespesaBase>(
        columnDefsByKey,
        columnsFromApi ?? null,
        DESPESA_TABLE_DEFAULT_ORDER,
        actionsColumn,
        undefined,
        columnsFromApi?.length ? undefined : DESPESA_TABLE_DEFAULT_ORDER
      ),
    [columnDefsByKey, columnsFromApi, actionsColumn]
  );

  const table = useReactTable({
    data: filteredItems ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const total = useMemo(
    () => (filteredItems ?? []).reduce((acc, d) => acc + d.valor, 0),
    [filteredItems]
  );

  if (isLoading && items.length === 0) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {config.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{config.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={
              columnsFromApi?.length
                ? (filteredItems ?? []).map((item) => {
                    const row: Record<string, string> = {};
                    const itemAny = item as unknown as Record<string, unknown>;
                    for (const col of columnsFromApi) {
                      if (col.id === 'data') row.data = formatDate(item.data);
                      else if (col.id === 'tipo') row.tipo = item.tipo || '-';
                      else if (col.id === 'descricao') row.descricao = item.descricao;
                      else if (col.id === 'valor') row.valor = formatCurrency(item.valor);
                      else if (col.id === 'recorrencia') row.recorrencia = item.recorrencia ?? 'unica';
                      else if (col.id === 'comunicarAgenda') row.comunicarAgenda = item.comunicarAgenda ? 'Sim' : 'Nao';
                      else row[col.id] = String(itemAny[col.id] ?? '-');
                    }
                    return row;
                  })
                : (filteredItems ?? []).map((item) => ({
                    data: formatDate(item.data),
                    tipo: item.tipo || '-',
                    descricao: item.descricao,
                    valor: formatCurrency(item.valor),
                    recorrencia: item.recorrencia ?? 'unica',
                  }))
            }
            columns={
              columnsFromApi?.length
                ? columnsFromApi.map((c) => ({ key: c.id, label: c.label }))
                : [
                    { key: 'data', label: 'Data' },
                    { key: 'tipo', label: 'Tipo' },
                    { key: 'descricao', label: 'Descricao' },
                    { key: 'valor', label: 'Valor' },
                    { key: 'recorrencia', label: 'Recorrencia' },
                  ]
            }
            filename={config.key}
            title={config.title}
          />
          <button
            onClick={() => handleOpenDialog()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            data-testid="despesa-categoria-novo-registro"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Registro</span>
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-slate-200 bg-white">
        {/* Tabela Desktop */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full" data-testid="despesa-categoria-tabela">
            <thead className="border-b border-slate-200 bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const colId = header.column.id;
                    const slug = colId === 'comunicarAgenda' ? 'comunicar-agenda' : colId === 'actions' ? 'acoes' : colId;
                    return (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-500"
                      data-testid={`despesa-categoria-tabela-header-${slug}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    Nenhum registro cadastrado
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50" data-testid="despesa-categoria-tabela-linha">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap px-6 py-4 text-sm text-slate-600"
                        data-testid={`despesa-categoria-celula-${cell.column.id === 'comunicarAgenda' ? 'comunicar-agenda' : cell.column.id === 'actions' ? 'acoes' : cell.column.id}`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td
                    colSpan={Math.max(1, columns.length - 2)}
                    className="px-6 py-3 text-right text-sm font-medium text-slate-900"
                  >
                    Total:
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-slate-900">
                    {formatCurrency(total)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Lista Mobile */}
        <div className="divide-y divide-slate-200 sm:hidden">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">
              Nenhum registro encontrado
            </div>
          ) : (
            <>
              {filteredItems.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900">
                        {item.descricao}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatDate(item.data)}
                      </p>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(item.valor)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Editar"
                          onClick={() => handleOpenDialog(item)}
                          data-testid="despesa-categoria-linha-editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Excluir"
                          onClick={() => setDeleteItemId(item.id)}
                          data-testid="despesa-categoria-linha-excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {/* Total Mobile */}
              <div className="flex items-center justify-between bg-slate-50 p-4">
                <span className="font-medium text-slate-700">Total</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(total)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialog Adicionar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="despesa-categoria-dialog">
          <DialogHeader>
            <DialogTitle data-testid="despesa-categoria-dialog-titulo">
              {editingItem ? 'Editar Registro' : 'Novo Registro'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Altere os dados do registro.'
                : 'Preencha os dados do novo registro.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="data"
                    className="text-sm font-medium text-slate-700"
                  >
                    Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) =>
                      setFormData({ ...formData, data: e.target.value })
                    }
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 uppercase"
                    required
                    data-testid="despesa-categoria-data"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="tipo"
                    className="text-sm font-medium text-slate-700"
                  >
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex min-w-0 gap-1">
                    <select
                      id="tipo"
                      value={formData.tipo}
                      onChange={(e) =>
                        setFormData({ ...formData, tipo: e.target.value })
                      }
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 uppercase"
                      required
                      data-testid="despesa-categoria-tipo"
                    >
                      <option value="">Selecione...</option>
                      {tiposDisponiveis.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {config.key === 'despesa-funcionario' && ABREVIACOES_TIPO_FUNCIONARIO[tipo]
                            ? ABREVIACOES_TIPO_FUNCIONARIO[tipo]
                            : tipo}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setNovoTipoLabel('');
                        setIsTiposDialogOpen(true);
                      }}
                      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-emerald-600"
                      title="Adicionar ou gerenciar tipos"
                      data-testid="despesa-categoria-btn-tipos"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="descricao"
                  className="text-sm font-medium text-slate-700"
                >
                  Descrição
                </label>
                <input
                  id="descricao"
                  type="text"
                  placeholder={config.placeholder}
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value.toUpperCase() })
                  }
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 uppercase"
                  data-testid="despesa-categoria-descricao"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="valor"
                  className="text-sm font-medium text-slate-700"
                >
                  Valor (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  id="valor"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valor: e.target.value,
                    })
                  }
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                  data-testid="despesa-categoria-valor"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="recorrente"
                  type="checkbox"
                  checked={formData.recorrente || false}
                  data-testid="despesa-categoria-recorrente"
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData((prev) => ({
                      ...prev,
                      recorrente: checked,
                        ...(useRecorrenciaDataValorList && checked
                          ? {
                              valores: prev.valores?.length
                                ? [{ data: prev.data, valor: prev.valor }, ...prev.valores.slice(1)]
                                : [{ data: prev.data, valor: prev.valor }],
                            }
                          : {}),
                    }));
                  }}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="recorrente"
                  className="text-sm font-medium text-slate-700"
                >
                  Recorrente
                </label>
              </div>
              {formData.recorrente && useRecorrenciaDataValorList && formData.valores && (
                <DataValorList
                  value={formData.valores}
                  onChange={(valores) => setFormData({ ...formData, valores })}
                  label="Datas da recorrencia"
                  addLabel="Adicionar valor"
                  showTotal
                  getNewItem={(valores) => {
                    const ultima = valores[valores.length - 1];
                    const dataBase = ultima?.data?.trim() || formData.data;
                    const proximaData = dataBase ? addOneMonth(dataBase) : formatDateToLocalYYYYMMDD(new Date());
                    return { data: proximaData, valor: formData.valor };
                  }}
                />
              )}
              {formData.recorrente && !useRecorrenciaDataValorList && (
                <div className="grid grid-cols-2 gap-4">
                  <SelectRecorrencia
                    value={(formData.recorrencia as TipoRecorrencia) || 'mensal'}
                    onChange={(value) =>
                      setFormData({ ...formData, recorrencia: value })
                    }
                    label="Periodicidade"
                  />
                  <div className="space-y-2">
                    <label
                      htmlFor="recorrenciaFim"
                      className="text-sm font-medium text-slate-700"
                    >
                      Data fim (opcional)
                    </label>
                    <input
                      id="recorrenciaFim"
                      type="date"
                      value={formData.recorrenciaFim || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recorrenciaFim: e.target.value || undefined,
                        })
                      }
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                      data-testid="despesa-categoria-recorrencia-fim"
                    />
                    <p className="text-xs text-slate-500">
                      Última data de vencimento da série. A data informada acima conta como a primeira ocorrência (ex.: 6 meses a partir de 13/02 = 13/02, 13/03, …, 13/07). Deixe em branco para gerar até 12 meses.
                    </p>
                  </div>
                </div>
              )}
              {showComunicarAgenda && (
                <div className="flex items-center gap-2">
                  <input
                    id="comunicarAgenda"
                    type="checkbox"
                    checked={formData.comunicarAgenda || false}
                    onChange={(e) =>
                      setFormData({ ...formData, comunicarAgenda: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    data-testid="despesa-categoria-comunicar-agenda"
                  />
                  <label
                    htmlFor="comunicarAgenda"
                    className="text-sm font-medium text-slate-700"
                  >
                    Comunicar Agenda
                  </label>
                </div>
              )}
            </div>
            </DialogBody>
            <DialogFooter>
              <button
                type="button"
                onClick={handleCloseDialog}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 ring-offset-white transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                data-testid="despesa-categoria-cancelar"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white ring-offset-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                data-testid="despesa-categoria-submit"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingItem ? 'Salvar' : 'Adicionar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Gerenciar Tipos */}
      <Dialog open={isTiposDialogOpen} onOpenChange={setIsTiposDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar tipos</DialogTitle>
            <DialogDescription>
              Adicione ou remova tipos para {config.title}. Nao e possivel excluir um tipo que ja possua lancamentos.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
          <div className="space-y-4 py-4">
            {tiposError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {tiposError}
              </p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do tipo"
                value={novoTipoLabel}
                onChange={(e) =>
                  setNovoTipoLabel(e.target.value.trim().toUpperCase())
                }
                data-testid="despesa-categoria-tipo-input-nome"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (novoTipoLabel.trim()) {
                      addTipo(config.key, novoTipoLabel.trim().toUpperCase())
                        .then(() => {
                          setNovoTipoLabel('');
                          toast.success(<span data-testid="despesa-categoria-mensagem-sucesso">Tipo adicionado.</span>);
                        })
                        .catch((err) => {
                          toast.error(
                            <span data-testid="despesa-categoria-mensagem-erro">{err instanceof Error ? err.message : 'Erro ao adicionar tipo'}</span>
                          );
                        });
                    }
                  }
                }}
                className="flex flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm uppercase placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
              <button
                type="button"
                disabled={!novoTipoLabel.trim() || isLoadingTipos}
                onClick={() => {
                  const label = novoTipoLabel.trim().toUpperCase();
                  if (!label) return;
                  addTipo(config.key, label)
                    .then(() => {
                      setNovoTipoLabel('');
                      toast.success(<span data-testid="despesa-categoria-mensagem-sucesso">Tipo adicionado.</span>);
                    })
                    .catch((err) => {
                      toast.error(
                        <span data-testid="despesa-categoria-mensagem-erro">{err instanceof Error ? err.message : 'Erro ao adicionar tipo'}</span>
                      );
                    });
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                data-testid="despesa-categoria-tipo-adicionar"
              >
                {isLoadingTipos ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Adicionar
              </button>
            </div>
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2" data-testid="despesa-categoria-tipo-lista">
              {tiposParaListar.length === 0 ? (
                <li className="py-4 text-center text-sm text-slate-500">
                  Nenhum tipo. Adicione acima.
                </li>
              ) : (
                tiposParaListar.map((t) => (
                  <li
                    key={t.id ?? t.label}
                    className="flex items-center justify-between rounded bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    <span>{t.label}</span>
                    {t.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          deleteTipo(t.id!).catch((err) => {
                            toast.error(
                              <span data-testid="despesa-categoria-mensagem-erro">
                                {err instanceof Error
                                  ? err.message
                                  : 'Nao foi possivel excluir. O tipo pode estar em uso.'}
                              </span>
                            );
                          });
                        }}
                        disabled={isLoadingTipos}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                        title="Excluir tipo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">padrao</span>
                    )}
                  </li>
                ))
              )}
            </ul>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsTiposDialogOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                data-testid="despesa-categoria-tipo-cancelar"
              >
                Fechar
              </button>
            </div>
          </div>
          </DialogBody>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Confirmar Exclusao */}
      <AlertDialog
        open={!!deleteItemId}
        onOpenChange={(open) => !open && setDeleteItemId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro? Esta acao nao pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} data-testid="despesa-categoria-confirmar-excluir">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
