import { useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Plus, Pencil, Trash2, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DespesaBase, DespesaInput } from '@/types/despesa';
import { TIPOS_DESPESA } from '@/types/despesa';
import { BANCOS_PADRAO, getBancoIcon, type Banco } from '@/types/banco';
import { DateFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { ExportButtons } from '@/components/ui/export-buttons';
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
import { cn } from '@/lib/cn';

// Extende DespesaBase para incluir banco
interface DespesaBanco extends DespesaBase {
  bancoId?: string;
}

interface DespesaBancoInput extends DespesaInput {
  bancoId?: string;
}

interface DespesaBancoPageProps {
  items: DespesaBanco[];
  isLoading: boolean;
  fetchItems: () => Promise<void>;
  addItem: (data: DespesaBancoInput) => Promise<void>;
  updateItem: (id: string, data: Partial<DespesaBancoInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR');
}

function formatDateForInput(date: string) {
  return date.split('T')[0];
}

// Componente de selecao de banco com visual de cards
function BancoSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (bancoId: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">
        Banco <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
        {BANCOS_PADRAO.map((banco) => (
          <button
            key={banco.id}
            type="button"
            onClick={() => onChange(banco.id)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border-2 p-2 transition-all hover:shadow-md',
              value === banco.id
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: banco.cor }}
            >
              {getBancoIcon(banco)}
            </div>
            <span className="text-xs font-medium text-slate-700 text-center leading-tight">
              {banco.nome.split(' ')[0]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

// Componente de badge do banco
function BancoBadge({ bancoId }: { bancoId?: string }) {
  const banco = BANCOS_PADRAO.find((b) => b.id === bancoId);
  if (!banco) return <span className="text-slate-400">-</span>;

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ backgroundColor: banco.cor }}
      >
        {getBancoIcon(banco)}
      </div>
      <span className="text-sm font-medium">{banco.nome}</span>
    </div>
  );
}

export function DespesaBancoPageComponent({
  items,
  isLoading,
  fetchItems,
  addItem,
  updateItem,
  deleteItem,
}: DespesaBancoPageProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DespesaBanco | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>();
  const [bancoFilter, setBancoFilter] = useState<string>('');

  const [formData, setFormData] = useState<DespesaBancoInput>({
    data: '',
    tipo: '',
    descricao: '',
    valor: 0,
    bancoId: '',
    comunicarAgenda: false,
  });

  const tiposDisponiveis = TIPOS_DESPESA['despesa-banco'] || ['OUTROS'];

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filtra items por data e banco
  const filteredItems = useMemo(() => {
    let result = items;

    if (dateFilter) {
      result = result.filter((item) => {
        const itemDate = new Date(item.data);
        return itemDate >= dateFilter.startDate && itemDate <= dateFilter.endDate;
      });
    }

    if (bancoFilter) {
      result = result.filter((item) => item.bancoId === bancoFilter);
    }

    return result;
  }, [items, dateFilter, bancoFilter]);

  const handleOpenDialog = (item?: DespesaBanco) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        data: formatDateForInput(item.data),
        tipo: item.tipo || '',
        descricao: item.descricao,
        valor: item.valor,
        bancoId: item.bancoId || '',
        comunicarAgenda: item.comunicarAgenda || false,
      });
    } else {
      setEditingItem(null);
      setFormData({
        data: new Date().toISOString().split('T')[0],
        tipo: tiposDisponiveis[0] || '',
        descricao: '',
        valor: 0,
        bancoId: '',
        comunicarAgenda: false,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    setFormData({ data: '', tipo: '', descricao: '', valor: 0, bancoId: '', comunicarAgenda: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.bancoId) {
      toast.error('Selecione um banco');
      return;
    }

    if (!formData.tipo) {
      toast.error('Tipo e obrigatorio');
      return;
    }

    if (!formData.descricao.trim()) {
      toast.error('Descricao e obrigatoria');
      return;
    }

    if (formData.valor <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    try {
      if (editingItem) {
        await updateItem(editingItem.id, formData);
        toast.success('Registro atualizado com sucesso!');
      } else {
        await addItem(formData);
        toast.success('Registro adicionado com sucesso!');
      }
      handleCloseDialog();
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

  const columns = useMemo<ColumnDef<DespesaBanco>[]>(
    () => [
      {
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
      {
        accessorKey: 'bancoId',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Banco
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => <BancoBadge bancoId={row.getValue('bancoId')} />,
      },
      {
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
      {
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
      {
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
      {
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
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredItems ?? [],
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Despesas Bancarias</h1>
          <p className="mt-1 text-sm text-slate-500">Gerencie tarifas e despesas bancarias</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          
          {/* Filtro de Banco */}
          <select
            value={bancoFilter}
            onChange={(e) => setBancoFilter(e.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Todos os Bancos</option>
            {BANCOS_PADRAO.map((banco) => (
              <option key={banco.id} value={banco.id}>
                {banco.nome}
              </option>
            ))}
          </select>

          <ExportButtons
            data={(filteredItems ?? []).map((item) => {
              const banco = BANCOS_PADRAO.find((b) => b.id === item.bancoId);
              return {
                data: formatDate(item.data),
                banco: banco?.nome || '-',
                tipo: item.tipo || '-',
                descricao: item.descricao,
                valor: formatCurrency(item.valor),
              };
            })}
            columns={[
              { key: 'data', label: 'Data' },
              { key: 'banco', label: 'Banco' },
              { key: 'tipo', label: 'Tipo' },
              { key: 'descricao', label: 'Descricao' },
              { key: 'valor', label: 'Valor' },
            ]}
            filename="despesas-bancarias"
            title="Despesas Bancarias"
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

      {/* Cards de resumo por banco */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BANCOS_PADRAO.slice(0, 4).map((banco) => {
          const totalBanco = items
            .filter((i) => i.bancoId === banco.id)
            .reduce((acc, i) => acc + i.valor, 0);
          if (totalBanco === 0) return null;
          return (
            <div
              key={banco.id}
              className="rounded-xl border border-slate-200 bg-white p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setBancoFilter(bancoFilter === banco.id ? '' : banco.id)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: banco.cor }}
                >
                  {getBancoIcon(banco)}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">{banco.nome}</p>
                  <p className="text-lg font-bold text-slate-900">{formatCurrency(totalBanco)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-slate-200 bg-white">
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
                        : flexRender(header.column.columnDef.header, header.getContext())}
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
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-slate-900">
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
                      <div className="flex items-center gap-2 mb-1">
                        <BancoBadge bancoId={item.bancoId} />
                      </div>
                      <p className="font-medium text-slate-900">{item.descricao}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{formatDate(item.data)}</p>
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
              <div className="flex items-center justify-between bg-slate-50 p-4">
                <span className="font-medium text-slate-700">Total</span>
                <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dialog Adicionar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Registro' : 'Novo Registro'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Altere os dados do registro.' : 'Preencha os dados do novo registro.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Seletor de Banco */}
              <BancoSelector
                value={formData.bancoId || ''}
                onChange={(bancoId) => setFormData({ ...formData, bancoId })}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="data" className="text-sm font-medium text-slate-700">
                    Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="tipo" className="text-sm font-medium text-slate-700">
                    Tipo <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 uppercase"
                    required
                  >
                    <option value="">Selecione...</option>
                    {tiposDisponiveis.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="descricao" className="text-sm font-medium text-slate-700">
                  Descricao <span className="text-red-500">*</span>
                </label>
                <input
                  id="descricao"
                  type="text"
                  placeholder="Ex: Tarifa mensal, TED, DOC..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value.toUpperCase() })}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 uppercase"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="valor" className="text-sm font-medium text-slate-700">
                  Valor (R$) <span className="text-red-500">*</span>
                </label>
                <input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.valor || ''}
                  onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="comunicarAgenda"
                  type="checkbox"
                  checked={formData.comunicarAgenda || false}
                  onChange={(e) => setFormData({ ...formData, comunicarAgenda: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="comunicarAgenda" className="text-sm font-medium text-slate-700">
                  Comunicar Agenda
                </label>
              </div>
            </div>

            <DialogFooter>
              <button
                type="button"
                onClick={handleCloseDialog}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingItem ? 'Salvar' : 'Adicionar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Confirmar Exclusao */}
      <AlertDialog open={!!deleteItemId} onOpenChange={(open) => !open && setDeleteItemId(null)}>
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
