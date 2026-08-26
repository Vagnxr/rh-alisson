import { useState, useMemo, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { api } from '@/lib/api';
import { dateFilterToParams } from '@/lib/financeiro-api';
import type { AReceberRow } from '@/types/financeiro';
import { cn } from '@/lib/cn';
import { ExportButtons } from '@/components/ui/export-buttons';
import { PAGE_TITLE, PAGE_SUBTITLE } from '@/lib/uiClasses';
import { useTaxasPrazos, type MaquininhaInfo } from '@/hooks/useTaxasPrazos';
import { useLatestRequest } from '@/hooks/useLatestRequest';
import { corHeaderClasses } from '@/lib/cores-maquininha';

/**
 * Bandeiras e maquininhas vem de `useTaxasPrazos` — fonte unica.
 * PIX nao e bandeira de debito: tem secao propria por maquininha.
 */

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
  const [pix, setPix] = useState<AReceberRow[]>([]);
  const [voucher, setVoucher] = useState<VoucherAReceberResp>(VOUCHER_VAZIO);
  const [ifood, setIfood] = useState<IfoodAReceberResp>({ aReceber: 0, valorBruto: 0, valorLoja: 0 });
  const {
    bandeirasCredito: bandeirasCreditoCfg,
    bandeirasDebito: bandeirasDebitoCfg,
    maquininhasVisiveis: maquininhasHabilitadas,
    modulos,
    cores,
  } = useTaxasPrazos();
  const [loading, setLoading] = useState(true);

  const params = useMemo(() => dateFilterToParams(dateFilter), [dateFilter]);

  const iniciarBusca = useLatestRequest();

  const fetchData = useCallback(() => {
    // So a busca mais recente escreve no estado (ver useLatestRequest).
    const atual = iniciarBusca();

    setLoading(true);
    Promise.all([
      api.get<AReceberRow[]>('financeiro/outras-funcoes/a-receber/credito', { params }).then((r) => {
        if (atual()) setCredito(Array.isArray(r.data) ? r.data : []);
      }),
      api.get<AReceberRow[]>('financeiro/outras-funcoes/a-receber/debito', { params }).then((r) => {
        if (atual()) setDebito(Array.isArray(r.data) ? r.data : []);
      }),
      api.get<AReceberRow[]>('financeiro/outras-funcoes/a-receber/pix', { params }).then((r) => {
        if (atual()) setPix(Array.isArray(r.data) ? r.data : []);
      }),
      api.get<VoucherAReceberResp>('financeiro/outras-funcoes/a-receber/voucher', { params }).then((r) => {
        const d = r.data;
        if (atual()) setVoucher(d && Array.isArray(d.itens) ? d : VOUCHER_VAZIO);
      }),
      api.get<IfoodAReceberResp>('financeiro/outras-funcoes/a-receber/ifood', { params }).then((r) => {
        const d = r.data;
        if (atual()) {
          setIfood({
            aReceber: Number(d?.aReceber) || 0,
            valorBruto: Number(d?.valorBruto) || 0,
            valorLoja: Number(d?.valorLoja) || 0,
          });
        }
      }),
    ])
      .catch((err) => {
        if (atual()) toast.error(err?.message ?? 'Erro ao carregar');
      })
      .finally(() => {
        if (atual()) setLoading(false);
      });
  }, [params, iniciarBusca]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Para uma maquininha + bandeira, soma os valores recebidos. */
  const valorPara = (rows: AReceberRow[], operadora: string, bandeira: string): number => {
    return rows
      .filter((r) => (r.operadora ?? '') === operadora && r.bandeira === bandeira)
      .reduce((acc, r) => acc + r.aReceber, 0);
  };

  /**
   * Lancamentos que nao casam com nenhuma linha do cadastro da maquininha —
   * bandeira removida ou renomeada. Vao para uma linha "Outras" em vez de sumir.
   */
  const outrasDaMaquininha = (
    rows: AReceberRow[],
    operadora: string,
    bandeirasList: { id: string; label: string }[],
  ): number => {
    const conhecidas = new Set(bandeirasList.map((b) => b.id));
    return rows
      .filter((r) => (r.operadora ?? '') === operadora && !conhecidas.has(r.bandeira ?? ''))
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
    const outras = outrasDaMaquininha(rows, maquininha.id, bandeirasList);
    if (outras !== 0) {
      linhas.push({ bandeira: 'Outras', bandeiraId: '__outras', aReceber: outras });
    }
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

  /**
   * Card para lancamentos sem maquininha (ou com maquininha desabilitada).
   * So aparece quando ha valor — evita poluir a tela no caso normal, e garante
   * que a soma da tela feche com a do banco.
   */
  const renderSemMaquininha = (tipo: 'Credito' | 'Debito', rows: AReceberRow[]) => {
    const idsHabilitados = new Set(maquininhasHabilitadas.map((m) => m.id));
    const orfaos = rows.filter((r) => !idsHabilitados.has(r.operadora ?? ''));
    const total = orfaos.reduce((a, r) => a + r.aReceber, 0);
    if (total === 0) return null;
    return (
      <div key={`orfaos-${tipo}`} className="rounded-xl border border-dashed border-border bg-card overflow-hidden">
        <div className="border-b border-border bg-muted/40 px-4 py-2">
          <h2 className="text-sm font-semibold text-foreground">
            {tipo} <span className="opacity-70">— sem maquininha</span>
          </h2>
        </div>
        <table className="w-full min-w-[260px]">
          <tbody className="divide-y divide-border">
            {orfaos.map((r, i) => (
              <tr key={`${r.operadora ?? 'sem'}-${r.bandeira}-${i}`} className="hover:bg-muted/40">
                <td className="px-4 py-2 text-sm text-foreground">{r.bandeira || 'Sem bandeira'}</td>
                <td className="px-4 py-2 text-right text-sm font-medium text-foreground">
                  {formatCurrency(r.aReceber)}
                </td>
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
    );
  };

  /**
   * PIX consolidado: uma linha por maquininha.
   *
   * Diferente de credito e debito, PIX nao tem bandeira — por isso nao cabe no
   * `renderTabelaPorMaquininha`. O cliente apontou "no a receber nao achei o
   * PIX": a modalidade existe no Controle de Cartoes mas nao tinha card aqui.
   */
  const renderTabelaPix = () => {
    const linhas = maquininhasHabilitadas.map((m) => ({
      id: m.id,
      label: m.label,
      aReceber: pix
        .filter((r) => (r.operadora ?? '') === m.id)
        .reduce((acc, r) => acc + r.aReceber, 0),
    }));
    const idsHabilitados = new Set(maquininhasHabilitadas.map((m) => m.id));
    const orfaos = pix
      .filter((r) => !idsHabilitados.has(r.operadora ?? ''))
      .reduce((acc, r) => acc + r.aReceber, 0);
    if (orfaos !== 0) linhas.push({ id: '__sem', label: 'Sem maquininha', aReceber: orfaos });
    const total = linhas.reduce((a, l) => a + l.aReceber, 0);
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className={cn('border-b border-border px-4 py-2', corHeaderClasses(cores, 'pix'))}>
          <h2 className="text-sm font-semibold">
            PIX <span className="opacity-70">— consolidado</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[260px]">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                  Maquininha
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                  A receber
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {linhas.map((l) => (
                <tr key={l.id} className="hover:bg-muted/40">
                  <td className="px-4 py-2 text-sm text-foreground">{l.label}</td>
                  <td className="px-4 py-2 text-right text-sm font-medium text-foreground">
                    {formatCurrency(l.aReceber)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-border bg-muted/40">
              <tr>
                <td className="px-4 py-2 text-sm font-medium text-foreground">Total</td>
                <td className="px-4 py-2 text-right text-sm font-bold text-foreground">
                  {formatCurrency(total)}
                </td>
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
            Periodo por <strong>data de recebimento</strong> — um lancamento aparece no dia em que o
            valor entra, nao no dia da venda. Credito e Debito por maquininha; Voucher e iFood
            consolidados.
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
              ...maquininhasHabilitadas.map((m) => ({
                tipo: 'PIX',
                maquininha: m.label,
                bandeira: '—',
                aReceber: formatCurrency(
                  pix.filter((r) => (r.operadora ?? '') === m.id).reduce((a, r) => a + r.aReceber, 0),
                ),
              })),
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
                {renderSemMaquininha('Credito', credito)}
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
                {renderSemMaquininha('Debito', debito)}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">PIX</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{renderTabelaPix()}</div>
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
