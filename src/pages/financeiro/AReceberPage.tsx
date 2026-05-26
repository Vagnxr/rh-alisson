import { useState, useMemo, useEffect, useCallback } from 'react';
import { Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { dateFilterToParams } from '@/lib/financeiro-api';
import type { AReceberRow } from '@/types/financeiro';
import type { BandeiraCartao } from '@/types/financeiro';
import { MAQUININHAS_PADRAO_LIST, MAQUININHAS_PADRAO_HABILITADAS, MAQUININHAS_PADRAO_IDS } from '@/lib/maquininhas';
import { cn } from '@/lib/cn';
import { ExportButtons } from '@/components/ui/export-buttons';
import { PAGE_TITLE, PAGE_SUBTITLE, BTN_OUTLINE } from '@/lib/uiClasses';

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
  } | null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function AReceberPage() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [credito, setCredito] = useState<AReceberRow[]>([]);
  const [debito, setDebito] = useState<AReceberRow[]>([]);
  const [voucher, setVoucher] = useState<AReceberRow[]>([]);
  const [bandeirasVoucher, setBandeirasVoucher] = useState<string[]>([]);
  const [maquininhasHabilitadas, setMaquininhasHabilitadas] = useState<MaquininhaInfo[]>([]);
  const [bandeirasCreditoCfg, setBandeirasCreditoCfg] = useState<{ id: string; label: string }[]>(BANDEIRAS_CREDITO);
  const [bandeirasDebitoCfg, setBandeirasDebitoCfg] = useState<{ id: string; label: string }[]>(BANDEIRAS_DEBITO);
  const [loading, setLoading] = useState(true);
  const [dialogBandeiras, setDialogBandeiras] = useState(false);
  const [novaBandeiraVoucher, setNovaBandeiraVoucher] = useState('');

  const params = useMemo(() => dateFilterToParams(dateFilter), [dateFilter]);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get<AReceberRow[]>('financeiro/outras-funcoes/a-receber/credito', { params }).then((r) => setCredito(Array.isArray(r.data) ? r.data : [])),
      api.get<AReceberRow[]>('financeiro/outras-funcoes/a-receber/debito', { params }).then((r) => setDebito(Array.isArray(r.data) ? r.data : [])),
      api.get<AReceberRow[]>('financeiro/outras-funcoes/a-receber/voucher', { params }).then((r) => setVoucher(Array.isArray(r.data) ? r.data : [])),
    ]).catch((err) => toast.error(err?.message ?? 'Erro ao carregar')).finally(() => setLoading(false));
    api.get<string[]>('financeiro/outras-funcoes/config/bandeiras-voucher').then((r) => setBandeirasVoucher(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    // Le maquininhas habilitadas + bandeiras cadastradas no config de taxas/prazos.
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

  /** Tabela por maquininha (credito ou debito). */
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
        <div className="border-b border-border bg-muted/40 px-4 py-2">
          <h2 className="text-sm font-semibold text-foreground">
            {tipo} <span className="text-muted-foreground">— {maquininha.label}</span>
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

  /** Voucher: nao discrimina por maquininha (cliente pediu pra deixar consolidado). */
  const voucherCompleto = useMemo(() => {
    if (bandeirasVoucher.length === 0) {
      // Agrega os recebidos por bandeira (sem distincao de maquininha).
      const map = new Map<string, number>();
      for (const r of voucher) {
        map.set(r.bandeira, (map.get(r.bandeira) ?? 0) + r.aReceber);
      }
      return Array.from(map.entries()).map(([bandeira, aReceber]) => ({ bandeira, aReceber }));
    }
    return bandeirasVoucher.map((b) => {
      const total = voucher.filter((r) => r.bandeira === b).reduce((a, r) => a + r.aReceber, 0);
      return { bandeira: b, aReceber: total };
    });
  }, [bandeirasVoucher, voucher]);

  const renderTabelaVoucher = () => {
    const total = voucherCompleto.reduce((a, r) => a + r.aReceber, 0);
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-muted/40 px-4 py-2">
          <h2 className="text-sm font-semibold text-foreground">
            Voucher <span className="text-muted-foreground">— consolidado</span>
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
              {voucherCompleto.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-center text-sm text-muted-foreground">Nenhuma bandeira</td>
                </tr>
              ) : voucherCompleto.map((r) => (
                <tr key={r.bandeira} className="hover:bg-muted/40">
                  <td className="px-4 py-2 text-sm text-foreground">{r.bandeira}</td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-foreground">{formatCurrency(r.aReceber)}</td>
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

  const addBandeiraVoucher = () => {
    const t = novaBandeiraVoucher.trim();
    if (!t) return;
    if (bandeirasVoucher.includes(t)) {
      toast.error('Bandeira ja existe.');
      return;
    }
    setBandeirasVoucher((prev) => [...prev, t]);
    setNovaBandeiraVoucher('');
    api.put('financeiro/outras-funcoes/config/bandeiras-voucher', { bandeiras: [...bandeirasVoucher, t] }).catch(() => {});
  };

  const removeBandeiraVoucher = (bandeira: string) => {
    setBandeirasVoucher((prev) => prev.filter((b) => b !== bandeira));
    api.put('financeiro/outras-funcoes/config/bandeiras-voucher', { bandeiras: bandeirasVoucher.filter((b) => b !== bandeira) }).catch(() => {});
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={PAGE_TITLE}>A Receber</h1>
          <p className={PAGE_SUBTITLE}>
            Credito e Debito separados por maquininha habilitada. Voucher consolidado por bandeira.
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
              ...voucherCompleto.map((r) => ({
                tipo: 'Voucher',
                maquininha: '—',
                bandeira: r.bandeira,
                aReceber: formatCurrency(r.aReceber),
              })),
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
          <button
            type="button"
            onClick={() => setDialogBandeiras(true)}
            className={BTN_OUTLINE}
          >
            <Settings2 className="h-4 w-4" />
            Bandeiras voucher
          </button>
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

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Voucher</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {renderTabelaVoucher()}
            </div>
          </section>
        </div>
      )}

      <Dialog open={dialogBandeiras} onOpenChange={setDialogBandeiras}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bandeiras Voucher</DialogTitle>
            <p className="text-sm text-muted-foreground">Adicione ou remova linhas (bandeiras) da tabela Voucher.</p>
          </DialogHeader>
          <DialogBody>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={novaBandeiraVoucher}
                onChange={(e) => setNovaBandeiraVoucher(e.target.value)}
                placeholder="Nova bandeira"
                className={cn(
                  'flex h-10 flex-1 rounded-lg border border-border px-3 py-2 text-sm',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500'
                )}
              />
              <button
                type="button"
                onClick={addBandeiraVoucher}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Adicionar
              </button>
            </div>
            <ul className="mt-4 space-y-2 max-h-48 overflow-y-auto">
              {bandeirasVoucher.map((b) => (
                <li key={b} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="text-foreground">{b}</span>
                  <button
                    type="button"
                    onClick={() => removeBandeiraVoucher(b)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                  >
                    Remover
                  </button>
                </li>
              ))}
              {bandeirasVoucher.length === 0 && (
                <li className="text-sm text-muted-foreground py-2">Nenhuma bandeira. Adicione acima.</li>
              )}
            </ul>
          </DialogBody>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogBandeiras(false)}
              className="rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40"
            >
              Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
