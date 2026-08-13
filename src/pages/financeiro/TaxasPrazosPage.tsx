import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Save, Plus, Trash2, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  MAQUININHAS_PADRAO_LIST,
  MAQUININHAS_PADRAO_IDS,
  MAQUININHAS_PADRAO_HABILITADAS,
} from '@/lib/maquininhas';
import { cn } from '@/lib/cn';
import { PAGE_TITLE, PAGE_SUBTITLE, BTN_CANCEL } from '@/lib/uiClasses';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NumberField } from '@/components/ui/number-field';
import {
  type TipoBandeira,
  type CategoriaCredito,
  type TipoMaq,
  type FechamentoVoucher,
  type CorteQuinzenal,
  type VoucherConfig,
  type VoucherCategoria,
  type BandeiraCadastro,
  type TaxaPrazoMaquininha,
  type TaxasJsonShape,
  type TaxasPrazosPayload,
  type IfoodConfig,
  type ModulosHabilitados,
  FECHAMENTO_OPTIONS,
  CORTE_OPTIONS,
  CORTE_QUINZENAL_PADRAO,
  DEFAULT_BANDEIRAS,
  DEFAULT_IFOOD_CONFIG,
  comVoucherSeed,
  getModulosHabilitados,
} from '@/types/taxas-prazos';

/**
 * Valor sentinela do Select de fechamento/corte de uma CATEGORIA.
 *
 * Sem ele, o Select exibiria o valor efetivo (herdado da bandeira) e ao salvar
 * gravaria esse valor explicitamente na categoria — congelando a heranca. Com o
 * sentinela, "Herdar" limpa o override e a categoria volta a seguir a bandeira.
 * Radix Select nao aceita value="", por isso uma string.
 */
const HERDAR = '__herdar';

const fechamentoLabelDe = (f: FechamentoVoucher) =>
  FECHAMENTO_OPTIONS.find((o) => o.id === f)?.label ?? 'Normal';
const corteLabelDe = (c?: number) => CORTE_OPTIONS.find((o) => o.id === c)?.label ?? '-';

const CATEGORIAS_CREDITO: { id: CategoriaCredito; label: string }[] = [
  { id: 'a-vista', label: 'A vista' },
  { id: 'parcelado-vista', label: 'Parcelado a vista' },
  { id: 'parcelado-prazo', label: 'Parcelado a prazo' },
];

/** Tipos por maquininha. Voucher e iFood sao independentes (secao propria no topo). */
const TIPOS_MAQ: { id: TipoMaq; label: string }[] = [
  { id: 'credito', label: 'Credito' },
  { id: 'debito', label: 'Debito' },
  { id: 'pix', label: 'PIX' },
];

const INPUT_NUM_CLASS = 'w-20';

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

interface VoucherFormState {
  taxa: string;
  prazo: string;
  fechamento: FechamentoVoucher;
  corte: number;
  corteQuinzenal: CorteQuinzenal;
  doc: string;
  porVenda: string;
  anuidade: string;
  usaQtdCupons: boolean;
  categorias: VoucherCategoria[];
}

const VOUCHER_FORM_VAZIO: VoucherFormState = {
  taxa: '',
  prazo: '',
  fechamento: 'normal',
  corte: 1,
  corteQuinzenal: { ...CORTE_QUINZENAL_PADRAO },
  doc: '',
  porVenda: '',
  anuidade: '',
  usaQtdCupons: false,
  categorias: [],
};

function voucherToForm(v?: VoucherConfig): VoucherFormState {
  if (!v) return VOUCHER_FORM_VAZIO;
  return {
    taxa: v.taxa ? String(v.taxa) : '',
    prazo: v.prazo ? String(v.prazo) : '',
    fechamento: v.fechamento ?? 'normal',
    corte: v.corte ?? 1,
    corteQuinzenal: { ...CORTE_QUINZENAL_PADRAO, ...(v.corteQuinzenal ?? {}) },
    doc: v.doc != null ? String(v.doc) : '',
    porVenda: v.porVenda != null ? String(v.porVenda) : '',
    anuidade: v.anuidade != null ? String(v.anuidade) : '',
    usaQtdCupons: !!v.usaQtdCupons,
    categorias: (v.categorias ?? []).map((c) => ({ ...c })),
  };
}

function formToVoucher(f: VoucherFormState): VoucherConfig {
  // Campo vazio = nao configurado (undefined). Zero digitado e um valor valido —
  // antes `n > 0` descartava, tornando impossivel gravar DOC ou Por venda = 0.
  const numOrUndef = (s: string) => {
    if (s.trim() === '') return undefined;
    const n = parseFloat(s.replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    taxa: parseFloat(f.taxa.replace(',', '.')) || 0,
    prazo: parseInt(f.prazo, 10) || 0,
    fechamento: f.fechamento,
    // Corte e corte quinzenal sao gravados sempre, independente do fechamento
    // ativo: alternar Semanal <-> Quinzenal nao pode apagar a configuracao do outro.
    corte: f.corte,
    corteQuinzenal: f.corteQuinzenal,
    doc: numOrUndef(f.doc),
    porVenda: numOrUndef(f.porVenda),
    anuidade: numOrUndef(f.anuidade),
    ...(f.usaQtdCupons ? { usaQtdCupons: true } : {}),
    ...(f.categorias.length > 0 ? { categorias: f.categorias } : {}),
  };
}

export function TaxasPrazosPage() {
  const [payload, setPayload] = useState<TaxasJsonShape>({});
  const [bandeiras, setBandeiras] = useState<BandeiraCadastro[]>(DEFAULT_BANDEIRAS);
  const [maquininhas, setMaquininhas] = useState<{ id: string; label: string; custom?: boolean }[]>([]);
  const [habilitadas, setHabilitadas] = useState<string[]>(MAQUININHAS_PADRAO_HABILITADAS);
  const [modulos, setModulos] = useState<ModulosHabilitados>({ voucher: true, ifood: true });
  const [ifoodConfig, setIfoodConfig] = useState<IfoodConfig>(DEFAULT_IFOOD_CONFIG);
  /** Map (operadora|tipo|categoria|bandeira) -> { taxa, prazo }. So credito/debito/pix. */
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
  const [voucherForm, setVoucherForm] = useState<VoucherFormState>(VOUCHER_FORM_VAZIO);
  const [novaCategoriaLabel, setNovaCategoriaLabel] = useState('');

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

        // Bandeiras: mescla bandeiras salvas com as defaults novas para nao perder seed
        // em tenants antigos. Toda bandeira voucher ganha config (seed dos defaults).
        const salvas = Array.isArray(taxasJson.bandeirasCadastradas) ? taxasJson.bandeirasCadastradas : [];
        const bandsBase = salvas.length > 0 ? salvas : DEFAULT_BANDEIRAS;
        const idsSalvos = new Set(bandsBase.map((b) => b.id));
        const novasDefaults = DEFAULT_BANDEIRAS.filter((b) => !idsSalvos.has(b.id));
        const bands = [...bandsBase, ...novasDefaults].map(comVoucherSeed);
        setBandeiras(bands);

        // Maquininhas: defaults + customs (lista completa; abas filtram por habilitadas)
        const customs = Array.isArray(taxasJson.maquininhasCustom) ? taxasJson.maquininhasCustom : [];
        const customsClean = customs
          .filter((m) => m && m.id && m.label)
          .filter((m) => !MAQUININHAS_PADRAO_IDS.has(m.id))
          .map((m) => ({ id: m.id, label: m.label, custom: true }));
        const lista = [...MAQUININHAS_PADRAO_LIST.map((m) => ({ ...m, custom: false })), ...customsClean];
        setMaquininhas(lista);

        const habs = Array.isArray(taxasJson.maquininhasHabilitadas)
          ? taxasJson.maquininhasHabilitadas
          : MAQUININHAS_PADRAO_HABILITADAS;
        setHabilitadas(habs);

        setModulos(getModulosHabilitados(taxasJson));
        setIfoodConfig(taxasJson.ifoodConfig ?? DEFAULT_IFOOD_CONFIG);

        // Aba ativa default = primeira maquininha habilitada
        const visiveis = lista.filter((m) => habs.includes(m.id));
        if (visiveis.length > 0) setMaqAtiva(visiveis[0].id);

        // Configs: monta map a partir do JSON (so credito/debito/pix na v2).
        const cfgs: Record<string, { taxa: number; prazo: number }> = {};
        const taxasArr = Array.isArray(taxasJson.taxasPorMaquininha) ? taxasJson.taxasPorMaquininha : [];
        for (const t of taxasArr) {
          if (t.tipo === 'voucher' || t.tipo === 'ifood') continue;
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
        setBandeiras(DEFAULT_BANDEIRAS.map(comVoucherSeed));
        const lista = MAQUININHAS_PADRAO_LIST.map((m) => ({ ...m, custom: false }));
        setMaquininhas(lista);
        setHabilitadas(MAQUININHAS_PADRAO_HABILITADAS);
        const visiveis = lista.filter((m) => MAQUININHAS_PADRAO_HABILITADAS.includes(m.id));
        if (visiveis.length > 0) setMaqAtiva(visiveis[0].id);
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

  /** Maquininhas exibidas nas abas: apenas habilitadas no Gerenciar (Controle de Cartoes). */
  const maquininhasVisiveis = useMemo(
    () => maquininhas.filter((m) => habilitadas.includes(m.id)),
    [maquininhas, habilitadas],
  );

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

  /** Atualiza um campo da config voucher da bandeira (edicao inline). */
  const updateVoucherCfg = (bandeiraId: string, patch: Partial<VoucherConfig>) => {
    setBandeiras((prev) =>
      prev.map((b) =>
        b.id === bandeiraId && b.voucher ? { ...b, voucher: { ...b.voucher, ...patch } } : b,
      ),
    );
  };

  /** Atualiza um override de categoria (edicao inline). */
  const updateVoucherCat = (bandeiraId: string, catId: string, patch: Partial<VoucherCategoria>) => {
    setBandeiras((prev) =>
      prev.map((b) => {
        if (b.id !== bandeiraId || !b.voucher) return b;
        const categorias = (b.voucher.categorias ?? []).map((c) => (c.id === catId ? { ...c, ...patch } : c));
        return { ...b, voucher: { ...b.voucher, categorias } };
      }),
    );
  };

  /** Serializa o estado em formato persistivel (schema v2). */
  const buildJson = (bandeirasArg?: BandeiraCadastro[]): { taxasJson: TaxasJsonShape; prazos: number[] } => {
    const bandsToSave = bandeirasArg ?? bandeiras;
    const taxasPorMaquininha: TaxaPrazoMaquininha[] = [];
    // Itera TODAS as maquininhas (nao so as habilitadas) para nao perder config ao desabilitar.
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
    }
    const prazosVoucher = bandsToSave.filter((b) => b.tipo === 'voucher' && b.voucher).map((b) => b.voucher!.prazo);
    const prazos = [
      ...new Set([...taxasPorMaquininha.map((t) => t.prazo), ...prazosVoucher, ifoodConfig.prazo]),
    ].sort((a, b) => a - b);
    const taxasJson: TaxasJsonShape = {
      ...payload,
      schemaVersion: 2,
      bandeirasCadastradas: bandsToSave,
      taxasPorMaquininha,
      ifoodConfig,
      modulosHabilitados: modulos,
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
    setVoucherForm(VOUCHER_FORM_VAZIO);
    setNovaCategoriaLabel('');
    setNovaBandeiraOpen(true);
  };

  const handleOpenEditarBandeira = (b: BandeiraCadastro) => {
    setBandeiraEditando(b);
    setBandeiraForm({ label: b.label, tipo: b.tipo });
    setVoucherForm(voucherToForm(b.voucher));
    setNovaCategoriaLabel('');
    setNovaBandeiraOpen(true);
  };

  const handleAddCategoria = () => {
    const label = novaCategoriaLabel.trim();
    if (!label) return;
    const id = slugify(label);
    if (!id || voucherForm.categorias.some((c) => c.id === id)) {
      toast.error('Categoria invalida ou ja existente.');
      return;
    }
    setVoucherForm((f) => ({ ...f, categorias: [...f.categorias, { id, label }] }));
    setNovaCategoriaLabel('');
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
    const nova: BandeiraCadastro = {
      id,
      label: labelTrim,
      tipo: bandeiraForm.tipo,
      ...(bandeiraForm.tipo === 'voucher' ? { voucher: formToVoucher(voucherForm) } : {}),
    };
    const novaLista = bandeiraEditando
      ? bandeiras.map((b) => (b.id === bandeiraEditando.id ? { ...b, ...nova } : b))
      : [...bandeiras, nova];
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

  /**
   * Celulas de Fechamento, Corte (semanal) e Corte quinzenal — renderizadas POR
   * LINHA, para que cada categoria tenha ciclo proprio.
   *
   * @param efetivo config ja resolvida (override da categoria ou herdada da bandeira)
   * @param herdavel true numa linha de categoria — habilita a opcao "Herdar"
   * @param proprio  o que a propria linha define (undefined = herdando)
   */
  const renderFechamentoCells = (
    efetivo: { fechamento: FechamentoVoucher; corte?: number; corteQuinzenal?: CorteQuinzenal },
    herdavel: boolean,
    proprio: { fechamento?: FechamentoVoucher; corte?: number; corteQuinzenal?: CorteQuinzenal },
    onChange: (patch: Partial<VoucherCategoria>) => void,
  ) => {
    const herdandoFechamento = herdavel && proprio.fechamento === undefined;
    const herdandoCorte = herdavel && proprio.corte === undefined;
    const herdandoQuinzenal = herdavel && proprio.corteQuinzenal === undefined;
    const quinzenal = efetivo.corteQuinzenal ?? CORTE_QUINZENAL_PADRAO;
    const marcaHerdado = (herdando: boolean) => (herdando ? 'italic text-muted-foreground' : '');

    return (
      <>
        <td className="whitespace-nowrap px-3 py-2 align-middle">
          <Select
            value={herdandoFechamento ? HERDAR : efetivo.fechamento}
            onValueChange={(v) =>
              onChange(v === HERDAR ? { fechamento: undefined } : { fechamento: v as FechamentoVoucher })
            }
          >
            <SelectTrigger className={cn('h-9 w-36', marcaHerdado(herdandoFechamento))}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {herdavel && <SelectItem value={HERDAR}>Herdar ({fechamentoLabelDe(efetivo.fechamento)})</SelectItem>}
              {FECHAMENTO_OPTIONS.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </td>

        <td className="whitespace-nowrap px-3 py-2 align-middle">
          {efetivo.fechamento === 'semanal' ? (
            <Select
              value={herdandoCorte ? HERDAR : String(efetivo.corte ?? 1)}
              onValueChange={(v) =>
                onChange(v === HERDAR ? { corte: undefined } : { corte: parseInt(v, 10) })
              }
            >
              <SelectTrigger className={cn('h-9 w-32', marcaHerdado(herdandoCorte))}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {herdavel && <SelectItem value={HERDAR}>Herdar ({corteLabelDe(efetivo.corte)})</SelectItem>}
                {CORTE_OPTIONS.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </td>

        <td className="whitespace-nowrap px-3 py-2 align-middle">
          {efetivo.fechamento === 'quinzenal' ? (
            <div className={cn('flex items-center gap-1', marcaHerdado(herdandoQuinzenal))}>
              <NumberField
                value={quinzenal.primeiro}
                decimals={0}
                min={1}
                max={28}
                aria-label="Primeiro dia de corte"
                className="w-14"
                onCommit={(v) =>
                  onChange({ corteQuinzenal: { ...quinzenal, primeiro: v ?? CORTE_QUINZENAL_PADRAO.primeiro } })
                }
              />
              <span className="text-xs text-muted-foreground">e</span>
              <NumberField
                value={quinzenal.segundo ?? 0}
                decimals={0}
                min={0}
                max={31}
                title="0 = ultimo dia do mes"
                aria-label="Segundo dia de corte (0 = fim do mes)"
                className="w-14"
                onCommit={(v) => onChange({ corteQuinzenal: { ...quinzenal, segundo: v ?? 0 } })}
              />
              {herdavel && !herdandoQuinzenal && (
                <button
                  type="button"
                  title="Voltar a herdar da bandeira"
                  onClick={() => onChange({ corteQuinzenal: undefined })}
                  className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </td>
      </>
    );
  };

  /** Linha de inputs numericos de voucher — bandeira (sem categorias) ou categoria (overrides). */
  const renderVoucherInputs = (
    efetivo: { taxa: number; prazo: number; doc?: number; porVenda?: number; anuidade?: number; usaQtdCupons?: boolean },
    onChange: (patch: Partial<VoucherCategoria>) => void,
  ) => (
    <>
      <td className="whitespace-nowrap px-3 py-2">
        <NumberField
          value={efetivo.taxa}
          min={0}
          aria-label="Taxa (%)"
          className={INPUT_NUM_CLASS}
          onCommit={(v) => onChange({ taxa: v ?? 0 })}
        />
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <NumberField
          value={efetivo.prazo}
          decimals={0}
          min={0}
          aria-label="Prazo (dias)"
          className={INPUT_NUM_CLASS}
          onCommit={(v) => onChange({ prazo: v ?? 0 })}
        />
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <NumberField
          value={efetivo.doc ?? 0}
          min={0}
          aria-label="DOC (R$)"
          className={INPUT_NUM_CLASS}
          onCommit={(v) => onChange({ doc: v ?? 0 })}
        />
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <NumberField
          value={efetivo.porVenda ?? 0}
          min={0}
          aria-label="Por venda (R$)"
          className={INPUT_NUM_CLASS}
          onCommit={(v) => onChange({ porVenda: v ?? 0 })}
        />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-center">
        <input
          type="checkbox"
          checked={!!efetivo.usaQtdCupons}
          onChange={(e) => onChange({ usaQtdCupons: e.target.checked })}
          className="h-4 w-4 accent-emerald-600"
          title="Por Venda cobrada por cupom (lancamento pede Qtd Cupons)"
        />
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <NumberField
          value={efetivo.anuidade ?? 0}
          min={0}
          aria-label="Anuidade (R$)"
          className={INPUT_NUM_CLASS}
          onCommit={(v) => onChange({ anuidade: v ?? 0 })}
        />
      </td>
    </>
  );

  /** Secao destacada de Voucher e iFood (independentes de maquininha). */
  const renderVoucherIfoodSection = () => {
    if (!modulos.voucher && !modulos.ifood) return null;
    return (
      <section className="overflow-hidden rounded-xl border-2 border-emerald-500/30 bg-card">
        <header className="border-b border-border bg-emerald-500/5 px-4 py-3 sm:px-6">
          <h2 className="text-base font-bold text-foreground">Voucher e iFood</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Independentes de maquininha. Habilite ou desabilite em Controle de Cartoes → Gerenciar maquininhas.
          </p>
        </header>

        {modulos.voucher && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {['Bandeira', 'Taxa (%)', 'Prazo (dias)', 'DOC (R$)', 'Por venda (R$)', 'Cupons', 'Anuidade (R$)', 'Fechamento', 'Corte', 'Corte quinzenal'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bandeirasVoucher.map((b) => {
                  const cats = b.voucher?.categorias ?? [];
                  if (cats.length === 0) {
                    const cfg = b.voucher ?? { taxa: 0, prazo: 0, fechamento: 'normal' as FechamentoVoucher };
                    return (
                      <tr key={b.id} className="hover:bg-muted/40">
                        <td className="whitespace-nowrap px-3 py-2 text-sm font-medium text-foreground">
                          {b.label}
                        </td>
                        {renderVoucherInputs(cfg, (patch) => updateVoucherCfg(b.id, patch))}
                        {renderFechamentoCells(
                          {
                            fechamento: cfg.fechamento ?? 'normal',
                            corte: cfg.corte,
                            corteQuinzenal: cfg.corteQuinzenal,
                          },
                          false,
                          cfg,
                          (patch) => updateVoucherCfg(b.id, patch),
                        )}
                      </tr>
                    );
                  }
                  return cats.map((cat) => {
                    // Cada categoria resolve sua config efetiva: o que ela mesma
                    // define, senao o da bandeira. Alterar uma nao afeta as irmas.
                    const efetivo = {
                      taxa: cat.taxa ?? b.voucher!.taxa,
                      prazo: cat.prazo ?? b.voucher!.prazo,
                      doc: cat.doc ?? b.voucher!.doc,
                      porVenda: cat.porVenda ?? b.voucher!.porVenda,
                      anuidade: cat.anuidade ?? b.voucher!.anuidade,
                      usaQtdCupons: cat.usaQtdCupons ?? b.voucher!.usaQtdCupons,
                      fechamento: cat.fechamento ?? b.voucher!.fechamento ?? 'normal',
                      corte: cat.corte ?? b.voucher!.corte,
                      corteQuinzenal: cat.corteQuinzenal ?? b.voucher!.corteQuinzenal,
                    };
                    return (
                      <tr key={`${b.id}-${cat.id}`} className="hover:bg-muted/40">
                        <td className="whitespace-nowrap px-3 py-2 text-sm text-foreground">
                          <span className="font-medium">{b.label}</span>{' '}
                          <span className="text-muted-foreground">{cat.label}</span>
                        </td>
                        {renderVoucherInputs(efetivo, (patch) => updateVoucherCat(b.id, cat.id, patch))}
                        {renderFechamentoCells(efetivo, true, cat, (patch) =>
                          updateVoucherCat(b.id, cat.id, patch),
                        )}
                      </tr>
                    );
                  });
                })}
                {bandeirasVoucher.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-sm text-muted-foreground">
                      Nenhuma bandeira voucher cadastrada. Cadastre acima em Bandeiras.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {modulos.ifood && (
          <div className="border-t border-border px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-end gap-4">
              <span className="pb-2 text-sm font-bold text-foreground">iFood</span>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Taxa (%)
                <NumberField
                  value={ifoodConfig.taxa}
                  min={0}
                  className={INPUT_NUM_CLASS}
                  onCommit={(v) => setIfoodConfig((f) => ({ ...f, taxa: v ?? 0 }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Prazo (dias)
                <NumberField
                  value={ifoodConfig.prazo}
                  decimals={0}
                  min={0}
                  className={INPUT_NUM_CLASS}
                  onCommit={(v) => setIfoodConfig((f) => ({ ...f, prazo: v ?? 0 }))}
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                Fechamento
                <Select
                  value={ifoodConfig.fechamento ?? 'normal'}
                  onValueChange={(v) => setIfoodConfig((f) => ({ ...f, fechamento: v as FechamentoVoucher }))}
                >
                  <SelectTrigger className="h-9 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FECHAMENTO_OPTIONS.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              {(ifoodConfig.fechamento ?? 'normal') === 'semanal' && (
                <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                  Corte
                  <Select
                    value={String(ifoodConfig.corte ?? 3)}
                    onValueChange={(v) => setIfoodConfig((f) => ({ ...f, corte: parseInt(v, 10) }))}
                  >
                    <SelectTrigger className="h-9 w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CORTE_OPTIONS.map((o) => (
                        <SelectItem key={o.id} value={String(o.id)}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              )}
              {(ifoodConfig.fechamento ?? 'normal') === 'quinzenal' && (
                <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
                  Corte quinzenal (dias do mes)
                  <div className="flex items-center gap-1">
                    <NumberField
                      value={ifoodConfig.corteQuinzenal?.primeiro ?? CORTE_QUINZENAL_PADRAO.primeiro}
                      decimals={0}
                      min={1}
                      max={28}
                      aria-label="Primeiro dia de corte"
                      className="w-14"
                      onCommit={(v) =>
                        setIfoodConfig((f) => ({
                          ...f,
                          corteQuinzenal: {
                            primeiro: v ?? CORTE_QUINZENAL_PADRAO.primeiro,
                            segundo: f.corteQuinzenal?.segundo ?? 0,
                          },
                        }))
                      }
                    />
                    <span className="text-xs text-muted-foreground">e</span>
                    <NumberField
                      value={ifoodConfig.corteQuinzenal?.segundo ?? 0}
                      decimals={0}
                      min={0}
                      max={31}
                      title="0 = ultimo dia do mes"
                      aria-label="Segundo dia de corte (0 = fim do mes)"
                      className="w-14"
                      onCommit={(v) =>
                        setIfoodConfig((f) => ({
                          ...f,
                          corteQuinzenal: {
                            primeiro: f.corteQuinzenal?.primeiro ?? CORTE_QUINZENAL_PADRAO.primeiro,
                            segundo: v ?? 0,
                          },
                        }))
                      }
                    />
                  </div>
                </label>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              No lancamento de iFood informe Valor iFood e Valor Loja.
            </p>
          </div>
        )}
      </section>
    );
  };

  /** Renderiza a tabela de taxas/prazos da combinacao (maqAtiva, tipoAtivo, catAtiva). */
  const renderTabela = () => {
    let linhas: { bandeiraId: string; bandeiraLabel: string }[] = [];
    let categoriaParam: CategoriaCredito | '' = '';

    if (tipoAtivo === 'credito') {
      linhas = bandeirasCredito.map((b) => ({ bandeiraId: b.id, bandeiraLabel: b.label }));
      categoriaParam = catAtiva;
    } else if (tipoAtivo === 'debito') {
      linhas = bandeirasDebito.map((b) => ({ bandeiraId: b.id, bandeiraLabel: b.label }));
    } else {
      // PIX: linha unica sem bandeira
      linhas = [{ bandeiraId: '', bandeiraLabel: 'PIX' }];
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
                      <NumberField
                        value={c.taxa}
                        min={0}
                        aria-label={`Taxa de ${l.bandeiraLabel}`}
                        className="w-24"
                        onCommit={(v) =>
                          updateConfig(maqAtiva, tipoAtivo, categoriaParam, l.bandeiraId, 'taxa', v ?? 0)
                        }
                      />
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-sm text-muted-foreground">
                      <NumberField
                        value={c.prazo}
                        decimals={0}
                        min={0}
                        aria-label={`Prazo de ${l.bandeiraLabel}`}
                        className="w-24"
                        onCommit={(v) =>
                          updateConfig(maqAtiva, tipoAtivo, categoriaParam, l.bandeiraId, 'prazo', v ?? 0)
                        }
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

      {/* Voucher e iFood — independentes de maquininha, em destaque no topo */}
      {renderVoucherIfoodSection()}

      {/* Taxas e Prazos por MAQUININHA */}
      <section className="rounded-xl border border-border bg-card overflow-hidden">
        <header className="border-b border-border px-4 py-3 sm:px-6">
          <h2 className="text-base font-bold text-foreground">Taxas e prazos por maquininha</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Selecione a maquininha, depois o tipo de pagamento. Para credito ha 3 categorias (taxa muda por
            categoria).
          </p>
        </header>

        {/* Tab por maquininha (apenas habilitadas no Gerenciar) */}
        <div className="flex flex-wrap gap-1 border-b border-border px-4 pt-3 sm:px-6">
          {maquininhasVisiveis.map((m) => (
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

        <div className="p-4 sm:p-6">
          {maquininhasVisiveis.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma maquininha habilitada. Habilite em Controle de Cartoes → Gerenciar maquininhas.
            </p>
          ) : maqAtiva ? (
            renderTabela()
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma maquininha disponivel.</p>
          )}
        </div>
      </section>

      {/* Modal cadastrar/editar bandeira */}
      {novaBandeiraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-5 text-card-foreground shadow-lg">
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
                <Select
                  value={bandeiraForm.tipo}
                  onValueChange={(v) => setBandeiraForm({ ...bandeiraForm, tipo: v as TipoBandeira })}
                >
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credito">Credito</SelectItem>
                    <SelectItem value="debito">Debito</SelectItem>
                    <SelectItem value="voucher">Voucher</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campos de voucher (tabela de perguntas do cliente) */}
              {bandeiraForm.tipo === 'voucher' && (
                <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Taxa (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={voucherForm.taxa}
                        onChange={(e) => setVoucherForm({ ...voucherForm, taxa: e.target.value })}
                        className="h-9 w-full rounded-lg border border-input bg-background px-2 text-center text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Prazo (dias)</label>
                      <input
                        type="number"
                        min="0"
                        value={voucherForm.prazo}
                        onChange={(e) => setVoucherForm({ ...voucherForm, prazo: e.target.value })}
                        className="h-9 w-full rounded-lg border border-input bg-background px-2 text-center text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Fechamento</label>
                      <Select
                        value={voucherForm.fechamento}
                        onValueChange={(v) =>
                          setVoucherForm({ ...voucherForm, fechamento: v as FechamentoVoucher })
                        }
                      >
                        <SelectTrigger className="h-9 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FECHAMENTO_OPTIONS.map((o) => (
                            <SelectItem key={o.id} value={o.id}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {voucherForm.fechamento === 'semanal' && (
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">Dia de corte</label>
                        <Select
                          value={String(voucherForm.corte)}
                          onValueChange={(v) => setVoucherForm({ ...voucherForm, corte: parseInt(v, 10) })}
                        >
                          <SelectTrigger className="h-9 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CORTE_OPTIONS.map((o) => (
                              <SelectItem key={o.id} value={String(o.id)}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">DOC (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={voucherForm.doc}
                        onChange={(e) => setVoucherForm({ ...voucherForm, doc: e.target.value })}
                        className="h-9 w-full rounded-lg border border-input bg-background px-2 text-center text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Por venda (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={voucherForm.porVenda}
                        onChange={(e) => setVoucherForm({ ...voucherForm, porVenda: e.target.value })}
                        className="h-9 w-full rounded-lg border border-input bg-background px-2 text-center text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">Anuidade (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={voucherForm.anuidade}
                        onChange={(e) => setVoucherForm({ ...voucherForm, anuidade: e.target.value })}
                        className="h-9 w-full rounded-lg border border-input bg-background px-2 text-center text-sm"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={voucherForm.usaQtdCupons}
                      onChange={(e) => setVoucherForm({ ...voucherForm, usaQtdCupons: e.target.checked })}
                      className="h-4 w-4 accent-emerald-600"
                    />
                    Lancamento pede Qtd Cupons (Por Venda cobrada por cupom)
                  </label>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Categorias (opcional)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {voucherForm.categorias.map((c) => (
                        <span
                          key={c.id}
                          className="inline-flex items-center gap-1 rounded-full bg-card px-2.5 py-1 text-xs font-medium text-foreground ring-1 ring-border"
                        >
                          {c.label}
                          <button
                            type="button"
                            onClick={() =>
                              setVoucherForm((f) => ({
                                ...f,
                                categorias: f.categorias.filter((x) => x.id !== c.id),
                              }))
                            }
                            className="text-muted-foreground hover:text-red-600"
                            aria-label={`Remover ${c.label}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={novaCategoriaLabel}
                        onChange={(e) => setNovaCategoriaLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCategoria();
                          }
                        }}
                        placeholder="Ex.: Alimentacao"
                        className="h-9 flex-1 rounded-lg border border-input bg-background px-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategoria}
                        className="rounded-lg border border-border px-3 text-sm font-medium text-foreground hover:bg-muted/40"
                      >
                        Adicionar
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Ex.: Pluxee tem Alimentacao, Refeicao, Premium e Gift. Taxa/prazo por categoria podem ser
                      ajustados na tabela Voucher e iFood.
                    </p>
                  </div>
                </div>
              )}
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
