import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Save, Plus, Trash2, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { MAQUININHAS_PADRAO_LIST, MAQUININHAS_PADRAO_IDS } from '@/lib/maquininhas';

/** Tipo de bandeira (credito ou debito). */
type TipoBandeira = 'credito' | 'debito';

/** Cadastro de bandeira (lista usada no lancamento em Controle de Cartoes). */
interface BandeiraCadastro {
  id: string;
  label: string;
  tipo: TipoBandeira;
}

/** Maquininha custom criada pelo usuario em Controle de Cartoes (persistida no JSON). */
interface MaquininhaCustom {
  id: string;
  label: string;
  custom?: boolean;
  tipos?: string[];
  bandeirasCredito?: string[];
  bandeirasDebito?: string[];
}

/** Configuracao de taxa+prazo POR MAQUININHA (operadora) e por tipo de pagamento. */
interface TaxaPrazoMaquininha {
  operadora: string;
  tipo: TipoBandeira;
  taxa: number;
  prazo: number;
}

/** JSON salvo em ControleCartaoTaxasPrazos.taxas (formato envelopado). */
interface TaxasJsonShape {
  bandeirasCadastradas?: BandeiraCadastro[];
  maquininhasCustom?: MaquininhaCustom[];
  maquininhasHabilitadas?: string[];
  /** Taxas por maquininha + tipo (FORMATO NOVO). */
  taxasPorMaquininha?: TaxaPrazoMaquininha[];
  /** @deprecated Formato antigo (por bandeira) — mantido para retrocompat de leitura. */
  taxas?: Array<{ bandeira: string; tipo: string; taxa: number; prazo?: number }>;
  [key: string]: unknown;
}

interface TaxasPrazosPayload {
  taxas?: TaxasJsonShape | null;
  prazos?: number[] | null;
}

/** Bandeiras default (seed inicial). */
const DEFAULT_BANDEIRAS: BandeiraCadastro[] = [
  { id: 'visa', label: 'Visa', tipo: 'credito' },
  { id: 'mastercard', label: 'Mastercard', tipo: 'credito' },
  { id: 'elo-credito', label: 'Elo Credito', tipo: 'credito' },
  { id: 'amex', label: 'Amex', tipo: 'credito' },
  { id: 'hipercard', label: 'Hipercard', tipo: 'credito' },
  { id: 'electron', label: 'Electron', tipo: 'debito' },
  { id: 'elo-debito', label: 'Elo Debito', tipo: 'debito' },
  { id: 'maestro', label: 'Maestro', tipo: 'debito' },
];

/** Slug seguro pra usar como id de bandeira customizada. */
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

/** Chave composta para identificar uma config (operadora|tipo). */
function keyOf(operadora: string, tipo: TipoBandeira): string {
  return `${operadora}|${tipo}`;
}

export function TaxasPrazosPage() {
  const [payload, setPayload] = useState<TaxasJsonShape>({});
  const [bandeiras, setBandeiras] = useState<BandeiraCadastro[]>(DEFAULT_BANDEIRAS);
  const [maquininhas, setMaquininhas] = useState<{ id: string; label: string; custom?: boolean }[]>([]);
  /** Map (operadora|tipo) -> { taxa, prazo }. */
  const [configs, setConfigs] = useState<Record<string, { taxa: number; prazo: number }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        // taxas pode vir como objeto envelopado (novo formato) ou como array legado.
        const taxasJson: TaxasJsonShape =
          wrapped.taxas && typeof wrapped.taxas === 'object' && !Array.isArray(wrapped.taxas)
            ? (wrapped.taxas as TaxasJsonShape)
            : {};
        if (Array.isArray(wrapped.taxas)) {
          taxasJson.taxas = wrapped.taxas as Array<{ bandeira: string; tipo: string; taxa: number; prazo?: number }>;
        }
        setPayload(taxasJson);

        // Bandeiras: usa cadastradas ou DEFAULT_BANDEIRAS
        const bands: BandeiraCadastro[] =
          Array.isArray(taxasJson.bandeirasCadastradas) && taxasJson.bandeirasCadastradas.length > 0
            ? taxasJson.bandeirasCadastradas
            : DEFAULT_BANDEIRAS;
        setBandeiras(bands);

        // Maquininhas: defaults + customs (sem duplicar)
        const customs = Array.isArray(taxasJson.maquininhasCustom) ? taxasJson.maquininhasCustom : [];
        const customsClean = customs
          .filter((m) => m && m.id && m.label)
          .filter((m) => !MAQUININHAS_PADRAO_IDS.has(m.id))
          .map((m) => ({ id: m.id, label: m.label, custom: true }));
        const lista = [...MAQUININHAS_PADRAO_LIST.map((m) => ({ ...m, custom: false })), ...customsClean];
        setMaquininhas(lista);

        // Configs: para cada (maquininha, credito) e (maquininha, debito)
        const cfgs: Record<string, { taxa: number; prazo: number }> = {};
        const taxasArr = Array.isArray(taxasJson.taxasPorMaquininha) ? taxasJson.taxasPorMaquininha : [];
        const prazoFallback = Array.isArray(wrapped.prazos) && wrapped.prazos.length > 0 ? wrapped.prazos[0] : 30;
        for (const m of lista) {
          for (const tipo of ['credito', 'debito'] as TipoBandeira[]) {
            const found = taxasArr.find((t) => t.operadora === m.id && t.tipo === tipo);
            cfgs[keyOf(m.id, tipo)] = {
              taxa: Number(found?.taxa ?? 0),
              prazo: Number(found?.prazo ?? (tipo === 'debito' ? 1 : prazoFallback)),
            };
          }
        }
        setConfigs(cfgs);
      })
      .catch(() => {
        setBandeiras(DEFAULT_BANDEIRAS);
        const lista = MAQUININHAS_PADRAO_LIST.map((m) => ({ ...m, custom: false }));
        setMaquininhas(lista);
        const cfgs: Record<string, { taxa: number; prazo: number }> = {};
        for (const m of lista) {
          cfgs[keyOf(m.id, 'credito')] = { taxa: 0, prazo: 30 };
          cfgs[keyOf(m.id, 'debito')] = { taxa: 0, prazo: 1 };
        }
        setConfigs(cfgs);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const bandeirasCredito = useMemo(() => bandeiras.filter((b) => b.tipo === 'credito'), [bandeiras]);
  const bandeirasDebito = useMemo(() => bandeiras.filter((b) => b.tipo === 'debito'), [bandeiras]);

  const updateConfig = (
    operadora: string,
    tipo: TipoBandeira,
    field: 'taxa' | 'prazo',
    value: number,
  ) => {
    const k = keyOf(operadora, tipo);
    setConfigs((prev) => ({
      ...prev,
      [k]: { ...(prev[k] ?? { taxa: 0, prazo: 30 }), [field]: value },
    }));
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

  const handleSalvarBandeira = () => {
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
    if (bandeiraEditando) {
      setBandeiras((prev) =>
        prev.map((b) => (b.id === bandeiraEditando.id ? { ...b, label: labelTrim, tipo: bandeiraForm.tipo } : b)),
      );
    } else {
      setBandeiras((prev) => [...prev, { id, label: labelTrim, tipo: bandeiraForm.tipo }]);
    }
    setNovaBandeiraOpen(false);
    setBandeiraEditando(null);
  };

  const handleRemoverBandeira = (id: string) => {
    if (!window.confirm('Remover essa bandeira?')) return;
    setBandeiras((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSave = () => {
    setSaving(true);
    const taxasPorMaquininha: TaxaPrazoMaquininha[] = [];
    for (const m of maquininhas) {
      for (const tipo of ['credito', 'debito'] as TipoBandeira[]) {
        const c = configs[keyOf(m.id, tipo)] ?? { taxa: 0, prazo: tipo === 'debito' ? 1 : 30 };
        taxasPorMaquininha.push({ operadora: m.id, tipo, taxa: c.taxa, prazo: c.prazo });
      }
    }
    const prazos = [...new Set(taxasPorMaquininha.map((t) => t.prazo))].sort((a, b) => a - b);
    const taxasJson: TaxasJsonShape = {
      ...payload,
      bandeirasCadastradas: bandeiras,
      taxasPorMaquininha,
    };
    const novoPayload: TaxasPrazosPayload = {
      taxas: taxasJson,
      prazos,
    };
    api
      .put('financeiro/controle-cartoes/taxas-prazos', novoPayload)
      .then(() => {
        toast.success('Bandeiras, maquininhas, taxas e prazos salvos.');
        setPayload(taxasJson);
      })
      .catch((err) => toast.error(err?.message ?? 'Erro ao salvar.'))
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Taxas e prazos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre as bandeiras aceitas e configure a taxa (%) e o prazo (dias) de cada maquininha.
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
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Bandeiras</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              As bandeiras cadastradas aqui ficam disponiveis para escolher no lancamento em Controle de Cartoes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenNovaBandeira}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
            Nova bandeira
          </button>
        </header>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(
            [
              ['Credito', bandeirasCredito],
              ['Debito', bandeirasDebito],
            ] as const
          ).map(([titulo, lista]) => (
            <div key={titulo} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{titulo}</h3>
              {lista.length === 0 ? (
                <p className="py-2 text-sm text-slate-400">Nenhuma bandeira cadastrada.</p>
              ) : (
                <ul className="space-y-1">
                  {lista.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-center justify-between rounded-md bg-white px-3 py-1.5 text-sm"
                    >
                      <span className="font-medium text-slate-900">{b.label}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEditarBandeira(b)}
                          className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="Editar bandeira"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoverBandeira(b.id)}
                          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
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
      <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <header className="border-b border-slate-200 px-4 py-3 sm:px-6">
          <h2 className="text-base font-bold text-slate-900">Taxas e prazos por maquininha</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Configure a taxa e o prazo de cada maquininha por tipo de pagamento (credito e debito).
            As maquininhas customizadas sao criadas em "Gerenciar maquininhas" na pagina Controle de Cartoes.
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  Maquininha
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  Taxa (%)
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-700">
                  Prazo (dias)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {maquininhas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-slate-500">
                    Nenhuma maquininha disponivel.
                  </td>
                </tr>
              ) : (
                maquininhas.flatMap((m) =>
                  (['credito', 'debito'] as TipoBandeira[]).map((tipo, idx) => {
                    const c = configs[keyOf(m.id, tipo)] ?? { taxa: 0, prazo: tipo === 'debito' ? 1 : 30 };
                    return (
                      <tr key={`${m.id}-${tipo}`} className="hover:bg-slate-50">
                        <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-slate-900">
                          {idx === 0 ? (
                            <span className="inline-flex items-center gap-2">
                              {m.label}
                              {m.custom && (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                  Custom
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-300">·</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-sm text-slate-600 capitalize">
                          {tipo}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-sm text-slate-600">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={c.taxa}
                            onChange={(e) =>
                              updateConfig(m.id, tipo, 'taxa', parseFloat(e.target.value) || 0)
                            }
                            className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-sm text-slate-600">
                          <input
                            type="number"
                            min="0"
                            value={c.prazo}
                            onChange={(e) =>
                              updateConfig(m.id, tipo, 'prazo', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"
                          />
                        </td>
                      </tr>
                    );
                  }),
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal cadastrar/editar bandeira */}
      {novaBandeiraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {bandeiraEditando ? 'Editar bandeira' : 'Nova bandeira'}
              </h3>
              <button
                type="button"
                onClick={() => setNovaBandeiraOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nome da bandeira</label>
                <input
                  type="text"
                  value={bandeiraForm.label}
                  onChange={(e) => setBandeiraForm({ ...bandeiraForm, label: e.target.value })}
                  placeholder="Ex.: Banescard"
                  className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Tipo</label>
                <select
                  value={bandeiraForm.tipo}
                  onChange={(e) => setBandeiraForm({ ...bandeiraForm, tipo: e.target.value as TipoBandeira })}
                  className="flex h-10 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="credito">Credito</option>
                  <option value="debito">Debito</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNovaBandeiraOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
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
