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
import { cn } from '@/lib/cn';
import { ExportButtons } from '@/components/ui/export-buttons';

const BANDEIRAS_CREDITO_DEBITO: { id: BandeiraCartao; label: string }[] = [
  { id: 'amex', label: 'Amex' },
  { id: 'elo-credito', label: 'Elo Credito' },
  { id: 'hipercard', label: 'Hipercard' },
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'visa', label: 'Visa' },
  { id: 'electron', label: 'Electron' },
  { id: 'elo-debito', label: 'Elo Debito' },
  { id: 'maestro', label: 'Maestro' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function AReceberPage() {
  const [dateFilter, setDateFilter] = useState<DateFilterValue>(getDefaultFilter);
  const [credito, setCredito] = useState<AReceberRow[]>([]);
  const [debito, setDebito] = useState<AReceberRow[]>([]);
  const [voucher, setVoucher] = useState<AReceberRow[]>([]);
  const [bandeirasVoucher, setBandeirasVoucher] = useState<string[]>([]);
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
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const creditoCompleto = useMemo(() => {
    return BANDEIRAS_CREDITO_DEBITO.map((b) => ({
      bandeira: b.label,
      aReceber: credito.find((r) => r.bandeira === b.id || r.bandeira === b.label)?.aReceber ?? 0,
    }));
  }, [credito]);

  const debitoCompleto = useMemo(() => {
    return BANDEIRAS_CREDITO_DEBITO.map((b) => ({
      bandeira: b.label,
      aReceber: debito.find((r) => r.bandeira === b.id || r.bandeira === b.label)?.aReceber ?? 0,
    }));
  }, [debito]);

  const voucherCompleto = useMemo(() => {
    if (bandeirasVoucher.length === 0) return voucher;
    return bandeirasVoucher.map((b) => ({
      bandeira: b,
      aReceber: voucher.find((r) => r.bandeira === b)?.aReceber ?? 0,
    }));
  }, [bandeirasVoucher, voucher]);

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

  function renderTabela(titulo: string, rows: AReceberRow[]) {
    const total = rows.reduce((a, r) => a + r.aReceber, 0);
    return (
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-2">
          <h2 className="text-sm font-semibold text-slate-800">{titulo}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px]">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Bandeira</th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">A receber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((r, i) => (
                <tr key={`${r.bandeira}-${i}`} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm text-slate-700">{r.bandeira}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-slate-900">{formatCurrency(r.aReceber)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-slate-200 bg-slate-50">
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">Total</td>
                <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">{formatCurrency(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Outras funcoes – A receber</h1>
          <p className="mt-1 text-sm text-slate-500">
            Credito, Debito e Voucher por bandeira. Bandeiras do voucher sao configuráveis.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <DateFilter value={dateFilter} onChange={setDateFilter} />
          <ExportButtons
            data={[
              ...creditoCompleto.map((r) => ({ tipo: 'Credito', bandeira: r.bandeira, aReceber: formatCurrency(r.aReceber) })),
              ...debitoCompleto.map((r) => ({ tipo: 'Debito', bandeira: r.bandeira, aReceber: formatCurrency(r.aReceber) })),
              ...voucherCompleto.map((r) => ({ tipo: 'Voucher', bandeira: r.bandeira, aReceber: formatCurrency(r.aReceber) })),
            ]}
            columns={[
              { key: 'tipo', label: 'Tipo' },
              { key: 'bandeira', label: 'Bandeira' },
              { key: 'aReceber', label: 'A receber' },
            ]}
            filename="a-receber"
            title="A receber"
          />
          <button
            type="button"
            onClick={() => setDialogBandeiras(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Settings2 className="h-4 w-4" />
            Bandeiras voucher
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {renderTabela('Credito', creditoCompleto)}
          {renderTabela('Debito', debitoCompleto)}
          {renderTabela('Voucher', voucherCompleto)}
        </div>
      )}

      <Dialog open={dialogBandeiras} onOpenChange={setDialogBandeiras}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bandeiras Voucher</DialogTitle>
            <p className="text-sm text-slate-500">Adicione ou remova linhas (bandeiras) da tabela Voucher.</p>
          </DialogHeader>
          <DialogBody>
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={novaBandeiraVoucher}
                onChange={(e) => setNovaBandeiraVoucher(e.target.value)}
                placeholder="Nova bandeira"
                className={cn(
                  'flex h-10 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm',
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
                <li key={b} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  <span className="text-slate-700">{b}</span>
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
                <li className="text-sm text-slate-500 py-2">Nenhuma bandeira. Adicione acima.</li>
              )}
            </ul>
          </DialogBody>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setDialogBandeiras(false)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Fechar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
