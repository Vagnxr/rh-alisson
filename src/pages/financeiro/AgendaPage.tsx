import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Check, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { DiaAgenda, AgendaItem, AgendaItemDirectInput } from '@/types/agenda';
import { useAgendaStore } from '@/stores/agendaStore';
import { formatDateToLocalYYYYMMDD } from '@/lib/date';
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

function getDaysInMonthGrid(year: number, month: number): { date: Date; dateStr: string; isCurrentMonth: boolean }[] {
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

const initialFormDirect: AgendaItemDirectInput = {
  data: formatDateToLocalYYYYMMDD(new Date()),
  descricao: '',
  valor: 0,
};

export function AgendaPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [confirmarPagoIds, setConfirmarPagoIds] = useState<string[] | null>(null);
  const [openLancarDirect, setOpenLancarDirect] = useState(false);
  const [formDirect, setFormDirect] = useState(initialFormDirect);

  const {
    dias,
    diaSelecionado,
    isLoading,
    isLoadingDetalhe,
    error,
    fetchDias,
    fetchDia,
    addItemDirect,
    marcarPago,
    marcarPagoLote,
    setDiaSelecionado,
    clearError,
  } = useAgendaStore();

  const diasByDate = useMemo(() => {
    const map = new Map<string, DiaAgenda>();
    dias.forEach((d) => map.set(d.data, d));
    return map;
  }, [dias]);

  const dataInicio = formatDateToLocalYYYYMMDD(getFirstDayOfMonth(year, month));
  const dataFim = formatDateToLocalYYYYMMDD(getLastDayOfMonth(year, month));

  useEffect(() => {
    fetchDias({ dataInicio, dataFim }).catch(() => {});
  }, [dataInicio, dataFim, fetchDias]);

  const grid = useMemo(
    () => getDaysInMonthGrid(year, month),
    [year, month]
  );

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
    () => (diaSelecionado?.itens ?? []).filter((i) => !i.pago),
    [diaSelecionado?.itens]
  );

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const handleMarcarPagoClick = () => {
    if (selectedIds.size === 0) return;
    setConfirmarPagoIds(Array.from(selectedIds));
  };

  const handleLancarDirectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formDirect.valor <= 0) {
      toast.error('Informe o valor.');
      return;
    }
    try {
      const payload: AgendaItemDirectInput = {
        data: formDirect.data,
        valor: formDirect.valor,
        ...(formDirect.descricao?.trim() && { descricao: formDirect.descricao.trim() }),
      };
      await addItemDirect(payload);
      toast.success('Lancamento adicionado na agenda.');
      setOpenLancarDirect(false);
      setFormDirect(initialFormDirect);
      fetchDias({ dataInicio, dataFim }).catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao lancar na agenda.');
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
          Lancar na agenda
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={clearError} className="text-red-500 underline">
            Fechar
          </button>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 capitalize">{monthTitle}</h2>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => {
                if (month === 0) {
                  setMonth(11);
                  setYear((y) => y - 1);
                } else {
                  setMonth((m) => m - 1);
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
                  setYear((y) => y + 1);
                } else {
                  setMonth((m) => m + 1);
                }
              }}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500">
          {WEEKDAYS.map((w) => (
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
            const temValor = totalE > 0 || totalS > 0;
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => isCurrentMonth && handleClickDia(dateStr)}
                className={`min-h-[72px] rounded-lg border p-2 text-left transition-colors ${
                  isCurrentMonth
                    ? temValor
                      ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50 cursor-pointer'
                      : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100 cursor-pointer'
                    : 'border-transparent bg-transparent cursor-default'
                }`}
              >
                <span
                  className={`text-sm font-medium ${
                    isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
                  }`}
                >
                  {date.getDate()}
                </span>
                {isCurrentMonth && temValor && (
                  <div className="mt-1 text-[10px] leading-tight text-slate-600">
                    {formatCurrency(totalE - totalS)}
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
        onOpenChange={(open) => {
          if (!open) {
            setDiaSelecionado(null);
            setSelectedIds(new Set());
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
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
            Entradas e saidas do dia. Marque itens como pagos.
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
                <div className="flex gap-4 text-sm">
                  <span className="text-emerald-600 font-medium">
                    Entradas: {formatCurrency(diaSelecionado.totalEntradas)}
                  </span>
                  <span className="text-red-600 font-medium">
                    Saidas: {formatCurrency(diaSelecionado.totalSaidas)}
                  </span>
                </div>
                <ul className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2">
                  {(diaSelecionado.itens ?? []).length === 0 ? (
                    <li className="py-4 text-center text-sm text-slate-500">
                      Nenhum item neste dia
                    </li>
                  ) : (
                    (diaSelecionado.itens ?? []).map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        selected={selectedIds.has(item.id)}
                        onToggleSelect={() => handleToggleSelect(item.id)}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Lancar na agenda</DialogTitle>
            <DialogDescription>
              O item ficara apenas na agenda (nao vincula a despesa).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLancarDirectSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="direct-data" className="text-sm font-medium text-slate-700">
                Data
              </label>
              <input
                id="direct-data"
                type="date"
                value={formDirect.data}
                onChange={(e) => setFormDirect({ ...formDirect, data: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="direct-descricao" className="text-sm font-medium text-slate-700">
                Descricao (opcional)
              </label>
              <input
                id="direct-descricao"
                type="text"
                value={formDirect.descricao ?? ''}
                onChange={(e) => setFormDirect({ ...formDirect, descricao: e.target.value })}
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="direct-valor" className="text-sm font-medium text-slate-700">
                Valor (R$)
              </label>
              <input
                id="direct-valor"
                type="number"
                step="0.01"
                min="0"
                value={formDirect.valor || ''}
                onChange={(e) =>
                  setFormDirect({ ...formDirect, valor: parseFloat(e.target.value) || 0 })
                }
                className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
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

      {/* Confirmar marcar como pago */}
      <AlertDialog
        open={!!confirmarPagoIds?.length}
        onOpenChange={(open) => !open && setConfirmarPagoIds(null)}
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
            <AlertDialogAction onClick={handleConfirmarMarcarPago}>
              Confirmar
            </AlertDialogAction>
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
}: {
  item: AgendaItem;
  selected: boolean;
  onToggleSelect: () => void;
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
        <span className="font-medium text-slate-800">
          {item.descricao || 'Sem descricao'}
        </span>
        {(item.tipoDespesa || item.origem) && (
          <span className="ml-2 block text-xs text-slate-500">
            {[item.tipoDespesa, item.origem].filter(Boolean).join(' · ')}
          </span>
        )}
      </div>
      <span
        className={`font-medium ${
          item.tipo === 'entrada' ? 'text-emerald-600' : 'text-red-600'
        }`}
      >
        {item.tipo === 'entrada' ? '+' : '-'}
        {formatCurrency(item.valor)}
      </span>
      {item.pago && (
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
          Pago
        </span>
      )}
    </li>
  );
}
