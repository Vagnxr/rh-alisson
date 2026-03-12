import { Building2, Landmark, Pencil, Plus } from 'lucide-react';
import type { Banco } from '@/types/banco';
import { BancoLogo } from './banco';
import { formatCurrency } from './DespesaBancoUtils';
import type { DespesaBanco } from './DespesaBancoUtils';

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
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Despesas Bancarias</h1>
            <p className="mt-1 text-sm text-slate-500">
              Gerencie tarifas e despesas por banco. Clique em um card para ver detalhes e lancar
              registros.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenBancos}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Building2 className="h-4 w-4" />
              Gerenciar bancos
            </button>
          </div>
        </div>

        {/* Banner Total Geral - soma de todas as saidas de todos os bancos */}
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100">
              <Landmark className="h-6 w-6 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Total Geral</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalGeral)}</p>
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
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-emerald-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                data-testid="despesa-banco-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <BancoLogo banco={banco} size="lg" />
                    <div>
                      <h3 className="font-semibold text-slate-900">{banco.nome}</h3>
                      {banco.codigo && (
                        <p className="text-sm text-slate-500">{banco.codigo}</p>
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
                      className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      title="Editar banco"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 rounded-lg bg-slate-100 p-2.5">
                  <p className="text-xs text-slate-600">Total despesas</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {formatCurrency(totalBanco)}
                  </p>
                </div>
                <div className="mt-4 text-center">
                  <span className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
                    Ver detalhes
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {bancos.length === 0 && (
          <div className="rounded-xl border border-slate-200 border-dashed bg-slate-50 p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-3 text-sm font-medium text-slate-600">Nenhum banco cadastrado</p>
            <p className="mt-1 text-sm text-slate-500">
              Adicione bancos para comecar a registrar despesas.
            </p>
            <button
              type="button"
              onClick={onOpenBancos}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
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
