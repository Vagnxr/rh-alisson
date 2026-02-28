import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Loader2, Plus, Settings2, Trash2 } from 'lucide-react';
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
import { dateFilterToParams } from '@/lib/financeiro-api';
import { onlyNumbers, isValidCNPJ, maskCNPJ } from '@/lib/masks';
import type { EntradaRow, EntradaValorItem } from '@/types/financeiro';
import type { CreateFornecedorDto } from '@/types/fornecedor';
import { useFornecedorStore } from '@/stores/fornecedorStore';
import { FornecedorForm } from '@/components/fornecedor/FornecedorForm';
import { ExportButtons } from '@/components/ui/export-buttons';
import { cn } from '@/lib/cn';
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

const CATEGORIAS_INICIAIS = [
  { id: 'comercializacao', nome: 'COMERCIALIZAÇÃO' },
  { id: 'industrializacao', nome: 'INDUSTRIALIZAÇÃO' },
  { id: 'embalagem', nome: 'EMBALAGEM' },
  { id: 'mat-uso-cons', nome: 'MAT USO/CONS' },
  { id: 'merc-uso-cons', nome: 'MERC USO/CONS' },
  { id: 'gas', nome: 'GLP' },
  { id: 'bonif-preco', nome: 'BONIF PREÇO' },
  { id: 'bonif-troca', nome: 'BONIF TROCA' },
  { id: 'bonif-loja', nome: 'BONIF LOJA' },
];

const MODELOS_NOTA_INICIAIS = ['NF-e', 'NFC-e', 'NFS-e', 'ENT SN', 'BONIFICAÇÃO'];

const TIPOS_ENTRADA = ['Compra', 'Outros'];

/** Formas de pagamento padrao (sem Bradesco e Santander). */
/** Forma de pagamento com flag comunica Agenda (Boleto sim; Dinheiro/PIX nao). */
interface FormaPagamentoItem {
  nome: string;
  comunicaAgenda: boolean;
}

const FORMAS_PAGAMENTO_INICIAIS: FormaPagamentoItem[] = [
  { nome: 'DINHEIRO', comunicaAgenda: false },
  { nome: 'PIX', comunicaAgenda: false },
  { nome: 'BOLETO', comunicaAgenda: true },
];

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
  const [fornecedorNome, setFornecedorNome] = useState<string | null>(null);
  const [fornecedorError, setFornecedorError] = useState<string | null>(null);
  const [cadastroFornecedorOpen, setCadastroFornecedorOpen] = useState(false);

  const [modelosNota, setModelosNota] = useState<string[]>(() => [...MODELOS_NOTA_INICIAIS]);
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>(() => [...CATEGORIAS_INICIAIS]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoItem[]>(() => [...FORMAS_PAGAMENTO_INICIAIS]);

  const [configDialog, setConfigDialog] = useState<'modelo' | 'categoria' | 'forma' | null>(null);
  const [novoModelo, setNovoModelo] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novaForma, setNovaForma] = useState('');
  const [novaFormaComunicaAgenda, setNovaFormaComunicaAgenda] = useState(false);

  const defaultForm = useCallback(() => {
    return {
      data: new Date().toISOString().split('T')[0],
      dataEmissao: '',
      numeroNota: '',
      tipoEntradaId: TIPOS_ENTRADA[0] ?? 'Compra',
      fornecedor: '',
      modeloNotaId: modelosNota[0] ?? '',
      formaPagamentoId: formasPagamento[0]?.nome ?? '',
      valorPago: '' as string | number,
      valores: [] as { categoriaId: string; valor: string }[],
      contasAPagar: [] as { vencimento: string; valor: string }[],
    };
  }, [modelosNota, formasPagamento]);

  const [formData, setFormData] = useState(defaultForm());
  const { fornecedores, fetchFornecedores, addFornecedor } = useFornecedorStore();

  const resolveFornecedorByCnpj = useCallback(() => {
    const raw = formData.fornecedor.trim();
    const digits = onlyNumbers(raw);
    setFornecedorNome(null);
    setFornecedorError(null);
    if (digits.length !== 14) return;
    const found = fornecedores.find((f) => f.tipo === 'cnpj' && onlyNumbers(f.cnpj) === digits);
    if (found && found.tipo === 'cnpj') {
      setFornecedorNome(found.razaoSocial || found.nomeFantasia || '');
    } else if (!found) {
      setFornecedorError('Fornecedor não cadastrado. Cadastre em Fornecedores ou use o botão abaixo.');
    }
  }, [formData.fornecedor, fornecedores]);


  const totalValores = useMemo(() => {
    return formData.valores.reduce((acc, v) => acc + parseNum(v.valor), 0);
  }, [formData.valores]);

  const formaLancamentoDireto = formData.formaPagamentoId
    ? FORMAS_PAGAMENTO_LANCAMENTO_DIRETO.some((f) => slugify(f) === slugify(formData.formaPagamentoId) || f === formData.formaPagamentoId)
    : false;
  const formaBoleto = formData.formaPagamentoId && slugify(formData.formaPagamentoId) === 'boleto';

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

  useEffect(() => {
    if (!isDialogOpen) {
      setFornecedorNome(null);
      setFornecedorError(null);
    }
  }, [isDialogOpen]);

  useEffect(() => {
    if (!isDialogOpen || !editingItem) return;
    const digits = onlyNumbers(editingItem.fornecedor || '');
    if (digits.length !== 14) return;
    const found = fornecedores.find((f) => f.tipo === 'cnpj' && onlyNumbers(f.cnpj) === digits);
    if (found && found.tipo === 'cnpj') {
      setFornecedorNome(found.razaoSocial || found.nomeFantasia || '');
      setFornecedorError(null);
    } else if (!found) {
      setFornecedorNome(null);
      setFornecedorError('Fornecedor não cadastrado. Cadastre em Fornecedores ou use o botão abaixo.');
    }
  }, [isDialogOpen, editingItem, fornecedores]);


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
        numeroNota: item.numeroNota ?? '',
        tipoEntradaId: item.tipoEntrada ?? TIPOS_ENTRADA[0] ?? 'Compra',
        fornecedor: cnpjDisplay,
        modeloNotaId: item.modeloNota ?? modelosNota[0] ?? '',
        formaPagamentoId: item.formaPagamento ?? formasPagamento[0]?.nome ?? '',
        valorPago: item.valorPago ?? '',
        valores: valoresFromRow,
        contasAPagar: (item as unknown as { contasAPagar?: { vencimento: string; valor: number }[] })?.contasAPagar?.map((p) => ({ vencimento: p.vencimento?.slice(0, 10) ?? '', valor: String(p.valor ?? '') })) ?? [],
      });
    } else {
      setEditingItem(null);
      setFormData({
        ...defaultForm(),
        valores: categorias.length > 0 ? [{ categoriaId: categorias[0].id, valor: '0' }] : [],
        contasAPagar: [],
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

  const addContaAPagar = () => {
    setFormData((prev) => ({
      ...prev,
      contasAPagar: [...(prev.contasAPagar ?? []), { vencimento: '', valor: '' }],
    }));
  };
  const removeContaAPagar = (index: number) => {
    setFormData((prev) => {
      const list = prev.contasAPagar?.length ? prev.contasAPagar : [];
      return { ...prev, contasAPagar: list.filter((_, i) => i !== index) };
    });
  };
  const updateContaAPagar = (index: number, field: 'vencimento' | 'valor', value: string) => {
    setFormData((prev) => {
      const list = prev.contasAPagar?.length ? prev.contasAPagar : [{ vencimento: '', valor: '' }];
      const next = list.map((p, i) => (i === index ? { ...p, [field]: value } : p));
      return { ...prev, contasAPagar: next };
    });
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
    const body: Record<string, unknown> = {
      data: formData.data.slice(0, 10),
      dataEmissao: formData.dataEmissao?.slice(0, 10) || undefined,
      numeroNota: formData.numeroNota?.trim() || undefined,
      tipoEntrada: formData.tipoEntradaId || undefined,
      fornecedor: fornecedorNumeros,
      modeloNota: formData.modeloNotaId,
      formaPagamento: formData.formaPagamentoId,
      valorPago: valorPagoNum,
      valores: valoresBody,
      total,
    };
    if (formaBoleto && formData.contasAPagar?.length) {
      const parcelas = formData.contasAPagar
        .filter((p) => p.vencimento.trim() && parseNum(p.valor) > 0)
        .map((p) => ({ vencimento: p.vencimento.slice(0, 10), valor: parseNum(p.valor) }));
      if (parcelas.length) body.contasAPagar = parcelas;
    }
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
        cell: ({ row }) => formatDateStringToBR(String(row.getValue('data') ?? '')),
      },
      {
        accessorKey: 'dataEmissao',
        header: 'Data emissao',
        cell: ({ row }) => (row.original.dataEmissao ? formatDateStringToBR(String(row.original.dataEmissao)) : '-'),
      },
      {
        accessorKey: 'numeroNota',
        header: 'Nº nota',
        cell: ({ row }) => row.original.numeroNota ?? '-',
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
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Entrada</h1>
          <p className="mt-1 text-sm text-slate-500">
            Data, fornecedor, modelo da nota, categoria, valores e forma de pagamento.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <span className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfigDialog('modelo')}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:px-4 sm:py-2.5"
            >
              <Settings2 className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Modelos nota</span>
            </button>
            <button
              type="button"
              onClick={() => setConfigDialog('categoria')}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:px-4 sm:py-2.5"
            >
              <Settings2 className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Categorias</span>
            </button>
            <button
              type="button"
              onClick={() => setConfigDialog('forma')}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:px-4 sm:py-2.5"
            >
              <Settings2 className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">Formas pag.</span>
            </button>
          </div>
          <span className="hidden h-6 w-px bg-slate-200 sm:block" aria-hidden />
          <div className="flex items-center gap-2">
            <ExportButtons
              data={items.map((r) => ({
                data: formatDateStringToBR(r.data),
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
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 sm:px-4 sm:py-2.5"
            >
              <Plus className="h-4 w-4" />
              <span className="whitespace-nowrap">Novo</span>
            </button>
          </div>
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
                      <p>Nenhum registro no periodo.</p>
                      <p className="mt-1 text-xs text-slate-400">Use <strong>+ Novo</strong> para adicionar (o fornecedor deve estar cadastrado em Fornecedores).</p>
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
        <DialogContent className="max-h-[90vh] flex flex-col overflow-x-hidden">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Entrada' : 'Nova Entrada'}</DialogTitle>
            <DialogDescription>
              Preencha os dados da entrada na ordem: Modelo da nota, CNPJ do fornecedor, Data entrada, Data emissao, Nº da nota, Tipo, Valor/Categoria, Forma de pagamento. O CNPJ deve estar cadastrado em Fornecedores.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="overflow-y-auto overflow-x-hidden min-w-0">
              <div className="space-y-4 mt-4 mb-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
                    <label className="text-sm font-medium text-slate-700">Tipo</label>
                    <select value={formData.tipoEntradaId} onChange={(e) => setFormData({ ...formData, tipoEntradaId: e.target.value })} className={inputClass}>
                      {TIPOS_ENTRADA.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">CNPJ do fornecedor</label>
                    <input
                      type="text"
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      value={formData.fornecedor}
                      onChange={(e) => {
                        setFormData({ ...formData, fornecedor: maskCNPJ(e.target.value) });
                        setFornecedorNome(null);
                        setFornecedorError(null);
                      }}
                      onBlur={() => resolveFornecedorByCnpj()}
                      className={cn(inputClass, fornecedorError && 'border-red-500')}
                    />
                    {fornecedorNome && (
                      <p className="text-sm text-emerald-700 font-medium">{fornecedorNome}</p>
                    )}
                    {fornecedorError && (
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm text-red-600">{fornecedorError}</p>
                        <button
                          type="button"
                          onClick={() => setCadastroFornecedorOpen(true)}
                          className="text-sm font-medium text-emerald-600 hover:underline"
                        >
                          Cadastrar fornecedor
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Data entrada</label>
                    <input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} className={inputClass} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Data emissao (nota)</label>
                    <input type="date" value={formData.dataEmissao} onChange={(e) => setFormData({ ...formData, dataEmissao: e.target.value })} className={inputClass} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Nº da nota</label>
                    <input
                      type="text"
                      placeholder="Ex: 156"
                      value={formData.numeroNota}
                      onChange={(e) => setFormData({ ...formData, numeroNota: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Valor / Categoria</label>
                    <button type="button" onClick={addValorLine} className="text-sm text-emerald-600 hover:underline">
                      Adicionar valor
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto py-4">
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
                          className={cn(inputClass, 'w-fit')}
                        />
                        <button type="button" onClick={() => removeValorLine(i)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600" title="Remover">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Total: {formatCurrency(totalValores)}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Forma de pagamento</label>
                  <select
                    value={formData.formaPagamentoId}
                    onChange={(e) => setFormData({ ...formData, formaPagamentoId: e.target.value })}
                    className={inputClass}
                  >
                    {formasPagamento.map((f) => (
                      <option key={f.nome} value={f.nome}>{f.nome}</option>
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
                {formaBoleto && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-700">Contas a pagar</label>
                      <button type="button" onClick={addContaAPagar} className="text-sm text-emerald-600 hover:underline">
                        Adicionar parcela
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Vencimento e valor de cada boleto (comunica Agenda).</p>
                    <div className="space-y-2 max-h-36 overflow-y-auto">
                      {(formData.contasAPagar?.length ? formData.contasAPagar : [{ vencimento: '', valor: '' }]).map((p, i) => (
                        <div key={i} className="flex gap-2 items-center">
                          <input
                            type="date"
                            value={p.vencimento}
                            onChange={(e) => updateContaAPagar(i, 'vencimento', e.target.value)}
                            className={cn(inputClass, 'flex-1 min-w-0')}
                          />
                          <input
                            type="text"
                            inputMode="decimal"
                            placeholder="0,00"
                            value={p.valor}
                            onChange={(e) => updateContaAPagar(i, 'valor', e.target.value)}
                            className={cn(inputClass, 'w-28')}
                          />
                          <button type="button" onClick={() => removeContaAPagar(i)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600" title="Remover">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
        <DialogContent>
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
              {modelosNota.map((m) => {
                const isPadrao = MODELOS_NOTA_INICIAIS.includes(m);
                return (
                  <li key={m} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <span className="text-sm">{m}</span>
                    <button
                      type="button"
                      disabled={isPadrao}
                      onClick={() => !isPadrao && setModelosNota((prev) => prev.filter((x) => x !== m))}
                      className={cn('rounded p-1.5', isPadrao ? 'cursor-not-allowed text-slate-300' : 'text-slate-400 hover:bg-red-50 hover:text-red-600')}
                      title={isPadrao ? 'Padrao do sistema nao pode ser removido' : 'Remover'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog config Categorias */}
      <Dialog open={configDialog === 'categoria'} onOpenChange={(o) => !o && setConfigDialog(null)}>
        <DialogContent>
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
              {categorias.map((c) => {
                const isPadrao = CATEGORIAS_INICIAIS.some((x) => x.id === c.id);
                return (
                  <li key={c.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <span className="text-sm">{c.nome}</span>
                    <button
                      type="button"
                      disabled={isPadrao}
                      onClick={() => !isPadrao && setCategorias((prev) => prev.filter((x) => x.id !== c.id))}
                      className={cn('rounded p-1.5', isPadrao ? 'cursor-not-allowed text-slate-300' : 'text-slate-400 hover:bg-red-50 hover:text-red-600')}
                      title={isPadrao ? 'Padrao do sistema nao pode ser removido' : 'Remover'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog config Formas de pagamento */}
      <Dialog open={configDialog === 'forma'} onOpenChange={(o) => !o && setConfigDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Formas de pagamento</DialogTitle>
            <DialogDescription>Adicione ou remova formas. Ao criar, informe se comunica Agenda (ex.: Boleto sim; Dinheiro/PIX nao).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex flex-wrap gap-2 items-end">
              <div className="space-y-1 flex-1 min-w-[140px]">
                <input
                  type="text"
                  placeholder="Ex: BOLETO"
                  value={novaForma}
                  onChange={(e) => setNovaForma(e.target.value.toUpperCase())}
                  className={inputClass}
                />
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={novaFormaComunicaAgenda}
                    onChange={(e) => setNovaFormaComunicaAgenda(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600"
                  />
                  Comunica Agenda
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  const t = novaForma.trim();
                  if (!t) return;
                  if (formasPagamento.some((x) => x.nome === t)) {
                    toast.error('Ja existe.');
                    return;
                  }
                  setFormasPagamento((prev) => [...prev, { nome: t, comunicaAgenda: novaFormaComunicaAgenda }]);
                  setNovaForma('');
                  setNovaFormaComunicaAgenda(false);
                }}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Adicionar
              </button>
            </div>
            <ul className="space-y-1 max-h-40 overflow-y-auto">
              {formasPagamento.map((f) => {
                const isPadrao = FORMAS_PAGAMENTO_INICIAIS.some((x) => x.nome === f.nome);
                return (
                  <li key={f.nome} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <span className="text-sm">{f.nome} {f.comunicaAgenda ? '(comunica Agenda)' : ''}</span>
                    <button
                      type="button"
                      disabled={isPadrao}
                      onClick={() => !isPadrao && setFormasPagamento((prev) => prev.filter((x) => x.nome !== f.nome))}
                      className={cn('rounded p-1.5', isPadrao ? 'cursor-not-allowed text-slate-300' : 'text-slate-400 hover:bg-red-50 hover:text-red-600')}
                      title={isPadrao ? 'Padrao do sistema nao pode ser removido' : 'Remover'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal cadastrar fornecedor (mantém o formulário de Entrada aberto atrás) */}
      <FornecedorForm
        open={cadastroFornecedorOpen}
        onOpenChange={setCadastroFornecedorOpen}
        initialCnpj={formData.fornecedor}
        onSubmit={async (data) => {
          await addFornecedor(data as CreateFornecedorDto);
          toast.success('Fornecedor cadastrado.');
          setCadastroFornecedorOpen(false);
          await fetchFornecedores();
          const digits = onlyNumbers(formData.fornecedor);
          const list = useFornecedorStore.getState().fornecedores;
          const found = list.find((f) => f.tipo === 'cnpj' && onlyNumbers(f.cnpj) === digits);
          if (found && found.tipo === 'cnpj') {
            setFornecedorNome(found.razaoSocial || found.nomeFantasia || '');
            setFornecedorError(null);
          }
        }}
        isLoading={false}
      />
    </div>
  );
}
