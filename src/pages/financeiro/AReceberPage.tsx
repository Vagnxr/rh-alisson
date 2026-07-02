import { useState, useMemo, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { api } from '@/lib/api';
import { dateFilterToParams } from '@/lib/financeiro-api';
import type { AReceberRow } from '@/types/financeiro';
import type { BandeiraCartao } from '@/types/financeiro';
import { MAQUININHAS_PADRAO_LIST, MAQUININHAS_PADRAO_HABILITADAS, MAQUININHAS_PADRAO_IDS } from '@/lib/maquininhas';
import { cn } from '@/lib/cn';
import { ExportButtons } from '@/components/ui/export-buttons';
import { PAGE_TITLE, PAGE_SUBTITLE } from '@/lib/uiClasses';
import { type ModulosHabilitados } from '@/types/taxas-prazos';
import { corHeaderClasses, DEFAULT_MAQUININHAS_CORES } from '@/lib/cores-maquininha';

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
  { id: 'pix' as BandeiraCartao, label: 'PIX' },
];

interface MaquininhaInfo {
  id: string;
  label: string;
}

interface TaxasJsonResp {
  taxas?: {
    bandeirasCadastradas?: { id: string; label: string; tipo: string }[];
    maquininhasCustom?: { id: string; label: string }[];
    maquininhasHabilitadas?: string[];
    maquininhasCores?: Record<string, string>;
    modulosHabilitados?: ModulosHabilitados;
  } | null;
}

/** Resposta do GET a-receber/voucher (v2): linhas por bandeira/categoria + DOC por bloco. */
interface VoucherAReceberResp {
  itens: { bandeira: string; categoria: string | null; label: string; aReceber: number }[];
  subtotal: number;
  doc: { bandeira: string; label: string; blocos: number; doc: number; total: number }[];
  docTotal: number;
  total: number;
}

interface IfoodAReceberResp {
  aReceber: number;
  valorBruto: number;
  valorLoja: number;
}

const VOUCHER_VAZIO: VoucherAReceberResp = { itens: [], subtotal: 0, doc: [], docTotal: 0, total: 0 };

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function AReceberPage() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [credito, setCredito] = useState<AReceberRow[]>([]);
  const [debito, setDebito] = useState<AReceberRow[]>([]);
  const [voucher, setVoucher] = useState<VoucherAReceberResp>(VOUCHER_VAZIO);
  const [ifood, setIfood] = useState<IfoodAReceberResp>({ aReceber: 0, valorBruto: 0, valorLoja: 0 });
  const [maquininhasHabilitadas, setMaquininhasHabilitadas] = useState<MaquininhaInfo[]>([]);
  const [bandeirasCreditoCfg, setBandeirasCreditoCfg] = useState<{ id: string; label: string }[]>(BANDEIRAS_CREDITO);
  const [bandeirasDebitoCfg, setBandeirasDebitoCfg] = useState<{ id: string; label: string }[]>(BANDEIRAS_DEBITO);
  const [modulos, setModulos] = useState<ModulosHabilitados>({ voucher: true, ifood: true });
  const [cores, setCores] = useState<Record<string, string>>({ ...DEFAULT_MAQUININHAS_CORES });
  const [loading, setLoading] = useState(true);

  const params = useMemo(() => dateFilterToParams(dateFilter), [dateFilter]);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<AReceberRow[]>('financeiro/outras-funcoes/a-receber/credito', { params }).then((r) => setCredito(Array.isArray(r.data) ? r.data : [])),
      api.get<AReceberRow[]>('financeiro/outras-funcoes/a-receber/debito', { params }).then((r) => setDebito(Array.isArray(r.data) ? r.data : [])),
      api.get<VoucherAReceberResp>('financeiro/outras-funcoes/a-receber/voucher', { params }).then((r) => {
        const d = r.data;
        setVoucher(d && Array.isArray(d.itens) ? d : VOUCHER_VAZIO);
      }),
      api.get<IfoodAReceberResp>('financeiro/outras-funcoes/a-receber/ifood', { params }).then((r) => {
        const d = r.data;
        setIfood({
          aReceber: Number(d?.aReceber) || 0,
          valorBruto: Number(d?.valorBruto) || 0,
          valorLoja: Number(d?.valorLoja) || 0,
        });
      }),
    ]).catch((err) => toast.error(err?.message ?? 'Erro ao carregar')).finally(() => setLoading(false));
    // Le maquininhas habilitadas, cores, modulos e bandeiras cadastradas no config de taxas/prazos.
    api.get<TaxasJsonResp>('financeiro/controle-cartoes/taxas-prazos').then((r) => {
      const taxasJson = r.data?.taxas;
      if (!taxasJson || typeof taxasJson !== 'object') return;
      // Maquininhas habilitadas (com fallback para todas as padrao habilitadas).
      const habilitadasIds = Array.isArray(taxasJson.maquininhasHabilitadas) && taxasJson.maquininhasHabilitadas.length > 0
        ? taxasJson.maquininhasHabilitadas
        : MAQUININHAS_PADRAO_HABILITADAS;
      const customs = Array.isArray(taxasJson.maquininhasCustom) ? taxasJson.maquininhasCustom : [];
      const todas = [
        ...MAQUININHAS_PADRAO_LIST.map((m) => ({ id: m.id, label: m.label })),
        ...customs.filter((c) => c && c.id && c.label && !MAQUININHAS_PADRAO_IDS.has(c.id)).map((c) => ({ id: c.id, label: c.label })),
      ];
      const habilitadas = todas.filter((m) => habilitadasIds.includes(m.id));
      setMaquininhasHabilitadas(habilitadas.length > 0 ? habilitadas : todas);
      setModulos(taxasJson.modulosHabilitados ?? { voucher: true, ifood: true });
      if (taxasJson.maquininhasCores && typeof taxasJson.maquininhasCores === 'object') {
        setCores({ ...DEFAULT_MAQUININHAS_CORES, ...taxasJson.maquininhasCores });
      }
      // Bandeiras (sobrepoe defaults se o tenant configurou).
      const bandsCfg = Array.isArray(taxasJson.bandeirasCadastradas) ? taxasJson.bandeirasCadastradas : [];
      if (bandsCfg.length > 0) {
        const credCfg = bandsCfg.filter((b) => b.tipo === 'credito').map((b) => ({ id: b.id, label: b.label }));
        const debCfg = bandsCfg.filter((b) => b.tipo === 'debito').map((b) => ({ id: b.id, label: b.label }));
        if (credCfg.length > 0) setBandeirasCreditoCfg(credCfg);
        if (debCfg.length > 0) setBandeirasDebitoCfg(debCfg);
      }
    }).catch(() => {});
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Para uma maquininha + bandeira, soma os valores recebidos. */
  const valorPara = (rows: AReceberRow[], operadora: string, bandeira: string): number => {
    return rows
      .filter((r) => (r.operadora ?? '') === operadora && (r.bandeira === bandeira))
      .reduce((acc, r) => acc + r.aReceber, 0);
  };

  /** Tabela por maquininha (credito ou debito). Cabecalho com a cor configurada no Gerenciar. */
  const renderTabelaPorMaquininha = (
    tipo: 'Credito' | 'Debito',
    maquininha: MaquininhaInfo,
    bandeirasList: { id: string; label: string }[],
    rows: AReceberRow[],
  ) => {
    const linhas = bandeirasList.map((b) => ({
      bandeira: b.label,
      bandeiraId: b.id,
      aReceber: valorPara(rows, maquininha.id, b.id),
    }));
    const total = linhas.reduce((a, l) => a + l.aReceber, 0);
    return (
      <div key={`${tipo}-${maquininha.id}`} className="rounded-xl border border-border bg-card overflow-hidden">
        <div className={cn('border-b border-border px-4 py-2', corHeaderClasses(cores, maquininha.id))}>
          <h2 className="text-sm font-semibold">
            {tipo} <span className="opacity-70">— {maquininha.label}</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[260px]">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Bandeira</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-muted-foreground">A receber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {linhas.map((l) => (
                <tr key={l.bandeiraId} className="hover:bg-muted/40">
                  <td className="px-4 py-2 text-sm text-foreground">{l.bandeira}</td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-foreground">{formatCurrency(l.aReceber)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border bg-muted/40">
              <tr>
                <td className="px-4 py-2 text-sm font-medium text-foreground">Total</td>
                <td className="px-4 py-2 text-right text-sm font-bold text-foreground">{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  /** Voucher consolidado: linhas por bandeira/categoria + DOC por bloco de fechamento. */
  const renderTabelaVoucher = () => {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className={cn('border-b border-border px-4 py-2', corHeaderClasses(cores, 'voucher'))}>
          <h2 className="text-sm font-semibold">
            Voucher <span className="opacity-70">— consolidado</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px]">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Bandeira</th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-muted-foreground">A receber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {voucher.itens.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-center text-sm text-muted-foreground">
                    Nenhuma bandeira voucher cadastrada em Taxas e Prazos.
                  </td>
                </tr>
              ) : voucher.itens.map((r) => (
                <tr key={`${r.bandeira}-${r.categoria ?? ''}`} className="hover:bg-muted/40">
                  <td className="px-4 py-2 text-sm text-foreground">{r.label}</td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-foreground">{formatCurrency(r.aReceber)}</td>
                </tr>
              ))}
              {voucher.doc.map((d) => (
                <tr key={`doc-${d.bandeira}`} className="hover:bg-muted/40">
                  <td className="px-4 py-2 text-sm text-red-600 dark:text-red-400">
                    DOC {d.label} <span className="text-xs text-muted-foreground">({d.blocos} bloco{d.blocos > 1 ? 's' : ''} x {formatCurrency(d.doc)})</span>
                  </td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-red-600 dark:text-red-400">
                    -{formatCurrency(d.total)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border bg-muted/40">
              <tr>
                <td className="px-4 py-2 text-sm font-medium text-foreground">Total</td>
                <td className="px-4 py-2 text-right text-sm font-bold text-foreground">{formatCurrency(voucher.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  /** Card iFood: a receber calculado + valor bruto/loja informativos. */
  const renderTabelaIfood = () => {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className={cn('border-b border-border px-4 py-2', corHeaderClasses(cores, 'ifood'))}>
          <h2 className="text-sm font-semibold">
            iFood <span className="opacity-70">— consolidado</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px]">
            <tbody className="divide-y divide-border">
              <tr className="hover:bg-muted/40">
                <td className="px-4 py-2 text-sm text-foreground">Valor bruto (iFood)</td>
                <td className="px-4 py-2 text-right text-sm font-medium text-foreground">{formatCurrency(ifood.valorBruto)}</td>
              </tr>
              <tr className="hover:bg-muted/40">
                <td className="px-4 py-2 text-sm text-foreground">Recebido na loja</td>
                <td className="px-4 py-2 text-right text-sm font-medium text-foreground">{formatCurrency(ifood.valorLoja)}</td>
              </tr>
            </tbody>
            <tfoot className="border-t border-border bg-muted/40">
              <tr>
                <td className="px-4 py-2 text-sm font-medium text-foreground">A receber</td>
                <td className="px-4 py-2 text-right text-sm font-bold text-foreground">{formatCurrency(ifood.aReceber)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={PAGE_TITLE}>A Receber</h1>
          <p className={PAGE_SUBTITLE}>
            Credito e Debito separados por maquininha habilitada. Voucher e iFood consolidados.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={[
              ...maquininhasHabilitadas.flatMap((m) =>
                bandeirasCreditoCfg.map((b) => ({
                  tipo: 'Credito',
                  maquininha: m.label,
                  bandeira: b.label,
                  aReceber: formatCurrency(valorPara(credito, m.id, b.id)),
                })),
              ),
              ...maquininhasHabilitadas.flatMap((m) =>
                bandeirasDebitoCfg.map((b) => ({
                  tipo: 'Debito',
                  maquininha: m.label,
                  bandeira: b.label,
                  aReceber: formatCurrency(valorPara(debito, m.id, b.id)),
                })),
              ),
              ...(modulos.voucher
                ? voucher.itens.map((r) => ({
                    tipo: 'Voucher',
                    maquininha: '—',
                    bandeira: r.label,
                    aReceber: formatCurrency(r.aReceber),
                  }))
                : []),
              ...(modulos.ifood
                ? [{ tipo: 'iFood', maquininha: '—', bandeira: 'iFood', aReceber: formatCurrency(ifood.aReceber) }]
                : []),
            ]}
            columns={[
              { key: 'tipo', label: 'Tipo' },
              { key: 'maquininha', label: 'Maquininha' },
              { key: 'bandeira', label: 'Bandeira' },
              { key: 'aReceber', label: 'A receber' },
            ]}
            filename="a-receber"
            title="A receber"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Credito</h2>
            {maquininhasHabilitadas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma maquininha habilitada.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {maquininhasHabilitadas.map((m) =>
                  renderTabelaPorMaquininha('Credito', m, bandeirasCreditoCfg, credito),
                )}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Debito</h2>
            {maquininhasHabilitadas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma maquininha habilitada.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {maquininhasHabilitadas.map((m) =>
                  renderTabelaPorMaquininha('Debito', m, bandeirasDebitoCfg, debito),
                )}
              </div>
            )}
          </section>

          {(modulos.voucher || modulos.ifood) && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Voucher e iFood
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {modulos.voucher && renderTabelaVoucher()}
                {modulos.ifood && renderTabelaIfood()}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
