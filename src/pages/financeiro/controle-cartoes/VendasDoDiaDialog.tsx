import { useState } from 'react';
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BTN_CANCEL, ICON_BTN, ICON_BTN_DANGER } from '@/lib/uiClasses';
import { formatDateStringToBR } from '@/lib/date';
import type { ControleCartoesRow } from '@/types/financeiro';
import { cn } from '@/lib/cn';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

interface VendasDoDiaDialogProps {
  /** Dia sendo inspecionado (YYYY-MM-DD). `null` fecha o dialogo. */
  dia: string | null;
  /** Vendas lancadas nesse dia, ja filtradas pela aba/maquininha/bandeira. */
  vendas: ControleCartoesRow[];
  onClose: () => void;
  onNova: (dia: string) => void;
  onEditar: (venda: ControleCartoesRow) => void;
  onExcluir: (id: string) => void;
}

/**
 * Vendas de um dia no credito PARCELADO A PRAZO, cada uma com suas parcelas.
 *
 * Quem trabalha com parcelado pode ter dezenas de vendas no mesmo dia, em
 * quantidades de parcelas diferentes. A tabela principal mostra o dia agregado;
 * e aqui que o cliente ve e edita venda a venda, e confere as datas de
 * recebimento de cada parcela — pedido da planilha de 19/08/2026.
 */
export function VendasDoDiaDialog({
  dia,
  vendas,
  onClose,
  onNova,
  onEditar,
  onExcluir,
}: VendasDoDiaDialogProps) {
  const [expandida, setExpandida] = useState<string | null>(null);

  return (
    <Dialog open={!!dia} onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vendas de {dia ? formatDateStringToBR(dia) : ''}</DialogTitle>
          <DialogDescription>
            {vendas.length === 1 ? '1 venda lancada' : `${vendas.length} vendas lancadas`} neste dia.
            Clique numa venda para ver as datas das parcelas.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-2">
            {vendas.map((venda) => {
              const aberta = expandida === venda.id;
              const parcelas = venda.parcelas ?? [];
              return (
                <div key={venda.id} className="rounded-lg border border-border">
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => setExpandida(aberta ? null : venda.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      aria-expanded={aberta}
                    >
                      {aberta ? (
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate text-sm font-medium text-foreground">
                        {formatCurrency(venda.valor)}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {venda.numeroParcelas ? `${venda.numeroParcelas}x` : '-'}
                        {venda.taxaPercent != null ? ` · ${venda.taxaPercent}%` : ''}
                      </span>
                      <span className="ml-auto shrink-0 text-sm text-muted-foreground">
                        A receber {formatCurrency(venda.aReceber)}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={ICON_BTN}
                      title="Editar venda"
                      onClick={() => onEditar(venda)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className={ICON_BTN_DANGER}
                      title="Excluir venda"
                      onClick={() => onExcluir(venda.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {aberta && (
                    <div className="border-t border-border px-3 py-2">
                      {parcelas.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Sem parcelas registradas para esta venda.
                        </p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                              <th className="py-1 text-left font-semibold">Parcela</th>
                              <th className="py-1 text-left font-semibold">Data</th>
                              <th className="py-1 text-right font-semibold">Valor</th>
                              <th className="py-1 text-right font-semibold">A receber</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {parcelas.map((p) => (
                              <tr key={p.numero}>
                                <td className="py-1.5 text-muted-foreground">
                                  {p.numero}/{parcelas.length}
                                </td>
                                <td className="py-1.5 text-muted-foreground">
                                  {formatDateStringToBR(p.dataAReceber)}
                                </td>
                                <td className="py-1.5 text-right text-muted-foreground">
                                  {formatCurrency(p.valor)}
                                </td>
                                <td className="py-1.5 text-right text-foreground">
                                  {formatCurrency(p.aReceber)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogBody>
        <DialogFooter>
          <button type="button" onClick={onClose} className={BTN_CANCEL}>
            Fechar
          </button>
          <button
            type="button"
            onClick={() => dia && onNova(dia)}
            className={cn(
              'inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4',
              'text-sm font-medium text-white transition-colors hover:bg-emerald-700',
            )}
          >
            <Plus className="h-4 w-4" />
            Nova venda neste dia
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
