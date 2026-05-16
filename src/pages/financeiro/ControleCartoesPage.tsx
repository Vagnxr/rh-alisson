import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Loader2, Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
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
import type { ControleCartoesRow, BandeiraCartao } from '@/types/financeiro';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
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

/** Permite apenas digitos (inteiro). */
function sanitizeInteger(value: string): string {
  return value.replace(/\D/g, '');
}

/** Permite apenas digitos e no maximo um separador decimal (virgula ou ponto). */
function sanitizeDecimal(value: string): string {
  const cleaned = value.replace(/[^\d,.]/g, '');
  const sepIndex = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'));
  if (sepIndex < 0) return cleaned;
  const intPart = cleaned.slice(0, sepIndex).replace(/[,.]/g, '');
  const decPart = cleaned.slice(sepIndex + 1).replace(/\D/g, '');
  return intPart + cleaned[sepIndex] + decPart;
}

function diaSemanaFromDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  return dias[d.getDay()];
}

const inputClass =
  'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const BANDEIRAS_CREDITO: { id: BandeiraCartao; label: string }[] = [
  { id: 'amex', label: 'Amex' },
  { id: 'elo-credito', label: 'Elo Credito' },
  { id: 'hipercard', label: 'Hipercard' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'visa', label: 'Visa' },
];
const BANDEIRAS_DEBITO: { id: BandeiraCartao; label: string }[] = [
  { id: 'electron', label: 'Electron' },
  { id: 'elo-debito', label: 'Elo Debito' },
  { id: 'maestro', label: 'Maestro' },
];
/** Bandeiras voucher (alimentacao/refeicao). */
const BANDEIRAS_VOUCHER: { id: string; label: string }[] = [
  { id: 'alelo', label: 'Alelo' },
  { id: 'ben', label: 'Ben Visa Vale' },
  { id: 'sodexo', label: 'Sodexo' },
  { id: 'ticket', label: 'Ticket' },
  { id: 'vr', label: 'VR' },
  { id: 'verocard', label: 'Verocard' },
  { id: 'plush', label: 'Plush' },
];

/** Tipos de pagamento configuraveis por maquininha. */
const TIPOS_PAGAMENTO_MAQUININHA = [
  { id: 'a-vista', label: 'Credito a vista', grupo: 'credito' as const },
  { id: 'parcelado-vista', label: 'Credito parcelado a vista', grupo: 'credito' as const },
  { id: 'parcelado-prazo', label: 'Credito parcelado a prazo', grupo: 'credito' as const },
  { id: 'debito', label: 'Debito', grupo: 'debito' as const },
  { id: 'pix', label: 'PIX', grupo: 'pix' as const },
] as const;

interface MaquininhaConfig {
  id: string;
  label: string;
  /** Custom = criada pelo usuario; nao-custom sao as padrao do sistema. */
  custom?: boolean;
  /** Tipos de pagamento habilitados nesta maquininha. */
  tipos: string[];
  /** Bandeiras de credito aceitas. */
  bandeirasCredito: string[];
  /** Bandeiras de debito aceitas. */
  bandeirasDebito: string[];
}

/** Tipos padrao quando cria/usa maquininha sem config explicita. */
const TIPOS_DEFAULT = ['a-vista', 'parcelado-vista', 'parcelado-prazo', 'debito', 'pix'];

/** Maquininhas (operadoras) padrao do sistema. Cliente pode habilitar mais ou criar novas. */
const MAQUININHAS_PADRAO: MaquininhaConfig[] = [
  { id: 'cielo', label: 'Cielo', tipos: TIPOS_DEFAULT, bandeirasCredito: BANDEIRAS_CREDITO.map((b) => b.id), bandeirasDebito: BANDEIRAS_DEBITO.map((b) => b.id) },
  { id: 'rede', label: 'Rede', tipos: TIPOS_DEFAULT, bandeirasCredito: BANDEIRAS_CREDITO.map((b) => b.id), bandeirasDebito: BANDEIRAS_DEBITO.map((b) => b.id) },
  { id: 'getnet', label: 'GetNet', tipos: TIPOS_DEFAULT, bandeirasCredito: BANDEIRAS_CREDITO.map((b) => b.id), bandeirasDebito: BANDEIRAS_DEBITO.map((b) => b.id) },
  { id: 'stone', label: 'Stone', tipos: TIPOS_DEFAULT, bandeirasCredito: BANDEIRAS_CREDITO.map((b) => b.id), bandeirasDebito: BANDEIRAS_DEBITO.map((b) => b.id) },
  { id: 'pagbank', label: 'PagBank', tipos: TIPOS_DEFAULT, bandeirasCredito: BANDEIRAS_CREDITO.map((b) => b.id), bandeirasDebito: BANDEIRAS_DEBITO.map((b) => b.id) },
  { id: 'mercado-pago', label: 'Mercado Pago', tipos: TIPOS_DEFAULT, bandeirasCredito: BANDEIRAS_CREDITO.map((b) => b.id), bandeirasDebito: BANDEIRAS_DEBITO.map((b) => b.id) },
  { id: 'safrapay', label: 'SafraPay', tipos: TIPOS_DEFAULT, bandeirasCredito: BANDEIRAS_CREDITO.map((b) => b.id), bandeirasDebito: BANDEIRAS_DEBITO.map((b) => b.id) },
  { id: 'infinite-pay', label: 'InfinitePay', tipos: TIPOS_DEFAULT, bandeirasCredito: BANDEIRAS_CREDITO.map((b) => b.id), bandeirasDebito: BANDEIRAS_DEBITO.map((b) => b.id) },
];

/** Maquininhas habilitadas por padrao (3 principais). Tenant pode habilitar/desabilitar. */
const MAQUININHAS_PADRAO_HABILITADAS = ['cielo', 'rede', 'getnet'];

/** Slugify para gerar id a partir de label de maquininha custom. */
function slugifyMaq(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

type TabCartao = 'credito' | 'debito' | 'pix' | 'voucher' | 'ifood' | 'outras';
type TipoCredito = 'a-vista' | 'parcelado-vista' | 'parcelado-prazo';
const TIPOS_CREDITO: { id: TipoCredito; label: string }[] = [
  { id: 'a-vista', label: 'A vista' },
  { id: 'parcelado-vista', label: 'Parcelado a vista' },
  { id: 'parcelado-prazo', label: 'Parcelado a prazo' },
];

export function ControleCartoesPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  /** Operadora (maquininha) selecionada quando em credito/debito/pix. */
  const [operadora, setOperadora] = useState<string>('cielo');
  const [maquininhasHabilitadas, setMaquininhasHabilitadas] = useState<string[]>(
    MAQUININHAS_PADRAO_HABILITADAS,
  );
  /** Maquininhas customizadas (criadas pelo usuario). */
  const [maquininhasCustom, setMaquininhasCustom] = useState<MaquininhaConfig[]>([]);
  const [habilitarOpen, setHabilitarOpen] = useState(false);
  /** Maquininha em edicao no dialog. null = nenhuma; objeto = novo/editando. */
  const [editingMaq, setEditingMaq] = useState<MaquininhaConfig | null>(null);

  /** Lista mesclada: padroes + customs. */
  const todasMaquininhas: MaquininhaConfig[] = useMemo(
    () => [...MAQUININHAS_PADRAO, ...maquininhasCustom],
    [maquininhasCustom],
  );

  /** Config da maquininha atualmente selecionada (para filtrar bandeiras e tipos). */
  const operadoraConfig = useMemo(
    () => todasMaquininhas.find((m) => m.id === operadora),
    [todasMaquininhas, operadora],
  );
  const [tab, setTab] = useState<TabCartao>('credito');
  const [bandeira, setBandeira] = useState<BandeiraCartao>('visa');
  const [bandeiraVoucher, setBandeiraVoucher] = useState<string>('alelo');
  const [items, setItems] = useState<ControleCartoesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ControleCartoesRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tipoCredito, setTipoCredito] = useState<TipoCredito>('a-vista');
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    valor: '',
    prazo: '',
    taxaPercent: '',
    dataAReceber: new Date().toISOString().split('T')[0],
    numeroParcelas: '',
    valorLoja: '', // para iFood: valor recebido na loja (nao soma no a receber)
  });

  /** Persiste habilitacao + maquininhas customizadas no backend (JSON em ControleCartaoTaxasPrazos.taxas). */
  const persistirConfigMaquininhas = useCallback(
    async (habilitadas: string[], customs: MaquininhaConfig[]) => {
      try {
        const cur = await api.get<{ taxas?: Record<string, unknown> }>(
          'financeiro/controle-cartoes/taxas-prazos',
        );
        const taxasAtual = (cur.data?.taxas ?? {}) as Record<string, unknown>;
        const novo = {
          ...taxasAtual,
          maquininhasHabilitadas: habilitadas,
          maquininhasCustom: customs,
        };
        await api.put('financeiro/controle-cartoes/taxas-prazos', { taxas: novo });
      } catch (e) {
        console.warn('Falha ao persistir maquininhas', e);
      }
    },
    [],
  );

  /** Carrega config (habilitadas + custom) do backend. */
  useEffect(() => {
    api
      .get<{
        taxas?: {
          maquininhasHabilitadas?: string[];
          maquininhasCustom?: MaquininhaConfig[];
        };
      }>('financeiro/controle-cartoes/taxas-prazos')
      .then((res) => {
        const habilitadas = res.data?.taxas?.maquininhasHabilitadas;
        const customs = res.data?.taxas?.maquininhasCustom;
        if (Array.isArray(customs)) {
          setMaquininhasCustom(customs);
        }
        if (Array.isArray(habilitadas) && habilitadas.length > 0) {
          setMaquininhasHabilitadas(habilitadas);
          if (!habilitadas.includes(operadora)) setOperadora(habilitadas[0]);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchList = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {
      ...dateFilterToParams(dateFilter),
      tipo: tab,
    };
    if (tab === 'credito' || tab === 'debito') params.bandeira = bandeira;
    if (tab === 'credito') params.tipoCredito = tipoCredito;
    if (tab === 'voucher') params.bandeira = bandeiraVoucher;
    // operadora aplica para credito/debito/pix (nao voucher nem ifood)
    if (tab === 'credito' || tab === 'debito' || tab === 'pix') params.operadora = operadora;
    api
      .get<ControleCartoesRow[]>('financeiro/controle-cartoes', { params })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : [];
        setItems(
          list.map((r: ControleCartoesRow & { data?: string; dataAReceber?: string }) => ({
            ...r,
            data: r.data ?? '',
            dataAReceber: r.dataAReceber ?? '',
            taxaPercent: r.taxaPercent ?? r.taxa,
            diaSemana: diaSemanaFromDate(r.data ?? ''),
            diaSemanaAReceber: diaSemanaFromDate(r.dataAReceber ?? ''),
          }))
        );
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [dateFilter, tab, bandeira, bandeiraVoucher, tipoCredito, operadora]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleOpenDialog = (item?: ControleCartoesRow) => {
    if (item) {
      setEditingItem(item);
      if (item.tipoCredito && tab === 'credito') setTipoCredito(item.tipoCredito);
      const taxaVal = item.taxa ?? item.taxaPercent;
      const itemAny = item as ControleCartoesRow & {
        numeroParcelas?: number;
        valorLoja?: number;
      };
      setFormData({
        data: (item.data ?? '').toString().split('T')[0]?.slice(0, 10) ?? '',
        valor: String(item.valor),
        prazo: item.prazo != null ? String(item.prazo) : '',
        taxaPercent: taxaVal != null ? String(taxaVal) : '',
        dataAReceber: (item.dataAReceber ?? '').toString().split('T')[0]?.slice(0, 10) ?? '',
        numeroParcelas: itemAny.numeroParcelas != null ? String(itemAny.numeroParcelas) : '',
        valorLoja: itemAny.valorLoja != null ? String(itemAny.valorLoja) : '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        data: new Date().toISOString().split('T')[0],
        valor: '',
        prazo: '',
        taxaPercent: '',
        dataAReceber: new Date().toISOString().split('T')[0],
        numeroParcelas: '',
        valorLoja: '',
      });
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
    const dataAReceber = formData.dataAReceber.slice(0, 10);
    const valor = parseNum(formData.valor);
    const prazo = formData.prazo.trim() ? parseNum(formData.prazo) : undefined;
    const taxaPercent = formData.taxaPercent.trim() ? parseNum(formData.taxaPercent) : undefined;
    const numeroParcelas =
      tab === 'credito' && tipoCredito === 'parcelado-prazo' && formData.numeroParcelas.trim()
        ? parseNum(formData.numeroParcelas)
        : undefined;
    const body: Record<string, unknown> = {
      tipo: tab,
      ...((tab === 'credito' || tab === 'debito') && { bandeira }),
      ...(tab === 'voucher' && { bandeira: bandeiraVoucher }),
      ...((tab === 'credito' || tab === 'debito' || tab === 'pix') && { operadora }),
      ...(tab === 'credito' && { tipoCredito }),
      ...(numeroParcelas != null && { numeroParcelas }),
      data,
      valor,
      dataAReceber,
      ...(prazo != null && { prazo }),
      ...(taxaPercent != null && { taxaPercent }),
    };
    if (tab === 'credito' && tipoCredito === 'parcelado-prazo' && (numeroParcelas == null || numeroParcelas < 1)) {
      toast.error('Informe o numero de parcelas para credito parcelado a prazo.');
      return;
    }
    if (editingItem) {
      api
        .patch<ControleCartoesRow & { data: string; dataAReceber: string }>(`financeiro/controle-cartoes/${editingItem.id}`, body)
        .then((res) => {
          const data = res.data as ControleCartoesRow & { data?: string; dataAReceber?: string };
          toast.success('Registro atualizado.');
          setItems((prev) =>
            prev.map((r) =>
              r.id === editingItem.id
                ? {
                    ...data,
                    data: data.data ?? '',
                    dataAReceber: data.dataAReceber ?? '',
                    taxaPercent: data.taxaPercent ?? data.taxa,
                    diaSemana: diaSemanaFromDate(data.data ?? ''),
                    diaSemanaAReceber: diaSemanaFromDate(data.dataAReceber ?? ''),
                  }
                : r
            )
          );
          handleCloseDialog();
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao atualizar'));
    } else {
      api
        .post<ControleCartoesRow & { data: string; dataAReceber: string }>('financeiro/controle-cartoes', body)
        .then((res) => {
          const data = res.data as ControleCartoesRow & { data?: string; dataAReceber?: string };
          toast.success('Registro adicionado.');
          setItems((prev) => [
            ...prev,
            {
              ...data,
              data: data.data ?? '',
              dataAReceber: data.dataAReceber ?? '',
              taxaPercent: data.taxaPercent ?? data.taxa,
              diaSemana: diaSemanaFromDate(data.data ?? ''),
              diaSemanaAReceber: diaSemanaFromDate(data.dataAReceber ?? ''),
            },
          ]);
          handleCloseDialog();
        })
        .catch((err) => toast.error(err?.message ?? 'Erro ao criar'));
    }
  };

  const handleDelete = () => {
    if (!deleteId) return;
    api
      .delete(`financeiro/controle-cartoes/${deleteId}`)
      .then(() => {
        setItems((prev) => prev.filter((r) => r.id !== deleteId));
        setDeleteId(null);
        toast.success('Registro excluido.');
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao excluir'));
  };

  const columns = useMemo<ColumnDef<ControleCartoesRow>[]>(
    () => [
      {
        accessorKey: 'data',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 font-medium"
            onClick={column.getToggleSortingHandler()}
          >
            Data <ArrowUpDown className="h-4 w-4" />
          </button>
        ),
        cell: ({ row }) => formatDateStringToBR(String(row.getValue('data') ?? '')),
      },
      ...(tab === 'credito'
        ? [
            {
              accessorKey: 'tipoCredito' as const,
              header: 'Tipo',
              cell: ({ row }: { row: { getValue: (k: string) => unknown } }) => {
                const v = row.getValue('tipoCredito') as string | undefined;
                return TIPOS_CREDITO.find((t) => t.id === v)?.label ?? v ?? '-';
              },
            } as ColumnDef<ControleCartoesRow>,
          ]
        : []),
      {
        accessorKey: 'valor',
        header: 'Valor',
        cell: ({ row }) => formatCurrency(row.getValue('valor')),
      },
      {
        accessorKey: 'prazo',
        header: 'Prazo',
        cell: ({ row }) => {
          const v = row.getValue('prazo') as number | undefined;
          return v != null ? `${v} d` : '-';
        },
      },
      {
        accessorKey: 'taxaPercent',
        header: 'Taxa %',
        cell: ({ row }) => {
          const v = row.getValue('taxaPercent') as number | undefined;
          return v != null ? `${v}%` : '-';
        },
      },
      {
        accessorKey: 'aReceber',
        header: 'A receber',
        cell: ({ row }) => formatCurrency(row.getValue('aReceber')),
      },
      {
        accessorKey: 'dataAReceber',
        header: 'Data a receber',
        cell: ({ row }) => formatDateStringToBR(String(row.getValue('dataAReceber') ?? '')),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Acoes</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              title="Editar"
              onClick={() => handleOpenDialog(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
              title="Excluir"
              onClick={() => setDeleteId(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    [tab]
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const showBandeiras = tab === 'credito' || tab === 'debito';
  /** Filtra bandeiras conforme config da maquininha selecionada. */
  const bandeirasList = useMemo(() => {
    if (tab === 'credito') {
      const aceitas = operadoraConfig?.bandeirasCredito ?? BANDEIRAS_CREDITO.map((b) => b.id);
      return BANDEIRAS_CREDITO.filter((b) => aceitas.includes(b.id));
    }
    if (tab === 'debito') {
      const aceitas = operadoraConfig?.bandeirasDebito ?? BANDEIRAS_DEBITO.map((b) => b.id);
      return BANDEIRAS_DEBITO.filter((b) => aceitas.includes(b.id));
    }
    return [];
  }, [tab, operadoraConfig]);

  /** Tipos de credito disponiveis para a maquininha selecionada. */
  const tiposCreditoDisponiveis = useMemo(() => {
    const tiposMaq = operadoraConfig?.tipos ?? TIPOS_DEFAULT;
    return TIPOS_CREDITO.filter((t) => tiposMaq.includes(t.id));
  }, [operadoraConfig]);

  /** Tabs habilitadas conforme config da maquininha (debito, pix, etc. podem ser desabilitadas). */
  const tabsDisponiveis = useMemo(() => {
    const tiposMaq = operadoraConfig?.tipos ?? TIPOS_DEFAULT;
    const temCredito = tiposMaq.some((t) =>
      ['a-vista', 'parcelado-vista', 'parcelado-prazo'].includes(t),
    );
    const temDebito = tiposMaq.includes('debito');
    const temPix = tiposMaq.includes('pix');
    return { credito: temCredito, debito: temDebito, pix: temPix };
  }, [operadoraConfig]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Controle Cartoes</h1>
          <p className="mt-1 text-sm text-slate-500">
            Credito/Debito, PIX, Voucher e outras funcoes. Prazo, taxa, bruto e liquido (a receber calculado pelo sistema).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={items.map((r) => ({
              data: formatDateStringToBR(r.data),
              valor: formatCurrency(r.valor),
              prazo: r.prazo != null ? `${r.prazo}` : '-',
              taxaPercent: r.taxaPercent != null ? `${r.taxaPercent}%` : '-',
              aReceber: formatCurrency(r.aReceber),
              dataAReceber: formatDateStringToBR(r.dataAReceber),
            }))}
            columns={[
              { key: 'data', label: 'Data' },
              { key: 'valor', label: 'Valor' },
              { key: 'prazo', label: 'Prazo' },
              { key: 'taxaPercent', label: 'Taxa %' },
              { key: 'aReceber', label: 'A receber' },
              { key: 'dataAReceber', label: 'Data a receber' },
            ]}
            filename={`controle-cartoes-${tab}`}
            title="Controle Cartoes"
          />
          <button
            type="button"
            onClick={() => handleOpenDialog()}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Novo
          </button>
        </div>
      </div>

      {/* Seletor de maquininha (operadora): aplica apenas em credito/debito/pix */}
      {(tab === 'credito' || tab === 'debito' || tab === 'pix') && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Maquininha</span>
          {todasMaquininhas
            .filter((m) => maquininhasHabilitadas.includes(m.id))
            .map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setOperadora(m.id)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  operadora === m.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                )}
              >
                {m.label}
              </button>
            ))}
          <button
            type="button"
            onClick={() => setHabilitarOpen(true)}
            className="ml-auto rounded-lg border border-dashed border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            + Gerenciar maquininhas
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-slate-200">
        {(
          [
            { id: 'credito' as TabCartao, label: 'Credito', visible: tabsDisponiveis.credito },
            { id: 'debito' as TabCartao, label: 'Debito', visible: tabsDisponiveis.debito },
            { id: 'pix' as TabCartao, label: 'PIX', visible: tabsDisponiveis.pix },
            { id: 'voucher' as TabCartao, label: 'Voucher', visible: true },
            { id: 'ifood' as TabCartao, label: 'iFood', visible: true },
            { id: 'outras' as TabCartao, label: 'Outras funcoes', visible: true },
          ] as { id: TabCartao; label: string; visible: boolean }[]
        )
          .filter((t) => t.visible)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTab(t.id);
                if (t.id === 'credito') {
                  const firstBand = (operadoraConfig?.bandeirasCredito ?? ['visa'])[0];
                  setBandeira((firstBand ?? 'visa') as BandeiraCartao);
                }
                if (t.id === 'debito') {
                  const firstBand = (operadoraConfig?.bandeirasDebito ?? ['electron'])[0];
                  setBandeira((firstBand ?? 'electron') as BandeiraCartao);
                }
              }}
              className={cn(
                'rounded-t-lg px-4 py-2 text-sm font-medium transition-colors',
                tab === t.id
                  ? 'bg-slate-100 text-slate-900 border border-slate-200 border-b-white -mb-px'
                  : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === 'credito' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-600">Tipo:</span>
          {tiposCreditoDisponiveis.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTipoCredito(t.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                tipoCredito === t.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {showBandeiras && (
        <div className="flex flex-wrap gap-2">
          {bandeirasList.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBandeira(b.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                bandeira === b.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
      {tab === 'voucher' && (
        <div className="flex flex-wrap gap-2">
          {BANDEIRAS_VOUCHER.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBandeiraVoucher(b.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                bandeiraVoucher === b.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'outras' && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
          <Link
            to="/financeiro/outras-funcoes/a-receber"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
          >
            <ExternalLink className="h-4 w-4" />
            Ver A receber (valores por prazo/bandeira)
          </Link>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : (
          <table className="w-full min-w-[700px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700"
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
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-slate-500">
                    Nenhum registro no periodo
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="whitespace-nowrap px-4 py-3 text-sm text-slate-600"
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
            <DialogTitle>{editingItem ? 'Editar Registro' : 'Novo Registro'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Altere os dados.' : 'Preencha data, valor e data a receber. O valor a receber e calculado pelo sistema (taxa/prazo).'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Data</label>
                <DateInput
                  value={formData.data}
                  onChange={(v) => setFormData({ ...formData, data: v })}
                  className={inputClass}
                  required
                />
              </div>
              {tab === 'credito' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Tipo credito</label>
                  <select
                    value={tipoCredito}
                    onChange={(e) => setTipoCredito(e.target.value as TipoCredito)}
                    className={inputClass}
                  >
                    {tiposCreditoDisponiveis.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Valor (R$) {tab === 'ifood' && <span className="text-xs text-slate-400">(bruto iFood)</span>}
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: sanitizeDecimal(e.target.value) })}
                  className={inputClass}
                  required
                />
              </div>
              {tab === 'credito' && tipoCredito === 'parcelado-prazo' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Numero de parcelas <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex.: 3"
                    value={formData.numeroParcelas}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numeroParcelas: sanitizeInteger(e.target.value),
                      })
                    }
                    className={inputClass}
                    required
                  />
                  <p className="text-xs text-slate-500">
                    O comerciante recebe N parcelas a cada 30 dias.
                  </p>
                </div>
              )}
              {tab === 'ifood' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Valor recebido na loja (R$)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={formData.valorLoja}
                    onChange={(e) =>
                      setFormData({ ...formData, valorLoja: sanitizeDecimal(e.target.value) })
                    }
                    className={inputClass}
                  />
                  <p className="text-xs text-slate-500">
                    Valor pago em dinheiro/maquina na entrega (nao soma no a receber).
                  </p>
                </div>
              )}
              {(tab === 'credito' || tab === 'debito' || tab === 'outras') && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Prazo (dias)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Ex.: 30"
                      value={formData.prazo}
                      onChange={(e) => setFormData({ ...formData, prazo: sanitizeInteger(e.target.value) })}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Taxa %</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Ex.: 2,5"
                      value={formData.taxaPercent}
                      onChange={(e) => setFormData({ ...formData, taxaPercent: sanitizeDecimal(e.target.value) })}
                      className={inputClass}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Data a receber</label>
                <DateInput
                  value={formData.dataAReceber}
                  onChange={(v) => setFormData({ ...formData, dataAReceber: v })}
                  className={inputClass}
                  required
                />
              </div>
            </div>
            </DialogBody>
            <DialogFooter>
              <button type="button" onClick={handleCloseDialog} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-100">
                Cancelar
              </button>
              <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700">
                {editingItem ? 'Salvar' : 'Adicionar'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este registro? Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Gerenciar maquininhas: lista padrao + customizadas, habilitar/desabilitar, criar/editar/excluir */}
      <Dialog
        open={habilitarOpen}
        onOpenChange={(o) => {
          setHabilitarOpen(o);
          if (!o) setEditingMaq(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingMaq ? (maquininhasCustom.some((m) => m.id === editingMaq.id) ? 'Editar maquininha' : 'Nova maquininha') : 'Gerenciar maquininhas'}</DialogTitle>
            <DialogDescription>
              {editingMaq
                ? 'Defina o nome, as formas de pagamento aceitas e as bandeiras.'
                : 'Habilite as maquininhas que voce usa ou crie uma nova com seus tipos e bandeiras.'}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            {editingMaq == null ? (
              <div className="mt-2 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Padrao do sistema
                    </span>
                  </div>
                  <div className="space-y-2">
                    {MAQUININHAS_PADRAO.map((m) => {
                      const habilitada = maquininhasHabilitadas.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                        >
                          <span className="text-sm text-slate-800">{m.label}</span>
                          <label className="flex cursor-pointer items-center gap-2">
                            <span className="text-xs text-slate-500">
                              {habilitada ? 'Habilitada' : 'Desabilitada'}
                            </span>
                            <input
                              type="checkbox"
                              checked={habilitada}
                              onChange={(e) => {
                                setMaquininhasHabilitadas((prev) => {
                                  const next = e.target.checked
                                    ? Array.from(new Set([...prev, m.id]))
                                    : prev.filter((x) => x !== m.id);
                                  if (next.length === 0) {
                                    toast.error('Mantenha pelo menos uma maquininha habilitada.');
                                    return prev;
                                  }
                                  if (!next.includes(operadora)) setOperadora(next[0]);
                                  persistirConfigMaquininhas(next, maquininhasCustom).catch(() => {});
                                  return next;
                                });
                              }}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Suas customizadas
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingMaq({
                          id: '',
                          label: '',
                          custom: true,
                          tipos: [...TIPOS_DEFAULT],
                          bandeirasCredito: BANDEIRAS_CREDITO.map((b) => b.id),
                          bandeirasDebito: BANDEIRAS_DEBITO.map((b) => b.id),
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nova maquininha
                    </button>
                  </div>
                  {maquininhasCustom.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">
                      Nenhuma maquininha customizada. Crie uma se a sua nao esta na lista padrao.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {maquininhasCustom.map((m) => {
                        const habilitada = maquininhasHabilitadas.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-slate-800">{m.label}</span>
                              <span className="text-xs text-slate-500">
                                {m.tipos.length} forma(s) | {m.bandeirasCredito.length} bandeira(s) credito
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={habilitada}
                                onChange={(e) => {
                                  setMaquininhasHabilitadas((prev) => {
                                    const next = e.target.checked
                                      ? Array.from(new Set([...prev, m.id]))
                                      : prev.filter((x) => x !== m.id);
                                    if (next.length === 0) {
                                      toast.error('Mantenha pelo menos uma maquininha habilitada.');
                                      return prev;
                                    }
                                    if (!next.includes(operadora)) setOperadora(next[0]);
                                    persistirConfigMaquininhas(next, maquininhasCustom).catch(() => {});
                                    return next;
                                  });
                                }}
                                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                title={habilitada ? 'Habilitada' : 'Habilitar'}
                              />
                              <button
                                type="button"
                                onClick={() => setEditingMaq({ ...m })}
                                className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                title="Editar"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const novos = maquininhasCustom.filter((x) => x.id !== m.id);
                                  const novasHabilitadas = maquininhasHabilitadas.filter(
                                    (x) => x !== m.id,
                                  );
                                  setMaquininhasCustom(novos);
                                  setMaquininhasHabilitadas(
                                    novasHabilitadas.length > 0
                                      ? novasHabilitadas
                                      : MAQUININHAS_PADRAO_HABILITADAS,
                                  );
                                  if (operadora === m.id) setOperadora('cielo');
                                  persistirConfigMaquininhas(
                                    novasHabilitadas.length > 0
                                      ? novasHabilitadas
                                      : MAQUININHAS_PADRAO_HABILITADAS,
                                    novos,
                                  ).catch(() => {});
                                  toast.success('Maquininha excluida.');
                                }}
                                className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                                title="Excluir"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <MaquininhaForm
                value={editingMaq}
                onChange={setEditingMaq}
                onCancel={() => setEditingMaq(null)}
                onSave={(maq) => {
                  // Cria ou atualiza
                  const ehNova = !maquininhasCustom.some((m) => m.id === maq.id);
                  if (!maq.label.trim()) {
                    toast.error('Informe o nome da maquininha.');
                    return;
                  }
                  if (maq.tipos.length === 0) {
                    toast.error('Selecione ao menos uma forma de pagamento.');
                    return;
                  }
                  const id = ehNova ? `mq-${slugifyMaq(maq.label)}-${Date.now().toString(36)}` : maq.id;
                  const final: MaquininhaConfig = { ...maq, id, custom: true };
                  const novos = ehNova
                    ? [...maquininhasCustom, final]
                    : maquininhasCustom.map((m) => (m.id === maq.id ? final : m));
                  setMaquininhasCustom(novos);
                  // Habilita automaticamente quando criada
                  let novasHabilitadas = maquininhasHabilitadas;
                  if (ehNova) {
                    novasHabilitadas = [...maquininhasHabilitadas, id];
                    setMaquininhasHabilitadas(novasHabilitadas);
                    setOperadora(id);
                  }
                  persistirConfigMaquininhas(novasHabilitadas, novos).catch(() => {});
                  setEditingMaq(null);
                  toast.success(ehNova ? 'Maquininha criada.' : 'Maquininha atualizada.');
                }}
              />
            )}
          </DialogBody>
          <DialogFooter>
            {editingMaq == null && (
              <button
                type="button"
                onClick={() => setHabilitarOpen(false)}
                className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Fechar
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Form de criar/editar maquininha customizada. */
interface MaquininhaFormProps {
  value: MaquininhaConfig;
  onChange: (m: MaquininhaConfig) => void;
  onSave: (m: MaquininhaConfig) => void;
  onCancel: () => void;
}

function MaquininhaForm({ value, onChange, onSave, onCancel }: MaquininhaFormProps) {
  const toggle = (lista: string[], id: string): string[] =>
    lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];

  return (
    <div className="mt-2 space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-slate-700">
          Nome da maquininha <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          placeholder="Ex.: Minha SumUp"
          className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700">
          Formas de pagamento aceitas <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TIPOS_PAGAMENTO_MAQUININHA.map((t) => {
            const ativo = value.tipos.includes(t.id);
            return (
              <label
                key={t.id}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                  ativo
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                )}
              >
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={() => onChange({ ...value, tipos: toggle(value.tipos, t.id) })}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                {t.label}
              </label>
            );
          })}
        </div>
      </div>

      {value.tipos.some((t) => ['a-vista', 'parcelado-vista', 'parcelado-prazo'].includes(t)) && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Bandeiras de credito aceitas</label>
          <div className="flex flex-wrap gap-2">
            {BANDEIRAS_CREDITO.map((b) => {
              const ativo = value.bandeirasCredito.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() =>
                    onChange({ ...value, bandeirasCredito: toggle(value.bandeirasCredito, b.id) })
                  }
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    ativo
                      ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {value.tipos.includes('debito') && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Bandeiras de debito aceitas</label>
          <div className="flex flex-wrap gap-2">
            {BANDEIRAS_DEBITO.map((b) => {
              const ativo = value.bandeirasDebito.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() =>
                    onChange({ ...value, bandeirasDebito: toggle(value.bandeirasDebito, b.id) })
                  }
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    ativo
                      ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => onSave(value)}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}
