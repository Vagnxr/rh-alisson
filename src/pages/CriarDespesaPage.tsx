import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { DespesaCategoria } from '@/types/despesa';
import { DESPESA_CATEGORIAS, TIPOS_DESPESA } from '@/types/despesa';
import { formatDateToLocalYYYYMMDD } from '@/lib/date';
import { useDespesaTiposStore } from '@/stores/despesaTiposStore';
import { SelectRecorrencia } from '@/components/ui/select-recorrencia';
import type { TipoRecorrencia } from '@/types/recorrencia';

const CATEGORIAS_KEYS: DespesaCategoria[] = [
  'despesa-fixa',
  'despesa-extra',
  'despesa-funcionario',
  'despesa-imposto',
  'despesa-veiculo',
  'despesa-banco',
];

export function CriarDespesaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    categoria: 'despesa-fixa' as DespesaCategoria,
    data: formatDateToLocalYYYYMMDD(new Date()),
    tipo: (TIPOS_DESPESA['despesa-fixa'] ?? ['OUTROS'])[0] ?? '',
    descricao: '',
    valor: 0,
    comunicarAgenda: false,
    recorrente: false,
    recorrencia: 'mensal' as TipoRecorrencia,
    recorrenciaFim: '',
  });

  const { getTipos, fetchTipos } = useDespesaTiposStore();
  const tiposPadrao = TIPOS_DESPESA[form.categoria] ?? ['OUTROS'];
  const tiposCustom = getTipos(form.categoria).filter((t) => !tiposPadrao.includes(t.label));
  const tiposDisponiveis = [...tiposPadrao, ...tiposCustom.map((t) => t.label)];

  useEffect(() => {
    fetchTipos(form.categoria).catch(() => {});
  }, [form.categoria, fetchTipos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tipo) {
      toast.error('Selecione o tipo.');
      return;
    }
    if (form.valor <= 0) {
      toast.error('Valor deve ser maior que zero.');
      return;
    }
    setLoading(true);
    try {
      await api.post('despesas', {
        categoria: form.categoria,
        data: form.data,
        tipo: form.tipo,
        descricao: form.descricao,
        valor: form.valor,
        comunicarAgenda: form.comunicarAgenda,
        recorrencia: form.recorrente ? form.recorrencia : 'unica',
        recorrenciaFim: form.recorrente && form.recorrenciaFim ? form.recorrenciaFim : undefined,
      });
      toast.success('Despesa criada.');
      navigate('/configuracoes');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar despesa.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Criar despesa</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lancar uma despesa manualmente com os mesmos campos das telas de despesas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Categoria</label>
          <select
            value={form.categoria}
            onChange={(e) => {
              const cat = e.target.value as DespesaCategoria;
              setForm((f) => ({
                ...f,
                categoria: cat,
                tipo: (TIPOS_DESPESA[cat] ?? ['OUTROS'])[0] ?? '',
              }));
            }}
            className={inputClass}
          >
            {CATEGORIAS_KEYS.map((key) => (
              <option key={key} value={key}>
                {DESPESA_CATEGORIAS[key].title}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Data</label>
            <input
              type="date"
              value={form.data}
              onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
              className={inputClass}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tipo</label>
            <select
              value={form.tipo || tiposDisponiveis[0]}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              className={inputClass}
              required
            >
              {tiposDisponiveis.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Descricao</label>
          <input
            type="text"
            value={form.descricao}
            onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value.toUpperCase() }))}
            placeholder={DESPESA_CATEGORIAS[form.categoria].placeholder}
            className={inputClass}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.valor || ''}
            onChange={(e) => setForm((f) => ({ ...f, valor: parseFloat(e.target.value) || 0 }))}
            className={inputClass}
            required
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="recorrente"
            type="checkbox"
            checked={form.recorrente}
            onChange={(e) => setForm((f) => ({ ...f, recorrente: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
          />
          <label htmlFor="recorrente" className="text-sm font-medium text-slate-700">
            Recorrente
          </label>
        </div>
        {form.recorrente && (
          <div className="grid grid-cols-2 gap-4">
            <SelectRecorrencia
              value={form.recorrencia}
              onChange={(v) => setForm((f) => ({ ...f, recorrencia: v }))}
              label="Periodicidade"
            />
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Data fim (opcional)</label>
              <input
                type="date"
                value={form.recorrenciaFim}
                onChange={(e) => setForm((f) => ({ ...f, recorrenciaFim: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            id="comunicarAgenda"
            type="checkbox"
            checked={form.comunicarAgenda}
            onChange={(e) => setForm((f) => ({ ...f, comunicarAgenda: e.target.checked }))}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600"
          />
          <label htmlFor="comunicarAgenda" className="text-sm font-medium text-slate-700">
            Comunicar Agenda
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/configuracoes')}
            className="flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar despesa
          </button>
        </div>
      </form>
    </div>
  );
}
