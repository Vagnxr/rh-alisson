import { Building2, Landmark, Pencil, Plus } from 'lucide-react';
import type { Banco } from '@/types/banco';
import { BancoLogo } from './banco';
import { formatCurrency } from './DespesaBancoUtils';
import type { DespesaBanco } from './DespesaBancoUtils';
import {
  PAGE_TITLE,
  PAGE_SUBTITLE,
  BTN_OUTLINE,
  CARD_PADDED,
  CARD_INTERACTIVE,
  EMPTY_STATE,
  MUTED_BOX,
  ICON_BTN,
} from '@/lib/uiClasses';

interface DespesaBancoListaViewProps {
  bancos: Banco[];
  items: DespesaBanco[];
  totalGeral: number;
  onSelectBanco: (banco: Banco) => void;
  onOpenBancos: () => void;
  onEditBanco: (banco: Banco) => void;
}

export function DespesaBancoListaView({
  bancos,
  items,
  totalGeral,
  onSelectBanco,
  onOpenBancos,
  onEditBanco,
}: DespesaBancoListaViewProps) {
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={PAGE_TITLE}>Despesas Bancarias</h1>
            <p className={PAGE_SUBTITLE}>
              Gerencie tarifas e despesas por banco. Clique em um card para ver detalhes e lancar
              registros.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={onOpenBancos} className={BTN_OUTLINE}>
              <Building2 className="h-4 w-4" />
              Gerenciar bancos
            </button>
          </div>
        </div>

        <div className={CARD_PADDED}>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Landmark className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Total Geral</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalGeral)}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {bancos.map((banco) => {
            const totalBanco = items
              .filter((i) => i.bancoId === banco.id)
              .reduce((acc, i) => acc + i.valor, 0);
            return (
              <div
                key={banco.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectBanco(banco)}
                onKeyDown={(e) => e.key === 'Enter' && onSelectBanco(banco)}
                className={CARD_INTERACTIVE}
                data-testid="despesa-banco-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <BancoLogo banco={banco} size="lg" />
                    <div>
                      <h3 className="font-semibold text-foreground">{banco.nome}</h3>
                      {banco.codigo && (
                        <p className="text-sm text-muted-foreground">{banco.codigo}</p>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex gap-1"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onEditBanco(banco)}
                      className={ICON_BTN}
                      title="Editar banco"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className={`mt-4 ${MUTED_BOX}`}>
                  <p className="text-xs text-muted-foreground">Total despesas</p>
                  <p className="text-lg font-semibold text-foreground">
                    {formatCurrency(totalBanco)}
                  </p>
                </div>
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground">
                    Ver detalhes
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {bancos.length === 0 && (
          <div className={EMPTY_STATE}>
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium text-foreground">Nenhum banco cadastrado</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Adicione bancos para comecar a registrar despesas.
            </p>
            <button
              type="button"
              onClick={onOpenBancos}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Gerenciar bancos
            </button>
          </div>
        )}
      </div>
    </>
  );
}
