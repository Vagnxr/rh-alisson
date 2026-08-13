import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
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
import { cn } from '@/lib/cn';
import { ExportButtons } from '@/components/ui/export-buttons';
import { formatDateStringToBR, formatDateToLocalYYYYMMDD } from '@/lib/date';
import { DateInput } from '@/components/ui/date-input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { parseValorFromInput, formatValorForInput } from '@/lib/formatValor';
import { MAQUININHAS_PADRAO_LIST, MAQUININHAS_PADRAO_HABILITADAS } from '@/lib/maquininhas';
import { INPUT_CLASS, PAGE_TITLE, PAGE_SUBTITLE, BTN_CANCEL } from '@/lib/uiClasses';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { resolverVoucherConfig, type ModulosHabilitados } from '@/types/taxas-prazos';
import { useTaxasPrazos } from '@/hooks/useTaxasPrazos';
import { useLatestRequest } from '@/hooks/useLatestRequest';
import {
  agruparPorBlocoCorte,
  calcularTotais,
  descontoDaLinha,
  temQtdCupons,
  type TotaisControleCartoes,
} from '@/lib/controle-cartoes-totais';
import { COR_IDS, CORES_MAQUININHA, corIdDe } from '@/lib/cores-maquininha';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function parseNum(v: string): number {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/**
 * Conteudo de uma celula de rodape (total ou subtotal), alinhada com a coluna.
 *
 * Percorre as colunas visiveis para que o rodape acompanhe automaticamente as
 * colunas que mudam por aba (Categoria, Qtd cupons, Valor loja).
 */
function celulaDeTotal(
  columnId: string,
  totais: TotaisControleCartoes,
  rotulo: string,
): React.ReactNode {
  switch (columnId) {
    case 'data':
      return rotulo;
    case 'valor':
      return formatCurrency(totais.valor);
    case 'valorLoja':
      return formatCurrency(totais.valorLoja);
    case 'desconto':
      return formatCurrency(totais.desconto);
    case 'aReceber':
      return formatCurrency(totais.aReceber);
    default:
      return null;
  }
}

/** Permite apenas digitos (inteiro). */
function sanitizeInteger(value: string): string {
  return value.replace(/\D/g, '');
}

function diaSemanaFromDate(dateStr: string): string {
  const d = new Date(dateStr);
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  return dias[d.getDay()];
}

const inputClass = INPUT_CLASS;

/**
 * As bandeiras NAO sao listadas aqui.
 *
 * A fonte unica e `bandeirasCadastradas` do JSON de Taxas e Prazos, lida por
 * `useTaxasPrazos()`. Antes esta tela mantinha listas proprias, que divergiam
 * das outras telas e ignoravam as bandeiras personalizadas do usuario.
 */

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
  /** Bandeiras de credito aceitas. `undefined` = todas as cadastradas. */
  bandeirasCredito?: string[];
  /** Bandeiras de debito aceitas. `undefined` = todas as cadastradas. */
  bandeirasDebito?: string[];
}

/** Tipos padrao quando cria/usa maquininha sem config explicita. */
const TIPOS_DEFAULT = ['a-vista', 'parcelado-vista', 'parcelado-prazo', 'debito', 'pix'];

/** Maquininhas (operadoras) padrao do sistema. Cliente pode habilitar mais ou criar novas.
 * O catalogo basico vem de @/lib/maquininhas (compartilhado com TaxasPrazosPage). */
const MAQUININHAS_PADRAO: MaquininhaConfig[] = MAQUININHAS_PADRAO_LIST.map((m) => ({
  id: m.id,
  label: m.label,
  tipos: TIPOS_DEFAULT,
  // Sem whitelist: maquininha padrao aceita toda bandeira cadastrada. Fixar as
  // bandeiras aqui impedia que uma bandeira nova aparecesse na tela.
  bandeirasCredito: undefined,
  bandeirasDebito: undefined,
}));

/** Slugify para gerar id a partir de label de maquininha custom. */
function slugifyMaq(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

type TabCartao = 'credito' | 'debito' | 'pix' | 'voucher' | 'ifood';
type TipoCredito = 'a-vista' | 'parcelado-vista' | 'parcelado-prazo';
const TIPOS_CREDITO: { id: TipoCredito; label: string }[] = [
  { id: 'a-vista', label: 'A vista' },
  { id: 'parcelado-vista', label: 'Parcelado a vista' },
  { id: 'parcelado-prazo', label: 'Parcelado a prazo' },
];

export function ControleCartoesPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const iniciarBusca = useLatestRequest();
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
  /** Categoria da bandeira voucher selecionada (ex.: Pluxee Alimentacao). '' = sem categoria. */
  const [categoriaVoucher, setCategoriaVoucher] = useState<string>('');
  /**
   * Bandeiras, modulos e cores vem do cadastro de Taxas e Prazos — fonte unica.
   * Inclui as bandeiras personalizadas de credito, debito e voucher.
   */
  const {
    bandeirasCredito: bandeirasCreditoAll,
    bandeirasDebito: bandeirasDebitoAll,
    bandeirasVoucher: bandeirasVoucherAll,
    modulos,
    cores,
    refetch: refetchTaxas,
  } = useTaxasPrazos();
  const [items, setItems] = useState<ControleCartoesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ControleCartoesRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [tipoCredito, setTipoCredito] = useState<TipoCredito>('a-vista');
  const [formData, setFormData] = useState({
    data: formatDateToLocalYYYYMMDD(new Date()),
    valor: '',
    prazo: '',
    taxaPercent: '',
    dataAReceber: formatDateToLocalYYYYMMDD(new Date()),
    numeroParcelas: '',
    valorLoja: '', // para iFood: valor recebido na loja (nao soma no a receber)
    qtdCupons: '', // para voucher com Por Venda por cupom (ex.: Ticket Rest/Flex)
  });

  /** Persiste habilitacao + customizadas + modulos + cores no backend (JSON em ControleCartaoTaxasPrazos.taxas). */
  const persistirConfigMaquininhas = useCallback(
    async (config: {
      habilitadas: string[];
      customs: MaquininhaConfig[];
      modulos: ModulosHabilitados;
      cores: Record<string, string>;
    }) => {
      try {
        const cur = await api.get<{ taxas?: Record<string, unknown> }>(
          'financeiro/controle-cartoes/taxas-prazos',
        );
        const taxasAtual = (cur.data?.taxas ?? {}) as Record<string, unknown>;
        const novo = {
          ...taxasAtual,
          maquininhasHabilitadas: config.habilitadas,
          maquininhasCustom: config.customs,
          modulosHabilitados: config.modulos,
          maquininhasCores: config.cores,
        };
        await api.put('financeiro/controle-cartoes/taxas-prazos', { taxas: novo });
      } catch (e) {
        console.warn('Falha ao persistir maquininhas', e);
      }
    },
    [],
  );

  /** Troca a cor de cabecalho de uma maquininha/modulo e persiste. */
  const handleSetCor = (id: string, corId: string) => {
    persistirConfigMaquininhas({
      habilitadas: maquininhasHabilitadas,
      customs: maquininhasCustom,
      modulos,
      cores: { ...cores, [id]: corId },
    })
      .then(() => refetchTaxas())
      .catch(() => {});
  };

  /** Habilita/desabilita os modulos Voucher e iFood e persiste. */
  const handleToggleModulo = (key: 'voucher' | 'ifood', enabled: boolean) => {
    persistirConfigMaquininhas({
      habilitadas: maquininhasHabilitadas,
      customs: maquininhasCustom,
      modulos: { ...modulos, [key]: enabled },
      cores,
    })
      .then(() => refetchTaxas())
      .catch(() => {});
  };

  /** Maquininhas habilitadas e customizadas — config propria desta tela. */
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
        if (Array.isArray(customs)) setMaquininhasCustom(customs);
        if (Array.isArray(habilitadas) && habilitadas.length > 0) {
          setMaquininhasHabilitadas(habilitadas);
          if (!habilitadas.includes(operadora)) setOperadora(habilitadas[0]);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Mantem a bandeira voucher selecionada valida quando o cadastro carrega. */
  useEffect(() => {
    if (bandeirasVoucherAll.length === 0) return;
    if (!bandeirasVoucherAll.some((v) => v.id === bandeiraVoucher)) {
      setBandeiraVoucher(bandeirasVoucherAll[0].id);
    }
  }, [bandeirasVoucherAll, bandeiraVoucher]);

  /** Config efetiva da bandeira voucher selecionada (com overrides da categoria). */
  const voucherSelecionado = useMemo(
    () => bandeirasVoucherAll.find((b) => b.id === bandeiraVoucher),
    [bandeirasVoucherAll, bandeiraVoucher],
  );
  const voucherCfgEfetiva = useMemo(
    () => resolverVoucherConfig(voucherSelecionado, categoriaVoucher || null),
    [voucherSelecionado, categoriaVoucher],
  );

  /** Se o modulo da aba atual for desabilitado, volta para credito. */
  useEffect(() => {
    if ((tab === 'voucher' && !modulos.voucher) || (tab === 'ifood' && !modulos.ifood)) {
      setTab('credito');
    }
  }, [tab, modulos]);

  const fetchList = useCallback(() => {
    // So a busca mais recente escreve no estado: trocar aba/bandeira/maquininha
    // deixa a anterior em voo, e a resposta atrasada zerava a tabela.
    const atual = iniciarBusca();
    setLoading(true);
    const params: Record<string, string> = {
      ...dateFilterToParams(dateFilter),
      tipo: tab,
    };
    if (tab === 'credito' || tab === 'debito') params.bandeira = bandeira;
    if (tab === 'credito') params.tipoCredito = tipoCredito;
    if (tab === 'voucher') {
      params.bandeira = bandeiraVoucher;
      if (categoriaVoucher) params.categoriaVoucher = categoriaVoucher;
    }
    // operadora aplica para credito/debito/pix (nao voucher nem ifood)
    if (tab === 'credito' || tab === 'debito' || tab === 'pix') params.operadora = operadora;
    api
      .get<ControleCartoesRow[]>('financeiro/controle-cartoes', { params })
      .then((res) => {
        if (!atual()) return;
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
      .catch((err) => {
        if (atual()) toast.error(err?.message ?? 'Erro ao carregar');
      })
      .finally(() => {
        if (atual()) setLoading(false);
      });
  }, [dateFilter, tab, bandeira, bandeiraVoucher, categoriaVoucher, tipoCredito, operadora, iniciarBusca]);

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
        qtdCupons?: number;
      };
      setFormData({
        data: (item.data ?? '').toString().split('T')[0]?.slice(0, 10) ?? '',
        valor: formatValorForInput(Number(item.valor ?? 0)),
        prazo: item.prazo != null ? String(item.prazo) : '',
        taxaPercent: taxaVal != null ? String(taxaVal) : '',
        dataAReceber: (item.dataAReceber ?? '').toString().split('T')[0]?.slice(0, 10) ?? '',
        numeroParcelas: itemAny.numeroParcelas != null ? String(itemAny.numeroParcelas) : '',
        valorLoja: itemAny.valorLoja != null ? formatValorForInput(Number(itemAny.valorLoja)) : '',
        qtdCupons: itemAny.qtdCupons != null ? String(itemAny.qtdCupons) : '',
      });
    } else {
      setEditingItem(null);
      setFormData({
        data: formatDateToLocalYYYYMMDD(new Date()),
        valor: '',
        prazo: '',
        taxaPercent: '',
        dataAReceber: formatDateToLocalYYYYMMDD(new Date()),
        numeroParcelas: '',
        valorLoja: '',
        qtdCupons: '',
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
    const valor = parseValorFromInput(String(formData.valor));
    const valorLoja = formData.valorLoja.trim()
      ? parseValorFromInput(String(formData.valorLoja))
      : undefined;
    const numeroParcelas =
      tab === 'credito' && tipoCredito === 'parcelado-prazo' && formData.numeroParcelas.trim()
        ? parseNum(formData.numeroParcelas)
        : undefined;
    // prazo, taxa e dataAReceber sao calculados no backend a partir da config de Taxas e Prazos
    // (bandeira+tipo). O form so envia o que o usuario realmente preenche.
    const qtdCupons =
      tab === 'voucher' && voucherCfgEfetiva?.usaQtdCupons && formData.qtdCupons.trim()
        ? parseInt(formData.qtdCupons, 10)
        : undefined;
    const body: Record<string, unknown> = {
      tipo: tab,
      ...((tab === 'credito' || tab === 'debito') && { bandeira }),
      ...(tab === 'voucher' && { bandeira: bandeiraVoucher }),
      ...(tab === 'voucher' && categoriaVoucher && { categoriaVoucher }),
      ...((tab === 'credito' || tab === 'debito' || tab === 'pix') && { operadora }),
      ...(tab === 'credito' && { tipoCredito }),
      ...(numeroParcelas != null && { numeroParcelas }),
      ...(qtdCupons != null && { qtdCupons }),
      data,
      valor,
      ...(valorLoja != null && { valorLoja }),
    };
    if (tab === 'credito' && tipoCredito === 'parcelado-prazo' && (numeroParcelas == null || numeroParcelas < 1)) {
      toast.error('Informe o numero de parcelas para credito parcelado a prazo.');
      return;
    }
    if (tab === 'voucher' && voucherCfgEfetiva?.usaQtdCupons && (qtdCupons == null || qtdCupons < 1)) {
      toast.error('Informe a quantidade de cupons.');
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

  /** Coluna de cupons so aparece quando ha lancamento usando cupom. */
  const mostrarQtdCupons = useMemo(() => temQtdCupons(items), [items]);

  /** Rotulo legivel da categoria voucher de uma linha, a partir do cadastro. */
  const labelCategoriaVoucher = useCallback(
    (row: ControleCartoesRow): string | null => {
      if (!row.categoriaVoucher) return null;
      const banda = bandeirasVoucherAll.find((b) => b.id === row.bandeira);
      const cat = banda?.voucher?.categorias?.find((c) => c.id === row.categoriaVoucher);
      return cat?.label ?? row.categoriaVoucher;
    },
    [bandeirasVoucherAll],
  );

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
      // Voucher: categoria da bandeira (Ticket Restaurante, Pluxee Gift, etc.).
      ...(tab === 'voucher'
        ? [
            {
              accessorKey: 'categoriaVoucher' as const,
              header: 'Categoria',
              cell: ({ row }: { row: { original: ControleCartoesRow } }) =>
                labelCategoriaVoucher(row.original) ?? '-',
            } as ColumnDef<ControleCartoesRow>,
          ]
        : []),
      {
        accessorKey: 'valor',
        // No iFood o bruto e explicitamente o valor do iFood — `Valor loja` e outra coisa.
        header: tab === 'ifood' ? 'Valor iFood' : 'Valor',
        cell: ({ row }) => formatCurrency(row.getValue('valor')),
      },
      ...(tab === 'ifood'
        ? [
            {
              accessorKey: 'valorLoja' as const,
              header: 'Valor loja',
              cell: ({ row }: { row: { original: ControleCartoesRow } }) =>
                row.original.valorLoja != null ? formatCurrency(row.original.valorLoja) : '-',
            } as ColumnDef<ControleCartoesRow>,
          ]
        : []),
      // Quantidade de cupons so aparece quando a bandeira cobra por cupom.
      ...(tab === 'voucher' && mostrarQtdCupons
        ? [
            {
              accessorKey: 'qtdCupons' as const,
              header: 'Qtd cupons',
              cell: ({ row }: { row: { original: ControleCartoesRow } }) =>
                row.original.qtdCupons != null ? String(row.original.qtdCupons) : '-',
            } as ColumnDef<ControleCartoesRow>,
          ]
        : []),
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
        id: 'desconto',
        header: 'Desconto',
        cell: ({ row }) => formatCurrency(descontoDaLinha(row.original)),
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
              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-muted-foreground"
              title="Editar"
              onClick={() => handleOpenDialog(row.original)}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-red-600"
              title="Excluir"
              onClick={() => setDeleteId(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tab, mostrarQtdCupons, bandeirasVoucherAll]
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  /** Linhas efetivamente exibidas (respeita ordenacao), base de todos os totais. */
  const linhasVisiveis = useMemo(
    () => table.getRowModel().rows.map((r) => r.original),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, sorting],
  );
  const totaisGerais = useMemo(() => calcularTotais(linhasVisiveis), [linhasVisiveis]);
  /**
   * Voucher e pago por bloco de fechamento: os subtotais respeitam cada bloco,
   * em vez de somar lancamentos de ciclos diferentes.
   */
  const blocosVoucher = useMemo(
    () => (tab === 'voucher' ? agruparPorBlocoCorte(linhasVisiveis) : []),
    [tab, linhasVisiveis],
  );

  const showBandeiras = tab === 'credito' || tab === 'debito';
  /**
   * Bandeiras da aba atual, filtradas pela whitelist da maquininha quando ela
   * existir. `undefined` (maquininhas padrao) = aceita todas as cadastradas,
   * para que bandeiras novas aparecam sem precisar reconfigurar a maquininha.
   */
  const bandeirasList = useMemo(() => {
    if (tab === 'credito') {
      const aceitas = operadoraConfig?.bandeirasCredito;
      return aceitas ? bandeirasCreditoAll.filter((b) => aceitas.includes(b.id)) : bandeirasCreditoAll;
    }
    if (tab === 'debito') {
      const aceitas = operadoraConfig?.bandeirasDebito;
      return aceitas ? bandeirasDebitoAll.filter((b) => aceitas.includes(b.id)) : bandeirasDebitoAll;
    }
    return [];
  }, [tab, operadoraConfig, bandeirasCreditoAll, bandeirasDebitoAll]);

  /** Mantem a bandeira selecionada valida quando a lista muda (aba, maquininha, cadastro). */
  useEffect(() => {
    if (!showBandeiras || bandeirasList.length === 0) return;
    if (!bandeirasList.some((b) => b.id === bandeira)) {
      setBandeira(bandeirasList[0].id as BandeiraCartao);
    }
  }, [bandeirasList, bandeira, showBandeiras]);

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
          <h1 className={PAGE_TITLE}>Controle Cartoes</h1>
          <p className={PAGE_SUBTITLE}>
            Credito/Debito, PIX, Voucher e iFood. Prazo, taxa, bruto e liquido (a receber calculado pelo sistema).
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={linhasVisiveis.map((r) => ({
              data: formatDateStringToBR(r.data),
              ...(tab === 'voucher' ? { categoriaVoucher: labelCategoriaVoucher(r) ?? '-' } : {}),
              valor: formatCurrency(r.valor),
              ...(tab === 'ifood'
                ? { valorLoja: r.valorLoja != null ? formatCurrency(r.valorLoja) : '-' }
                : {}),
              ...(tab === 'voucher' && mostrarQtdCupons
                ? { qtdCupons: r.qtdCupons != null ? String(r.qtdCupons) : '-' }
                : {}),
              prazo: r.prazo != null ? `${r.prazo}` : '-',
              taxaPercent: r.taxaPercent != null ? `${r.taxaPercent}%` : '-',
              desconto: formatCurrency(descontoDaLinha(r)),
              aReceber: formatCurrency(r.aReceber),
              dataAReceber: formatDateStringToBR(r.dataAReceber),
            }))}
            columns={[
              { key: 'data', label: 'Data' },
              ...(tab === 'voucher' ? [{ key: 'categoriaVoucher', label: 'Categoria' }] : []),
              { key: 'valor', label: tab === 'ifood' ? 'Valor iFood' : 'Valor' },
              ...(tab === 'ifood' ? [{ key: 'valorLoja', label: 'Valor loja' }] : []),
              ...(tab === 'voucher' && mostrarQtdCupons
                ? [{ key: 'qtdCupons', label: 'Qtd cupons' }]
                : []),
              { key: 'prazo', label: 'Prazo' },
              { key: 'taxaPercent', label: 'Taxa %' },
              { key: 'desconto', label: 'Desconto' },
              { key: 'aReceber', label: 'A receber' },
              { key: 'dataAReceber', label: 'Data a receber' },
            ]}
            footer={{
              data: 'TOTAL',
              valor: formatCurrency(totaisGerais.valor),
              ...(tab === 'ifood' ? { valorLoja: formatCurrency(totaisGerais.valorLoja) } : {}),
              desconto: formatCurrency(totaisGerais.desconto),
              aReceber: formatCurrency(totaisGerais.aReceber),
            }}
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
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Maquininha</span>
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
                    : 'bg-muted text-foreground hover:bg-accent',
                )}
              >
                {m.label}
              </button>
            ))}
          <button
            type="button"
            onClick={() => setHabilitarOpen(true)}
            className="ml-auto rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40"
          >
            + Gerenciar maquininhas
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-1 border-b border-border">
        {(
          [
            { id: 'credito' as TabCartao, label: 'Credito', visible: tabsDisponiveis.credito },
            { id: 'debito' as TabCartao, label: 'Debito', visible: tabsDisponiveis.debito },
            { id: 'pix' as TabCartao, label: 'PIX', visible: tabsDisponiveis.pix },
            { id: 'voucher' as TabCartao, label: 'Voucher', visible: modulos.voucher },
            { id: 'ifood' as TabCartao, label: 'iFood', visible: modulos.ifood },
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
                  ? 'bg-muted text-foreground border border-border border-b-background -mb-px'
                  : 'text-muted-foreground hover:bg-muted/40',
              )}
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === 'credito' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Tipo:</span>
          {tiposCreditoDisponiveis.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTipoCredito(t.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                tipoCredito === t.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-muted text-foreground hover:bg-accent'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      {showBandeiras && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">Cartões:</span>
          {bandeirasList.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => setBandeira(b.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                bandeira === b.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-muted text-foreground hover:bg-accent'
              )}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}
      {tab === 'voucher' && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Vouchers:</span>
            {bandeirasVoucherAll.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  setBandeiraVoucher(b.id);
                  const cats = b.voucher?.categorias ?? [];
                  setCategoriaVoucher(cats.length > 0 ? cats[0].id : '');
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  bandeiraVoucher === b.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-muted text-foreground hover:bg-accent',
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
          {(voucherSelecionado?.voucher?.categorias?.length ?? 0) > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Categoria:</span>
              {voucherSelecionado!.voucher!.categorias!.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoriaVoucher(c.id)}
                  className={cn(
                    'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                    categoriaVoucher === c.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground ring-1 ring-border hover:bg-muted/40',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
          <table className="w-full min-w-[700px]">
            <thead className="border-b border-border bg-muted/40">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            {table.getRowModel().rows.length === 0 ? (
              <tbody>
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    Nenhum registro no periodo
                  </td>
                </tr>
              </tbody>
            ) : tab === 'voucher' ? (
              // Voucher: um tbody por bloco de corte, cada um com seu subtotal.
              blocosVoucher.map((bloco) => {
                const linhasDoBloco = table
                  .getRowModel()
                  .rows.filter((r) => (r.original.dataAReceber ?? '').slice(0, 10) === bloco.chave);
                return (
                  <tbody key={bloco.chave} className="divide-y divide-border border-b border-border">
                    <tr className="bg-muted/60">
                      <td
                        colSpan={columns.length}
                        className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        Bloco de corte — recebimento em {formatDateStringToBR(bloco.chave)} (
                        {bloco.subtotal.quantidade} lancamento
                        {bloco.subtotal.quantidade > 1 ? 's' : ''})
                      </td>
                    </tr>
                    {linhasDoBloco.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/40">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="bg-muted/30 text-sm font-medium text-foreground">
                      {table.getVisibleLeafColumns().map((col) => (
                        <td key={col.id} className="whitespace-nowrap px-4 py-2">
                          {celulaDeTotal(col.id, bloco.subtotal, 'Subtotal')}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                );
              })
            ) : (
              <tbody className="divide-y divide-border">
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/40">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="whitespace-nowrap px-4 py-3 text-sm text-muted-foreground">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
            {table.getRowModel().rows.length > 0 && (
              <tfoot className="border-t-2 border-border bg-muted/40">
                <tr className="text-sm font-bold text-foreground">
                  {table.getVisibleLeafColumns().map((col) => (
                    <td key={col.id} className="whitespace-nowrap px-4 py-3">
                      {celulaDeTotal(col.id, totaisGerais, 'Total')}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Registro' : 'Novo Registro'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Altere os dados.' : 'Preencha data e valor. O valor a receber e calculado pelo sistema (taxa/prazo).'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Data</label>
                <DateInput
                  value={formData.data}
                  onChange={(v) => setFormData({ ...formData, data: v })}
                  className={inputClass}
                  required
                />
              </div>
              {tab === 'credito' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Tipo credito</label>
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
                <label className="text-sm font-medium text-foreground">
                  Valor (R$) {tab === 'ifood' && <span className="text-xs text-muted-foreground">(bruto iFood)</span>}
                </label>
                <CurrencyInput
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(v) => setFormData({ ...formData, valor: v })}
                  className={inputClass}
                  required
                />
              </div>
              {tab === 'credito' && tipoCredito === 'parcelado-prazo' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
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
                  <p className="text-xs text-muted-foreground">
                    O comerciante recebe N parcelas a cada 30 dias.
                  </p>
                </div>
              )}
              {tab === 'voucher' && voucherCfgEfetiva?.usaQtdCupons && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Qtd Cupons <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex.: 10"
                    value={formData.qtdCupons}
                    onChange={(e) =>
                      setFormData({ ...formData, qtdCupons: sanitizeInteger(e.target.value) })
                    }
                    className={inputClass}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {voucherCfgEfetiva.porVenda != null
                      ? `Desconto de ${formatCurrency(voucherCfgEfetiva.porVenda)} por cupom de venda.`
                      : 'Quantidade de cupons da venda.'}
                  </p>
                </div>
              )}
              {tab === 'ifood' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Valor recebido na loja (R$)
                  </label>
                  <CurrencyInput
                    placeholder="0,00"
                    value={formData.valorLoja}
                    onChange={(v) => setFormData({ ...formData, valorLoja: v })}
                    className={inputClass}
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor pago em dinheiro/maquina na entrega (nao soma no a receber).
                  </p>
                </div>
              )}
              {/* Prazo, taxa e data a receber sao calculados automaticamente pelo backend
                  a partir da configuracao de Taxas e Prazos (bandeira + tipo).
                  Para alterar, vá em "Taxas e prazos". */}
              <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Taxa, prazo e data a receber serao calculados automaticamente
                conforme a configuracao em <strong>Taxas e prazos</strong>.
              </p>
            </div>
            </DialogBody>
            <DialogFooter>
              <button type="button" onClick={handleCloseDialog} className={BTN_CANCEL}>
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
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Padrao do sistema
                    </span>
                  </div>
                  <div className="space-y-2">
                    {MAQUININHAS_PADRAO.map((m) => {
                      const habilitada = maquininhasHabilitadas.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                        >
                          <span className="text-sm text-foreground">{m.label}</span>
                          <div className="flex items-center gap-2">
                          <CorSelect value={corIdDe(cores, m.id)} onChange={(c) => handleSetCor(m.id, c)} />
                          <label className="flex cursor-pointer items-center gap-2">
                            <span className="text-xs text-muted-foreground">
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
                                  persistirConfigMaquininhas({
                                    habilitadas: next,
                                    customs: maquininhasCustom,
                                    modulos,
                                    cores,
                                  }).catch(() => {});
                                  return next;
                                });
                              }}
                              className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
                            />
                          </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
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
                          bandeirasCredito: bandeirasCreditoAll.map((b) => b.id),
                          bandeirasDebito: bandeirasDebitoAll.map((b) => b.id),
                        })
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Nova maquininha
                    </button>
                  </div>
                  {maquininhasCustom.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-4 text-center text-xs text-muted-foreground">
                      Nenhuma maquininha customizada. Crie uma se a sua nao esta na lista padrao.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {maquininhasCustom.map((m) => {
                        const habilitada = maquininhasHabilitadas.includes(m.id);
                        return (
                          <div
                            key={m.id}
                            className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
                          >
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-foreground">{m.label}</span>
                              <span className="text-xs text-muted-foreground">
                                {m.tipos.length} forma(s) |{' '}
                                {m.bandeirasCredito
                                  ? `${m.bandeirasCredito.length} bandeira(s) credito`
                                  : 'todas as bandeiras'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CorSelect value={corIdDe(cores, m.id)} onChange={(c) => handleSetCor(m.id, c)} />
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
                                    persistirConfigMaquininhas({
                                    habilitadas: next,
                                    customs: maquininhasCustom,
                                    modulos,
                                    cores,
                                  }).catch(() => {});
                                    return next;
                                  });
                                }}
                                className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
                                title={habilitada ? 'Habilitada' : 'Habilitar'}
                              />
                              <button
                                type="button"
                                onClick={() => setEditingMaq({ ...m })}
                                className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
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
                                  persistirConfigMaquininhas({
                                    habilitadas:
                                      novasHabilitadas.length > 0
                                        ? novasHabilitadas
                                        : MAQUININHAS_PADRAO_HABILITADAS,
                                    customs: novos,
                                    modulos,
                                    cores,
                                  }).catch(() => {});
                                  toast.success('Maquininha excluida.');
                                }}
                                className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-red-600"
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

                {/* Voucher e iFood: modulos habilitaveis (independentes de maquininha) */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Outros modulos
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(
                      [
                        { key: 'voucher' as const, label: 'Voucher (Alelo, Ticket, VR...)' },
                        { key: 'ifood' as const, label: 'iFood' },
                      ]
                    ).map((mod) => {
                      const habilitado = modulos[mod.key];
                      return (
                        <div
                          key={mod.key}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                        >
                          <span className="text-sm text-foreground">{mod.label}</span>
                          <div className="flex items-center gap-2">
                            <CorSelect
                              value={corIdDe(cores, mod.key)}
                              onChange={(c) => handleSetCor(mod.key, c)}
                            />
                            <label className="flex cursor-pointer items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {habilitado ? 'Habilitado' : 'Desabilitado'}
                              </span>
                              <input
                                type="checkbox"
                                checked={habilitado}
                                onChange={(e) => handleToggleModulo(mod.key, e.target.checked)}
                                className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Desabilitar esconde as abas aqui, a secao em Taxas e Prazos e os cards em A Receber.
                  </p>
                </div>
              </div>
            ) : (
              <MaquininhaForm
                value={editingMaq}
                onChange={setEditingMaq}
                bandeirasCredito={bandeirasCreditoAll}
                bandeirasDebito={bandeirasDebitoAll}
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
                  persistirConfigMaquininhas({
                    habilitadas: novasHabilitadas,
                    customs: novos,
                    modulos,
                    cores,
                  }).catch(() => {});
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

/** Seletor compacto de cor de cabecalho (paleta fixa de cores-maquininha.ts). */
function CorSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-32" title="Cor do cabecalho nos cards">
        <SelectValue placeholder="Cor" />
      </SelectTrigger>
      <SelectContent>
        {COR_IDS.map((c) => (
          <SelectItem key={c} value={c}>
            <span className="inline-flex items-center gap-2">
              <span className={cn('h-3 w-3 rounded-full', CORES_MAQUININHA[c].dot)} />
              {CORES_MAQUININHA[c].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Form de criar/editar maquininha customizada. */
interface MaquininhaFormProps {
  value: MaquininhaConfig;
  onChange: (m: MaquininhaConfig) => void;
  /** Bandeiras de credito disponiveis (defaults + cadastradas em Taxas e Prazos). */
  bandeirasCredito: { id: string; label: string }[];
  /** Bandeiras de debito disponiveis. */
  bandeirasDebito: { id: string; label: string }[];
  onSave: (m: MaquininhaConfig) => void;
  onCancel: () => void;
}

function MaquininhaForm({
  value,
  onChange,
  bandeirasCredito,
  bandeirasDebito,
  onSave,
  onCancel,
}: MaquininhaFormProps) {
  const toggle = (lista: string[], id: string): string[] =>
    lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id];

  return (
    <div className="mt-2 space-y-5">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Nome da maquininha <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          placeholder="Ex.: Minha SumUp"
          className="flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">
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
                    : 'border-border bg-card text-foreground hover:bg-muted/40',
                )}
              >
                <input
                  type="checkbox"
                  checked={ativo}
                  onChange={() => onChange({ ...value, tipos: toggle(value.tipos, t.id) })}
                  className="h-4 w-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
                />
                {t.label}
              </label>
            );
          })}
        </div>
      </div>

      {value.tipos.some((t) => ['a-vista', 'parcelado-vista', 'parcelado-prazo'].includes(t)) && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Bandeiras de credito aceitas</label>
          <div className="flex flex-wrap gap-2">
            {bandeirasCredito.map((b) => {
              // Sem whitelist (undefined) = todas aceitas. Ao desmarcar a
              // primeira, materializa a lista atual menos a bandeira clicada.
              const atuais = value.bandeirasCredito ?? bandeirasCredito.map((x) => x.id);
              const ativo = atuais.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onChange({ ...value, bandeirasCredito: toggle(atuais, b.id) })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    ativo
                      ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/40',
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
          <label className="text-sm font-medium text-foreground">Bandeiras de debito aceitas</label>
          <div className="flex flex-wrap gap-2">
            {bandeirasDebito.map((b) => {
              const atuais = value.bandeirasDebito ?? bandeirasDebito.map((x) => x.id);
              const ativo = atuais.includes(b.id);
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onChange({ ...value, bandeirasDebito: toggle(atuais, b.id) })}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    ativo
                      ? 'border-emerald-500 bg-emerald-100 text-emerald-800'
                      : 'border-border bg-card text-muted-foreground hover:bg-muted/40',
                  )}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={onCancel}
          className={BTN_CANCEL}
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
