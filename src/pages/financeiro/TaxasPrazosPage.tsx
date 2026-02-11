import { useState, useEffect, useCallback } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { BandeiraCartao } from '@/types/financeiro';

export interface TaxaPrazoConfig {
  bandeira: BandeiraCartao;
  label: string;
  tipo: 'credito' | 'debito';
  taxaPercent: number;
  prazoDias: number;
}

const BANDEIRAS: { id: BandeiraCartao; label: string; tipo: 'credito' | 'debito' }[] = [
  { id: 'visa', label: 'Visa', tipo: 'credito' },
  { id: 'mastercard', label: 'Mastercard', tipo: 'credito' },
  { id: 'elo-credito', label: 'Elo Credito', tipo: 'credito' },
  { id: 'amex', label: 'Amex', tipo: 'credito' },
  { id: 'hipercard', label: 'Hipercard', tipo: 'credito' },
  { id: 'electron', label: 'Electron', tipo: 'debito' },
  { id: 'elo-debito', label: 'Elo Debito', tipo: 'debito' },
  { id: 'maestro', label: 'Maestro', tipo: 'debito' },
];

const defaultConfigs = (): TaxaPrazoConfig[] =>
  BANDEIRAS.map((b) => ({
    bandeira: b.id,
    label: b.label,
    tipo: b.tipo,
    taxaPercent: 0,
    prazoDias: 30,
  }));

export function TaxasPrazosPage() {
  const [configs, setConfigs] = useState<TaxaPrazoConfig[]>(defaultConfigs());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchConfigs = useCallback(() => {
    setLoading(true);
    api
      .get<{ taxas?: { bandeira: string; tipo: string; taxa: number }[]; prazos?: number[] }>('financeiro/controle-cartoes/taxas-prazos')
      .then((res) => {
        const data = res.data && typeof res.data === 'object' ? res.data : {};
        const taxas = Array.isArray(data.taxas) ? data.taxas : [];
        const prazos = Array.isArray(data.prazos) ? data.prazos : [];
        const prazoDefault = prazos.length > 0 ? prazos[0] : 30;
        const merged = BANDEIRAS.map((b) => {
          const found = taxas.find((t) => t.bandeira === b.id && t.tipo === b.tipo);
          return {
            bandeira: b.id,
            label: b.label,
            tipo: b.tipo,
            taxaPercent: found != null ? found.taxa : 0,
            prazoDias: prazoDefault,
          };
        });
        setConfigs(merged);
      })
      .catch(() => {
        setConfigs(defaultConfigs());
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  const updateLocal = (bandeira: BandeiraCartao, field: 'taxaPercent' | 'prazoDias', value: number) => {
    setConfigs((prev) =>
      prev.map((c) => (c.bandeira === bandeira ? { ...c, [field]: value } : c))
    );
  };

  const handleSave = () => {
    setSaving(true);
    const taxas = configs.map((c) => ({
      bandeira: c.bandeira,
      tipo: c.tipo,
      taxa: c.taxaPercent,
    }));
    const prazos = [...new Set(configs.map((c) => c.prazoDias))].sort((a, b) => a - b);
    api
      .put('financeiro/controle-cartoes/taxas-prazos', { taxas, prazos })
      .then(() => {
        toast.success('Taxas e prazos salvos.');
      })
      .catch((err) => {
        toast.error(err?.message ?? 'Erro ao salvar.');
      })
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
            Configure taxa (%) e prazo (dias) por bandeira para o controle de cartoes.
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

      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Bandeira
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Taxa (%)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Prazo (dias)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {configs.map((c) => (
              <tr key={c.bandeira} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-slate-900">
                  {c.label}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-sm text-slate-600 capitalize">
                  {c.tipo}
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-sm text-slate-600">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={c.taxaPercent}
                    onChange={(e) =>
                      updateLocal(c.bandeira, 'taxaPercent', parseFloat(e.target.value) || 0)
                    }
                    className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </td>
                <td className="whitespace-nowrap px-6 py-3 text-sm text-slate-600">
                  <input
                    type="number"
                    min="0"
                    value={c.prazoDias}
                    onChange={(e) =>
                      updateLocal(c.bandeira, 'prazoDias', parseInt(e.target.value, 10) || 0)
                    }
                    className="w-24 rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
