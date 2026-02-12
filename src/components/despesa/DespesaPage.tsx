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
import type { DespesaBase, DespesaInput, DespesaCategoriaConfig, DespesaCategoria } from '@/types/despesa';
import { TIPOS_DESPESA } from '@/types/despesa';
import type { TipoRecorrencia } from '@/types/recorrencia';
import { SelectRecorrencia, RecorrenciaBadge } from '@/components/ui/select-recorrencia';
import { useDespesaTiposStore } from '@/stores/despesaTiposStore';
import { useAgendaStore } from '@/stores/agendaStore';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import { buildTableColumns } from '@/lib/buildTableColumns';
import { ExportButtons } from '@/components/ui/export-buttons';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { formatDateToLocalYYYYMMDD, formatDateStringToBR } from '@/lib/date';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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

/** Ordem padrao das colunas; recorrencia vem do backend e e exibida na tabela. */
const DESPESA_TABLE_DEFAULT_ORDER = ['data', 'tipo', 'descricao', 'valor', 'recorrencia'];

interface DespesaPageProps {
  config: DespesaCategoriaConfig;
  items: DespesaBase[];
  columns?: TableColumnConfigFromApi[] | null;
  isLoading: boolean;
  fetchItems: (params?: { dataInicio?: string; dataFim?: string }) => Promise<void>;
  addItem: (data: DespesaInput) => Promise<void>;
  updateItem: (id: string, data: Partial<DespesaInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  /** Exibir opcao "Comunicar agenda" no formulario. Investimento nao usa. Default true. */
  showComunicarAgenda?: boolean;
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
  showComunicarAgenda = true,
}: DespesaPageProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DespesaBase | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);

  const [formData, setFormData] = useState<DespesaInput & { recorrente: boolean }>({
    data: '',
    tipo: '',
    descricao: '',
    valor: 0,
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
  const tiposDisponiveis = [...defaultLabels, ...customTipos.map((t) => t.label)];

  // Lista para o dialog: padroes (sem id) + tipos da API que nao sao padrao (com id, podem excluir)
  const tiposParaListar = [
    ...defaultLabels.map((label) => ({ label, id: undefined as string | undefined })),
    ...customTipos.map((t) => ({ label: t.label, id: t.id })),
  ];

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
      setFormData({
        data: formatDateForInput(item.data),
        tipo: item.tipo || '',
        descricao: item.descricao,
        valor: item.valor,
        comunicarAgenda: item.comunicarAgenda || false,
        recorrencia: item.recorrencia,
        recorrenciaFim: item.recorrenciaFim,
        recorrente: rec !== 'unica',
      });
    } else {
      setEditingItem(null);
      setFormData({
        data: formatDateToLocalYYYYMMDD(new Date()),
        tipo: tiposDisponiveis[0] || '',
        descricao: '',
        valor: 0,
        comunicarAgenda: false,
        recorrente: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({ data: '', tipo: '', descricao: '', valor: 0, comunicarAgenda: false, recorrente: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tipo) {
      toast.error('Tipo e obrigatorio');
      return;
    }

    if (formData.valor <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    try {
      const payload: DespesaInput = {
        data: formData.data,
        tipo: formData.tipo,
        descricao: formData.descricao,
        valor: formData.valor,
        comunicarAgenda: formData.comunicarAgenda,
        recorrencia: formData.recorrente ? (formData.recorrencia || 'mensal') : 'unica',
        recorrenciaFim: formData.recorrente ? formData.recorrenciaFim : undefined,
      };
      if (editingItem) {
        await updateItem(editingItem.id, payload);
        toast.success('Registro atualizado com sucesso!');
      } else {
        await addItem(payload);
        toast.success('Registro adicionado com sucesso!');
      }
      handleCloseDialog();
      fetchAgendaDias(dateParams).catch(() => {});
    } catch {
      toast.error('Erro ao salvar registro');
    }
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;

    try {
      await deleteItem(deleteItemId);
      toast.success('Registro excluido com sucesso!');
      setDeleteItemId(null);
    } catch {
      toast.error('Erro ao excluir registro');
    }
  };

  const columnDefsByKey = useMemo<Record<string, ColumnDef<DespesaBase>>>(
    () => ({
      data: {
        accessorKey: 'data',
        header: ({ column }) => (
          <button
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
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Tipo
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
            {row.getValue('tipo') || '-'}
          </span>
        ),
      },
      descricao: {
        accessorKey: 'descricao',
        header: ({ column }) => (
          <button
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
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Recorrencia
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => {
          const value = (row.getValue('recorrencia') as string) || 'unica';
          return value === 'unica' ? (
            <span className="text-slate-400">-</span>
          ) : (
            <RecorrenciaBadge value={value as TipoRecorrencia} />
          );
        },
      },
    }),
    []
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
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Excluir"
            onClick={() => setDeleteItemId(row.original.id)}
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
        ['tipo', 'recorrencia']
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
            data={(filteredItems ?? []).map((item) => ({
              data: formatDate(item.data),
              tipo: item.tipo || '-',
              descricao: item.descricao,
              valor: formatCurrency(item.valor),
              recorrencia: item.recorrencia ?? 'unica',
            }))}
            columns={[
              { key: 'data', label: 'Data' },
              { key: 'tipo', label: 'Tipo' },
              { key: 'descricao', label: 'Descricao' },
              { key: 'valor', label: 'Valor' },
              { key: 'recorrencia', label: 'Recorrencia' },
            ]}
            filename={config.key}
            title={config.title}
          />
          <button
            onClick={() => handleOpenDialog()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
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
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-500"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
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
                  <tr key={row.id} className="hover:bg-slate-50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap px-6 py-4 text-sm text-slate-600"
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
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Excluir"
                          onClick={() => setDeleteItemId(item.id)}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Registro' : 'Novo Registro'}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? 'Altere os dados do registro.'
                : 'Preencha os dados do novo registro.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
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
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="tipo"
                    className="text-sm font-medium text-slate-700"
                  >
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-1">
                    <select
                      id="tipo"
                      value={formData.tipo}
                      onChange={(e) =>
                        setFormData({ ...formData, tipo: e.target.value })
                      }
                      className="flex h-10 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 uppercase"
                      required
                    >
                      <option value="">Selecione...</option>
                      {tiposDisponiveis.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
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
                  Descricao
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
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.valor || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valor: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="recorrente"
                  type="checkbox"
                  checked={formData.recorrente || false}
                  onChange={(e) =>
                    setFormData({ ...formData, recorrente: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label
                  htmlFor="recorrente"
                  className="text-sm font-medium text-slate-700"
                >
                  Recorrente
                </label>
              </div>
              {formData.recorrente && (
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
                    />
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
            <DialogFooter>
              <button
                type="button"
                onClick={handleCloseDialog}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 ring-offset-white transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white ring-offset-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar tipos</DialogTitle>
            <DialogDescription>
              Adicione ou remova tipos para {config.title}. Nao e possivel excluir um tipo que ja possua lancamentos.
            </DialogDescription>
          </DialogHeader>
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
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (novoTipoLabel.trim()) {
                      addTipo(config.key, novoTipoLabel.trim().toUpperCase())
                        .then(() => {
                          setNovoTipoLabel('');
                          toast.success('Tipo adicionado.');
                        })
                        .catch((err) => {
                          toast.error(
                            err instanceof Error ? err.message : 'Erro ao adicionar tipo'
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
                      toast.success('Tipo adicionado.');
                    })
                    .catch((err) => {
                      toast.error(
                        err instanceof Error ? err.message : 'Erro ao adicionar tipo'
                      );
                    });
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isLoadingTipos ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Adicionar
              </button>
            </div>
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
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
                              err instanceof Error
                                ? err.message
                                : 'Nao foi possivel excluir. O tipo pode estar em uso.'
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
          </div>
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
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
