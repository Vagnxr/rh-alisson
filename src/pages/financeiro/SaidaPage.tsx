import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Loader2, Plus } from 'lucide-react';
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
import { DateInput } from '@/components/ui/date-input';

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
  'industrializacao',
  'comercializacao',
  'embalagem',
  'materialUsoCons',
  'mercadoriaUsoCons',
  'gas',
] as const;

const LABEL_CAMPO: Record<string, string> = {
  industrializacao: 'Industrializacao',
  comercializacao: 'Comercializacao',
  embalagem: 'Embalagem',
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
  'modeloNota',
  'cnpjCpf',
  'fornecedor',
  'dataEntrada',
  'formaPagamento',
  'industrializacao',
  'comercializacao',
  'embalagem',
  'materialUsoCons',
  'mercadoriaUsoCons',
  'gas',
  'total',
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
      .get<SaidaRow[]>('financeiro/saida', {
        params: dateFilterToParams(dateFilter),
      })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        const cols = res.columns ?? null;
        setItems(list);
        setColumnsFromApi(cols);
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar'))
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
        fornecedor: item.fornecedor ?? '',
        industrializacao: String(item.industrializacao ?? 0),
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
        .catch((err) => toast.error(err?.message ?? 'Erro ao atualizar'));
    } else {
      api
        .post<SaidaRow>('financeiro/saida', body)
        .then((res) => {
          toast.success('Registro adicionado.');
          setItems((prev) => [...prev, res.data]);
          handleCloseDialog();
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao criar'));
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
            onClick={column.getToggleSortingHandler()}
          >
            DATA PAGAMENTO <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => {
          const val = String(row.getValue('data') ?? '');
          return <span>{formatDateStringToBR(val) || '-'}</span>;
        },
      },
      modeloNota: {
        accessorKey: 'modeloNota',
        header: 'MODELO',
        cell: ({ row }) => {
          const val = row.original.modeloNota ?? '';
          return <span className="text-slate-600">{val || '-'}</span>;
        },
      },
      cnpjCpf: {
        accessorKey: 'cnpjCpf',
        header: 'CNPJ/CPF',
        cell: ({ row }) => {
          const val = row.original.cnpjCpf ?? '';
          return <span className="text-slate-600">{val || '-'}</span>;
        },
      },
      fornecedor: {
        accessorKey: 'fornecedor',
        header: 'FORNECEDOR',
        cell: ({ row }) => {
          const val = row.original.fornecedor ?? '';
          return <span className="text-slate-600">{val || '-'}</span>;
        },
      },
      dataEntrada: {
        accessorKey: 'dataEntrada',
        header: 'DATA ENTRADA',
        cell: ({ row }) => {
          const val = row.original.dataEntrada ?? '';
          return <span className="text-slate-600">{formatDateStringToBR(val) || '-'}</span>;
        },
      },
      formaPagamento: {
        accessorKey: 'formaPagamento',
        header: 'FORMA DE PAGTO',
        cell: ({ row }) => {
          const val = row.original.formaPagamento ?? '';
          return <span className="text-slate-600">{val || '-'}</span>;
        },
      },
      industrializacao: {
        accessorKey: 'industrializacao',
        header: 'INDUSTRIALIZAÇÃO',
        cell: ({ row }) => {
          const n = Number(row.original.industrializacao ?? 0);
          return <span>{formatCurrency(n)}</span>;
        },
      },
      comercializacao: {
        accessorKey: 'comercializacao',
        header: 'COMERCIALIZAÇÃO',
        cell: ({ row }) => {
          const n = Number(row.original.comercializacao ?? 0);
          return <span>{formatCurrency(n)}</span>;
        },
      },
      embalagem: {
        accessorKey: 'embalagem',
        header: 'EMBALAGEM',
        cell: ({ row }) => <span>{formatCurrency(Number(row.original.embalagem ?? 0))}</span>,
      },
      materialUsoCons: {
        accessorKey: 'materialUsoCons',
        header: 'MATERIAL USO/CONS',
        cell: ({ row }) => <span>{formatCurrency(Number(row.original.materialUsoCons ?? 0))}</span>,
      },
      mercadoriaUsoCons: {
        accessorKey: 'mercadoriaUsoCons',
        header: 'MERCADORIA USO/CONS',
        cell: ({ row }) => <span>{formatCurrency(Number(row.original.mercadoriaUsoCons ?? 0))}</span>,
      },
      gas: {
        accessorKey: 'gas',
        header: 'GLP',
        cell: ({ row }) => <span>{formatCurrency(Number(row.original.gas ?? 0))}</span>,
      },
      total: {
        accessorKey: 'total',
        header: 'TOTAL',
        cell: ({ row }) => <span>{formatCurrency(Number(row.original.total ?? 0))}</span>,
      },
    }),
    [],
  );

  const columns = useMemo(
    () =>
      buildTableColumns<SaidaRow>(columnDefsByKey, columnsFromApi ?? null, SAIDA_DEFAULT_ORDER),
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
          <button
            type="button"
            onClick={() => handleOpenDialog()}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 sm:px-4 sm:py-2.5"
          >
            <Plus className="h-4 w-4" />
            <span className="whitespace-nowrap">Novo</span>
          </button>
          <ExportButtons
            data={items.map((r) => ({
              dataPagamento: formatDateStringToBR(r.data),
              modeloNota: r.modeloNota ?? '',
              cnpjCpf: r.cnpjCpf ?? '',
              fornecedor: r.fornecedor ?? '',
              dataEntrada: formatDateStringToBR(r.dataEntrada ?? ''),
              formaPagamento: r.formaPagamento ?? '',
              industrializacao: formatCurrency(Number(r.industrializacao ?? 0)),
              comercializacao: formatCurrency(Number(r.comercializacao)),
              embalagem: formatCurrency(Number(r.embalagem)),
              materialUsoCons: formatCurrency(Number(r.materialUsoCons)),
              mercadoriaUsoCons: formatCurrency(Number(r.mercadoriaUsoCons)),
              glp: formatCurrency(Number(r.gas)),
              total: formatCurrency(Number(r.total ?? 0)),
            }))}
            columns={[
              { key: 'dataPagamento', label: 'DATA PAGAMENTO' },
              { key: 'modeloNota', label: 'MODELO' },
              { key: 'cnpjCpf', label: 'CNPJ/CPF' },
              { key: 'fornecedor', label: 'FORNECEDOR' },
              { key: 'dataEntrada', label: 'DATA ENTRADA' },
              { key: 'formaPagamento', label: 'FORMA DE PAGTO' },
              { key: 'industrializacao', label: 'INDUSTRIALIZAÇÃO' },
              { key: 'comercializacao', label: 'COMERCIALIZAÇÃO' },
              { key: 'embalagem', label: 'EMBALAGEM' },
              { key: 'materialUsoCons', label: 'MATERIAL USO/CONS.' },
              { key: 'mercadoriaUsoCons', label: 'MERCADORIA USO/CONS.' },
              { key: 'glp', label: 'GLP' },
              { key: 'total', label: 'TOTAL' },
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
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-bold tracking-wider text-slate-700 uppercase"
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
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      {row.getVisibleCells().map((cell) => (
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

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setEditingItem(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Saida' : 'Nova Saida'}</DialogTitle>
            <DialogDescription>Preencha os dados da saida.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
              <div className="mt-4 mb-4 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Data pagamento</label>
                  <DateInput
                    value={formData.data}
                    onChange={(v) => setFormData({ ...formData, data: v })}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Forma de pagamento</label>
                  <select
                    value={formData.formaPagamento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        formaPagamento: e.target.value as SaidaFormaPagamento,
                      })
                    }
                    className={inputClass}
                    required
                  >
                    {FORMAS_SAIDA.map((fp) => (
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
                    onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                    className={inputClass}
                  />
                </div>
                {CAMPOS_NUMERICOS_ORDEM.map((key) => (
                  <div key={key} className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">
                      {LABEL_CAMPO[key] ?? `${key.charAt(0).toUpperCase() + key.slice(1)}`} (R$)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={formData[key]}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
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
