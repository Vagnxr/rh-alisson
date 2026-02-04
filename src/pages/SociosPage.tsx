import { useEffect, useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Users,
  User,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
} from 'lucide-react';
import { useSociosStore } from '@/stores/sociosStore';
import { TIPOS_MOVIMENTACAO, type TipoMovimentacaoSocio, type Socio, type MovimentacaoSocio, type ResumoSocio } from '@/types/socio';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import { buildTableColumns } from '@/lib/buildTableColumns';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { formatDateToLocalYYYYMMDD } from '@/lib/date';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from 'sonner';
import { cn } from '@/lib/cn';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

// Componente de Card de Socio para a pre-pagina
interface SocioCardProps {
  resumo: ResumoSocio;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function SocioCard({ resumo, onClick, onEdit, onDelete }: SocioCardProps) {
  const { socio, totalProLabore, totalDistribuicao, totalRetiradas, saldoTotal } = resumo;

  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-emerald-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
            <User className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{socio.nome}</h3>
            <p className="text-sm text-slate-500">{socio.cpf}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
            <Percent className="h-3 w-3" />
            {socio.percentualSociedade}%
          </div>
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={onEdit}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Editar socio"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              title="Excluir socio"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-blue-50 p-2.5">
          <p className="text-xs text-blue-600">Pro-labore</p>
          <p className="text-sm font-semibold text-blue-700">{formatCurrency(totalProLabore)}</p>
        </div>
        <div className="rounded-lg bg-emerald-50 p-2.5">
          <p className="text-xs text-emerald-600">Distribuicao</p>
          <p className="text-sm font-semibold text-emerald-700">{formatCurrency(totalDistribuicao)}</p>
        </div>
        <div className="rounded-lg bg-amber-50 p-2.5">
          <p className="text-xs text-amber-600">Retiradas</p>
          <p className="text-sm font-semibold text-amber-700">{formatCurrency(totalRetiradas)}</p>
        </div>
        <div className="rounded-lg bg-slate-100 p-2.5">
          <p className="text-xs text-slate-600">Total</p>
          <p className="text-sm font-semibold text-slate-900">{formatCurrency(saldoTotal)}</p>
        </div>
      </div>

      <div className="mt-4 text-center">
        <Button variant="outline" size="sm" className="w-full">
          Ver detalhes
        </Button>
      </div>
    </div>
  );
}

const MOVIMENTACOES_TABLE_DEFAULT_ORDER = ['data', 'tipo', 'descricao', 'valor'];

// Componente de tabela de movimentacoes
interface MovimentacoesTableProps {
  movimentacoes: MovimentacaoSocio[];
  columnsFromApi?: TableColumnConfigFromApi[] | null;
  onEdit: (mov: MovimentacaoSocio) => void;
  onDelete: (id: string) => void;
}

function MovimentacoesTable({ movimentacoes, columnsFromApi, onEdit, onDelete }: MovimentacoesTableProps) {
  const columnDefsByKey = useMemo<Record<string, ColumnDef<MovimentacaoSocio>>>(
    () => ({
      data: {
        accessorKey: 'data',
        header: 'Data',
        cell: ({ row }) => formatDate(row.getValue('data')),
      },
      tipo: {
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: ({ row }) => {
          const tipoConfig = TIPOS_MOVIMENTACAO[row.original.tipo];
          return (
            <span className={cn('rounded-full px-2 py-1 text-xs font-medium', tipoConfig.cor)}>
              {tipoConfig.label}
            </span>
          );
        },
      },
      descricao: {
        accessorKey: 'descricao',
        header: 'Descricao',
        cell: ({ row }) => <span className="text-slate-700">{row.original.descricao}</span>,
      },
      valor: {
        accessorKey: 'valor',
        header: () => <span className="text-right block">Valor</span>,
        cell: ({ row }) => (
          <span className="text-right font-medium text-slate-900 block">
            {formatCurrency(row.original.valor)}
          </span>
        ),
      },
    }),
    []
  );

  const columns = useMemo(
    () =>
      buildTableColumns<MovimentacaoSocio>(
        columnDefsByKey,
        columnsFromApi ?? null,
        MOVIMENTACOES_TABLE_DEFAULT_ORDER,
        {
          id: 'actions',
          header: () => <span className="text-center block">Acoes</span>,
          cell: ({ row }) => {
            const mov = row.original;
            return (
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => onEdit(mov)}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(mov.id)}
                  className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          },
        }
      ),
    [columnDefsByKey, columnsFromApi]
  );

  const table = useReactTable({
    data: movimentacoes,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (movimentacoes.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-500">Nenhuma movimentacao encontrada</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SociosPage() {
  const {
    socios,
    resumos,
    movimentacoes,
    movimentacoesColumns,
    fetchSocios,
    fetchResumo,
    fetchMovimentacoes,
    addSocio,
    updateSocio,
    deleteSocio,
    addMovimentacao,
    updateMovimentacao,
    deleteMovimentacao,
    getMovimentacoesPorSocio,
  } = useSociosStore();

  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingMov, setEditingMov] = useState<MovimentacaoSocio | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isSocioDialogOpen, setIsSocioDialogOpen] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
  const [deletingSocioId, setDeletingSocioId] = useState<string | null>(null);
  const [socioFormData, setSocioFormData] = useState({
    nome: '',
    cpf: '',
    percentualSociedade: '',
    isAtivo: true,
  });

  // Form state (movimentacao)
  const [formData, setFormData] = useState({
    data: '',
    tipo: 'pro-labore' as TipoMovimentacaoSocio,
    descricao: '',
    valor: '',
  });

  const movimentacoesFiltros = useMemo(() => ({
    dataInicio: formatDateToLocalYYYYMMDD(dateFilter.startDate),
    dataFim: formatDateToLocalYYYYMMDD(dateFilter.endDate),
  }), [dateFilter.startDate, dateFilter.endDate]);

  useEffect(() => {
    fetchSocios();
    fetchResumo();
    fetchMovimentacoes(selectedSocio?.id, movimentacoesFiltros);
  }, [fetchSocios, fetchResumo, fetchMovimentacoes, selectedSocio?.id, movimentacoesFiltros.dataInicio, movimentacoesFiltros.dataFim]);

  const movimentacoesFiltradas = useMemo(() => {
    if (!selectedSocio) return [];
    return getMovimentacoesPorSocio(selectedSocio.id);
  }, [selectedSocio, movimentacoes, getMovimentacoesPorSocio]);

  const totalGeral = useMemo(() => {
    return resumos.reduce((acc, r) => acc + r.saldoTotal, 0);
  }, [resumos]);

  const handleOpenDialog = (mov?: MovimentacaoSocio) => {
    if (mov) {
      setEditingMov(mov);
      setFormData({
        data: mov.data,
        tipo: mov.tipo,
        descricao: mov.descricao,
        valor: mov.valor.toString(),
      });
    } else {
      setEditingMov(null);
      setFormData({
        data: new Date().toISOString().split('T')[0],
        tipo: 'pro-labore',
        descricao: '',
        valor: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.data || !formData.descricao || !formData.valor) {
      toast.error('Preencha todos os campos');
      return;
    }

    const valor = parseFloat(formData.valor.replace(',', '.'));
    if (isNaN(valor) || valor <= 0) {
      toast.error('Valor invalido');
      return;
    }

    if (editingMov) {
      await updateMovimentacao(editingMov.id, {
        data: formData.data,
        tipo: formData.tipo,
        descricao: formData.descricao,
        valor,
      });
      toast.success('Movimentacao atualizada com sucesso!');
    } else {
      await addMovimentacao({
        socioId: selectedSocio!.id,
        data: formData.data,
        tipo: formData.tipo,
        descricao: formData.descricao,
        valor,
      });
      toast.success('Movimentacao adicionada com sucesso!');
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    await deleteMovimentacao(deletingId);
    toast.success('Movimentacao excluida com sucesso!');
    setIsDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleOpenSocioDialog = (socio?: Socio) => {
    if (socio) {
      setEditingSocio(socio);
      setSocioFormData({
        nome: socio.nome,
        cpf: socio.cpf,
        percentualSociedade: String(socio.percentualSociedade),
        isAtivo: socio.isAtivo,
      });
    } else {
      setEditingSocio(null);
      setSocioFormData({
        nome: '',
        cpf: '',
        percentualSociedade: '',
        isAtivo: true,
      });
    }
    setIsSocioDialogOpen(true);
  };

  const handleSubmitSocio = async () => {
    const nome = socioFormData.nome.trim();
    const cpf = socioFormData.cpf.trim().replace(/\D/g, '');
    const percentual = parseFloat(socioFormData.percentualSociedade.replace(',', '.'));

    if (!nome) {
      toast.error('Informe o nome do socio');
      return;
    }
    if (cpf.length < 11) {
      toast.error('CPF deve ter 11 digitos');
      return;
    }
    if (isNaN(percentual) || percentual < 0 || percentual > 100) {
      toast.error('Percentual deve ser entre 0 e 100');
      return;
    }

    try {
      if (editingSocio) {
        await updateSocio(editingSocio.id, {
          nome,
          cpf,
          percentualSociedade: percentual,
          isAtivo: socioFormData.isAtivo,
        });
        toast.success('Socio atualizado com sucesso!');
      } else {
        await addSocio({
          nome,
          cpf,
          percentualSociedade: percentual,
          isAtivo: socioFormData.isAtivo,
        });
        toast.success('Socio adicionado com sucesso!');
      }
      setIsSocioDialogOpen(false);
      await fetchSocios();
      await fetchResumo();
      const nextSocios = useSociosStore.getState().socios;
      const updated = editingSocio ? nextSocios.find((s) => s.id === editingSocio.id) : null;
      if (updated && selectedSocio?.id === updated.id) {
        setSelectedSocio(updated);
      }
    } catch {
      // erro ja tratado no store
    }
  };

  const handleDeleteSocio = async () => {
    if (!deletingSocioId) return;
    try {
      await deleteSocio(deletingSocioId);
      toast.success('Socio excluido com sucesso!');
      if (selectedSocio?.id === deletingSocioId) {
        setSelectedSocio(null);
      }
      setDeletingSocioId(null);
      await fetchSocios();
      await fetchResumo();
      await fetchMovimentacoes();
    } catch {
      setDeletingSocioId(null);
    }
  };

  // Pre-pagina de resumo
  if (!selectedSocio) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Socios</h1>
            <p className="mt-1 text-sm text-slate-500">
              Cadastre socios e acompanhe movimentacoes. Clique em um card para ver detalhes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <DateFilter value={dateFilter} onChange={setDateFilter} />
            <Button onClick={() => handleOpenSocioDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Socio
            </Button>
          </div>
        </div>

        {/* Card de total geral */}
        <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-emerald-500 to-emerald-600 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-emerald-100">Total Geral - Todos os Socios</p>
              <p className="text-2xl font-bold">{formatCurrency(totalGeral)}</p>
            </div>
          </div>
        </div>

        {/* Grid de socios */}
        {resumos.length === 0 ? (
          <div className="rounded-xl border border-slate-200 border-dashed bg-slate-50 p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-600">Nenhum socio cadastrado</p>
            <p className="mt-1 text-sm text-slate-500">Cadastre o primeiro socio para comecar a registrar movimentacoes.</p>
            <Button className="mt-4" onClick={() => handleOpenSocioDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Socio
            </Button>
          </div>
        ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {resumos.map((resumo) => (
            <SocioCard
              key={resumo.socio.id}
              resumo={resumo}
              onClick={() => setSelectedSocio(resumo.socio)}
              onEdit={(e) => {
                e.stopPropagation();
                handleOpenSocioDialog(resumo.socio);
              }}
              onDelete={(e) => {
                e.stopPropagation();
                setDeletingSocioId(resumo.socio.id);
              }}
            />
          ))}
        </div>
        )}

        {/* Dialog Novo/Editar Socio */}
        <Dialog open={isSocioDialogOpen} onOpenChange={setIsSocioDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSocio ? 'Editar Socio' : 'Novo Socio'}</DialogTitle>
              <DialogDescription>
                {editingSocio
                  ? 'Altere os dados do socio'
                  : 'Preencha os dados para cadastrar um novo socio'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Nome</label>
                <input
                  type="text"
                  value={socioFormData.nome}
                  onChange={(e) => setSocioFormData({ ...socioFormData, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">CPF</label>
                <input
                  type="text"
                  value={socioFormData.cpf}
                  onChange={(e) => setSocioFormData({ ...socioFormData, cpf: e.target.value })}
                  placeholder="Apenas numeros ou formatado"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Percentual de participacao (%)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={socioFormData.percentualSociedade}
                  onChange={(e) => setSocioFormData({ ...socioFormData, percentualSociedade: e.target.value })}
                  placeholder="Ex: 50"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="socio-ativo"
                  checked={socioFormData.isAtivo}
                  onChange={(e) => setSocioFormData({ ...socioFormData, isAtivo: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="socio-ativo" className="text-sm font-medium text-slate-700">
                  Socio ativo
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSocioDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitSocio}>{editingSocio ? 'Salvar' : 'Cadastrar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog confirmar exclusao de socio */}
        <AlertDialog open={!!deletingSocioId} onOpenChange={(open) => !open && setDeletingSocioId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir socio</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este socio? Todas as movimentacoes vinculadas serao perdidas. Esta acao nao pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSocio}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // Pagina de detalhes do socio
  const resumoAtual = resumos.find((r) => r.socio.id === selectedSocio.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedSocio(null)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{selectedSocio.nome}</h1>
            <p className="text-sm text-slate-500">
              {selectedSocio.cpf} - {selectedSocio.percentualSociedade}% de participacao
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <Button variant="outline" onClick={() => handleOpenSocioDialog(selectedSocio)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar Socio
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Movimentacao
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <DollarSign className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pro-labore</p>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(resumoAtual?.totalProLabore || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Distribuicao</p>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(resumoAtual?.totalDistribuicao || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <TrendingDown className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Retiradas</p>
              <p className="text-lg font-bold text-slate-900">
                {formatCurrency(resumoAtual?.totalRetiradas || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Total</p>
              <p className="text-lg font-bold text-emerald-600">
                {formatCurrency(resumoAtual?.saldoTotal || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de movimentacoes */}
      <MovimentacoesTable
        movimentacoes={movimentacoesFiltradas}
        columnsFromApi={movimentacoesColumns}
        onEdit={handleOpenDialog}
        onDelete={(id) => {
          setDeletingId(id);
          setIsDeleteDialogOpen(true);
        }}
      />

      {/* Dialog de adicionar/editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMov ? 'Editar Movimentacao' : 'Nova Movimentacao'}</DialogTitle>
            <DialogDescription>
              {editingMov
                ? 'Altere os dados da movimentacao'
                : 'Preencha os dados da nova movimentacao'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Data</label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo: e.target.value as TipoMovimentacaoSocio })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {Object.entries(TIPOS_MOVIMENTACAO).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Descricao</label>
              <input
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Pro-labore Janeiro"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Valor</label>
              <input
                type="text"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>{editingMov ? 'Salvar' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmacao de exclusao */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta movimentacao? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
