import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { DateFilter, getDefaultFilter, type DateFilterValue } from '@/components/ui/date-filter';
import { api } from '@/lib/api';
import { dateFilterToParams } from '@/lib/financeiro-api';
import { ExportButtons } from '@/components/ui/export-buttons';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useLatestRequest } from '@/hooks/useLatestRequest';
import { formatValorForInput, parseValorFromInput } from '@/lib/formatValor';
import { PAGE_TITLE, PAGE_SUBTITLE } from '@/lib/uiClasses';
import type {
  VendaPerdaCreditoRow,
  VendaPerdaDebitoPixRow,
  VendaPerdaVoucherRow,
  VendaPerdaIfoodRow,
  VendaPerdaTotalCartoesRow,
  VendaPerdaPosAluguelRow,
  VendaPerdaPerdaTotalRow,
  VendaPerdaConfigMes,
  VendaPerdaIfoodConfig,
} from '@/types/financeiro';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(2).replace('.', ',')}%`;
}

/** Retorna YYYY-MM quando o filtro cobre um unico mes; senao null. */
function mesUnicoDoFiltro(filter: DateFilterValue): string | null {
  const startYM = `${filter.startDate.getFullYear()}-${String(filter.startDate.getMonth() + 1).padStart(2, '0')}`;
  const endYM = `${filter.endDate.getFullYear()}-${String(filter.endDate.getMonth() + 1).padStart(2, '0')}`;
  return startYM === endYM ? startYM : null;
}

const defaultCredito = (): VendaPerdaCreditoRow => ({ totalBruto: 0, descontos: 0, totalLiquido: 0 });
const defaultDebitoPix = (): VendaPerdaDebitoPixRow => ({ totalBruto: 0, descontos: 0, totalLiquido: 0 });
const defaultVoucher = (): VendaPerdaVoucherRow => ({ totalBruto: 0, descontos: 0, totalLiquido: 0 });
const defaultIfood = (): VendaPerdaIfoodRow => ({ totalBruto: 0, descontos: 0, totalLiquido: 0 });
const defaultTotalCartoes = (): VendaPerdaTotalCartoesRow => ({ valorBruto: 0, descontos: 0, totalLiquido: 0 });
const defaultPosAluguel = (): VendaPerdaPosAluguelRow => ({ valor: 0 });
const defaultPerdaTotal = (): VendaPerdaPerdaTotalRow => ({ valor: 0 });
const defaultIfoodConfig = (): VendaPerdaIfoodConfig => ({
  valorBruto: 0,
  viaLoja: 0,
  descontos: 0,
  valorLiquido: 0,
});

const CARD_HEADER = 'border-b border-border bg-muted/40 px-5 py-3';
const CARD_TITLE = 'text-sm font-semibold text-foreground';

export function VendaPerdaPage() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [credito, setCredito] = useState<VendaPerdaCreditoRow>(defaultCredito());
  const [debitoPix, setDebitoPix] = useState<VendaPerdaDebitoPixRow>(defaultDebitoPix());
  const [voucher, setVoucher] = useState<VendaPerdaVoucherRow>(defaultVoucher());
  const [ifood, setIfood] = useState<VendaPerdaIfoodRow>(defaultIfood());
  const [totalCartoes, setTotalCartoes] = useState<VendaPerdaTotalCartoesRow>(defaultTotalCartoes());
  const [posAluguel, setPosAluguel] = useState<VendaPerdaPosAluguelRow>(defaultPosAluguel());
  const [perdaTotal, setPerdaTotal] = useState<VendaPerdaPerdaTotalRow>(defaultPerdaTotal());
  const [configMes, setConfigMes] = useState<VendaPerdaConfigMes>({ posAluguel: 0, ifood: defaultIfoodConfig() });
  const [posAluguelInput, setPosAluguelInput] = useState('');
  const [ifoodConfigInput, setIfoodConfigInput] = useState({
    valorBruto: '',
    viaLoja: '',
    descontos: '',
    valorLiquido: '',
  });

  const mesUnico = useMemo(() => mesUnicoDoFiltro(dateFilter), [dateFilter]);
  const editavel = mesUnico != null;

  const taxaEfetivaIfood = useMemo(() => {
    const bruto = parseValorFromInput(ifoodConfigInput.valorBruto);
    const descontos = parseValorFromInput(ifoodConfigInput.descontos);
    if (!bruto || bruto <= 0) return null;
    return (descontos / bruto) * 100;
  }, [ifoodConfigInput.valorBruto, ifoodConfigInput.descontos]);

  const iniciarBusca = useLatestRequest();

  const fetchData = useCallback(() => {
    // So a busca mais recente escreve no estado (ver useLatestRequest).
    const atual = iniciarBusca();
    setLoading(true);
    const params = dateFilterToParams(dateFilter);
    const mes = mesUnicoDoFiltro(dateFilter);
    const requests: [
      Promise<{ data?: Record<string, unknown> }>,
      Promise<{ data?: VendaPerdaConfigMes }> | null,
    ] = [
      api.get('financeiro/outras-funcoes/venda-perda', { params }),
      mes
        ? api.get<VendaPerdaConfigMes>('financeiro/outras-funcoes/venda-perda/config', {
            params: { mes },
          })
        : null,
    ];

    Promise.all([requests[0], requests[1] ?? Promise.resolve(null)])
      .then(([resumo, configRes]) => {
        if (!atual()) return;
        const d = resumo.data as {
          credito?: VendaPerdaCreditoRow;
          debitoPix?: VendaPerdaDebitoPixRow;
          voucher?: VendaPerdaVoucherRow;
          alimRef?: VendaPerdaVoucherRow;
          ifood?: VendaPerdaIfoodRow;
          food?: VendaPerdaIfoodRow;
          totalCartoes?: VendaPerdaTotalCartoesRow;
          posAluguel?: VendaPerdaPosAluguelRow;
          perdaTotal?: VendaPerdaPerdaTotalRow;
        };
        if (d?.credito) setCredito(d.credito);
        if (d?.debitoPix) setDebitoPix(d.debitoPix);
        if (d?.voucher) setVoucher(d.voucher);
        else if (d?.alimRef) setVoucher(d.alimRef);
        if (d?.ifood) setIfood(d.ifood);
        else if (d?.food) setIfood(d.food);
        if (d?.totalCartoes) setTotalCartoes(d.totalCartoes);
        if (d?.posAluguel) setPosAluguel(d.posAluguel);
        if (d?.perdaTotal) setPerdaTotal(d.perdaTotal);

        if (configRes?.data) {
          const cfg = configRes.data;
          setConfigMes(cfg);
          setPosAluguelInput(formatValorForInput(cfg.posAluguel));
          setIfoodConfigInput({
            valorBruto: formatValorForInput(cfg.ifood.valorBruto),
            viaLoja: formatValorForInput(cfg.ifood.viaLoja),
            descontos: formatValorForInput(cfg.ifood.descontos),
            valorLiquido: formatValorForInput(cfg.ifood.valorLiquido),
          });
        } else {
          setConfigMes({ posAluguel: 0, ifood: defaultIfoodConfig() });
          setPosAluguelInput('');
          setIfoodConfigInput({
            valorBruto: '',
            viaLoja: '',
            descontos: '',
            valorLiquido: '',
          });
        }
      })
      .catch((err) => {
        if (atual()) toast.error(err?.message ?? 'Erro ao carregar');
      })
      .finally(() => {
        if (atual()) setLoading(false);
      });
  }, [dateFilter, iniciarBusca]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Grava a configuracao do mes (POS aluguel + iFood).
   *
   * Roda no `onBlur` de cada campo. Antes era preciso clicar em "Salvar
   * configuracao do mes": o cliente digitou 100,00 em POS aluguel, nao clicou, e
   * reportou que o valor "nao esta somando no Perda total" — alem de nao entender
   * para que servia o botao. O calculo no backend sempre esteve certo; o que
   * faltava era o valor chegar la.
   */
  const handleSalvarConfig = useCallback(async () => {
    if (!mesUnico) return;
    setSavingConfig(true);
    try {
      const payload: VendaPerdaConfigMes = {
        posAluguel: parseValorFromInput(posAluguelInput) ?? 0,
        ifood: {
          valorBruto: parseValorFromInput(ifoodConfigInput.valorBruto) ?? 0,
          viaLoja: parseValorFromInput(ifoodConfigInput.viaLoja) ?? 0,
          descontos: parseValorFromInput(ifoodConfigInput.descontos) ?? 0,
          valorLiquido: parseValorFromInput(ifoodConfigInput.valorLiquido) ?? 0,
        },
      };
      await api.put(`financeiro/outras-funcoes/venda-perda/config?mes=${encodeURIComponent(mesUnico)}`, payload);
      // Sem toast: o salvamento e automatico e a atualizacao do card ja e o
      // retorno visivel. Toast a cada campo viraria ruido.
      fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar';
      toast.error(msg);
    } finally {
      setSavingConfig(false);
    }
  }, [mesUnico, posAluguelInput, ifoodConfigInput, fetchData]);

  const exportData = useMemo(
    () => [
      { tipo: 'Credito', totalBruto: formatCurrency(credito.totalBruto), descontos: formatCurrency(credito.descontos), totalLiquido: formatCurrency(credito.totalLiquido) },
      { tipo: 'Debito/PIX', totalBruto: formatCurrency(debitoPix.totalBruto), descontos: formatCurrency(debitoPix.descontos), totalLiquido: formatCurrency(debitoPix.totalLiquido) },
      { tipo: 'Voucher', totalBruto: formatCurrency(voucher.totalBruto), descontos: formatCurrency(voucher.descontos), totalLiquido: formatCurrency(voucher.totalLiquido) },
      { tipo: 'iFood (cartoes)', totalBruto: formatCurrency(ifood.totalBruto), descontos: formatCurrency(ifood.descontos), totalLiquido: formatCurrency(ifood.totalLiquido) },
      { tipo: 'Total cartoes', totalBruto: formatCurrency(totalCartoes.valorBruto), descontos: formatCurrency(totalCartoes.descontos), totalLiquido: formatCurrency(totalCartoes.totalLiquido) },
      { tipo: 'POS aluguel', valor: formatCurrency(posAluguel.valor) },
      { tipo: 'Perda total', valor: formatCurrency(perdaTotal.valor) },
    ],
    [credito, debitoPix, voucher, ifood, totalCartoes, posAluguel, perdaTotal],
  );

  function renderTabelaResumo(
    titulo: string,
    row: VendaPerdaCreditoRow | VendaPerdaDebitoPixRow | VendaPerdaVoucherRow | VendaPerdaIfoodRow,
  ) {
    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className={CARD_HEADER}>
          <h2 className={CARD_TITLE}>{titulo}</h2>
        </div>
        <div className="overflow-x-auto p-1">
          <table className="w-full min-w-[280px]">
            <thead className="border-b border-border bg-muted/20">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Total bruto</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Descontos</th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Total liquido</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-muted/40">
                <td className="px-5 py-4 text-sm font-medium text-foreground">{formatCurrency(row.totalBruto)}</td>
                <td className="px-5 py-4 text-right text-sm text-foreground">{formatCurrency(row.descontos)}</td>
                <td className="px-5 py-4 text-right text-sm font-semibold text-foreground">{formatCurrency(row.totalLiquido)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className={PAGE_TITLE}>Venda e Perda</h1>
          <p className={PAGE_SUBTITLE}>
            Resumo por tipo: credito, debito/PIX, voucher, iFood, total cartoes, POS aluguel e perda total.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={exportData}
            columns={[
              { key: 'tipo', label: 'Tipo' },
              { key: 'totalBruto', label: 'Total bruto' },
              { key: 'descontos', label: 'Descontos' },
              { key: 'totalLiquido', label: 'Total liquido' },
              { key: 'valor', label: 'Valor' },
            ]}
            filename="venda-perda"
            title="Venda e perda"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {renderTabelaResumo('Credito', credito)}
          {renderTabelaResumo('Debito/PIX', debitoPix)}
          {renderTabelaResumo('Voucher', voucher)}
          {renderTabelaResumo('iFood', ifood)}

          <div className="rounded-xl border border-border bg-card overflow-hidden sm:col-span-2 xl:col-span-1">
            <div className={CARD_HEADER}>
              <h2 className={CARD_TITLE}>iFood — configuracao mensal</h2>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Valor bruto</label>
                  {editavel ? (
                    <CurrencyInput
                      value={ifoodConfigInput.valorBruto}
                onBlur={handleSalvarConfig}
                      onChange={(v) => setIfoodConfigInput((s) => ({ ...s, valorBruto: v }))}
                    />
                  ) : (
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(configMes.ifood.valorBruto)}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Via loja</label>
                  {editavel ? (
                    <CurrencyInput
                      value={ifoodConfigInput.viaLoja}
                onBlur={handleSalvarConfig}
                      onChange={(v) => setIfoodConfigInput((s) => ({ ...s, viaLoja: v }))}
                    />
                  ) : (
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(configMes.ifood.viaLoja)}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Descontos</label>
                  {editavel ? (
                    <CurrencyInput
                      value={ifoodConfigInput.descontos}
                onBlur={handleSalvarConfig}
                      onChange={(v) => setIfoodConfigInput((s) => ({ ...s, descontos: v }))}
                    />
                  ) : (
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(configMes.ifood.descontos)}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium uppercase text-muted-foreground">Valor liquido</label>
                  {editavel ? (
                    <CurrencyInput
                      value={ifoodConfigInput.valorLiquido}
                onBlur={handleSalvarConfig}
                      onChange={(v) => setIfoodConfigInput((s) => ({ ...s, valorLiquido: v }))}
                    />
                  ) : (
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(configMes.ifood.valorLiquido)}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Taxa efetiva:{' '}
                <span className="font-medium text-foreground">
                  {taxaEfetivaIfood != null ? formatPercent(taxaEfetivaIfood) : '—'}
                </span>
              </p>
              {!editavel && (
                <p className="text-xs text-muted-foreground">
                  Selecione um unico mes no filtro para editar POS aluguel e iFood.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className={CARD_HEADER}>
              <h2 className={CARD_TITLE}>Total cartoes</h2>
            </div>
            <div className="overflow-x-auto p-1">
              <table className="w-full min-w-[280px]">
                <thead className="border-b border-border bg-muted/20">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Valor bruto</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Descontos</th>
                    <th className="px-5 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Total liquido</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-muted/40">
                    <td className="px-5 py-4 text-sm font-medium text-foreground">{formatCurrency(totalCartoes.valorBruto)}</td>
                    <td className="px-5 py-4 text-right text-sm text-foreground">{formatCurrency(totalCartoes.descontos)}</td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-foreground">{formatCurrency(totalCartoes.totalLiquido)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className={CARD_HEADER}>
              <h2 className={CARD_TITLE}>POS aluguel</h2>
            </div>
            <div className="space-y-4 p-5">
              {editavel ? (
                <CurrencyInput
                  value={posAluguelInput}
                  onChange={setPosAluguelInput}
                  onBlur={handleSalvarConfig}
                />
              ) : (
                <p className="text-3xl font-bold text-foreground">{formatCurrency(posAluguel.valor)}</p>
              )}
              {editavel && (
                <p className="text-sm text-muted-foreground">
                  {savingConfig
                    ? 'Salvando...'
                    : 'Aluguel das maquininhas neste mes. Ja somado na Perda total.'}
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className={CARD_HEADER}>
              <h2 className={CARD_TITLE}>Perda total</h2>
            </div>
            <div className="p-5">
              <p className="text-3xl font-bold text-foreground">{formatCurrency(perdaTotal.valor)}</p>
            </div>
          </div>


        </div>
      )}
    </div>
  );
}
