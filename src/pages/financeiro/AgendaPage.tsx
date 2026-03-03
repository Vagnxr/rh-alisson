import { useEffect, useMemo, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Loader2, Check, Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DiaAgenda, AgendaItem, AgendaItemDirectInput } from '@/types/agenda';
import { useAgendaStore } from '@/stores/agendaStore';
import { formatDateToLocalYYYYMMDD, addOneMonth } from '@/lib/date';
import { formatValorForInput, parseValorFromInput } from '@/lib/formatValor';
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
      toast.error('Preencha Descricao e Valor.');
      return;
    }
    if (formDirect.recorrente && formDirect.valores?.length) {
      const validRows = formDirect.valores.filter(
        r => r.data.trim() && parseValorFromInput(r.valor) > 0,
      );
      if (validRows.length === 0) {
        toast.error('Adicione ao menos uma data com valor maior que zero na tabela.');
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
          validRows.length > 1
            ? `${validRows.length} lancamentos adicionados na agenda.`
            : 'Lancamento adicionado na agenda.',
        );
        setOpenLancarDirect(false);
        setFormDirect(initialFormDirect);
        fetchDias({ dataInicio, dataFim }).catch(() => {});
        if (validRows[0]?.data) fetchDia(validRows[0].data).catch(() => {});
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao lancar na agenda.');
      }
      return;
    }
    const data = formDirect.data?.trim().slice(0, 10) ?? '';
    const valorNum = parseValorFromInput(formDirect.valor);
    if (!data) {
      toast.error('Preencha Data, Descricao e Valor.');
      return;
    }
    if (valorNum <= 0) {
      toast.error('Valor deve ser maior que zero.');
      return;
    }
    try {
      const payload: AgendaItemDirectInput = {
        data,
        descricao,
        valor: valorNum,
      };
      await addItemDirect(payload);
      toast.success('Lancamento adicionado na agenda.');
      setOpenLancarDirect(false);
      setFormDirect(initialFormDirect);
      fetchDias({ dataInicio, dataFim }).catch(() => {});
      fetchDia(data).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao lancar na agenda.');
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
      toast.error('Preencha Data, Descricao e Valor.');
      return;
    }
    if (valorNum <= 0) {
      toast.error('Preencha Data, Descricao e Valor.');
      return;
    }
    try {
      await updateItemDirect(editingDirectItem.id, {
        data: formEditDirect.data,
        descricao,
        valor: valorNum,
      });
      toast.success('Item atualizado.');
      setEditingDirectItem(null);
      await fetchDias({ dataInicio, dataFim });
      if (diaSelecionado) await fetchDia(diaSelecionado.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar.');
    }
  };

  const handleExcluirItem = async () => {
    if (!excluirItemId) return;
    try {
      await deleteItemDirect(excluirItemId);
      toast.success('Lancamento excluido da agenda.');
      setExcluirItemId(null);
      await fetchDias({ dataInicio, dataFim });
      if (diaSelecionado?.data) await fetchDia(diaSelecionado.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir.');
    }
  };

  const handleDesmarcarPago = async (itemId: string) => {
    try {
      await desmarcarPago(itemId);
      toast.success('Item desmarcado como pago.');
      if (diaSelecionado?.data) {
        await fetchDia(diaSelecionado.data);
        fetchDias({ dataInicio, dataFim }).catch(() => {});
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao desmarcar.');
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
        toast.success('Item marcado como pago.');
      } else {
        await marcarPagoLote(confirmarPagoIds);
        toast.success(`${confirmarPagoIds.length} itens marcados como pagos.`);
      }
      setSelectedIds(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao marcar como pago.');
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
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Agenda</h1>
          <p className="mt-1 text-sm text-slate-500">
            Visualize entradas e saidas por dia e marque itens como pagos
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpenLancarDirect(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Lançar na agenda
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={clearError} className="text-red-500 underline">
            Fechar
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative" ref={monthYearRef}>
              <button
                type="button"
                onClick={() => setOpenMonthYear(v => !v)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-lg font-semibold text-slate-800 capitalize hover:bg-slate-50"
              >
                {monthTitle}
                <ChevronDown
                  className={`h-5 w-5 text-slate-500 transition-transform ${openMonthYear ? 'rotate-180' : ''}`}
                />
              </button>
              {openMonthYear && (
                <div className="absolute top-full left-0 z-10 mt-1 w-[min(320px,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-4 shadow-lg">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium whitespace-nowrap text-slate-600">
                      Ano
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setYear(y => y - 1)}
                        className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="min-w-[4ch] text-center font-medium text-slate-800">
                        {year}
                      </span>
                      <button
                        type="button"
                        onClick={() => setYear(y => y + 1)}
                        className="rounded border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-50"
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
                            ? 'bg-emerald-100 font-semibold text-emerald-800'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2">
              <span className="block text-xs font-medium text-slate-500">Total do mes</span>
              <span className="text-lg font-bold text-slate-900">{formatCurrency(totalMes)}</span>
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
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
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
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
          {WEEKDAYS.map(w => (
            <div key={w} className="py-1">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
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
                className={`flex min-h-[80px] flex-col items-stretch rounded-lg border p-2 text-left transition-colors ${
                  isCurrentMonth
                    ? temValor
                      ? 'cursor-pointer border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50'
                      : 'cursor-pointer border-slate-100 bg-slate-50/50 hover:bg-slate-100'
                    : 'cursor-pointer border-transparent bg-transparent'
                }`}
              >
                <span
                  className={`self-start text-sm font-medium ${
                    isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {date.getDate()}
                </span>
                {temValor && (
                  <div
                    className={`mt-1.5 flex w-full justify-center font-semibold ${
                      isCurrentMonth ? 'text-base text-slate-900' : 'text-[10px] text-slate-400'
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
        <DialogContent>
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
              Entradas e saídas do dia. Marque itens como pagos. Para corrigir na origem (despesa,
              entrada ou agenda), use &quot;Pago · Desmarcar&quot; antes.
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
                  <div className="text-sm font-medium text-slate-900">
                    Total do dia (soma):{' '}
                    {formatCurrency(diaSelecionado.totalEntradas + diaSelecionado.totalSaidas)}
                  </div>
                  <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
                    {(diaSelecionado.itens ?? []).length === 0 ? (
                      <li className="py-4 text-center text-sm text-slate-500">
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lançar<area shape="poly" coords="" href="" alt="" /> na agenda</DialogTitle>
            <DialogDescription>
              O item ficará apenas na agenda (não vincula a despesa). Data, Descrição e Valor são
              obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLancarDirectSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="direct-data" className="text-sm font-medium text-slate-700">
                Data <span className="text-red-500">*</span>
              </label>
              <input
                id="direct-data"
                type="date"
                value={formDirect.data}
                onChange={e => setFormDirect({ ...formDirect, data: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="direct-descricao" className="text-sm font-medium text-slate-700">
                Descrição <span className="text-red-500">*</span>
              </label>
              <input
                id="direct-descricao"
                type="text"
                value={formDirect.descricao ?? ''}
                onChange={e =>
                  setFormDirect({ ...formDirect, descricao: e.target.value.toUpperCase() })
                }
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="direct-valor" className="text-sm font-medium text-slate-700">
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <input
                id="direct-valor"
                type="text"
                inputMode="decimal"
                value={formDirect.valor}
                onChange={e => setFormDirect({ ...formDirect, valor: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                required={!formDirect.recorrente}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="direct-recorrente"
                type="checkbox"
                checked={formDirect.recorrente}
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
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="direct-recorrente" className="text-sm font-medium text-slate-700">
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
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Adicionar
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog editar item direto da agenda */}
      <Dialog open={!!editingDirectItem} onOpenChange={open => !open && setEditingDirectItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar item da agenda</DialogTitle>
            <DialogDescription>
              Alterar data, descricao e valor do lancamento direto.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEditDirect} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="edit-direct-data" className="text-sm font-medium text-slate-700">
                Data <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-direct-data"
                type="date"
                value={formEditDirect.data}
                onChange={e => setFormEditDirect({ ...formEditDirect, data: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-direct-descricao" className="text-sm font-medium text-slate-700">
                Descricao <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-direct-descricao"
                type="text"
                value={formEditDirect.descricao}
                onChange={e => setFormEditDirect({ ...formEditDirect, descricao: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-direct-valor" className="text-sm font-medium text-slate-700">
                Valor (R$) <span className="text-red-500">*</span>
              </label>
              <input
                id="edit-direct-valor"
                type="text"
                inputMode="decimal"
                value={formEditDirect.valor}
                onChange={e =>
                  setFormEditDirect({ ...formEditDirect, valor: e.target.value })
                }
                placeholder="0,00"
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <DialogFooter>
              <button
                type="button"
                onClick={() => setEditingDirectItem(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
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
            <AlertDialogAction onClick={handleConfirmarMarcarPago}>Confirmar</AlertDialogAction>
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
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluirItem}>Excluir</AlertDialogAction>
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
    <li className="flex items-center gap-2 rounded bg-white px-3 py-2 text-sm">
      {!item.pago ? (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600"
        />
      ) : (
        <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-100 text-emerald-600">
          <Check className="h-3 w-3" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          {item.origem && (
            <span className="inline-block rounded bg-slate-200 px-1.5 py-0.5 text-xs font-medium text-slate-700">
              {item.origem}
            </span>
          )}
          {item.parcela && (
            <span className="inline-block rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">
              Parcela {item.parcela}
            </span>
          )}
        </div>
        <span className="block font-medium text-slate-800">
          {item.descricao || 'Sem descricao'}
        </span>
        {item.tipoDespesa && (
          <span className="block text-xs text-slate-500">{item.tipoDespesa}</span>
        )}
      </div>
      <span className="font-medium text-slate-900">{formatCurrency(item.valor)}</span>
      {editavel && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Editar"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
      {excluivel && onExcluir && (
        <button
          type="button"
          onClick={onExcluir}
          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
          title="Excluir da agenda"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      {item.pago && onDesmarcarPago && (
        <button
          type="button"
          onClick={onDesmarcarPago}
          className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
          title="Desmarcar como pago"
        >
          Pago · Desmarcar
        </button>
      )}
      {item.pago && !onDesmarcarPago && (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Pago</span>
      )}
    </li>
  );
}
