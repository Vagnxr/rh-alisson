import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Loader2, Plus, Pencil, Trash2, Settings2 } from 'lucide-react';
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
import { api } from '@/lib/api';
import { dateFilterToParams } from '@/lib/financeiro-api';
import { onlyNumbers, isValidCNPJ, maskCNPJ } from '@/lib/masks';
import type { EntradaRow, EntradaValorItem } from '@/types/financeiro';
import { useFornecedorStore } from '@/stores/fornecedorStore';
import { ExportButtons } from '@/components/ui/export-buttons';
import { cn } from '@/lib/cn';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR');
}

function parseNum(v: string): number {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

const inputClass =
  'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const CATEGORIAS_INICIAIS = [
  { id: 'comercializacao', nome: 'COMERCIALIZAÇÃO' },
  { id: 'industrializacao', nome: 'INDUSTRIALIZAÇÃO' },
  { id: 'embalagem', nome: 'EMBALAGEM' },
  { id: 'mat-uso-cons', nome: 'MAT USO/CONS' },
  { id: 'merc-uso-cons', nome: 'MERC USO/CONS' },
  { id: 'gas', nome: 'GÁS' },
  { id: 'bonif-preco', nome: 'BONIF PREÇO' },
  { id: 'bonif-troca', nome: 'BONIF TROCA' },
  { id: 'bonif-loja', nome: 'BONIF LOJA' },
];

const MODELOS_NOTA_INICIAIS = ['NF-e', 'NFC-e', 'NFS-e', 'ENT SN', 'BONIFICAÇÃO'];

const TIPOS_ENTRADA = ['Compra', 'Devolucao', 'Outros'];

/** Formas de pagamento padrao (sem Bradesco e Santander). */
const FORMAS_PAGAMENTO_INICIAIS = ['DINHEIRO', 'PIX', 'BOLETO'];

const FORMAS_PAGAMENTO_LANCAMENTO_DIRETO = ['DINHEIRO', 'PIX'];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function EntradaPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [items, setItems] = useState<EntradaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EntradaRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [modelosNota, setModelosNota] = useState<string[]>(() => [...MODELOS_NOTA_INICIAIS]);
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>(() => [...CATEGORIAS_INICIAIS]);
  const [formasPagamento, setFormasPagamento] = useState<string[]>(() => [...FORMAS_PAGAMENTO_INICIAIS]);

  const [configDialog, setConfigDialog] = useState<'modelo' | 'categoria' | 'forma' | null>(null);
  const [novoModelo, setNovoModelo] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novaForma, setNovaForma] = useState('');

  const defaultForm = useCallback(() => {
    return {
      data: new Date().toISOString().split('T')[0],
      dataEmissao: '',
      sequencia: '',
      tipoEntradaId: TIPOS_ENTRADA[0] ?? 'Compra',
      fornecedor: '',
      modeloNotaId: modelosNota[0] ?? '',
      formaPagamentoId: formasPagamento[0] ?? '',
      valorPago: '' as string | number,
      valores: [] as { categoriaId: string; valor: string }[],
    };
  }, [modelosNota, formasPagamento]);

  const [formData, setFormData] = useState(defaultForm());
  const { fornecedores, fetchFornecedores } = useFornecedorStore();

  const totalValores = useMemo(() => {
    return formData.valores.reduce((acc, v) => acc + parseNum(v.valor), 0);
  }, [formData.valores]);

  const formaLancamentoDireto = formData.formaPagamentoId
    ? FORMAS_PAGAMENTO_LANCAMENTO_DIRETO.some((f) => slugify(f) === slugify(formData.formaPagamentoId) || f === formData.formaPagamentoId)
    : false;

  const valorPagoNum = formData.valorPago !== '' ? parseNum(String(formData.valorPago)) : 0;

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get<EntradaRow[]>('financeiro/entrada', { params: dateFilterToParams(dateFilter) })
      .then((res) => setItems(Array.isArray(res.data) ? res.data : []))
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [dateFilter]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (isDialogOpen) fetchFornecedores().catch(() => {});
  }, [isDialogOpen, fetchFornecedores]);


  const handleOpenDialog = (item?: EntradaRow) => {
    if (item) {
      setEditingItem(item);
      const fornecedorVal = item.fornecedor || '';
      const cnpjDisplay = onlyNumbers(fornecedorVal).length === 14 ? maskCNPJ(fornecedorVal) : fornecedorVal;
      const valoresFromRow = item.valores?.length
        ? item.valores.map((v) => ({ categoriaId: v.categoriaId, valor: String(v.valor) }))
        : categorias.map((c) => ({
            categoriaId: c.id,
            valor: String(
              (item as unknown as Record<string, number>)[c.id] ?? 0
            ),
          })).filter((v) => parseNum(v.valor) > 0);
      if (valoresFromRow.length === 0 && categorias.length > 0) {
        valoresFromRow.push({ categoriaId: categorias[0].id, valor: '0' });
      }
      setFormData({
        data: item.data.split('T')[0] || item.data.slice(0, 10),
        dataEmissao: item.dataEmissao?.split('T')[0] ?? item.dataEmissao?.slice(0, 10) ?? '',
        sequencia: item.sequencia != null ? String(item.sequencia) : '',
        tipoEntradaId: item.tipoEntrada ?? TIPOS_ENTRADA[0] ?? 'Compra',
        fornecedor: cnpjDisplay,
        modeloNotaId: item.modeloNota ?? modelosNota[0] ?? '',
        formaPagamentoId: item.formaPagamento ?? formasPagamento[0] ?? '',
        valorPago: item.valorPago ?? '',
        valores: valoresFromRow,
      });
    } else {
      setEditingItem(null);
      setFormData({
        ...defaultForm(),
        valores: categorias.length > 0 ? [{ categoriaId: categorias[0].id, valor: '0' }] : [],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const addValorLine = () => {
    const firstCat = categorias[0]?.id;
    if (!firstCat) return;
    setFormData((prev) => ({
      ...prev,
      valores: [...prev.valores, { categoriaId: firstCat, valor: '0' }],
    }));
  };

  const removeValorLine = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      valores: prev.valores.filter((_, i) => i !== index),
    }));
  };

  const updateValorLine = (index: number, field: 'categoriaId' | 'valor', value: string) => {
    setFormData((prev) => ({
      ...prev,
      valores: prev.valores.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fornecedorRaw = formData.fornecedor.trim();
    const fornecedorNumeros = onlyNumbers(fornecedorRaw);
    if (fornecedorNumeros.length !== 14) {
      toast.error('Informe o CNPJ do fornecedor (14 digitos).');
      return;
    }
    if (!isValidCNPJ(fornecedorRaw)) {
      toast.error('CNPJ do fornecedor invalido.');
      return;
    }
    const existeFornecedor = fornecedores.some((f) => f.tipo === 'cnpj' && onlyNumbers(f.cnpj) === fornecedorNumeros);
    if (!existeFornecedor) {
      toast.error('Fornecedor nao cadastrado. Cadastre em Fornecedores antes.');
      return;
    }
    if (formData.valores.length === 0) {
      toast.error('Adicione ao menos um valor por categoria.');
      return;
    }
    const valoresBody: EntradaValorItem[] = formData.valores.map((v) => ({
      categoriaId: v.categoriaId,
      categoriaNome: categorias.find((c) => c.id === v.categoriaId)?.nome,
      valor: parseNum(v.valor),
    })).filter((v) => v.valor > 0);
    if (valoresBody.length === 0) {
      toast.error('Informe ao menos um valor maior que zero.');
      return;
    }
    const total = valoresBody.reduce((acc, v) => acc + v.valor, 0);
    const valorPagoNum = formData.valorPago !== '' ? parseNum(String(formData.valorPago)) : undefined;
    if (formaLancamentoDireto && (valorPagoNum === undefined || valorPagoNum === null)) {
      toast.error('Para Dinheiro ou PIX informe o valor a ser pago.');
      return;
    }
    const body = {
      data: formData.data.slice(0, 10),
      dataEmissao: formData.dataEmissao?.slice(0, 10) || undefined,
      sequencia: formData.sequencia.trim() ? (Number(formData.sequencia) || formData.sequencia) : undefined,
      tipoEntrada: formData.tipoEntradaId || undefined,
      fornecedor: fornecedorNumeros,
      modeloNota: formData.modeloNotaId,
      formaPagamento: formData.formaPagamentoId,
      valorPago: valorPagoNum,
      valores: valoresBody,
      total,
    };
    if (editingItem) {
      api
        .patch<EntradaRow>(`financeiro/entrada/${editingItem.id}`, body)
        .then(() => {
          toast.success('Registro atualizado.');
          fetchList();
          handleCloseDialog();
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar'));
    } else {
      api
        .post<EntradaRow>('financeiro/entrada', body)
        .then((res) => {
          toast.success('Registro adicionado.');
          setItems((prev) => [...prev, res.data]);
          handleCloseDialog();
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao criar'));
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    api
      .delete(`financeiro/entrada/${deleteId}`)
      .then(() => {
        setItems((prev) => prev.filter((r) => r.id !== deleteId));
        setDeleteId(null);
        toast.success('Registro excluido.');
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao excluir'));
  };

  const getRowTotal = (row: EntradaRow): number => {
    if (row.total != null) return row.total;
    if (row.valores?.length) return row.valores.reduce((a, v) => a + v.valor, 0);
    return (
      Number(row.industrializacao) +
      Number(row.comercializacao) +
      Number(row.embalagem) +
      Number(row.materialUsoCons) +
      Number(row.mercadoriaUsoCons) +
      Number(row.gas)
    );
  };

  const columns = useMemo<ColumnDef<EntradaRow>[]>(
    () => [
      {
        accessorKey: 'data',
        header: ({ column }) => (
          <button className="flex items-center gap-1 font-medium" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
            Data entrada <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => formatDate(row.getValue('data')),
      },
      {
        accessorKey: 'dataEmissao',
        header: 'Data emissao',
        cell: ({ row }) => (row.original.dataEmissao ? formatDate(row.original.dataEmissao) : '-'),
      },
      {
        accessorKey: 'sequencia',
        header: 'Seq.',
        cell: ({ row }) => row.original.sequencia ?? '-',
      },
      { accessorKey: 'fornecedor', header: 'Fornecedor' },
      {
        accessorKey: 'modeloNota',
        header: 'Modelo nota',
        cell: ({ row }) => row.original.modeloNota ?? '-',
      },
      {
        accessorKey: 'tipoEntrada',
        header: 'Tipo',
        cell: ({ row }) => row.original.tipoEntrada ?? '-',
      },
      {
        accessorKey: 'formaPagamento',
        header: 'Forma pag.',
        cell: ({ row }) => row.original.formaPagamento ?? '-',
      },
      {
        id: 'total',
        header: 'Total',
        cell: ({ row }) => formatCurrency(getRowTotal(row.original)),
      },
      {
        id: 'valorPago',
        header: 'Valor pago',
        cell: ({ row }) =>
          row.original.valorPago != null ? formatCurrency(row.original.valorPago) : '-',
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acoes</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" title="Editar" onClick={() => handleOpenDialog(row.original)}>
              <Pencil className="h-4 w-4" />
            </button>
            <button type="button" className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" title="Excluir" onClick={() => setDeleteId(row.original.id)}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
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
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Entrada</h1>
          <p className="mt-1 text-sm text-slate-500">
            Data, fornecedor, modelo da nota, categoria, valores e forma de pagamento.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <button
            type="button"
            onClick={() => setConfigDialog('modelo')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Settings2 className="h-4 w-4" />
            Modelos nota
          </button>
          <button
            type="button"
            onClick={() => setConfigDialog('categoria')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Settings2 className="h-4 w-4" />
            Categorias
          </button>
          <button
            type="button"
            onClick={() => setConfigDialog('forma')}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Settings2 className="h-4 w-4" />
            Formas pag.
          </button>
          <ExportButtons
            data={items.map((r) => ({
              data: formatDate(r.data),
              fornecedor: r.fornecedor,
              modeloNota: r.modeloNota ?? '-',
              formaPagamento: r.formaPagamento ?? '-',
              total: formatCurrency(getRowTotal(r)),
              valorPago: r.valorPago != null ? formatCurrency(r.valorPago) : '-',
            }))}
            columns={[
              { key: 'data', label: 'Data' },
              { key: 'fornecedor', label: 'Fornecedor' },
              { key: 'modeloNota', label: 'Modelo nota' },
              { key: 'formaPagamento', label: 'Forma pag.' },
              { key: 'total', label: 'Total' },
              { key: 'valorPago', label: 'Valor pago' },
            ]}
            filename="entrada"
            title="Entrada"
          />
          <button
            type="button"
            onClick={() => handleOpenDialog()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Novo
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
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
                      <th key={header.id} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-200">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-slate-500">
                      Nenhum registro no periodo
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50">
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
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
        <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Entrada' : 'Nova Entrada'}</DialogTitle>
            <DialogDescription>Preencha os dados da entrada.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="overflow-y-auto overflow-x-hidden min-w-0">
              <div className="space-y-4 mt-4 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Data entrada</label>
                    <input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} className={inputClass} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Data emissao (nota)</label>
                    <input type="date" value={formData.dataEmissao} onChange={(e) => setFormData({ ...formData, dataEmissao: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Sequencia</label>
                    <input type="text" inputMode="numeric" placeholder="Opcional" value={formData.sequencia} onChange={(e) => setFormData({ ...formData, sequencia: e.target.value })} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Tipo</label>
                    <select value={formData.tipoEntradaId} onChange={(e) => setFormData({ ...formData, tipoEntradaId: e.target.value })} className={inputClass}>
                      {TIPOS_ENTRADA.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">CNPJ do fornecedor</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    value={formData.fornecedor}
                    onChange={(e) => setFormData({ ...formData, fornecedor: maskCNPJ(e.target.value) })}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Modelo da nota</label>
                  <select
                    value={formData.modeloNotaId}
                    onChange={(e) => setFormData({ ...formData, modeloNotaId: e.target.value })}
                    className={inputClass}
                  >
                    {modelosNota.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Forma de pagamento</label>
                  <select
                    value={formData.formaPagamentoId}
                    onChange={(e) => setFormData({ ...formData, formaPagamentoId: e.target.value })}
                    className={inputClass}
                  >
                    {formasPagamento.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                {formaLancamentoDireto && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Valor a ser pago (conferencia)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={formData.valorPago}
                      onChange={(e) => setFormData({ ...formData, valorPago: e.target.value })}
                      className={cn(inputClass, valorPagoNum !== totalValores && valorPagoNum > 0 && 'border-amber-500')}
                    />
                    {formData.valorPago !== '' && parseNum(String(formData.valorPago)) !== totalValores && (
                      <p className="text-xs text-amber-600">Valor divergente do total da nota ({formatCurrency(totalValores)}).</p>
                    )}
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Valores por categoria</label>
                    <button type="button" onClick={addValorLine} className="text-sm text-emerald-600 hover:underline">
                      Adicionar valor
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {formData.valores.map((v, i) => (
                      <div key={i} className="flex gap-2 items-center min-w-0">
                        <select
                          value={v.categoriaId}
                          onChange={(e) => updateValorLine(i, 'categoriaId', e.target.value)}
                          className={cn(inputClass, 'min-w-[180px] flex-1')}
                          title={categorias.find((c) => c.id === v.categoriaId)?.nome}
                        >
                          {categorias.map((c) => (
                            <option key={c.id} value={c.id} title={c.nome}>
                              {c.nome}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder="0,00"
                          value={v.valor}
                          onChange={(e) => updateValorLine(i, 'valor', e.target.value)}
                          className={cn(inputClass, 'w-14 shrink-0')}
                        />
                        <button type="button" onClick={() => removeValorLine(i)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600" title="Remover">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Total: {formatCurrency(totalValores)}</p>
                </div>
              </div>
            </DialogBody>
            <DialogFooter>
              <button type="button" onClick={handleCloseDialog} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100">Cancelar</button>
              <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">{editingItem ? 'Salvar' : 'Adicionar'}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog config Modelos de nota */}
      <Dialog open={configDialog === 'modelo'} onOpenChange={(o) => !o && setConfigDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Modelos de nota</DialogTitle>
            <DialogDescription>Adicione ou remova modelos (NF-e, NFC-e, etc.).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: NF-e"
                value={novoModelo}
                onChange={(e) => setNovoModelo(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => {
                  const t = novoModelo.trim();
                  if (!t) return;
                  if (modelosNota.includes(t)) {
                    toast.error('Ja existe.');
                    return;
                  }
                  setModelosNota((prev) => [...prev, t]);
                  setNovoModelo('');
                }}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Adicionar
              </button>
            </div>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {modelosNota.map((m) => (
                <li key={m} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="text-sm">{m}</span>
                  <button type="button" onClick={() => setModelosNota((prev) => prev.filter((x) => x !== m))} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog config Categorias */}
      <Dialog open={configDialog === 'categoria'} onOpenChange={(o) => !o && setConfigDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Categorias</DialogTitle>
            <DialogDescription>Adicione ou remova categorias (Industrializacao, Embalagem, etc.).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Embalagem"
                value={novaCategoria}
                onChange={(e) => setNovaCategoria(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => {
                  const t = novaCategoria.trim();
                  if (!t) return;
                  const id = slugify(t);
                  if (categorias.some((c) => c.id === id)) {
                    toast.error('Ja existe.');
                    return;
                  }
                  setCategorias((prev) => [...prev, { id, nome: t }]);
                  setNovaCategoria('');
                }}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Adicionar
              </button>
            </div>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {categorias.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="text-sm">{c.nome}</span>
                  <button type="button" onClick={() => setCategorias((prev) => prev.filter((x) => x.id !== c.id))} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog config Formas de pagamento */}
      <Dialog open={configDialog === 'forma'} onOpenChange={(o) => !o && setConfigDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Formas de pagamento</DialogTitle>
            <DialogDescription>Adicione ou remova formas (Dinheiro, PIX, Cartao, etc.).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Boleto"
                value={novaForma}
                onChange={(e) => setNovaForma(e.target.value)}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => {
                  const t = novaForma.trim();
                  if (!t) return;
                  if (formasPagamento.includes(t)) {
                    toast.error('Ja existe.');
                    return;
                  }
                  setFormasPagamento((prev) => [...prev, t]);
                  setNovaForma('');
                }}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Adicionar
              </button>
            </div>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {formasPagamento.map((f) => (
                <li key={f} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className="text-sm">{f}</span>
                  <button type="button" onClick={() => setFormasPagamento((prev) => prev.filter((x) => x !== f))} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir este registro?</AlertDialogDescription>
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
