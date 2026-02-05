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
import { ArrowUpDown, Plus, Pencil, Trash2, Loader2, Building2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DespesaBase, DespesaInput } from '@/types/despesa';
import { TIPOS_DESPESA } from '@/types/despesa';
import { getBancoIcon, type Banco } from '@/types/banco';
import { useBancoStore } from '@/stores/bancoStore';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { formatDateToLocalYYYYMMDD } from '@/lib/date';
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

// DespesaBase ja inclui bancoId e bancoNome (despesa-banco)
interface DespesaBanco extends DespesaBase {}

interface DespesaBancoInput extends DespesaInput {
  bancoId?: string;
}

interface DespesaBancoPageProps {
  items: DespesaBanco[];
  isLoading: boolean;
  fetchItems: (params?: { dataInicio?: string; dataFim?: string }) => Promise<void>;
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

// Lista de bancos: vem da API (backend)
function useBancosList(): Banco[] {
  return useBancoStore((s) => s.bancos) ?? [];
}

// Celula de logo do banco: imagem quando existe logo, senao fallback com iniciais
function BancoLogo({ banco, size = 'md' }: { banco: Banco; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  if (banco.logo) {
    return (
      <img
        src={banco.logo}
        alt=""
        className={cn('rounded-lg object-contain bg-white shrink-0', sizeClass)}
      />
    );
  }
  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white', sizeClass)}
      style={{ backgroundColor: banco.cor }}
    >
      {getBancoIcon(banco)}
    </div>
  );
}

// Componente de selecao de banco com visual de cards
function BancoSelector({
  value,
  onChange,
  bancos,
}: {
  value: string;
  onChange: (bancoId: string) => void;
  bancos: Banco[];
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700">
        Banco <span className="text-red-500">*</span>
      </label>
      <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
        {bancos.map((banco) => (
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
            <BancoLogo banco={banco} size="md" />
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
function BancoBadge({ bancoId, bancos }: { bancoId?: string; bancos: Banco[] }) {
  const banco = bancos.find((b) => b.id === bancoId);
  if (!banco) return <span className="text-slate-400">-</span>;

  return (
    <div className="flex items-center gap-2">
      <BancoLogo banco={banco} size="sm" />
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
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [bancoFilter, setBancoFilter] = useState<string>('');
  const bancos = useBancosList();
  const fetchBancos = useBancoStore((s) => s.fetchBancos);
  const bancosFromApi = useBancoStore((s) => s.bancos);
  const addBanco = useBancoStore((s) => s.addBanco);
  const updateBanco = useBancoStore((s) => s.updateBanco);
  const deleteBanco = useBancoStore((s) => s.deleteBanco);

  const [isBancosDialogOpen, setIsBancosDialogOpen] = useState(false);
  const [editingBanco, setEditingBanco] = useState<Banco | null>(null);
  const [bancoForm, setBancoForm] = useState({ nome: '', codigo: '', cor: '#64748B' });
  const [deleteBancoId, setDeleteBancoId] = useState<string | null>(null);
  const [isBancoSaving, setIsBancoSaving] = useState(false);

  const [formData, setFormData] = useState<DespesaBancoInput>({
    data: '',
    tipo: '',
    descricao: '',
    valor: 0,
    bancoId: '',
    comunicarAgenda: false,
  });

  const tiposDisponiveis = TIPOS_DESPESA['despesa-banco'] || ['OUTROS'];

  const dateParams = useMemo(() => ({
    dataInicio: formatDateToLocalYYYYMMDD(dateFilter.startDate),
    dataFim: formatDateToLocalYYYYMMDD(dateFilter.endDate),
  }), [dateFilter.startDate, dateFilter.endDate]);

  useEffect(() => {
    fetchItems(dateParams);
  }, [fetchItems, dateParams.dataInicio, dateParams.dataFim]);

  useEffect(() => {
    fetchBancos();
  }, [fetchBancos]);

  // Backend ja retorna itens filtrados por data; so filtrar no cliente apenas por banco
  const filteredItems = useMemo(() => {
    if (!items) return [];
    if (!bancoFilter) return items;
    return items.filter((item) => item.bancoId === bancoFilter);
  }, [items, bancoFilter]);

  const handleOpenDialog = (item?: DespesaBanco) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        data: formatDateForInput(item.data),
        tipo: item.tipo || '',
        descricao: item.descricao ?? '',
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
        bancoId: bancoFilter || '',
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar registro');
    }
  };

  const handleDelete = async () => {
    if (!deleteItemId) return;

    try {
      await deleteItem(deleteItemId);
      toast.success('Registro excluido com sucesso!');
      setDeleteItemId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir registro');
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
        accessorKey: 'bancoNome',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Banco
            <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => {
          const bancoNome = row.original.bancoNome;
          const bancoId = row.original.bancoId;
          if (bancoNome) return <span className="text-sm font-medium">{bancoNome}</span>;
          return <BancoBadge bancoId={bancoId} bancos={bancos} />;
        },
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
    [bancos]
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
            {bancos.map((banco) => (
              <option key={banco.id} value={banco.id}>
                {banco.nome}
              </option>
            ))}
          </select>

          <ExportButtons
            data={(filteredItems ?? []).map((item) => {
              const bancoNome = item.bancoNome ?? bancos.find((b) => b.id === item.bancoId)?.nome ?? '-';
              return {
                data: formatDate(item.data),
                banco: bancoNome,
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
            onClick={() => setIsBancosDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Settings2 className="h-4 w-4" />
            <span>Gerenciar bancos</span>
          </button>
          <button
            onClick={() => handleOpenDialog()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Registro</span>
          </button>
        </div>
      </div>

      {/* Dialog Gerenciar Bancos */}
      <Dialog open={isBancosDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsBancosDialogOpen(false);
          setEditingBanco(null);
          setBancoForm({ nome: '', codigo: '', cor: '#64748B' });
        } else setIsBancosDialogOpen(open);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Gerenciar bancos</DialogTitle>
            <DialogDescription>
              Adicione, edite ou remova bancos. Bancos padrao aparecem quando nao ha nenhum cadastrado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Form Add / Edit */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
              <p className="text-sm font-medium text-slate-700">
                {editingBanco ? 'Editar banco' : 'Novo banco'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nome"
                  value={bancoForm.nome}
                  onChange={(e) => setBancoForm((f) => ({ ...f, nome: e.target.value.toUpperCase() }))}
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                />
                <input
                  type="text"
                  placeholder="Codigo (opcional)"
                  value={bancoForm.codigo}
                  onChange={(e) => setBancoForm((f) => ({ ...f, codigo: e.target.value }))}
                  className="flex h-9 w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
                />
              </div>
              {editingBanco && (
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-600">Cor:</label>
                  <input
                    type="color"
                    value={bancoForm.cor}
                    onChange={(e) => setBancoForm((f) => ({ ...f, cor: e.target.value }))}
                    className="h-8 w-14 cursor-pointer rounded border border-slate-200"
                  />
                </div>
              )}
              <div className="flex gap-2">
                {editingBanco ? (
                  <>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!bancoForm.nome.trim()) {
                          toast.error('Nome e obrigatorio');
                          return;
                        }
                        setIsBancoSaving(true);
                        try {
                          await updateBanco(editingBanco.id, {
                            nome: bancoForm.nome.trim(),
                            codigo: bancoForm.codigo.trim() || undefined,
                            cor: bancoForm.cor,
                          });
                          toast.success('Banco atualizado');
                          setEditingBanco(null);
                          setBancoForm({ nome: '', codigo: '', cor: '#64748B' });
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Erro ao atualizar');
                        } finally {
                          setIsBancoSaving(false);
                        }
                      }}
                      disabled={isBancoSaving}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Salvar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBanco(null);
                        setBancoForm({ nome: '', codigo: '', cor: '#64748B' });
                      }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!bancoForm.nome.trim()) {
                        toast.error('Nome e obrigatorio');
                        return;
                      }
                      setIsBancoSaving(true);
                      try {
                        await addBanco({
                          nome: bancoForm.nome.trim(),
                          codigo: bancoForm.codigo.trim() || undefined,
                        });
                        toast.success('Banco adicionado');
                        setBancoForm({ nome: '', codigo: '', cor: '#64748B' });
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Erro ao adicionar');
                      } finally {
                        setIsBancoSaving(false);
                      }
                    }}
                    disabled={isBancoSaving}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                )}
              </div>
            </div>
            {/* Lista */}
            <div className="max-h-48 overflow-y-auto space-y-1">
              {bancosFromApi.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum banco cadastrado. Adicione um acima.</p>
              ) : (
                bancosFromApi.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <BancoLogo banco={b} size="sm" />
                      <span className="text-sm font-medium">{b.nome}</span>
                      {b.codigo && (
                        <span className="text-xs text-slate-500">({b.codigo})</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBanco(b);
                          setBancoForm({ nome: b.nome, codigo: b.codigo || '', cor: b.cor || '#64748B' });
                        }}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteBancoId(b.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* AlertDialog Excluir Banco */}
      <AlertDialog open={!!deleteBancoId} onOpenChange={(open) => !open && setDeleteBancoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir banco</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este banco? Despesas vinculadas podem ficar sem banco.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteBancoId) return;
                try {
                  await deleteBanco(deleteBancoId);
                  toast.success('Banco excluido');
                  setDeleteBancoId(null);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Erro ao excluir');
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cards de resumo por banco */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {bancos.slice(0, 4).map((banco) => {
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
                <BancoLogo banco={banco} size="lg" />
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
                        {item.bancoNome ? (
                          <span className="text-sm font-medium">{item.bancoNome}</span>
                        ) : (
                          <BancoBadge bancoId={item.bancoId} bancos={bancos} />
                        )}
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
                bancos={bancos}
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
                  Descricao
                </label>
                <input
                  id="descricao"
                  type="text"
                  placeholder="Ex: Tarifa mensal, TED, DOC..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value.toUpperCase() })}
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 uppercase"
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
