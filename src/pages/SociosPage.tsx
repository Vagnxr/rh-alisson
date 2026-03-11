import { useEffect, useState, useMemo, useRef } from 'react';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { Users, User, ArrowLeft, Plus, Pencil, Trash2, Loader2, Percent } from 'lucide-react';
import { useSociosStore } from '@/stores/sociosStore';
import { useDespesaTiposStore } from '@/stores/despesaTiposStore';
import {
  TIPOS_MOVIMENTACAO,
  getTipoMovimentacaoDisplay,
  type TipoMovimentacaoSocio,
  type Socio,
  type MovimentacaoSocio,
  type ResumoSocio,
} from '@/types/socio';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import { buildTableColumns } from '@/lib/buildTableColumns';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { formatDateToLocalYYYYMMDD, formatDateStringToBR } from '@/lib/date';
import { formatValorForInput, parseValorFromInput } from '@/lib/formatValor';
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

/** Formata valor para exibicao em Socios: sem sinal negativo; valor absoluto com classe vermelha quando negativo. */
function formatCurrencySocios(value: number) {
  const abs = Math.abs(value);
  const text = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(abs);
  return { text, isNegative: value < 0 };
}

/** Formata CPF para exibicao: 000.000.000-00 */
function formatCpf(cpf: string | undefined): string {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '');
  if (digits.length < 3) return digits;
  if (digits.length < 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length < 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/** Formata CPF para uso no input (apenas digitos, max 11, exibicao formatada). */
function formatCpfInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  return formatCpf(digits) || digits;
}

/** Retorna a posicao do cursor no valor formatado apos digitar/editar (preserva digitos antes do cursor). */
function getCpfCursorPositionAfterFormat(
  formattedValue: string,
  digitsBeforeCursor: number,
): number {
  if (digitsBeforeCursor <= 0) return 0;
  let count = 0;
  for (let i = 0; i < formattedValue.length; i++) {
    if (/\d/.test(formattedValue[i])) {
      count++;
      if (count === digitsBeforeCursor) return i + 1;
    }
  }
  return formattedValue.length;
}

// Componente de Card de Socio para a pre-pagina
interface SocioCardProps {
  resumo: ResumoSocio;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
}

function SocioCard({ resumo, onClick, onEdit }: SocioCardProps) {
  const { socio, saldoTotal } = resumo;

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
            <p className="text-sm text-slate-500">{formatCpf(socio.cpf)}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
            <Percent className="h-3 w-3" />
            {socio.percentualSociedade}%
          </div>
          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={onEdit}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Editar socio"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-slate-100 p-3">
        <p className="text-xs text-slate-600">{'Total lançado'}</p>
        <p className="text-lg font-semibold text-slate-900">
          {formatCurrencySocios(saldoTotal).text}
        </p>
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

function MovimentacoesTable({
  movimentacoes,
  columnsFromApi,
  onEdit,
  onDelete,
}: MovimentacoesTableProps) {
  const columnDefsByKey = useMemo<Record<string, ColumnDef<MovimentacaoSocio>>>(
    () => ({
      data: {
        accessorKey: 'data',
        header: 'Data',
        cell: ({ row }) => formatDateStringToBR(String(row.getValue('data') ?? '')),
      },
      tipo: {
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: ({ row }) => {
          const { label, cor } = getTipoMovimentacaoDisplay(row.original.tipo);
          return (
            <span className={cn('rounded-full px-2 py-1 text-xs font-medium', cor)}>{label}</span>
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
        header: () => <span className="block text-right">Valor</span>,
        cell: ({ row }) => (
          <span className="block text-right font-medium text-black">
            {formatCurrency(row.original.valor)}
          </span>
        ),
      },
    }),
    [],
  );

  const columns = useMemo(
    () =>
      buildTableColumns<MovimentacaoSocio>(
        columnDefsByKey,
        columnsFromApi ?? null,
        MOVIMENTACOES_TABLE_DEFAULT_ORDER,
        {
          id: 'actions',
          header: () => <span className="block text-center">Acoes</span>,
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
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          },
        },
      ),
    [columnDefsByKey, columnsFromApi],
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-100">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className={cn(
                      'px-4 py-3 text-xs font-medium text-slate-500 uppercase',
                      header.column.id === 'valor' ? 'text-right' : 'text-left',
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-slate-50">
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className={cn(
                      'px-4 py-3 text-sm',
                      cell.column.id === 'valor' ? 'text-right' : 'text-left',
                    )}
                  >
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
  const [showInativos, setShowInativos] = useState(false);
  const [socioFormData, setSocioFormData] = useState({
    nome: '',
    cpf: '',
    percentualSociedade: '',
    isAtivo: true,
  });
  const cpfInputRef = useRef<HTMLInputElement>(null);
  const nextCpfCursorRef = useRef<number | null>(null);

  // Form state (movimentacao)
  const [formData, setFormData] = useState({
    data: '',
    tipo: 'pro-labore' as string,
    descricao: '',
    valor: '',
  });

  const {
    fetchTipos,
    getTipos,
    addTipo,
    deleteTipo,
    isLoading: isLoadingTipos,
  } = useDespesaTiposStore();
  const [isTiposDialogOpen, setIsTiposDialogOpen] = useState(false);
  const [novoTipoLabel, setNovoTipoLabel] = useState('');
  const TIPOS_FIXOS = Object.keys(TIPOS_MOVIMENTACAO) as TipoMovimentacaoSocio[];
  const tiposCustom = getTipos('socios').filter(
    t => !TIPOS_FIXOS.includes(t.label as TipoMovimentacaoSocio),
  );
  const tiposDisponiveis = [...TIPOS_FIXOS, ...tiposCustom.map(t => t.label)];
  const tiposParaListar = [
    ...TIPOS_FIXOS.map(k => ({
      label: TIPOS_MOVIMENTACAO[k].label,
      id: undefined as string | undefined,
      key: k,
    })),
    ...tiposCustom.map(t => ({ label: t.label, id: t.id, key: t.label })),
  ].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));

  const movimentacoesFiltros = useMemo(
    () => ({
      dataInicio: formatDateToLocalYYYYMMDD(dateFilter.startDate),
      dataFim: formatDateToLocalYYYYMMDD(dateFilter.endDate),
    }),
    [dateFilter.startDate, dateFilter.endDate],
  );

  const initialFetchDoneRef = useRef(false);
  const lastMovimentacoesParamsRef = useRef<{
    socioId?: string;
    dataInicio: string;
    dataFim: string;
  } | null>(null);

  useEffect(() => {
    if (initialFetchDoneRef.current) return;
    initialFetchDoneRef.current = true;
    fetchSocios();
    fetchResumo();
  }, [fetchSocios, fetchResumo]);

  useEffect(() => {
    const socioId = selectedSocio?.id;
    const { dataInicio, dataFim } = movimentacoesFiltros;
    const last = lastMovimentacoesParamsRef.current;
    if (
      last &&
      last.socioId === socioId &&
      last.dataInicio === dataInicio &&
      last.dataFim === dataFim
    ) {
      return;
    }
    lastMovimentacoesParamsRef.current = { socioId, dataInicio, dataFim };
    fetchMovimentacoes(socioId, movimentacoesFiltros);
  }, [
    fetchMovimentacoes,
    selectedSocio?.id,
    movimentacoesFiltros.dataInicio,
    movimentacoesFiltros.dataFim,
  ]);

  const tiposFetchedRef = useRef(false);
  useEffect(() => {
    if (tiposFetchedRef.current) return;
    tiposFetchedRef.current = true;
    fetchTipos('socios').catch(() => {});
  }, [fetchTipos]);

  // Restaura posicao do cursor no CPF apos formatacao (permite editar no meio do campo)
  useEffect(() => {
    if (cpfInputRef.current && nextCpfCursorRef.current !== null) {
      const pos = nextCpfCursorRef.current;
      cpfInputRef.current.setSelectionRange(pos, pos);
      nextCpfCursorRef.current = null;
    }
  }, [socioFormData.cpf]);

  const movimentacoesFiltradas = useMemo(() => {
    if (!selectedSocio) return [];
    return getMovimentacoesPorSocio(selectedSocio.id);
  }, [selectedSocio, movimentacoes, getMovimentacoesPorSocio]);

  const resumosAtivos = useMemo(() => resumos.filter(r => r.socio.isAtivo !== false), [resumos]);
  const resumosInativos = useMemo(() => resumos.filter(r => r.socio.isAtivo === false), [resumos]);
  const totalGeral = useMemo(() => {
    return resumosAtivos.reduce((acc, r) => acc + r.saldoTotal, 0);
  }, [resumosAtivos]);

  function normalizarTipoParaSelect(tipo: string): string {
    const keyLower = (tipo || '').toLowerCase();
    const fixedKey = TIPOS_FIXOS.find(k => k === keyLower);
    return fixedKey ?? (tipo || '').toUpperCase();
  }

  const handleOpenDialog = (mov?: MovimentacaoSocio) => {
    if (mov) {
      setEditingMov(mov);
      const dataStr = typeof mov.data === 'string' ? mov.data.slice(0, 10) : '';
      setFormData({
        data: dataStr,
        tipo: normalizarTipoParaSelect(mov.tipo),
        descricao: mov.descricao ?? '',
        valor: formatValorForInput(mov.valor),
      });
    } else {
      setEditingMov(null);
      setFormData({
        data: formatDateToLocalYYYYMMDD(new Date()),
        tipo: tiposDisponiveis[0] ?? 'pro-labore',
        descricao: '',
        valor: '',
      });
    }
    setIsDialogOpen(true);
  };

  // Ao abrir o dialog de edicao, garantir que o formulario mostra os dados da movimentacao (evita mostrar data atual por estado desatualizado)
  useEffect(() => {
    if (isDialogOpen && editingMov) {
      const dataStr = typeof editingMov.data === 'string' ? editingMov.data.slice(0, 10) : '';
      setFormData(prev => ({
        ...prev,
        data: dataStr,
        tipo: normalizarTipoParaSelect(editingMov.tipo),
        descricao: editingMov.descricao ?? prev.descricao,
        valor: formatValorForInput(editingMov.valor),
      }));
    }
  }, [isDialogOpen, editingMov?.id]);

  const handleSubmit = async () => {
    if (!formData.data || !formData.tipo || !formData.valor) {
      toast.error('Preencha Data, Tipo e Valor.');
      return;
    }

    const valor = parseValorFromInput(formData.valor);
    if (valor <= 0) {
      toast.error('Valor invalido');
      return;
    }

    const dataOnly = formData.data.slice(0, 10);
    const tipoParaEnvio = TIPOS_FIXOS.includes(formData.tipo as TipoMovimentacaoSocio)
      ? formData.tipo
      : formData.tipo.toUpperCase();
    const descricaoUpper = (formData.descricao || '').trim().toUpperCase();

    try {
      if (editingMov) {
        await updateMovimentacao(editingMov.id, {
          data: dataOnly,
          tipo: tipoParaEnvio,
          descricao: descricaoUpper,
          valor,
        });
        toast.success('Movimentacao atualizada com sucesso!');
      } else {
        await addMovimentacao({
          socioId: selectedSocio!.id,
          data: dataOnly,
          tipo: tipoParaEnvio,
          descricao: descricaoUpper,
          valor,
        });
        toast.success('Movimentacao adicionada com sucesso!');
      }
      setIsDialogOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar movimentacao.';
      toast.error(msg);
    }
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
        cpf: formatCpf(socio.cpf),
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
    const percentual = parseFloat(socioFormData.percentualSociedade.replace(',', '.')) || 0;

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
      const updated = editingSocio ? nextSocios.find(s => s.id === editingSocio.id) : null;
      if (updated && selectedSocio?.id === updated.id) {
        setSelectedSocio(updated);
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } }; message?: string };
      const msg = ax?.response?.data?.message ?? ax?.message ?? 'Erro ao salvar socio.';
      toast.error(typeof msg === 'string' ? msg : 'Erro ao salvar socio.');
    }
  };

  const handleAtivarSocio = async (socio: Socio) => {
    try {
      await updateSocio(socio.id, { isAtivo: true });
      toast.success('Socio ativado.');
      await fetchSocios();
      await fetchResumo();
    } catch {
      toast.error('Erro ao ativar socio.');
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
            {!showInativos && (
              <Button variant="outline" onClick={() => setShowInativos(true)}>
                Socios Inativos
              </Button>
            )}
            {showInativos && (
              <Button variant="outline" onClick={() => setShowInativos(false)}>
                Voltar aos socios ativos
              </Button>
            )}
            <Button onClick={() => handleOpenSocioDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Socio
            </Button>
          </div>
        </div>

        {/* Card de total geral (apenas na lista de ativos) */}
        {!showInativos && (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
                <Users className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900">Total Geral - Todos os Socios</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatCurrencySocios(totalGeral).text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grid de socios ativos ou lista de inativos */}
        {showInativos ? (
          resumosInativos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-400" />
              <p className="mt-3 text-sm font-medium text-slate-600">Nenhum socio inativo</p>
              <p className="mt-1 text-sm text-slate-500">
                Socios desativados aparecem aqui e podem ser reativados.
              </p>
              <Button className="mt-4" variant="outline" onClick={() => setShowInativos(false)}>
                Voltar aos socios ativos
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resumosInativos.map(resumo => (
                <div
                  key={resumo.socio.id}
                  className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-700">{resumo.socio.nome}</h3>
                      <p className="text-sm text-slate-500">{formatCpf(resumo.socio.cpf)}</p>
                    </div>
                    <Button size="sm" onClick={() => handleAtivarSocio(resumo.socio)}>
                      Ativar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : resumosAtivos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-600">Nenhum socio cadastrado</p>
            <p className="mt-1 text-sm text-slate-500">
              Cadastre o primeiro socio para comecar a registrar movimentacoes.
            </p>
            <Button className="mt-4" onClick={() => handleOpenSocioDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Socio
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resumosAtivos.map(resumo => (
              <SocioCard
                key={resumo.socio.id}
                resumo={resumo}
                onClick={() => setSelectedSocio(resumo.socio)}
                onEdit={e => {
                  e.stopPropagation();
                  handleOpenSocioDialog(resumo.socio);
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
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSubmitSocio();
              }}
              className="space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nome <span className="text-slate-500">*</span>
                </label>
                <input
                  type="text"
                  value={socioFormData.nome}
                  onChange={e =>
                    setSocioFormData({ ...socioFormData, nome: e.target.value.toUpperCase() })
                  }
                  placeholder="Nome completo"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  CPF <span className="text-slate-500">*</span>
                </label>
                <input
                  ref={cpfInputRef}
                  type="text"
                  inputMode="numeric"
                  maxLength={14}
                  value={socioFormData.cpf}
                  onChange={e => {
                    const input = e.target;
                    const newVal = formatCpfInput(input.value);
                    const digitsBeforeCursor = (
                      input.value.slice(0, input.selectionStart ?? 0).match(/\d/g) || []
                    ).length;
                    nextCpfCursorRef.current = getCpfCursorPositionAfterFormat(
                      newVal,
                      digitsBeforeCursor,
                    );
                    setSocioFormData(prev => ({ ...prev, cpf: newVal }));
                  }}
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Percentual de participacao (%) <span className="text-slate-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={socioFormData.percentualSociedade}
                  onChange={e =>
                    setSocioFormData({ ...socioFormData, percentualSociedade: e.target.value })
                  }
                  placeholder="Ex: 50"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="socio-ativo"
                  checked={socioFormData.isAtivo}
                  onChange={e => setSocioFormData({ ...socioFormData, isAtivo: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300"
                />
                <label htmlFor="socio-ativo" className="text-sm font-medium text-slate-700">
                  Socio ativo
                </label>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSocioDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">{editingSocio ? 'Salvar' : 'Cadastrar'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Pagina de detalhes do socio
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSelectedSocio(null);
              lastMovimentacoesParamsRef.current = null;
              fetchResumo();
              fetchMovimentacoes(undefined, movimentacoesFiltros);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{selectedSocio.nome}</h1>
            <p className="text-sm text-slate-500">
              {formatCpf(selectedSocio.cpf)} - {selectedSocio.percentualSociedade}% de participacao
            </p>
          </div>
        </div>
        <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <Button onClick={() => handleOpenDialog()} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            Nova Movimenta??o
          </Button>
        </div>
      </div>

      {/* Tabela de movimentacoes */}
      <MovimentacoesTable
        movimentacoes={movimentacoesFiltradas}
        columnsFromApi={movimentacoesColumns}
        onEdit={handleOpenDialog}
        onDelete={id => {
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

          <div className="space-y-4 pb-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Data <span className="text-slate-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.data}
                  onChange={e => setFormData({ ...formData, data: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Tipo <span className="text-slate-500">*</span>
                </label>
                <div className="flex gap-1">
                  <select
                    value={formData.tipo}
                    onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                    className="flex h-10 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase"
                    required
                  >
                    {TIPOS_FIXOS.map(key => (
                      <option key={key} value={key}>
                        {TIPOS_MOVIMENTACAO[key].label.toUpperCase()}
                      </option>
                    ))}
                    {tiposCustom.map(t => (
                      <option key={t.id} value={t.label}>
                        {t.label.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      setNovoTipoLabel('');
                      setIsTiposDialogOpen(true);
                    }}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                    title="Adicionar ou gerenciar tipos"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Descricao</label>
              <input
                type="text"
                value={formData.descricao}
                onChange={e =>
                  setFormData({ ...formData, descricao: e.target.value.toUpperCase() })
                }
                placeholder="Ex: Pro-labore Janeiro"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Valor <span className="text-slate-500">*</span>
              </label>
              <input
                type="text"
                value={formData.valor}
                onChange={e => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0,00"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-200 pt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>{editingMov ? 'Salvar' : 'Adicionar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Gerenciar Tipos */}
      <Dialog open={isTiposDialogOpen} onOpenChange={setIsTiposDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gerenciar tipos</DialogTitle>
            <DialogDescription>
              Adicione ou remova tipos de movimentacao. Tipos padrao (Pro-labore, Distribuicao,
              etc.) nao podem ser excluidos.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do tipo"
                value={novoTipoLabel}
                onChange={e => setNovoTipoLabel(e.target.value.trim().toUpperCase())}
                onKeyDown={e => {
                  if (e.key === 'Enter' && novoTipoLabel.trim()) {
                    e.preventDefault();
                    addTipo('socios', novoTipoLabel.trim())
                      .then(async () => {
                        setNovoTipoLabel('');
                        toast.success('Tipo adicionado.');
                        await fetchTipos('socios');
                      })
                      .catch(err =>
                        toast.error(err instanceof Error ? err.message : 'Erro ao adicionar tipo'),
                      );
                  }
                }}
                className="flex flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase"
              />
              <Button
                disabled={!novoTipoLabel.trim() || isLoadingTipos}
                onClick={() => {
                  const label = novoTipoLabel.trim();
                  if (!label) return;
                  addTipo('socios', label)
                    .then(async () => {
                      setNovoTipoLabel('');
                      toast.success('Tipo adicionado.');
                      await fetchTipos('socios');
                    })
                    .catch(err =>
                      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar tipo'),
                    );
                }}
              >
                {isLoadingTipos ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Adicionar'}
              </Button>
            </div>
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
              {tiposParaListar.length === 0 ? (
                <li className="py-4 text-center text-sm text-slate-500">Nenhum tipo.</li>
              ) : (
                tiposParaListar.map(t => (
                  <li
                    key={t.id ?? t.key}
                    className="flex items-center justify-between rounded bg-white px-3 py-2 text-sm text-slate-800"
                  >
                    <span>{t.label}</span>
                    {t.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          deleteTipo(t.id!)
                            .then(() => toast.success('Tipo removido.'))
                            .catch(err =>
                              toast.error(err instanceof Error ? err.message : 'Erro ao remover'),
                            );
                        }}
                        className="rounded p-1 text-slate-600 hover:bg-slate-100"
                        title="Excluir tipo"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </div>
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
            <AlertDialogAction onClick={handleDelete} className="bg-slate-700 hover:bg-slate-800">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
