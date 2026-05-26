import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Save, Plus, Trash2, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { MAQUININHAS_PADRAO_LIST, MAQUININHAS_PADRAO_IDS } from '@/lib/maquininhas';
import { cn } from '@/lib/cn';
import { PAGE_TITLE, PAGE_SUBTITLE, BTN_CANCEL } from '@/lib/uiClasses';

/** Tipo de bandeira (credito, debito, voucher). Voucher tambem precisa de cadastro de bandeira. */
type TipoBandeira = 'credito' | 'debito' | 'voucher';

/** Categoria de credito (taxa muda conforme categoria). */
type CategoriaCredito = 'a-vista' | 'parcelado-vista' | 'parcelado-prazo';

/** Sub-aba dentro de cada maquininha. PIX e IFOOD nao usam bandeira. */
type TipoMaq = 'credito' | 'debito' | 'pix' | 'voucher' | 'ifood';

/** Cadastro de bandeira (lista usada no lancamento em Controle de Cartoes). */
interface BandeiraCadastro {
  id: string;
  label: string;
  tipo: TipoBandeira;
}

/** Maquininha custom criada pelo usuario em Controle de Cartoes. */
interface MaquininhaCustom {
  id: string;
  label: string;
  custom?: boolean;
  tipos?: string[];
  bandeirasCredito?: string[];
  bandeirasDebito?: string[];
}

/**
 * Configuracao de taxa+prazo POR MAQUININHA, com discriminacao por:
 * - tipo (credito/debito/pix/voucher/ifood)
 * - categoria (so para credito: a-vista|parcelado-vista|parcelado-prazo)
 * - bandeira (para credito/debito/voucher; null para pix/ifood)
 */
interface TaxaPrazoMaquininha {
  operadora: string;
  tipo: TipoMaq;
  categoria?: CategoriaCredito;
  bandeira?: string | null;
  taxa: number;
  prazo: number;
}

/** JSON salvo em ControleCartaoTaxasPrazos.taxas. */
interface TaxasJsonShape {
  bandeirasCadastradas?: BandeiraCadastro[];
  maquininhasCustom?: MaquininhaCustom[];
  maquininhasHabilitadas?: string[];
  taxasPorMaquininha?: TaxaPrazoMaquininha[];
  /** @deprecated Formato antigo apenas com credito/debito; ainda lido para retrocompat. */
  taxas?: Array<{ bandeira: string; tipo: string; taxa: number; prazo?: number }>;
  [key: string]: unknown;
}

interface TaxasPrazosPayload {
  taxas?: TaxasJsonShape | null;
  prazos?: number[] | null;
}

/** Seed inicial de bandeiras (credito, debito incluindo PIX, voucher). */
const DEFAULT_BANDEIRAS: BandeiraCadastro[] = [
  { id: 'visa', label: 'Visa', tipo: 'credito' },
  { id: 'mastercard', label: 'Mastercard', tipo: 'credito' },
  { id: 'elo-credito', label: 'Elo Credito', tipo: 'credito' },
  { id: 'amex', label: 'Amex', tipo: 'credito' },
  { id: 'hipercard', label: 'Hipercard', tipo: 'credito' },
  { id: 'electron', label: 'Electron', tipo: 'debito' },
  { id: 'elo-debito', label: 'Elo Debito', tipo: 'debito' },
  { id: 'maestro', label: 'Maestro', tipo: 'debito' },
  { id: 'pix', label: 'PIX', tipo: 'debito' },
  { id: 'alelo', label: 'Alelo', tipo: 'voucher' },
  { id: 'ben', label: 'Ben Visa Vale', tipo: 'voucher' },
  { id: 'sodexo', label: 'Sodexo', tipo: 'voucher' },
  { id: 'ticket', label: 'Ticket', tipo: 'voucher' },
  { id: 'vr', label: 'VR', tipo: 'voucher' },
  { id: 'verocard', label: 'Verocard', tipo: 'voucher' },
  { id: 'pluxee', label: 'Pluxee', tipo: 'voucher' },
];

const CATEGORIAS_CREDITO: { id: CategoriaCredito; label: string }[] = [
  { id: 'a-vista', label: 'A vista' },
  { id: 'parcelado-vista', label: 'Parcelado a vista' },
  { id: 'parcelado-prazo', label: 'Parcelado a prazo' },
];

const TIPOS_MAQ: { id: TipoMaq; label: string }[] = [
  { id: 'credito', label: 'Credito' },
  { id: 'debito', label: 'Debito' },
  { id: 'pix', label: 'PIX' },
  { id: 'voucher', label: 'Voucher' },
  { id: 'ifood', label: 'iFood' },
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Chave composta: operadora|tipo|categoria|bandeira. */
function keyOf(operadora: string, tipo: TipoMaq, categoria: CategoriaCredito | '', bandeira: string): string {
  return `${operadora}|${tipo}|${categoria}|${bandeira}`;
}

export function TaxasPrazosPage() {
  const [payload, setPayload] = useState<TaxasJsonShape>({});
  const [bandeiras, setBandeiras] = useState<BandeiraCadastro[]>(DEFAULT_BANDEIRAS);
  const [maquininhas, setMaquininhas] = useState<{ id: string; label: string; custom?: boolean }[]>([]);
  /** Map (operadora|tipo|categoria|bandeira) -> { taxa, prazo }. */
  const [configs, setConfigs] = useState<Record<string, { taxa: number; prazo: number }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /** Aba ativa: maquininha + tipo + categoria (para credito). */
  const [maqAtiva, setMaqAtiva] = useState<string>('');
  const [tipoAtivo, setTipoAtivo] = useState<TipoMaq>('credito');
  const [catAtiva, setCatAtiva] = useState<CategoriaCredito>('a-vista');

  // Dialog de cadastro/edicao de bandeira
  const [bandeiraEditando, setBandeiraEditando] = useState<BandeiraCadastro | null>(null);
  const [novaBandeiraOpen, setNovaBandeiraOpen] = useState(false);
  const [bandeiraForm, setBandeiraForm] = useState<{ label: string; tipo: TipoBandeira }>({
    label: '',
    tipo: 'credito',
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    api
      .get<TaxasPrazosPayload>('financeiro/controle-cartoes/taxas-prazos')
      .then((res) => {
        const wrapped: TaxasPrazosPayload = res.data && typeof res.data === 'object' ? res.data : {};
        const taxasJson: TaxasJsonShape =
          wrapped.taxas && typeof wrapped.taxas === 'object' && !Array.isArray(wrapped.taxas)
            ? (wrapped.taxas as TaxasJsonShape)
            : {};
        setPayload(taxasJson);

        // Bandeiras: mescla bandeiras salvas com as defaults novas (PIX, voucher) para nao
        // perder seed em tenants antigos que ja tinham bandeirasCadastradas sem voucher/PIX.
        const salvas = Array.isArray(taxasJson.bandeirasCadastradas) ? taxasJson.bandeirasCadastradas : [];
        const bandsBase = salvas.length > 0 ? salvas : DEFAULT_BANDEIRAS;
        const idsSalvos = new Set(bandsBase.map((b) => b.id));
        const novasDefaults = DEFAULT_BANDEIRAS.filter((b) => !idsSalvos.has(b.id));
        const bands = [...bandsBase, ...novasDefaults];
        setBandeiras(bands);

        // Maquininhas: defaults + customs
        const customs = Array.isArray(taxasJson.maquininhasCustom) ? taxasJson.maquininhasCustom : [];
        const customsClean = customs
          .filter((m) => m && m.id && m.label)
          .filter((m) => !MAQUININHAS_PADRAO_IDS.has(m.id))
          .map((m) => ({ id: m.id, label: m.label, custom: true }));
        const lista = [...MAQUININHAS_PADRAO_LIST.map((m) => ({ ...m, custom: false })), ...customsClean];
        setMaquininhas(lista);

        // Aba ativa default = primeira maquininha
        if (lista.length > 0) setMaqAtiva(lista[0].id);

        // Configs: monta map a partir do JSON. Suporta formato antigo (taxas[] credito/debito por bandeira)
        // expandindo cada bandeira para todas as 3 categorias de credito.
        const cfgs: Record<string, { taxa: number; prazo: number }> = {};
        const taxasArr = Array.isArray(taxasJson.taxasPorMaquininha) ? taxasJson.taxasPorMaquininha : [];
        for (const t of taxasArr) {
          const cat = (t.categoria ?? '') as CategoriaCredito | '';
          const band = t.bandeira ?? '';
          cfgs[keyOf(t.operadora, t.tipo, cat, band)] = {
            taxa: Number(t.taxa) || 0,
            prazo: Number(t.prazo) || 0,
          };
        }
        setConfigs(cfgs);
      })
      .catch(() => {
        setBandeiras(DEFAULT_BANDEIRAS);
        const lista = MAQUININHAS_PADRAO_LIST.map((m) => ({ ...m, custom: false }));
        setMaquininhas(lista);
        if (lista.length > 0) setMaqAtiva(lista[0].id);
        setConfigs({});
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const bandeirasCredito = useMemo(() => bandeiras.filter((b) => b.tipo === 'credito'), [bandeiras]);
  const bandeirasDebito = useMemo(() => bandeiras.filter((b) => b.tipo === 'debito'), [bandeiras]);
  const bandeirasVoucher = useMemo(() => bandeiras.filter((b) => b.tipo === 'voucher'), [bandeiras]);

  const getConfig = (operadora: string, tipo: TipoMaq, categoria: CategoriaCredito | '', bandeira: string) => {
    return configs[keyOf(operadora, tipo, categoria, bandeira)] ?? { taxa: 0, prazo: 0 };
  };

  const updateConfig = (
    operadora: string,
    tipo: TipoMaq,
    categoria: CategoriaCredito | '',
    bandeira: string,
    field: 'taxa' | 'prazo',
    value: number,
  ) => {
    const k = keyOf(operadora, tipo, categoria, bandeira);
    setConfigs((prev) => ({
      ...prev,
      [k]: { ...(prev[k] ?? { taxa: 0, prazo: 0 }), [field]: value },
    }));
  };

  /** Serializa o estado em formato persistivel. */
  const buildJson = (bandeirasArg?: BandeiraCadastro[]): { taxasJson: TaxasJsonShape; prazos: number[] } => {
    const bandsToSave = bandeirasArg ?? bandeiras;
    const taxasPorMaquininha: TaxaPrazoMaquininha[] = [];
    for (const m of maquininhas) {
      // Credito: por categoria e por bandeira credito
      for (const cat of CATEGORIAS_CREDITO) {
        for (const b of bandsToSave.filter((x) => x.tipo === 'credito')) {
          const c = configs[keyOf(m.id, 'credito', cat.id, b.id)] ?? { taxa: 0, prazo: 0 };
          taxasPorMaquininha.push({
            operadora: m.id,
            tipo: 'credito',
            categoria: cat.id,
            bandeira: b.id,
            taxa: c.taxa,
            prazo: c.prazo,
          });
        }
      }
      // Debito: por bandeira debito
      for (const b of bandsToSave.filter((x) => x.tipo === 'debito')) {
        const c = configs[keyOf(m.id, 'debito', '', b.id)] ?? { taxa: 0, prazo: 0 };
        taxasPorMaquininha.push({
          operadora: m.id,
          tipo: 'debito',
          bandeira: b.id,
          taxa: c.taxa,
          prazo: c.prazo,
        });
      }
      // PIX: linha unica
      {
        const c = configs[keyOf(m.id, 'pix', '', '')] ?? { taxa: 0, prazo: 0 };
        taxasPorMaquininha.push({ operadora: m.id, tipo: 'pix', taxa: c.taxa, prazo: c.prazo });
      }
      // Voucher: por bandeira voucher
      for (const b of bandsToSave.filter((x) => x.tipo === 'voucher')) {
        const c = configs[keyOf(m.id, 'voucher', '', b.id)] ?? { taxa: 0, prazo: 0 };
        taxasPorMaquininha.push({
          operadora: m.id,
          tipo: 'voucher',
          bandeira: b.id,
          taxa: c.taxa,
          prazo: c.prazo,
        });
      }
      // iFood: linha unica
      {
        const c = configs[keyOf(m.id, 'ifood', '', '')] ?? { taxa: 0, prazo: 0 };
        taxasPorMaquininha.push({ operadora: m.id, tipo: 'ifood', taxa: c.taxa, prazo: c.prazo });
      }
    }
    const prazos = [...new Set(taxasPorMaquininha.map((t) => t.prazo))].sort((a, b) => a - b);
    const taxasJson: TaxasJsonShape = {
      ...payload,
      bandeirasCadastradas: bandsToSave,
      taxasPorMaquininha,
    };
    return { taxasJson, prazos };
  };

  /** Persiste no backend o estado atual. Se receber `bandeirasArg`, salva com aquela lista. */
  const persist = async (bandeirasArg?: BandeiraCadastro[], silent = false) => {
    const { taxasJson, prazos } = buildJson(bandeirasArg);
    await api.put('financeiro/controle-cartoes/taxas-prazos', { taxas: taxasJson, prazos });
    setPayload(taxasJson);
    if (!silent) toast.success('Salvo.');
  };

  const handleOpenNovaBandeira = () => {
    setBandeiraEditando(null);
    setBandeiraForm({ label: '', tipo: 'credito' });
    setNovaBandeiraOpen(true);
  };

  const handleOpenEditarBandeira = (b: BandeiraCadastro) => {
    setBandeiraEditando(b);
    setBandeiraForm({ label: b.label, tipo: b.tipo });
    setNovaBandeiraOpen(true);
  };

  /** Salva bandeira E persiste imediatamente (fix bug: bandeira nova nao some ao trocar de tela). */
  const handleSalvarBandeira = async () => {
    const labelTrim = bandeiraForm.label.trim();
    if (!labelTrim) {
      toast.error('Informe o nome da bandeira.');
      return;
    }
    const id = bandeiraEditando ? bandeiraEditando.id : slugify(labelTrim);
    if (!id) {
      toast.error('Nome invalido para gerar identificador.');
      return;
    }
    if (bandeiras.some((b) => b.id === id && b.id !== bandeiraEditando?.id)) {
      toast.error('Ja existe uma bandeira com esse nome.');
      return;
    }
    const novaLista = bandeiraEditando
      ? bandeiras.map((b) => (b.id === bandeiraEditando.id ? { ...b, label: labelTrim, tipo: bandeiraForm.tipo } : b))
      : [...bandeiras, { id, label: labelTrim, tipo: bandeiraForm.tipo }];
    setBandeiras(novaLista);
    setNovaBandeiraOpen(false);
    setBandeiraEditando(null);
    try {
      await persist(novaLista, true);
      toast.success(bandeiraEditando ? 'Bandeira atualizada.' : 'Bandeira cadastrada.');
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Erro ao salvar bandeira.');
    }
  };

  const handleRemoverBandeira = async (id: string) => {
    if (!window.confirm('Remover essa bandeira?')) return;
    const novaLista = bandeiras.filter((b) => b.id !== id);
    setBandeiras(novaLista);
    try {
      await persist(novaLista, true);
      toast.success('Bandeira removida.');
    } catch (e) {
      toast.error((e as Error)?.message ?? 'Erro ao remover bandeira.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persist();
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  /** Renderiza a tabela de taxas/prazos da combinacao (maqAtiva, tipoAtivo, catAtiva). */
  const renderTabela = () => {
    let linhas: { bandeiraId: string; bandeiraLabel: string }[] = [];
    let categoriaParam: CategoriaCredito | '' = '';

    if (tipoAtivo === 'credito') {
      linhas = bandeirasCredito.map((b) => ({ bandeiraId: b.id, bandeiraLabel: b.label }));
      categoriaParam = catAtiva;
    } else if (tipoAtivo === 'debito') {
      linhas = bandeirasDebito.map((b) => ({ bandeiraId: b.id, bandeiraLabel: b.label }));
    } else if (tipoAtivo === 'voucher') {
      linhas = bandeirasVoucher.map((b) => ({ bandeiraId: b.id, bandeiraLabel: b.label }));
    } else {
      // PIX / iFood: linha unica sem bandeira
      linhas = [{ bandeiraId: '', bandeiraLabel: tipoAtivo === 'pix' ? 'PIX' : 'iFood' }];
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-border bg-muted/40">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground">
                Bandeira
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground">
                Taxa (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground">
                Prazo (dias)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {linhas.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-sm text-muted-foreground">
                  Nenhuma bandeira cadastrada para {tipoAtivo}. Cadastre acima.
                </td>
              </tr>
            ) : (
              linhas.map((l) => {
                const c = getConfig(maqAtiva, tipoAtivo, categoriaParam, l.bandeiraId);
                return (
                  <tr key={`${l.bandeiraId || tipoAtivo}`} className="hover:bg-muted/40">
                    <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-foreground">
                      {l.bandeiraLabel}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-sm text-muted-foreground">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={c.taxa}
                        onChange={(e) =>
                          updateConfig(
                            maqAtiva,
                            tipoAtivo,
                            categoriaParam,
                            l.bandeiraId,
                            'taxa',
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-24 rounded-lg border border-border px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-sm text-muted-foreground">
                      <input
                        type="number"
                        min="0"
                        value={c.prazo}
                        onChange={(e) =>
                          updateConfig(
                            maqAtiva,
                            tipoAtivo,
                            categoriaParam,
                            l.bandeiraId,
                            'prazo',
                            parseInt(e.target.value, 10) || 0,
                          )
                        }
                        className="w-24 rounded-lg border border-border px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={PAGE_TITLE}>Taxas e prazos</h1>
          <p className={PAGE_SUBTITLE}>
            Cadastre as bandeiras aceitas e configure taxa (%) e prazo (dias) de cada maquininha por tipo de pagamento.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
      </div>

      {/* Bandeiras */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground">Bandeiras</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Cadastradas aqui ficam disponiveis no lancamento em Controle de Cartoes. Cadastro/edicao salva
              imediatamente.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNovaBandeira}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted/40"
          >
            <Plus className="h-4 w-4" />
            Nova bandeira
          </button>
        </header>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {(
            [
              ['Credito', bandeirasCredito],
              ['Debito', bandeirasDebito],
              ['Voucher', bandeirasVoucher],
            ] as const
          ).map(([titulo, lista]) => (
            <div key={titulo} className="rounded-lg border border-border bg-muted/40 p-3">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">{titulo}</h3>
              {lista.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">Nenhuma bandeira cadastrada.</p>
              ) : (
                <ul className="space-y-1">
                  {lista.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between rounded-md bg-card px-3 py-1.5 text-sm"
                    >
                      <span className="font-medium text-foreground">{b.label}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditarBandeira(b)}
                          className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Editar bandeira"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoverBandeira(b.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-red-600"
                          title="Remover bandeira"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Taxas e Prazos por MAQUININHA */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <header className="border-b border-border px-4 py-3 sm:px-6">
          <h2 className="text-base font-bold text-foreground">Taxas e prazos por maquininha</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Selecione a maquininha, depois o tipo de pagamento. Para credito ha 3 categorias (taxa muda por
            categoria). Prazo em dias uteis — deixe 0 para o cliente preencher quando lancar.
          </p>
        </header>

        {/* Tab por maquininha */}
        <div className="flex flex-wrap gap-1 border-b border-border px-4 pt-3 sm:px-6">
          {maquininhas.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMaqAtiva(m.id)}
              className={cn(
                'rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                maqAtiva === m.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {m.label}
              {m.custom && (
                <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary dark:text-primary">
                  Custom
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sub-aba por tipo */}
        <div className="flex flex-wrap gap-2 px-4 pt-3 sm:px-6">
          {TIPOS_MAQ.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTipoAtivo(t.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                tipoAtivo === t.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-muted text-foreground hover:bg-accent',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sub-sub-aba: categoria de credito (so para credito) */}
        {tipoAtivo === 'credito' && (
          <div className="flex flex-wrap items-center gap-2 px-4 pt-3 sm:px-6">
            <span className="text-xs font-medium text-muted-foreground">Categoria:</span>
            {CATEGORIAS_CREDITO.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCatAtiva(c.id)}
                className={cn(
                  'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
                  catAtiva === c.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground ring-1 ring-border hover:bg-muted/40',
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        <div className="p-4 sm:p-6">{maqAtiva ? renderTabela() : <p className="text-sm text-muted-foreground">Nenhuma maquininha disponivel.</p>}</div>
      </section>

      {/* Modal cadastrar/editar bandeira */}
      {novaBandeiraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5 text-card-foreground shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                {bandeiraEditando ? 'Editar bandeira' : 'Nova bandeira'}
              </h3>
              <button
                type="button"
                onClick={() => setNovaBandeiraOpen(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Nome da bandeira</label>
                <input
                  type="text"
                  value={bandeiraForm.label}
                  onChange={(e) => setBandeiraForm({ ...bandeiraForm, label: e.target.value })}
                  placeholder="Ex.: Banescard"
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Tipo</label>
                <select
                  value={bandeiraForm.tipo}
                  onChange={(e) => setBandeiraForm({ ...bandeiraForm, tipo: e.target.value as TipoBandeira })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="credito">Credito</option>
                  <option value="debito">Debito</option>
                  <option value="voucher">Voucher</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNovaBandeiraOpen(false)}
                className={BTN_CANCEL}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSalvarBandeira}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                {bandeiraEditando ? 'Salvar' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
