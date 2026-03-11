import { useState, useMemo, useEffect, useCallback } from 'react';
import { Plus, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
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
import { formatValorForInput, parseValorFromInput } from '@/lib/formatValor';
import { onlyNumbers, isValidCNPJ, isValidCPF, maskCNPJ, maskCPF } from '@/lib/masks';
import type { TableColumnConfigFromApi } from '@/types/configuracao';
import type { EntradaRow, EntradaValorItem } from '@/types/financeiro';
import type { CreateFornecedorDto } from '@/types/fornecedor';
import { useFornecedorStore } from '@/stores/fornecedorStore';
import { FornecedorForm } from '@/components/fornecedor/FornecedorForm';
import { ExportButtons } from '@/components/ui/export-buttons';
import { addOneMonth, formatDateStringToBR, formatDateToLocalYYYYMMDD } from '@/lib/date';
import {
  EntradaTable,
  EntradaFormDialog,
  EntradaConfigDialogs,
  CATEGORIAS_INICIAIS,
  MODELOS_NOTA_INICIAIS,
  TIPOS_ENTRADA,
  slugify,
  formatCurrency,
  normalizeVencimentoToYYYYMMDD,
  type FormaPagamentoFromApi,
  type EntradaFormData,
} from './entrada';

export function EntradaPage() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [items, setItems] = useState<EntradaRow[]>([]);
  const [columnsFromApi, setColumnsFromApi] = useState<TableColumnConfigFromApi[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EntradaRow | null>(null);
  const [fornecedorNome, setFornecedorNome] = useState<string | null>(null);
  const [fornecedorError, setFornecedorError] = useState<string | null>(null);
  const [cadastroFornecedorOpen, setCadastroFornecedorOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [modelosNota, setModelosNota] = useState<string[]>(() => [...MODELOS_NOTA_INICIAIS]);
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>(() => [
    ...CATEGORIAS_INICIAIS,
  ]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamentoFromApi[]>([]);
  const [loadingFormas, setLoadingFormas] = useState(false);

  const [configDialog, setConfigDialog] = useState<'modelo' | 'categoria' | 'forma' | null>(null);
  const [novoModelo, setNovoModelo] = useState('');
  const [novaCategoria, setNovaCategoria] = useState('');
  const [novaForma, setNovaForma] = useState('');
  const [novaFormaComunicarAgenda, setNovaFormaComunicarAgenda] = useState(false);

  const defaultForm = useCallback(() => {
    const hoje = formatDateToLocalYYYYMMDD(new Date());
    return {
      data: hoje,
      dataEmissao: hoje,
      numeroNota: '',
      tipoEntradaId: TIPOS_ENTRADA[0] ?? 'Compra',
      fornecedor: '',
      modeloNotaId: modelosNota[0] ?? '',
      formaPagamentoId: formasPagamento[0]?.nome ?? '',
      valorTotalNota: '',
      valores: [] as { categoriaId: string; valor: string }[],
      contasAPagar: [] as { vencimento: string; valor: string; disabled?: boolean }[],
    };
  }, [modelosNota, formasPagamento]);

  const [formData, setFormData] = useState<EntradaFormData>(defaultForm());
  const { fornecedores, fetchFornecedores, addFornecedor } = useFornecedorStore();

  /** Resolve nome/erro do fornecedor pela lista local (CPF 11 dígitos ou CNPJ 14 dígitos). */
  const resolveFornecedorByDocumento = useCallback(
    (docValue?: string) => {
      const raw = (docValue ?? formData.fornecedor).trim();
      const digits = onlyNumbers(raw);
      if (digits.length === 11) {
        const found = fornecedores.find(f => f.tipo === 'cpf' && onlyNumbers(f.cpf) === digits);
        if (found && found.tipo === 'cpf') {
          setFornecedorNome(found.nomeCompleto || found.nomeComercial || '');
          setFornecedorError(null);
        } else {
          setFornecedorNome(null);
          setFornecedorError(
            'Fornecedor não cadastrado. Cadastre em Fornecedores ou use o botão abaixo.',
          );
        }
        return;
      }
      if (digits.length === 14) {
        const found = fornecedores.find(f => f.tipo === 'cnpj' && onlyNumbers(f.cnpj) === digits);
        if (found && found.tipo === 'cnpj') {
          setFornecedorNome(found.razaoSocial || found.nomeFantasia || '');
          setFornecedorError(null);
        } else {
          setFornecedorNome(null);
          setFornecedorError(
            'Fornecedor não cadastrado. Cadastre em Fornecedores ou use o botão abaixo.',
          );
        }
      }
    },
    [formData.fornecedor, fornecedores],
  );

  const handleFornecedorChange = useCallback(
    (value: string) => {
      const digits = onlyNumbers(value).slice(0, 14);
      const masked = digits.length <= 11 ? maskCPF(digits) : maskCNPJ(digits);
      setFormData(prev => ({ ...prev, fornecedor: masked }));
      setFornecedorNome(null);
      setFornecedorError(null);
      if (digits.length === 11) resolveFornecedorByDocumento(masked);
      else if (digits.length === 14) resolveFornecedorByDocumento(masked);
    },
    [resolveFornecedorByDocumento],
  );

  const handleFornecedorBlur = useCallback(() => {
    const digits = onlyNumbers(formData.fornecedor);
    if (digits.length === 11 || digits.length === 14) resolveFornecedorByDocumento();
  }, [formData.fornecedor, resolveFornecedorByDocumento]);

  const handleFornecedorPaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text');
      const digits = onlyNumbers(pasted).slice(0, 14);
      const masked = digits.length <= 11 ? maskCPF(digits) : maskCNPJ(digits);
      setFormData(prev => ({ ...prev, fornecedor: masked }));
      setFornecedorNome(null);
      setFornecedorError(null);
      if (digits.length === 11 || digits.length === 14) resolveFornecedorByDocumento(masked);
    },
    [resolveFornecedorByDocumento],
  );

  const totalValores = useMemo(() => {
    return formData.valores.reduce((acc, v) => acc + parseValorFromInput(v.valor), 0);
  }, [formData.valores]);

  const formaBoleto = useMemo(() => {
    const atual = formasPagamento.find(f => f.nome === formData.formaPagamentoId);
    if (atual) return !!atual.comunicarAgenda;
    // Fallback defensivo para backends antigos ou dados inconsistentes
    return (formData.formaPagamentoId ?? '').toLowerCase() === 'boleto';
  }, [formasPagamento, formData.formaPagamentoId]);

  const valorTotalNotaNum = parseValorFromInput(formData.valorTotalNota);
  const somaCategoriasDiverge =
    valorTotalNotaNum > 0 &&
    totalValores > 0 &&
    Math.abs(totalValores - valorTotalNotaNum) > 0.005;

  const fetchList = useCallback(() => {
    setLoading(true);
    api
      .get<EntradaRow[]>('financeiro/entrada', { params: dateFilterToParams(dateFilter) })
      .then(res => {
        setItems(Array.isArray(res.data) ? res.data : []);
        setColumnsFromApi(res.columns ?? null);
      })
      .catch(err => toast.error(err?.message ?? 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [dateFilter]);

  const fetchFormasPagamento = useCallback(async () => {
    setLoadingFormas(true);
    try {
      const res = await api.get<{ data?: FormaPagamentoFromApi[] }>(
        'financeiro/entrada/formas-pagamento',
      );
      const list = res.data?.data ?? (Array.isArray(res.data) ? res.data : []);
      setFormasPagamento(Array.isArray(list) ? list : []);
    } catch {
      toast.error('Erro ao carregar formas de pagamento.');
    } finally {
      setLoadingFormas(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchFormasPagamento();
  }, [fetchFormasPagamento]);

  useEffect(() => {
    if (configDialog === 'forma') fetchFormasPagamento();
  }, [configDialog, fetchFormasPagamento]);

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
    const digits = onlyNumbers((editingItem.cnpjCpf ?? editingItem.fornecedor) ?? '');
    if (digits.length === 11) {
      const found = fornecedores.find(f => f.tipo === 'cpf' && onlyNumbers(f.cpf) === digits);
      if (found && found.tipo === 'cpf') {
        setFornecedorNome(found.nomeCompleto || found.nomeComercial || '');
        setFornecedorError(null);
      } else {
        setFornecedorNome(null);
        setFornecedorError(
          'Fornecedor não cadastrado. Cadastre em Fornecedores ou use o botão abaixo.',
        );
      }
      return;
    }
    if (digits.length === 14) {
      const found = fornecedores.find(f => f.tipo === 'cnpj' && onlyNumbers(f.cnpj) === digits);
      if (found && found.tipo === 'cnpj') {
        setFornecedorNome(found.razaoSocial || found.nomeFantasia || '');
        setFornecedorError(null);
      } else {
        setFornecedorNome(null);
        setFornecedorError(
          'Fornecedor não cadastrado. Cadastre em Fornecedores ou use o botão abaixo.',
        );
      }
    }
  }, [isDialogOpen, editingItem, fornecedores]);

  const handleOpenDialog = (item?: EntradaRow) => {
    if (item) {
      setEditingItem(item);
      const docRaw = (item.cnpjCpf ?? item.fornecedor ?? '').toString().trim();
      const docDigits = onlyNumbers(docRaw);
      const docDisplay =
        docDigits.length === 14
          ? maskCNPJ(docDigits)
          : docDigits.length === 11
            ? maskCPF(docDigits)
            : docRaw || '';
      const valoresFromRow = item.valores?.length
        ? item.valores.map(v => ({
            categoriaId: v.categoriaId,
            valor: formatValorForInput(Number(v.valor) || 0),
          }))
        : categorias
            .map(c => ({
              categoriaId: c.id,
              valor: formatValorForInput(Number((item as unknown as Record<string, number>)[c.id]) || 0),
            }))
            .filter(v => parseValorFromInput(v.valor) > 0);
      if (valoresFromRow.length === 0 && categorias.length > 0) {
        valoresFromRow.push({ categoriaId: categorias[0].id, valor: '0' });
      }
      const totalFromRow =
        item.total ??
        (item.valores?.length ? item.valores.reduce((a, v) => a + v.valor, 0) : 0);
      const rawContas = item.contasAPagar;
      setFormData({
        data: item.data.split('T')[0] || item.data.slice(0, 10),
        dataEmissao: item.dataEmissao?.split('T')[0] ?? item.dataEmissao?.slice(0, 10) ?? '',
        numeroNota: item.numeroNota ?? '',
        tipoEntradaId: item.tipoEntrada ?? TIPOS_ENTRADA[0] ?? 'Compra',
        fornecedor: docDisplay,
        modeloNotaId: item.modeloNota ?? modelosNota[0] ?? '',
        formaPagamentoId: item.formaPagamento ?? formasPagamento[0]?.nome ?? '',
        valorTotalNota: totalFromRow > 0 ? formatValorForInput(totalFromRow) : '',
        valores: valoresFromRow,
        contasAPagar: Array.isArray(rawContas)
          ? rawContas.map(p => ({
              vencimento: normalizeVencimentoToYYYYMMDD(p.vencimento as string | Date),
              valor: p.valor != null ? formatValorForInput(Number(p.valor)) : '',
              disabled: !!(p as { pago?: boolean }).pago,
            }))
          : [],
      });
    } else {
      setEditingItem(null);
      const hoje = formatDateToLocalYYYYMMDD(new Date());
      setFormData({
        ...defaultForm(),
        valorTotalNota: '',
        valores: categorias.length > 0 ? [{ categoriaId: categorias[0].id, valor: '0' }] : [],
        contasAPagar: [{ vencimento: hoje, valor: '' }],
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
  };

  const onAddForma = useCallback(
    async (nome: string, comunicarAgenda: boolean) => {
      setLoadingFormas(true);
      try {
        await api.post('financeiro/entrada/formas-pagamento', {
          nome: nome.trim(),
          comunicarAgenda,
        });
        toast.success('Forma de pagamento adicionada.');
        await fetchFormasPagamento();
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        toast.error(msg ?? 'Erro ao adicionar forma de pagamento.');
      } finally {
        setLoadingFormas(false);
      }
    },
    [fetchFormasPagamento],
  );

  const onEditForma = useCallback(
    async (id: string, nome: string, comunicarAgenda: boolean) => {
      setLoadingFormas(true);
      try {
        await api.patch(`financeiro/entrada/formas-pagamento/${id}`, {
          nome: nome.trim(),
          comunicarAgenda,
        });
        toast.success('Forma de pagamento atualizada.');
        await fetchFormasPagamento();
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        toast.error(msg ?? 'Erro ao atualizar forma de pagamento.');
      } finally {
        setLoadingFormas(false);
      }
    },
    [fetchFormasPagamento],
  );

  const onDeleteForma = useCallback(
    async (id: string) => {
      setLoadingFormas(true);
      try {
        await api.delete(`financeiro/entrada/formas-pagamento/${id}`);
        toast.success('Forma de pagamento excluida.');
        await fetchFormasPagamento();
      } catch (err: unknown) {
        const msg =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : null;
        toast.error(msg ?? 'Erro ao excluir forma de pagamento.');
      } finally {
        setLoadingFormas(false);
      }
    },
    [fetchFormasPagamento],
  );

  const addValorLine = () => {
    const firstCat = categorias[0]?.id;
    if (!firstCat) return;
    setFormData(prev => ({
      ...prev,
      valores: [...prev.valores, { categoriaId: firstCat, valor: '0' }],
    }));
  };

  const removeValorLine = (index: number) => {
    setFormData(prev => ({
      ...prev,
      valores: prev.valores.filter((_, i) => i !== index),
    }));
  };

  const updateValorLine = (index: number, field: 'categoriaId' | 'valor', value: string) => {
    setFormData(prev => ({
      ...prev,
      valores: prev.valores.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  const addContaAPagar = () => {
    setFormData(prev => {
      const list = prev.contasAPagar?.length ? prev.contasAPagar : [];
      const ultima = list[list.length - 1];
      const proximaData = ultima?.vencimento?.trim()
        ? addOneMonth(ultima.vencimento.trim().slice(0, 10))
        : formatDateToLocalYYYYMMDD(new Date());
      const proximoValor = ultima?.valor ?? '';
      return {
        ...prev,
        contasAPagar: [...list, { vencimento: proximaData, valor: proximoValor }],
      };
    });
  };
  const removeContaAPagar = (index: number) => {
    setFormData(prev => {
      const list = prev.contasAPagar?.length ? prev.contasAPagar : [];
      return { ...prev, contasAPagar: list.filter((_, i) => i !== index) };
    });
  };
  const updateContaAPagar = (index: number, field: 'vencimento' | 'valor', value: string) => {
    setFormData(prev => {
      const list = prev.contasAPagar?.length ? prev.contasAPagar : [{ vencimento: '', valor: '' }];
      const next = list.map((p, i) => (i === index ? { ...p, [field]: value } : p));
      return { ...prev, contasAPagar: next };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fornecedorRaw = formData.fornecedor.trim();
    const fornecedorNumeros = onlyNumbers(fornecedorRaw);
    if (fornecedorNumeros.length === 11) {
      if (!isValidCPF(fornecedorRaw)) {
        toast.error('CPF do fornecedor invalido.');
        return;
      }
      const existeFornecedor = fornecedores.some(
        f => f.tipo === 'cpf' && onlyNumbers(f.cpf) === fornecedorNumeros,
      );
      if (!existeFornecedor) {
        toast.error('Fornecedor nao cadastrado. Cadastre em Fornecedores antes.');
        return;
      }
    } else if (fornecedorNumeros.length === 14) {
      if (!isValidCNPJ(fornecedorRaw)) {
        toast.error('CNPJ do fornecedor invalido.');
        return;
      }
      const existeFornecedor = fornecedores.some(
        f => f.tipo === 'cnpj' && onlyNumbers(f.cnpj) === fornecedorNumeros,
      );
      if (!existeFornecedor) {
        toast.error('Fornecedor nao cadastrado. Cadastre em Fornecedores antes.');
        return;
      }
    } else {
      toast.error('Informe o CPF (11 digitos) ou CNPJ (14 digitos) do fornecedor.');
      return;
    }
    if (formData.valores.length === 0) {
      toast.error('Adicione ao menos um valor por categoria.');
      return;
    }
    const valoresBody: EntradaValorItem[] = formData.valores
      .map(v => ({
        categoriaId: v.categoriaId,
        categoriaNome: categorias.find(c => c.id === v.categoriaId)?.nome,
        valor: parseValorFromInput(v.valor),
      }))
      .filter(v => v.valor > 0);
    if (valoresBody.length === 0) {
      toast.error('Informe ao menos um valor maior que zero.');
      return;
    }
    const total = valoresBody.reduce((acc, v) => acc + v.valor, 0);
    const valorTotalNotaNumSubmit = parseValorFromInput(formData.valorTotalNota);
    if (total > 0 && valorTotalNotaNumSubmit <= 0) {
      toast.error('Informe o valor total da nota.');
      return;
    }
    if (valorTotalNotaNumSubmit > 0 && Math.abs(total - valorTotalNotaNumSubmit) > 0.005) {
      toast.error(
        'A soma dos valores por categoria deve ser igual ao valor total da nota.',
      );
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
      valores: valoresBody,
      total,
    };
    // Formas que comunicam agenda (modo Boleto) devem enviar contasAPagar
    if (formaBoleto && formData.contasAPagar?.length) {
      const parcelas = formData.contasAPagar
        .filter(p => p.vencimento.trim() && parseValorFromInput(p.valor) > 0)
        .map(p => ({
          vencimento: p.vencimento.slice(0, 10),
          valor: parseValorFromInput(p.valor),
        }));
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
        .catch(err => toast.error(err instanceof Error ? err.message : 'Erro ao atualizar'));
    } else {
      api
        .post<EntradaRow>('financeiro/entrada', body)
        .then(res => {
          toast.success('Registro adicionado.');
          setItems(prev => [...prev, res.data]);
          handleCloseDialog();
        })
        .catch(err => toast.error(err instanceof Error ? err.message : 'Erro ao criar'));
    }
  };

  const handleConfirmDelete = useCallback(() => {
    if (!deleteId) return;
    api
      .delete(`financeiro/entrada/${deleteId}`)
      .then(() => {
        toast.success('Registro excluído.');
        setItems(prev => prev.filter(r => r.id !== deleteId));
        setDeleteId(null);
      })
      .catch(err => toast.error(err?.message ?? 'Erro ao excluir.'));
  }, [deleteId]);

  const getRowTotal = useCallback((row: EntradaRow): number => {
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
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Entrada</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gerencie suas entradas.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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
          <div className="ml-auto flex items-center gap-2">
            <ExportButtons
              data={items.map(r => ({
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
            <DateFilter value={dateFilter} onChange={setDateFilter} />
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

      <EntradaTable
        items={items}
        columnsFromApi={columnsFromApi}
        loading={loading}
        getRowTotal={getRowTotal}
        onEdit={item => handleOpenDialog(item)}
        onDelete={row => setDeleteId(row.id)}
      />

      <EntradaFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingItem={editingItem}
        formData={formData}
        setFormData={setFormData}
        modelosNota={modelosNota}
        categorias={categorias}
        formasPagamento={formasPagamento}
        fornecedorNome={fornecedorNome}
        fornecedorError={fornecedorError}
        somaCategoriasDiverge={somaCategoriasDiverge}
        totalValores={totalValores}
        valorTotalNotaNum={valorTotalNotaNum}
        formaBoleto={formaBoleto}
        onFornecedorChange={handleFornecedorChange}
        onFornecedorBlur={handleFornecedorBlur}
        onFornecedorPaste={handleFornecedorPaste}
        onCadastroFornecedorOpen={() => setCadastroFornecedorOpen(true)}
        addValorLine={addValorLine}
        removeValorLine={removeValorLine}
        updateValorLine={updateValorLine}
        addContaAPagar={addContaAPagar}
        removeContaAPagar={removeContaAPagar}
        updateContaAPagar={updateContaAPagar}
        onSubmit={handleSubmit}
        onClose={handleCloseDialog}
      />

      <EntradaConfigDialogs
        configDialog={configDialog}
        setConfigDialog={setConfigDialog}
        modelosNota={modelosNota}
        setModelosNota={setModelosNota}
        novoModelo={novoModelo}
        setNovoModelo={setNovoModelo}
        categorias={categorias}
        setCategorias={setCategorias}
        novaCategoria={novaCategoria}
        setNovaCategoria={setNovaCategoria}
        formasPagamento={formasPagamento}
        loadingFormas={loadingFormas}
        novaForma={novaForma}
        setNovaForma={setNovaForma}
        novaFormaComunicarAgenda={novaFormaComunicarAgenda}
        setNovaFormaComunicarAgenda={setNovaFormaComunicarAgenda}
        onAddForma={onAddForma}
        onEditForma={onEditForma}
        onDeleteForma={onDeleteForma}
        slugify={slugify}
      />

      <FornecedorForm
        open={cadastroFornecedorOpen}
        onOpenChange={setCadastroFornecedorOpen}
        initialCnpj={onlyNumbers(formData.fornecedor).length === 14 ? formData.fornecedor.trim() : undefined}
        initialCpf={onlyNumbers(formData.fornecedor).length === 11 ? formData.fornecedor.trim() : undefined}
        existingFornecedores={fornecedores}
        onSubmit={async data => {
          await addFornecedor(data as CreateFornecedorDto);
          toast.success('Fornecedor cadastrado.');
          setCadastroFornecedorOpen(false);
          await fetchFornecedores();
          const digits = onlyNumbers(formData.fornecedor);
          const list = useFornecedorStore.getState().fornecedores;
          if (digits.length === 11) {
            const found = list.find(f => f.tipo === 'cpf' && onlyNumbers(f.cpf) === digits);
            if (found && found.tipo === 'cpf') {
              setFornecedorNome(found.nomeCompleto || found.nomeComercial || '');
              setFornecedorError(null);
            }
          } else if (digits.length === 14) {
            const found = list.find(f => f.tipo === 'cnpj' && onlyNumbers(f.cnpj) === digits);
            if (found && found.tipo === 'cnpj') {
              setFornecedorNome(found.razaoSocial || found.nomeFantasia || '');
              setFornecedorError(null);
            }
          }
        }}
        isLoading={false}
      />

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta entrada? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
