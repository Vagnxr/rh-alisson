import type { Table } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import { ArrowLeft, Plus, Pencil, Trash2, Settings2 } from 'lucide-react';
import type { Banco } from '@/types/banco';
import { DateFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { ExportButtons } from '@/components/ui/export-buttons';
import { BancoBadge } from './banco';
import { formatCurrency, formatDate, type DespesaBanco } from './DespesaBancoUtils';

interface ExportColumn {
  key: string;
  label: string;
}

interface DespesaBancoDetalheViewProps {
  selectedBanco: Banco;
  onBack: () => void;
  dateFilter: DateFilterValue;
  onDateFilterChange: (v: DateFilterValue) => void;
  exportData: Record<string, string>[];
  exportColumns: ExportColumn[];
  onOpenTipos: () => void;
  onNewRecord: () => void;
  table: Table<DespesaBanco>;
  columnsCount: number;
  filteredItems: DespesaBanco[];
  total: number;
  onEditItem: (item: DespesaBanco) => void;
  onDeleteItem: (id: string) => void;
  bancos: Banco[];
}

export function DespesaBancoDetalheView({
  selectedBanco,
  onBack,
  dateFilter,
  onDateFilterChange,
  exportData,
  exportColumns,
  onOpenTipos,
  onNewRecord,
  table,
  columnsCount,
  filteredItems,
  total,
  onEditItem,
  onDeleteItem,
  bancos,
}: DespesaBancoDetalheViewProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50"
            aria-label="Voltar para lista de bancos"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl truncate">
              {selectedBanco.nome}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Despesas e tarifas deste banco</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={onDateFilterChange} />
          <ExportButtons
            data={exportData}
            columns={exportColumns}
            filename="despesas-bancarias"
            title="Despesas Bancarias"
          />
          <button
            onClick={onOpenTipos}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Settings2 className="h-4 w-4" />
            <span>Gerenciar tipos</span>
          </button>
          <button
            onClick={onNewRecord}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span>Novo Registro</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-500"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-slate-200">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columnsCount}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    Nenhum registro cadastrado
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap px-6 py-4 text-sm text-slate-600"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-slate-900">
                    Total:
                  </td>
                  <td className="px-6 py-3 text-sm font-bold text-slate-900">
                    {formatCurrency(total)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div className="divide-y divide-slate-200 sm:hidden">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-12 text-center text-sm text-slate-500">
              Nenhum registro encontrado
            </div>
          ) : (
            <>
              {filteredItems.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {item.bancoNome ? (
                          <span className="text-sm font-medium">{item.bancoNome}</span>
                        ) : (
                          <BancoBadge bancoId={item.bancoId} bancos={bancos} />
                        )}
                      </div>
                      <p className="font-medium text-slate-900">{item.descricao}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{formatDate(item.data)}</p>
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <span className="font-semibold text-slate-900">
                        {formatCurrency(item.valor)}
                      </span>
                      <div className="flex gap-1">
                        <button
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          title="Editar"
                          onClick={() => onEditItem(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Excluir"
                          onClick={() => onDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between bg-slate-50 p-4">
                <span className="font-medium text-slate-700">Total</span>
                <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
