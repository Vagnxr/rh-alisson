import { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
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
import { formatDateStringToBR } from '@/lib/date';
import { useLembretesStore, type Lembrete } from '@/stores/lembretesStore';

type FiltroStatus = 'todos' | 'pendente' | 'concluido' | 'cancelado';

const PRIORIDADE_CONFIG = {
  baixa: { label: 'BAIXA', cor: 'bg-slate-100 text-slate-600' },
  media: { label: 'MEDIA', cor: 'bg-amber-100 text-amber-700' },
  alta: { label: 'ALTA', cor: 'bg-red-100 text-red-700' },
};

const STATUS_CONFIG = {
  pendente: { label: 'PENDENTE', icon: AlertCircle, cor: 'text-amber-500' },
  concluido: { label: 'CONCLUIDO', icon: CheckCircle2, cor: 'text-emerald-500' },
  cancelado: { label: 'CANCELADO', icon: XCircle, cor: 'text-slate-400' },
};

function isOverdue(dateStr: string) {
  return new Date(dateStr) < new Date();
}

export function LembretesPage() {
  const {
    lembretes,
    isLoading,
    fetchLembretes,
    createLembrete,
    updateLembrete,
    toggleStatus,
    deleteLembrete,
  } = useLembretesStore();

  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLembrete, setEditingLembrete] = useState<Lembrete | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    data: '',
    hora: '',
    prioridade: 'media' as 'baixa' | 'media' | 'alta',
  });

  useEffect(() => {
    fetchLembretes();
  }, [fetchLembretes]);

  // Filtra lembretes
  const lembretesFiltrados = useMemo(() => {
    if (filtroStatus === 'todos') return lembretes;
    return lembretes.filter((l) => l.status === filtroStatus);
  }, [lembretes, filtroStatus]);

  // Contadores
  const contadores = useMemo(() => {
    return {
      pendentes: lembretes.filter((l) => l.status === 'pendente').length,
      concluidos: lembretes.filter((l) => l.status === 'concluido').length,
      atrasados: lembretes.filter((l) => l.status === 'pendente' && isOverdue(l.data)).length,
    };
  }, [lembretes]);

  const handleOpenDialog = (lembrete?: Lembrete) => {
    if (lembrete) {
      setEditingLembrete(lembrete);
      const dataParaInput = (lembrete.data || '').trim().slice(0, 10);
      setFormData({
        titulo: lembrete.titulo,
        descricao: lembrete.descricao || '',
        data: dataParaInput || lembrete.data,
        hora: lembrete.hora || '',
        prioridade: lembrete.prioridade,
      });
    } else {
      setEditingLembrete(null);
      setFormData({
        titulo: '',
        descricao: '',
        data: new Date().toISOString().split('T')[0],
        hora: '',
        prioridade: 'media',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingLembrete(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      toast.error('Titulo e obrigatorio');
      return;
    }

    if (!formData.data) {
      toast.error('Data e obrigatoria');
      return;
    }

    // Envia data como ISO ao meio-dia UTC para o backend nao interpretar 00:00 como dia anterior no fuso
    const dataPayload =
      formData.data.length === 10 ? `${formData.data}T12:00:00.000Z` : formData.data;

    try {
      if (editingLembrete) {
        await updateLembrete(editingLembrete.id, {
          titulo: formData.titulo.toUpperCase(),
          descricao: formData.descricao?.trim() ? formData.descricao.toUpperCase() : undefined,
          data: dataPayload,
          hora: formData.hora?.trim() || undefined,
          prioridade: formData.prioridade,
        });
        toast.success('Lembrete atualizado!');
      } else {
        await createLembrete({
          titulo: formData.titulo.toUpperCase(),
          descricao: formData.descricao?.trim() ? formData.descricao.toUpperCase() : undefined,
          data: dataPayload,
          hora: formData.hora?.trim() || undefined,
          prioridade: formData.prioridade,
        });
        toast.success('Lembrete criado!');
      }
      handleCloseDialog();
    } catch {
      toast.error(editingLembrete ? 'Erro ao atualizar lembrete' : 'Erro ao criar lembrete');
    }
  };

  const handleToggleStatus = (id: string) => {
    toggleStatus(id).catch(() => toast.error('Erro ao alterar status'));
  };

  const handleCancelar = (id: string) => {
    updateLembrete(id, { status: 'cancelado' })
      .then(() => toast.success('Lembrete cancelado'))
      .catch(() => toast.error('Erro ao cancelar lembrete'));
  };

  const handleReabrir = (id: string) => {
    updateLembrete(id, { status: 'pendente' })
      .then(() => toast.success('Lembrete reaberto'))
      .catch(() => toast.error('Erro ao reabrir lembrete'));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteLembrete(deleteId);
      toast.success('Lembrete excluido!');
      setDeleteId(null);
    } catch {
      toast.error('Erro ao excluir lembrete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Lembretes</h1>
          <p className="mt-1 text-sm text-slate-500">Gerencie seus lembretes e notificacoes</p>
        </div>
        <button
          onClick={() => handleOpenDialog()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Lembrete</span>
        </button>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Pendentes</p>
              <p className="text-lg font-bold text-slate-900">{contadores.pendentes}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Concluidos</p>
              <p className="text-lg font-bold text-slate-900">{contadores.concluidos}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Atrasados</p>
              <p className="text-lg font-bold text-red-600">{contadores.atrasados}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-1 w-fit">
        {(['todos', 'pendente', 'concluido', 'cancelado'] as FiltroStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setFiltroStatus(status)}
            className={cn(
              'rounded px-3 py-1.5 text-sm font-medium transition-colors',
              filtroStatus === status
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            {status === 'todos' ? 'Todos' : STATUS_CONFIG[status].label}
          </button>
        ))}
      </div>

      {/* Lista de lembretes */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">Carregando lembretes...</p>
          </div>
        ) : lembretesFiltrados.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-4 text-sm text-slate-500">Nenhum lembrete encontrado</p>
          </div>
        ) : (
          lembretesFiltrados.map((lembrete) => {
            const StatusIcon = STATUS_CONFIG[lembrete.status].icon;
            const atrasado = lembrete.status === 'pendente' && isOverdue(lembrete.data);

            return (
              <div
                key={lembrete.id}
                className={cn(
                  'rounded-xl border bg-white p-4 transition-all hover:shadow-md',
                  atrasado ? 'border-red-200 bg-red-50' : 'border-slate-200',
                  lembrete.status === 'concluido' && 'opacity-60'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleStatus(lembrete.id)}
                    className={cn(
                      'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                      lembrete.status === 'concluido'
                        ? 'border-emerald-500 bg-emerald-500'
                        : 'border-slate-300 hover:border-emerald-500'
                    )}
                  >
                    {lembrete.status === 'concluido' && (
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    )}
                  </button>

                  {/* Conteudo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3
                          className={cn(
                            'font-medium',
                            lembrete.status === 'concluido'
                              ? 'text-slate-500 line-through'
                              : 'text-slate-900'
                          )}
                        >
                          {lembrete.titulo}
                        </h3>
                        {lembrete.descricao && (
                          <p className="mt-0.5 text-sm text-slate-500">{lembrete.descricao}</p>
                        )}
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                          PRIORIDADE_CONFIG[lembrete.prioridade].cor
                        )}
                      >
                        {PRIORIDADE_CONFIG[lembrete.prioridade].label}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className={atrasado ? 'text-red-600 font-medium' : ''}>
                          {formatDateStringToBR(lembrete.data)}
                          {atrasado && ' (ATRASADO)'}
                        </span>
                      </div>
                      {lembrete.hora && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{lembrete.hora}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acoes */}
                  <div className="flex items-center gap-1">
                    {lembrete.status === 'cancelado' ? (
                      <button
                        onClick={() => handleReabrir(lembrete.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Reabrir lembrete"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCancelar(lembrete.id)}
                        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                        title="Marcar como cancelado"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleOpenDialog(lembrete)}
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteId(lembrete.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Dialog Adicionar/Editar */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingLembrete ? 'Editar Lembrete' : 'Novo Lembrete'}</DialogTitle>
            <DialogDescription>
              {editingLembrete
                ? 'Altere os dados do lembrete'
                : 'Crie um novo lembrete para ser notificado'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Titulo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Pagar fornecedor"
                  className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Descricao</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Detalhes adicionais..."
                  rows={2}
                  className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Data <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Hora</label>
                  <input
                    type="time"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Prioridade</label>
                <div className="flex gap-2">
                  {(['baixa', 'media', 'alta'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormData({ ...formData, prioridade: p })}
                      className={cn(
                        'flex-1 rounded-lg border-2 py-2 text-sm font-medium transition-all',
                        formData.prioridade === p
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      )}
                    >
                      {PRIORIDADE_CONFIG[p].label}
                    </button>
                  ))}
                </div>
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
                className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {editingLembrete ? 'Salvar' : 'Criar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Confirmar Exclusao */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este lembrete? Esta acao nao pode ser desfeita.
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
