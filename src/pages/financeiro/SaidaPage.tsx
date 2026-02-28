import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { buildTableColumns } from '@/lib/buildTableColumns';
import { dateFilterToParams } from '@/lib/financeiro-api';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import type { SaidaRow, SaidaFormaPagamento } from '@/types/financeiro';
import { ExportButtons } from '@/components/ui/export-buttons';
import { formatDateStringToBR } from '@/lib/date';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseNum(v: string): number {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

const inputClass =
  'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const CAMPOS_NUMERICOS_ORDEM = [
  'comercializacao',
  'industrializacao',
  'embalagem',
  'materialUsoCons',
  'mercadoriaUsoCons',
  'gas',
] as const;

const LABEL_CAMPO: Record<string, string> = {
  materialUsoCons: 'Material uso/cons.',
  mercadoriaUsoCons: 'Mercadoria uso/cons.',
  gas: 'GLP',
};

const FORMAS_SAIDA: SaidaFormaPagamento[] = ['BOLETO', 'CARTAO'];

const defaultForm = () => ({
  data: new Date().toISOString().split('T')[0],
  formaPagamento: 'BOLETO' as SaidaFormaPagamento,
  fornecedor: '',
  industrializacao: '',
  comercializacao: '',
  embalagem: '',
  materialUsoCons: '',
  mercadoriaUsoCons: '',
  gas: '',
});

const SAIDA_DEFAULT_ORDER = [
  'data',
  'fornecedor',
  'formaPagamento',
  'industrializacao',
  'comercializacao',
  'embalagem',
  'materialUsoCons',
  'mercadoriaUsoCons',
  'gas',
];

export function SaidaPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [items, setItems] = useState<SaidaRow[]>([]);
  const [columnsFromApi, setColumnsFromApi] = useState<TableColumnConfigFromApi[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SaidaRow | null>(null);
  const [formData, setFormData] = useState(defaultForm());

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get<{ data?: SaidaRow[]; columns?: TableColumnConfigFromApi[] }>('financeiro/saida', {
        params: dateFilterToParams(dateFilter),
      })
      .then(res => {
        const body = res.data as { data?: SaidaRow[]; columns?: TableColumnConfigFromApi[] } | undefined;
        const list = body?.data ?? (Array.isArray(res.data) ? res.data : []);
        setItems(Array.isArray(list) ? list : []);
        setColumnsFromApi(body?.columns ?? null);
      })
      .catch(err => toast.error(err?.message ?? 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [dateFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleOpenDialog = (item?: SaidaRow) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        data: item.data.split('T')[0] || item.data.slice(0, 10),
        formaPagamento:
          item.formaPagamento &&
          (item.formaPagamento === 'BOLETO' || item.formaPagamento === 'CARTAO')
            ? item.formaPagamento
            : 'BOLETO',
        fornecedor: item.fornecedor,
        industrializacao: String(item.industrializacao),
        comercializacao: String(item.comercializacao),
        embalagem: String(item.embalagem),
        materialUsoCons: String(item.materialUsoCons),
        mercadoriaUsoCons: String(item.mercadoriaUsoCons),
        gas: String(item.gas),
      });
    } else {
      setEditingItem(null);
      setFormData(defaultForm());
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = formData.data.slice(0, 10);
    const body = {
      data,
      formaPagamento: formData.formaPagamento,
      fornecedor: formData.fornecedor,
      industrializacao: parseNum(formData.industrializacao),
      comercializacao: parseNum(formData.comercializacao),
      embalagem: parseNum(formData.embalagem),
      materialUsoCons: parseNum(formData.materialUsoCons),
      mercadoriaUsoCons: parseNum(formData.mercadoriaUsoCons),
      gas: parseNum(formData.gas),
    };
    if (editingItem) {
      api
        .patch<SaidaRow>(`financeiro/saida/${editingItem.id}`, body)
        .then(() => {
          toast.success('Registro atualizado.');
          fetchList();
          handleCloseDialog();
        })
        .catch(err => toast.error(err?.message ?? 'Erro ao atualizar'));
    } else {
      api
        .post<SaidaRow>('financeiro/saida', body)
        .then(res => {
          toast.success('Registro adicionado.');
          setItems(prev => [...prev, res.data]);
          handleCloseDialog();
        })
        .catch(err => toast.error(err?.message ?? 'Erro ao criar'));
    }
  };

  const columnDefsByKey = useMemo<Record<string, ColumnDef<SaidaRow>>>(
    () => ({
      data: {
        accessorKey: 'data',
        header: ({ column }) => (
          <button
            type="button"
            className="flex items-center gap-1 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Data <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => formatDateStringToBR(String(row.getValue('data') ?? '')),
      },
      fornecedor: {
        accessorKey: 'fornecedor',
        header: 'Fornecedor',
        cell: ({ row }) => (
          <span className="text-slate-600">{row.original.fornecedor ?? '-'}</span>
        ),
      },
      formaPagamento: {
        accessorKey: 'formaPagamento',
        header: 'Forma pag.',
        cell: ({ row }) => (
          <span className="text-slate-600">{row.original.formaPagamento ?? '-'}</span>
        ),
      },
      industrializacao: {
        accessorKey: 'industrializacao',
        header: 'Industrialização',
        cell: ({ row }) => formatCurrency(Number(row.original.industrializacao ?? 0)),
      },
      comercializacao: {
        accessorKey: 'comercializacao',
        header: 'Comercialização',
        cell: ({ row }) => formatCurrency(Number(row.original.comercializacao ?? 0)),
      },
      embalagem: {
        accessorKey: 'embalagem',
        header: 'Embalagem',
        cell: ({ row }) => formatCurrency(Number(row.original.embalagem ?? 0)),
      },
      materialUsoCons: {
        accessorKey: 'materialUsoCons',
        header: 'Material uso/cons',
        cell: ({ row }) => formatCurrency(Number(row.original.materialUsoCons ?? 0)),
      },
      mercadoriaUsoCons: {
        accessorKey: 'mercadoriaUsoCons',
        header: 'Mercadoria uso/cons',
        cell: ({ row }) => formatCurrency(Number(row.original.mercadoriaUsoCons ?? 0)),
      },
      gas: {
        accessorKey: 'gas',
        header: 'Gás',
        cell: ({ row }) => formatCurrency(Number(row.original.gas ?? 0)),
      },
    }),
    [],
  );

  const columns = useMemo(
    () =>
      buildTableColumns<SaidaRow>(
        columnDefsByKey,
        columnsFromApi ?? null,
        SAIDA_DEFAULT_ORDER,
      ),
    [columnDefsByKey, columnsFromApi],
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Saida</h1>
          <p className="mt-1 text-sm text-slate-500">
            Preenchido automaticamente conforme entrada.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={items.map(r => ({
              data: formatDateStringToBR(r.data),
              formaPagamento: r.formaPagamento ?? '',
              fornecedor: r.fornecedor,
              comercializacao: formatCurrency(Number(r.comercializacao)),
              industrializacao: formatCurrency(Number(r.industrializacao)),
              embalagem: formatCurrency(Number(r.embalagem)),
              materialUsoCons: formatCurrency(Number(r.materialUsoCons)),
              mercadoriaUsoCons: formatCurrency(Number(r.mercadoriaUsoCons)),
              glp: formatCurrency(Number(r.gas)),
            }))}
            columns={[
              { key: 'data', label: 'Data' },
              { key: 'formaPagamento', label: 'Forma pagamento' },
              { key: 'fornecedor', label: 'Fornecedor' },
              { key: 'comercializacao', label: 'Comercializacao' },
              { key: 'industrializacao', label: 'Industrializacao' },
              { key: 'embalagem', label: 'Embalagem' },
              { key: 'materialUsoCons', label: 'Material uso/cons.' },
              { key: 'mercadoriaUsoCons', label: 'Mercadoria uso/cons.' },
              { key: 'glp', label: 'GLP' },
            ]}
            filename="saida"
            title="Saida"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <table className="w-full min-w-[800px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(header => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-medium tracking-wider text-slate-500 uppercase"
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
                      colSpan={columns.length}
                      className="px-6 py-12 text-center text-sm text-slate-500"
                    >
                      <p>Nenhum registro no periodo.</p>
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map(row => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      {row.getVisibleCells().map(cell => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm whitespace-nowrap text-slate-600"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Saida' : 'Nova Saida'}</DialogTitle>
            <DialogDescription>Preencha os dados da saida.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
              <div className="mt-4 mb-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Data</label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={e => setFormData({ ...formData, data: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Forma de pagamento</label>
                  <select
                    value={formData.formaPagamento}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        formaPagamento: e.target.value as SaidaFormaPagamento,
                      })
                    }
                    className={inputClass}
                    required
                  >
                    {FORMAS_SAIDA.map(fp => (
                      <option key={fp} value={fp}>
                        {fp}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">
                    Apenas boleto ou cartao sobem para saida.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Fornecedor</label>
                  <input
                    type="text"
                    value={formData.fornecedor}
                    onChange={e => setFormData({ ...formData, fornecedor: e.target.value })}
                    className={inputClass}
                  />
                </div>
                {CAMPOS_NUMERICOS_ORDEM.map(key => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      {LABEL_CAMPO[key] ?? `${key.charAt(0).toUpperCase() + key.slice(1)}`} (R$)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={formData[key]}
                      onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </DialogBody>
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
                {editingItem ? 'Salvar' : 'Adicionar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}
