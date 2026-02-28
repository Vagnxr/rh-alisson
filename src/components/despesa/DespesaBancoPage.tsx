import { useEffect, useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DespesaInput } from '@/types/despesa';
import { TIPOS_DESPESA } from '@/types/despesa';
import type { Banco } from '@/types/banco';
import { useBancoStore } from '@/stores/bancoStore';
import { useDespesaTiposStore } from '@/stores/despesaTiposStore';
import { getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { formatDateToLocalYYYYMMDD } from '@/lib/date';
import { formatValorForInput, parseValorFromInput } from '@/lib/formatValor';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import { buildTableColumns } from '@/lib/buildTableColumns';
import type { TipoRecorrencia } from '@/types/recorrencia';
import { RecorrenciaBadge } from '@/components/ui/select-recorrencia';
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

import {
  type DespesaBanco,
  type DespesaBancoInput,
  DESPESA_BANCO_DEFAULT_ORDER,
  formatCurrency,
  formatDate,
  formatDateForInput,
} from './DespesaBancoUtils';
import { BancoBadge } from './banco';
import { DespesaBancoListaView } from './DespesaBancoListaView';
import { DespesaBancoDetalheView } from './DespesaBancoDetalheView';
import { DespesaBancoGerenciarBancosDialog } from './DespesaBancoGerenciarBancosDialog';
import { DespesaBancoGerenciarTiposDialog } from './DespesaBancoGerenciarTiposDialog';
import {
  DespesaBancoFormDialog,
  type DespesaBancoFormData,
} from './DespesaBancoFormDialog';

interface DespesaBancoPageProps {
  items: DespesaBanco[];
  columns?: TableColumnConfigFromApi[] | null;
  isLoading: boolean;
  fetchItems: (params?: { dataInicio?: string; dataFim?: string }) => Promise<void>;
  addItem: (data: DespesaBancoInput) => Promise<void>;
  updateItem: (id: string, data: Partial<DespesaBancoInput>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

function useBancosList(): Banco[] {
  return useBancoStore((s) => s.bancos) ?? [];
}

export function DespesaBancoPageComponent({
  items,
  columns: columnsFromApi,
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
  const [selectedBanco, setSelectedBanco] = useState<Banco | null>(null);
  const bancos = useBancosList();
  const fetchBancos = useBancoStore((s) => s.fetchBancos);
  const bancosFromApi = useBancoStore((s) => s.bancos);
  const addBanco = useBancoStore((s) => s.addBanco);
  const updateBanco = useBancoStore((s) => s.updateBanco);
  const deleteBanco = useBancoStore((s) => s.deleteBanco);

  const { fetchTipos, getTipos, addTipo, deleteTipo } = useDespesaTiposStore();
  const [isTiposDialogOpen, setIsTiposDialogOpen] = useState(false);
  const [novoTipoLabel, setNovoTipoLabel] = useState('');

  const [isBancosDialogOpen, setIsBancosDialogOpen] = useState(false);
  const [editingBanco, setEditingBanco] = useState<Banco | null>(null);
  const [bancoForm, setBancoForm] = useState({
    nome: '',
    codigo: '',
    cor: '#64748B',
    logo: '' as string,
  });
  const [deleteBancoId, setDeleteBancoId] = useState<string | null>(null);
  const [isBancoSaving, setIsBancoSaving] = useState(false);

  const [formData, setFormData] = useState<DespesaBancoFormData>({
    data: '',
    tipo: '',
    descricao: '',
    valor: '',
    bancoId: '',
    comunicarAgenda: false,
  });

  const tiposPadrao = TIPOS_DESPESA['despesa-banco'] || ['OUTROS'];
  const tiposFromStore = getTipos('despesa-banco');
  const customTipos = tiposFromStore.filter((t) => !tiposPadrao.includes(t.label));
  const tiposDisponiveis = [...tiposPadrao, ...customTipos.map((t) => t.label)].sort((a, b) =>
    a.localeCompare(b, 'pt-BR')
  );
  const tiposParaListar = [
    ...tiposPadrao.map((label) => ({ label, id: undefined as string | undefined })),
    ...customTipos.map((t) => ({ label: t.label, id: t.id })),
  ].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  const dateParams = useMemo(
    () => ({
      dataInicio: formatDateToLocalYYYYMMDD(dateFilter.startDate),
      dataFim: formatDateToLocalYYYYMMDD(dateFilter.endDate),
    }),
    [dateFilter.startDate, dateFilter.endDate]
  );

  useEffect(() => {
    fetchItems(dateParams);
  }, [fetchItems, dateParams.dataInicio, dateParams.dataFim]);

  useEffect(() => {
    fetchBancos();
  }, [fetchBancos]);

  useEffect(() => {
    fetchTipos('despesa-banco').catch(() => {});
  }, [fetchTipos]);

  const filteredItems = useMemo(() => {
    if (!items) return [];
    const bancoId = selectedBanco?.id ?? bancoFilter;
    if (!bancoId) return items;
    return items.filter((item) => item.bancoId === bancoId);
  }, [items, selectedBanco?.id, bancoFilter]);

  const handleOpenDialog = (item?: DespesaBanco) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        data: formatDateForInput(item.data),
        tipo: item.tipo || '',
        descricao: item.descricao ?? '',
        valor: formatValorForInput(item.valor),
        bancoId: item.bancoId || '',
        comunicarAgenda: item.comunicarAgenda || false,
      });
    } else {
      setEditingItem(null);
      setFormData({
        data: formatDateToLocalYYYYMMDD(new Date()),
        tipo: tiposDisponiveis[0] || '',
        descricao: '',
        valor: '',
        bancoId: selectedBanco?.id ?? bancoFilter ?? '',
        comunicarAgenda: false,
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
      bancoId: '',
      comunicarAgenda: false,
    });
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
    const valorNum = parseValorFromInput(String(formData.valor));
    if (valorNum <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }
    try {
      if (editingItem) {
        await updateItem(editingItem.id, { ...formData, valor: valorNum });
        toast.success('Registro atualizado com sucesso!');
      } else {
        await addItem({ ...formData, valor: valorNum });
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

  const columnDefsByKey = useMemo<Record<string, ColumnDef<DespesaBanco>>>(
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
      bancoNome: {
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
          return v ? (
            <span className="text-slate-900">Sim</span>
          ) : (
            <span className="text-slate-900">Nao</span>
          );
        },
      },
    }),
    [bancos]
  );

  const actionsColumn: ColumnDef<DespesaBanco> = useMemo(
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
      buildTableColumns<DespesaBanco>(
        columnDefsByKey,
        columnsFromApi ?? null,
        DESPESA_BANCO_DEFAULT_ORDER,
        actionsColumn,
        undefined,
        columnsFromApi?.length ? undefined : DESPESA_BANCO_DEFAULT_ORDER
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
    getFilteredRowModel: getFilteredRowModel(),
  });

  const total = useMemo(
    () => (filteredItems ?? []).reduce((acc, d) => acc + d.valor, 0),
    [filteredItems]
  );

  const exportData = useMemo(() => {
    const list = filteredItems ?? [];
    if (columnsFromApi?.length) {
      return list.map((item) => {
        const row: Record<string, string> = {};
        const bancoNome =
          item.bancoNome ?? bancos.find((b) => b.id === item.bancoId)?.nome ?? '-';
        for (const col of columnsFromApi) {
          if (col.id === 'data') row.data = formatDate(item.data);
          else if (col.id === 'bancoNome') row.bancoNome = bancoNome;
          else if (col.id === 'tipo') row.tipo = item.tipo || '-';
          else if (col.id === 'descricao') row.descricao = item.descricao;
          else if (col.id === 'valor') row.valor = formatCurrency(item.valor);
          else if (col.id === 'recorrencia') row.recorrencia = item.recorrencia ?? 'unica';
          else if (col.id === 'comunicarAgenda')
            row.comunicarAgenda = item.comunicarAgenda ? 'Sim' : 'Nao';
          else
            row[col.id] = String(
              (item as unknown as Record<string, unknown>)[col.id] ?? '-'
            );
        }
        return row;
      });
    }
    return list.map((item) => {
      const bancoNome =
        item.bancoNome ?? bancos.find((b) => b.id === item.bancoId)?.nome ?? '-';
      return {
        data: formatDate(item.data),
        banco: bancoNome,
        tipo: item.tipo || '-',
        descricao: item.descricao,
        valor: formatCurrency(item.valor),
      };
    });
  }, [filteredItems, columnsFromApi, bancos]);

  const exportColumns = useMemo(() => {
    if (columnsFromApi?.length) {
      return columnsFromApi.map((c) => ({ key: c.id, label: c.label }));
    }
    return [
      { key: 'data', label: 'Data' },
      { key: 'banco', label: 'Banco' },
      { key: 'tipo', label: 'Tipo' },
      { key: 'descricao', label: 'Descricao' },
      { key: 'valor', label: 'Valor' },
    ];
  }, [columnsFromApi]);

  if (isLoading && items.length === 0) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!selectedBanco) {
    return (
      <>
        <DespesaBancoListaView
          bancos={bancos}
          items={items}
          onSelectBanco={setSelectedBanco}
          onOpenBancos={() => setIsBancosDialogOpen(true)}
          onEditBanco={(banco) => {
            setEditingBanco(banco);
            setBancoForm({
              nome: banco.nome,
              codigo: banco.codigo || '',
              cor: banco.cor || '#64748B',
              logo: banco.logo || '',
            });
            setIsBancosDialogOpen(true);
          }}
        />
        <DespesaBancoGerenciarBancosDialog
          open={isBancosDialogOpen}
          onOpenChange={setIsBancosDialogOpen}
          editingBanco={editingBanco}
          setEditingBanco={setEditingBanco}
          bancoForm={bancoForm}
          setBancoForm={setBancoForm}
          deleteBancoId={deleteBancoId}
          setDeleteBancoId={setDeleteBancoId}
          bancosFromApi={bancosFromApi}
          addBanco={addBanco}
          updateBanco={updateBanco}
          deleteBanco={deleteBanco}
          isBancoSaving={isBancoSaving}
          setIsBancoSaving={setIsBancoSaving}
        />
        <DespesaBancoGerenciarTiposDialog
          open={isTiposDialogOpen}
          onOpenChange={setIsTiposDialogOpen}
          novoTipoLabel={novoTipoLabel}
          setNovoTipoLabel={setNovoTipoLabel}
          tiposParaListar={tiposParaListar}
          addTipo={addTipo}
          deleteTipo={deleteTipo}
        />
      </>
    );
  }

  return (
    <>
      <DespesaBancoDetalheView
        selectedBanco={selectedBanco}
        onBack={() => setSelectedBanco(null)}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        exportData={exportData}
        exportColumns={exportColumns}
        onOpenTipos={() => setIsTiposDialogOpen(true)}
        onNewRecord={() => handleOpenDialog()}
        table={table}
        columnsCount={columns.length}
        filteredItems={filteredItems}
        total={total}
        onEditItem={handleOpenDialog}
        onDeleteItem={setDeleteItemId}
        bancos={bancos}
      />
      <DespesaBancoGerenciarBancosDialog
        open={isBancosDialogOpen}
        onOpenChange={setIsBancosDialogOpen}
        editingBanco={editingBanco}
        setEditingBanco={setEditingBanco}
        bancoForm={bancoForm}
        setBancoForm={setBancoForm}
        deleteBancoId={deleteBancoId}
        setDeleteBancoId={setDeleteBancoId}
        bancosFromApi={bancosFromApi}
        addBanco={addBanco}
        updateBanco={updateBanco}
        deleteBanco={deleteBanco}
        isBancoSaving={isBancoSaving}
        setIsBancoSaving={setIsBancoSaving}
      />
      <DespesaBancoFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        selectedBanco={selectedBanco}
        bancos={bancos}
        tiposDisponiveis={tiposDisponiveis}
        onSubmit={handleSubmit}
        onClose={handleCloseDialog}
        isLoading={isLoading}
        onOpenTipos={() => {
          setNovoTipoLabel('');
          setIsTiposDialogOpen(true);
        }}
      />
      <DespesaBancoGerenciarTiposDialog
        open={isTiposDialogOpen}
        onOpenChange={setIsTiposDialogOpen}
        novoTipoLabel={novoTipoLabel}
        setNovoTipoLabel={setNovoTipoLabel}
        tiposParaListar={tiposParaListar}
        addTipo={addTipo}
        deleteTipo={deleteTipo}
      />
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
    </>
  );
}
