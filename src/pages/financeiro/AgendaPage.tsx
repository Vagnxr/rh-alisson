import { useEffect, useMemo, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Loader2, Check, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DiaAgenda, AgendaItem, AgendaItemDirectInput } from '@/types/agenda';
import { useAgendaStore } from '@/stores/agendaStore';
import { formatDateToLocalYYYYMMDD, addOneMonth } from '@/lib/date';
import { formatValorForInput, parseValorFromInput } from '@/lib/formatValor';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DateInput } from '@/components/ui/date-input';
import { PAGE_TITLE, PAGE_SUBTITLE, BTN_CANCEL } from '@/lib/uiClasses';
import { DataValorList } from '@/components/ui/data-valor-list';
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

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0);
}

function getDaysInMonthGrid(
  year: number,
  month: number,
): { date: Date; dateStr: string; isCurrentMonth: boolean }[] {
  const first = getFirstDayOfMonth(year, month);
  const last = getLastDayOfMonth(year, month);
  const startPad = first.getDay();
  const daysInMonth = last.getDate();
  const grid: { date: Date; dateStr: string; isCurrentMonth: boolean }[] = [];

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevLast = getLastDayOfMonth(prevYear, prevMonth).getDate();

  for (let i = 0; i < startPad; i++) {
    const d = prevLast - startPad + 1 + i;
    const date = new Date(prevYear, prevMonth, d);
    grid.push({
      date,
      dateStr: formatDateToLocalYYYYMMDD(date),
      isCurrentMonth: false,
    });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    grid.push({
      date,
      dateStr: formatDateToLocalYYYYMMDD(date),
      isCurrentMonth: true,
    });
  }
  const remaining = 42 - grid.length;
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month, daysInMonth + i);
    grid.push({
      date,
      dateStr: formatDateToLocalYYYYMMDD(date),
      isCurrentMonth: false,
    });
  }
  return grid;
}

const initialFormDirect = {
  data: formatDateToLocalYYYYMMDD(new Date()),
  descricao: '',
  valor: '',
  recorrente: false,
  valores: undefined as { data: string; valor: string }[] | undefined,
};

export function AgendaPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [confirmarPagoIds, setConfirmarPagoIds] = useState<string[] | null>(null);
  const [openLancarDirect, setOpenLancarDirect] = useState(false);
  const [formDirect, setFormDirect] = useState(initialFormDirect);
  const [openMonthYear, setOpenMonthYear] = useState(false);
  const monthYearRef = useRef<HTMLDivElement>(null);
  const [editingDirectItem, setEditingDirectItem] = useState<AgendaItem | null>(null);
  const [formEditDirect, setFormEditDirect] = useState({ data: '', descricao: '', valor: '' });
  const [excluirItemId, setExcluirItemId] = useState<string | null>(null);

  const {
    dias,
    diaSelecionado,
    isLoading,
    isLoadingDetalhe,
    error,
    fetchDias,
    fetchDia,
    addItemDirect,
    addItemDirectComParcelas,
    updateItemDirect,
    deleteItemDirect,
    marcarPago,
    marcarPagoLote,
    desmarcarPago,
    setDiaSelecionado,
    clearError,
  } = useAgendaStore();

  const diasByDate = useMemo(() => {
    const map = new Map<string, DiaAgenda>();
    dias.forEach(d => map.set(d.data, d));
    return map;
  }, [dias]);

  const dataInicio = formatDateToLocalYYYYMMDD(getFirstDayOfMonth(year, month));
  const dataFim = formatDateToLocalYYYYMMDD(getLastDayOfMonth(year, month));

  useEffect(() => {
    fetchDias({ dataInicio, dataFim }).catch(() => {});
  }, [dataInicio, dataFim, fetchDias]);

  useEffect(() => {
    if (openLancarDirect) {
      setFormDirect({
        ...initialFormDirect,
        data: formatDateToLocalYYYYMMDD(new Date()),
      });
    }
  }, [openLancarDirect]);

  useEffect(() => {
    if (!openMonthYear) return;
    const close = (e: MouseEvent) => {
      if (monthYearRef.current && !monthYearRef.current.contains(e.target as Node)) {
        setOpenMonthYear(false);
      }
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openMonthYear]);

  const grid = useMemo(() => getDaysInMonthGrid(year, month), [year, month]);

  /** Agenda e so soma: total do mes = soma dos valores de cada dia (sem subtracao). */
  const totalMes = useMemo(() => {
    return grid
      .filter(g => g.isCurrentMonth)
      .reduce((acc, g) => {
        const d = diasByDate.get(g.dateStr);
        return acc + (d?.totalEntradas ?? 0) + (d?.totalSaidas ?? 0);
      }, 0);
  }, [grid, diasByDate]);

  const handleClickDia = (dateStr: string) => {
    const existente = diasByDate.get(dateStr);
    if (existente?.itens && existente.itens.length > 0) {
      setDiaSelecionado(existente);
      return;
    }
    setDiaSelecionado({
      data: dateStr,
      totalEntradas: existente?.totalEntradas ?? 0,
      totalSaidas: existente?.totalSaidas ?? 0,
      itens: existente?.itens,
    });
    fetchDia(dateStr).catch(() => {});
  };

  const itensNaoPagos = useMemo(
    () => (diaSelecionado?.itens ?? []).filter(i => !i.pago),
    [diaSelecionado?.itens],
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMarcarPagoClick = () => {
    if (selectedIds.size === 0) return;
    setConfirmarPagoIds(Array.from(selectedIds));
  };

  const handleLancarDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const descricao = formDirect.descricao?.trim() ?? '';
    if (!descricao) {
      toast.error(<span data-testid="agenda-mensagem-erro">Preencha Descricao e Valor.</span>);
      return;
    }
    if (formDirect.recorrente && formDirect.valores?.length) {
      const validRows = formDirect.valores.filter(
        r => r.data.trim() && parseValorFromInput(r.valor) > 0,
      );
      if (validRows.length === 0) {
        toast.error(<span data-testid="agenda-mensagem-erro">Adicione ao menos uma data com valor maior que zero na tabela.</span>);
        return;
      }
      try {
        await addItemDirectComParcelas({
          descricao,
          parcelas: validRows.map(r => ({
            data: r.data.trim().slice(0, 10),
            valor: parseValorFromInput(r.valor),
          })),
        });
        toast.success(
          <span data-testid="agenda-mensagem-sucesso">
            {validRows.length > 1
              ? `${validRows.length} lancamentos adicionados na agenda.`
              : 'Lancamento adicionado na agenda.'}
          </span>,
        );
        setOpenLancarDirect(false);
        setFormDirect(initialFormDirect);
        fetchDias({ dataInicio, dataFim }).catch(() => {});
        if (validRows[0]?.data) fetchDia(validRows[0].data).catch(() => {});
      } catch (err) {
        toast.error(<span data-testid="agenda-mensagem-erro">{err instanceof Error ? err.message : 'Erro ao lancar na agenda.'}</span>);
      }
      return;
    }
    const data = formDirect.data?.trim().slice(0, 10) ?? '';
    const valorNum = parseValorFromInput(formDirect.valor);
    if (!data) {
      toast.error(<span data-testid="agenda-mensagem-erro">Preencha Data, Descricao e Valor.</span>);
      return;
    }
    if (valorNum <= 0) {
      toast.error(<span data-testid="agenda-mensagem-erro">Valor deve ser maior que zero.</span>);
      return;
    }
    try {
      const payload: AgendaItemDirectInput = {
        data,
        descricao,
        valor: valorNum,
      };
      await addItemDirect(payload);
      toast.success(<span data-testid="agenda-mensagem-sucesso">Lancamento adicionado na agenda.</span>);
      setOpenLancarDirect(false);
      setFormDirect(initialFormDirect);
      fetchDias({ dataInicio, dataFim }).catch(() => {});
      fetchDia(data).catch(() => {});
    } catch (err) {
      toast.error(<span data-testid="agenda-mensagem-erro">{err instanceof Error ? err.message : 'Erro ao lancar na agenda.'}</span>);
    }
  };

  const handleOpenEditDirect = (item: AgendaItem) => {
    if (!diaSelecionado) return;
    setEditingDirectItem(item);
    setFormEditDirect({
      data: diaSelecionado.data,
      descricao: item.descricao ?? '',
      valor: formatValorForInput(item.valor),
    });
  };

  const handleSubmitEditDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDirectItem) return;
    const descricao = formEditDirect.descricao.trim();
    const valorNum = parseValorFromInput(formEditDirect.valor);
    if (!descricao) {
      toast.error(<span data-testid="agenda-mensagem-erro">Preencha Data, Descricao e Valor.</span>);
      return;
    }
    if (valorNum <= 0) {
      toast.error(<span data-testid="agenda-mensagem-erro">Preencha Data, Descricao e Valor.</span>);
      return;
    }
    try {
      await updateItemDirect(editingDirectItem.id, {
        data: formEditDirect.data,
        descricao,
        valor: valorNum,
      });
      toast.success(<span data-testid="agenda-mensagem-sucesso">Item atualizado.</span>);
      setEditingDirectItem(null);
      await fetchDias({ dataInicio, dataFim });
      if (diaSelecionado) await fetchDia(diaSelecionado.data);
    } catch (err) {
      toast.error(<span data-testid="agenda-mensagem-erro">{err instanceof Error ? err.message : 'Erro ao atualizar.'}</span>);
    }
  };

  const handleExcluirItem = async () => {
    if (!excluirItemId) return;
    try {
      await deleteItemDirect(excluirItemId);
      toast.success(<span data-testid="agenda-mensagem-sucesso">Lancamento excluido da agenda.</span>);
      setExcluirItemId(null);
      await fetchDias({ dataInicio, dataFim });
      if (diaSelecionado?.data) await fetchDia(diaSelecionado.data);
    } catch (err) {
      toast.error(<span data-testid="agenda-mensagem-erro">{err instanceof Error ? err.message : 'Erro ao excluir.'}</span>);
    }
  };

  const handleDesmarcarPago = async (itemId: string) => {
    try {
      await desmarcarPago(itemId);
      toast.success(<span data-testid="agenda-mensagem-sucesso">Item desmarcado como pago.</span>);
      if (diaSelecionado?.data) {
        await fetchDia(diaSelecionado.data);
        fetchDias({ dataInicio, dataFim }).catch(() => {});
      }
    } catch (err) {
      toast.error(<span data-testid="agenda-mensagem-erro">{err instanceof Error ? err.message : 'Erro ao desmarcar.'}</span>);
    }
  };

  const handleConfirmarMarcarPago = async () => {
    if (!confirmarPagoIds || confirmarPagoIds.length === 0) {
      setConfirmarPagoIds(null);
      return;
    }
    try {
      if (confirmarPagoIds.length === 1) {
        await marcarPago(confirmarPagoIds[0]);
        toast.success(<span data-testid="agenda-mensagem-sucesso">Item marcado como pago.</span>);
      } else {
        await marcarPagoLote(confirmarPagoIds);
        toast.success(<span data-testid="agenda-mensagem-sucesso">{`${confirmarPagoIds.length} itens marcados como pagos.`}</span>);
      }
      setSelectedIds(new Set());
    } catch (e) {
      toast.error(<span data-testid="agenda-mensagem-erro">{e instanceof Error ? e.message : 'Erro ao marcar como pago.'}</span>);
    }
    setConfirmarPagoIds(null);
  };

  const monthTitle = useMemo(() => {
    const d = new Date(year, month, 1);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [year, month]);

  if (isLoading && dias.length === 0) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={PAGE_TITLE}>Agenda</h1>
          <p className={PAGE_SUBTITLE}>Visualize entradas e saidas por dia e marque itens como pagos</p>
        </div>
        <button
          type="button"
          onClick={() => setOpenLancarDirect(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          data-testid="agenda-lancar"
        >
          <Plus className="h-4 w-4" />
          Lançar na agenda
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" data-testid="agenda-mensagem-erro">
          <span>{error}</span>
          <button type="button" onClick={clearError} className="text-red-500 underline">
            Fechar
          </button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative" ref={monthYearRef}>
              <button
                type="button"
                onClick={() => setOpenMonthYear(v => !v)}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-left text-lg font-semibold text-foreground capitalize hover:bg-muted/40"
                data-testid="agenda-filtro-periodo-mes"
              >
                {monthTitle}
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${openMonthYear ? 'rotate-180' : ''}`}
                />
              </button>
              {openMonthYear && (
                <div className="absolute top-full left-0 z-10 mt-1 w-[min(320px,calc(100vw-2rem))] rounded-lg border border-border bg-card p-4 shadow-lg">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium whitespace-nowrap text-muted-foreground">
                      Ano
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setYear(y => y - 1)}
                        className="rounded border border-border p-1.5 text-muted-foreground hover:bg-muted/40"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="min-w-[4ch] text-center font-medium text-foreground">
                        {year}
                      </span>
                      <button
                        type="button"
                        onClick={() => setYear(y => y + 1)}
                        className="rounded border border-border p-1.5 text-muted-foreground hover:bg-muted/40"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="grid w-full grid-cols-3 gap-2">
                    {MONTH_NAMES.map((name, i) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => {
                          setMonth(i);
                          setOpenMonthYear(false);
                        }}
                        className={`min-w-0 rounded px-3 py-2 text-left text-sm whitespace-nowrap ${
                          i === month
                            ? 'bg-primary/15 font-semibold text-primary'
                            : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-border bg-muted/40 px-4 py-2" data-testid="agenda-total-mes">
              <span className="block text-xs font-medium text-muted-foreground">Total do mes</span>
              <span className="text-lg font-bold text-foreground">{formatCurrency(totalMes)}</span>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                if (month === 0) {
                  setMonth(11);
                  setYear(y => y - 1);
                } else {
                  setMonth(m => m - 1);
                }
              }}
              className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted/40"
              data-testid="agenda-filtro-prev"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (month === 11) {
                  setMonth(0);
                  setYear(y => y + 1);
                } else {
                  setMonth(m => m + 1);
                }
              }}
              className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted/40"
              data-testid="agenda-filtro-next"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
          {WEEKDAYS.map(w => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1" data-testid="agenda-calendario">
          {grid.map(({ date, dateStr, isCurrentMonth }) => {
            const dia = diasByDate.get(dateStr);
            const totalE = dia?.totalEntradas ?? 0;
            const totalS = dia?.totalSaidas ?? 0;
            const somaDia = totalE + totalS;
            const temValor = somaDia > 0;
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => (isCurrentMonth || temValor) && handleClickDia(dateStr)}
                data-testid={`agenda-dia-${dateStr}`}
                className={`flex min-h-[80px] flex-col items-stretch rounded-lg border p-2 text-left transition-colors ${
                  isCurrentMonth
                    ? temValor
                      ? 'cursor-pointer border-primary/30 bg-primary/10 hover:bg-primary/15'
                      : 'cursor-pointer border-border bg-muted/40 hover:bg-muted/50'
                    : 'cursor-pointer border-transparent bg-transparent'
                }`}
              >
                <span
                  className={`self-start text-sm font-medium ${
                    isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {date.getDate()}
                </span>
                {temValor && (
                  <div
                    className={`mt-1.5 flex w-full justify-center font-semibold ${
                      isCurrentMonth ? 'text-base text-foreground' : 'text-[10px] text-muted-foreground'
                    }`}
                  >
                    {formatCurrency(somaDia)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dialog detalhe do dia */}
      <Dialog
        open={!!diaSelecionado}
        onOpenChange={open => {
          if (!open) {
            setDiaSelecionado(null);
            setSelectedIds(new Set());
          }
        }}
      >
        <DialogContent
          data-testid="agenda-dialog-dia"
          closeButtonDataTestId="agenda-dialog-dia-fechar"
          className="sm:w-[80vw] sm:max-w-[1100px]"
        >
          <DialogHeader>
            <DialogTitle>
              {diaSelecionado
                ? new Date(diaSelecionado.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })
                : ''}
            </DialogTitle>
            <DialogDescription>
              Entradas e saídas do dia.
            </DialogDescription>
          </DialogHeader>
          {isLoadingDetalhe ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {diaSelecionado && (
                <>
                  <div className="text-sm font-medium text-foreground">
                    Total do dia (soma):{' '}
                    {formatCurrency(diaSelecionado.totalEntradas + diaSelecionado.totalSaidas)}
                  </div>
                  <ul className="max-h-[60vh] min-h-[280px] space-y-2 overflow-y-auto rounded-lg border border-border bg-muted/40 p-2" data-testid="agenda-dia-itens">
                    {(diaSelecionado.itens ?? []).length === 0 ? (
                      <li className="py-4 text-center text-sm text-muted-foreground">
                        Nenhum item neste dia
                      </li>
                    ) : (
                      (diaSelecionado.itens ?? []).map(item => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          selected={selectedIds.has(item.id)}
                          onToggleSelect={() => handleToggleSelect(item.id)}
                          editavel={!item.origem || item.origem === 'Agenda'}
                          excluivel={!item.origem || item.origem === 'Agenda'}
                          onEdit={() => handleOpenEditDirect(item)}
                          onExcluir={() => setExcluirItemId(item.id)}
                          onDesmarcarPago={() => handleDesmarcarPago(item.id)}
                        />
                      ))
                    )}
                  </ul>
                  {itensNaoPagos.length > 0 && (
                    <DialogFooter>
                      <button
                        type="button"
                        onClick={handleMarcarPagoClick}
                        disabled={selectedIds.size === 0}
                        className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        data-testid="agenda-dia-marcar-pago"
                      >
                        <Check className="h-4 w-4" />
                        {selectedIds.size === 0
                          ? 'Selecione itens para marcar como pago'
                          : selectedIds.size === 1
                            ? 'Marcar como pago'
                            : `Marcar ${selectedIds.size} como pagos`}
                      </button>
                    </DialogFooter>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog lancar direto na agenda */}
      <Dialog open={openLancarDirect} onOpenChange={setOpenLancarDirect}>
        <DialogContent data-testid="agenda-dialog-lancar">
          <DialogHeader>
            <DialogTitle>Lançar na agenda</DialogTitle>
            <DialogDescription>
              O item ficará apenas na agenda (não vincula a despesa). Data, Descrição e Valor são
              obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLancarDirectSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="direct-data" className="text-sm font-medium text-foreground">
                Data <span className="text-red-500">*</span>
              </label>
              <DateInput
                value={formDirect.data}
                onChange={v => setFormDirect({ ...formDirect, data: v })}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="direct-descricao" className="text-sm font-medium text-foreground">
                Descrição <span className="text-red-500">*</span>
              </label>
              <input
                id="direct-descricao"
                type="text"
                value={formDirect.descricao ?? ''}
                onChange={e =>
                  setFormDirect({ ...formDirect, descricao: e.target.value.toUpperCase() })
                }
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
                required
                data-testid="agenda-descricao"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="direct-valor" className="text-sm font-medium text-foreground">
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <CurrencyInput
                id="direct-valor"
                value={formDirect.valor}
                onChange={(v) => setFormDirect({ ...formDirect, valor: v })}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
                required={!formDirect.recorrente}
                testId="agenda-valor"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="direct-recorrente"
                type="checkbox"
                checked={formDirect.recorrente}
                data-testid="agenda-recorrente"
                onChange={e => {
                  const checked = e.target.checked;
                  setFormDirect(prev => ({
                    ...prev,
                    recorrente: checked,
                    valores: checked
                      ? [{ data: prev.data, valor: prev.valor || formatValorForInput(0) }]
                      : undefined,
                  }));
                }}
                className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="direct-recorrente" className="text-sm font-medium text-foreground">
                Recorrente
              </label>
            </div>
            {formDirect.recorrente && formDirect.valores && (
              <DataValorList
                label="Datas da recorrencia"
                value={formDirect.valores}
                onChange={items => setFormDirect(prev => ({ ...prev, valores: items }))}
                addLabel="Adicionar valor"
                showTotal
                maxHeight="max-h-48"
                countLabel="parcela"
                testIdPrefix="agenda"
                getNewItem={current => {
                  const last = current[current.length - 1];
                  return {
                    data: last ? addOneMonth(last.data) : formDirect.data,
                    valor: last?.valor ?? formDirect.valor ?? formatValorForInput(0),
                  };
                }}
              />
            )}
            <DialogFooter>
              <button
                type="button"
                onClick={() => setOpenLancarDirect(false)}
                className={BTN_CANCEL}
                data-testid="agenda-cancelar"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                data-testid="agenda-submit"
              >
                Adicionar
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog editar item direto da agenda */}
      <Dialog open={!!editingDirectItem} onOpenChange={open => !open && setEditingDirectItem(null)}>
        <DialogContent data-testid="agenda-dialog-editar">
          <DialogHeader>
            <DialogTitle>Editar item da agenda</DialogTitle>
            <DialogDescription>
              Alterar data, descricao e valor do lancamento direto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEditDirect} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-direct-data" className="text-sm font-medium text-foreground">
                Data <span className="text-red-500">*</span>
              </label>
              <DateInput
                value={formEditDirect.data}
                onChange={v => setFormEditDirect({ ...formEditDirect, data: v })}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-direct-descricao" className="text-sm font-medium text-foreground">
                Descricao <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-direct-descricao"
                type="text"
                value={formEditDirect.descricao}
                onChange={e => setFormEditDirect({ ...formEditDirect, descricao: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
                required
                data-testid="agenda-edit-descricao"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-direct-valor" className="text-sm font-medium text-foreground">
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <CurrencyInput
                id="edit-direct-valor"
                value={formEditDirect.valor}
                onChange={(v) => setFormEditDirect({ ...formEditDirect, valor: v })}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-ring"
                required
                testId="agenda-edit-valor"
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setEditingDirectItem(null)}
                className={BTN_CANCEL}
                data-testid="agenda-edit-cancelar"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                data-testid="agenda-edit-submit"
              >
                Salvar
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirmar marcar como pago */}
      <AlertDialog
        open={!!confirmarPagoIds?.length}
        onOpenChange={open => !open && setConfirmarPagoIds(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmarPagoIds?.length === 1
                ? 'Marcar este item como pago?'
                : `Marcar ${confirmarPagoIds?.length} itens como pagos?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarMarcarPago} data-testid="agenda-alert-marcar-pago-confirmar">Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar excluir lancamento da agenda */}
      <AlertDialog
        open={!!excluirItemId}
        onOpenChange={open => !open && setExcluirItemId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lancamento</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir este lancamento da agenda? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="agenda-alert-excluir-cancelar">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluirItem} data-testid="agenda-alert-excluir-confirmar">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ItemRow({
  item,
  selected,
  onToggleSelect,
  editavel,
  excluivel,
  onEdit,
  onExcluir,
  onDesmarcarPago,
}: {
  item: AgendaItem;
  selected: boolean;
  onToggleSelect: () => void;
  editavel?: boolean;
  excluivel?: boolean;
  onEdit?: () => void;
  onExcluir?: () => void;
  onDesmarcarPago?: () => void;
}) {
  return (
    <li className="flex items-center gap-2 rounded bg-card px-3 py-2 text-sm" data-testid="agenda-dia-item">
      {!item.pago ? (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-border text-emerald-600"
          data-testid="agenda-dia-item-checkbox"
        />
      ) : (
        <span className="flex h-4 w-4 items-center justify-center rounded bg-primary/15 text-primary">
          <Check className="h-3 w-3" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          {item.origem && (
            <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
              {item.origem}
            </span>
          )}
          {item.parcela && (
            <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
              Parcela {item.parcela}
            </span>
          )}
        </div>
        <span className="block font-medium text-foreground">
          {item.descricao || 'Sem descricao'}
        </span>
        {item.tipoDespesa && (
          <span className="block text-xs text-muted-foreground">{item.tipoDespesa}</span>
        )}
      </div>
      <span className="font-medium text-foreground">{formatCurrency(item.valor)}</span>
      {editavel && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
          title="Editar"
          data-testid="agenda-dia-item-editar"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {excluivel && onExcluir && (
        <button
          type="button"
          onClick={onExcluir}
          className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-red-600"
          title="Excluir da agenda"
          data-testid="agenda-dia-item-excluir"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      {item.pago && onDesmarcarPago && (
        <button
          type="button"
          onClick={onDesmarcarPago}
          className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
          title="Desmarcar como pago"
          data-testid="agenda-dia-item-desmarcar-pago"
        >
          Pago · Desmarcar
        </button>
      )}
      {item.pago && !onDesmarcarPago && (
        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">Pago</span>
      )}
    </li>
  );
}
