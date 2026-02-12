import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const inputClass =
  'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

function slugFromNome(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'despesa-custom';
}

export function NovaPaginaDespesaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);

  const updateSlug = (novoNome: string) => {
    if (!slugManual) setSlug(slugFromNome(novoNome));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      toast.error('Informe o nome da pagina.');
      return;
    }
    const slugFinal = slug.trim() || slugFromNome(nomeTrim);
    if (!slugFinal) {
      toast.error('Identificador invalido.');
      return;
    }
    setLoading(true);
    try {
      await api.post('despesas/categorias', { nome: nomeTrim, slug: slugFinal });
      toast.success('Pagina de despesa criada. Ela aparecera no menu apos o backend disponibilizar.');
      navigate('/configuracoes');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar pagina.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Criar pagina de despesa</h1>
        <p className="mt-1 text-sm text-slate-500">
          Crie uma nova tela de despesa (ex.: Despesa Marketing). A pagina aparecera no menu Despesas apos ser criada.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="space-y-2">
          <label htmlFor="nome" className="text-sm font-medium text-slate-700">
            Nome da pagina
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              updateSlug(e.target.value);
            }}
            placeholder="Ex: Despesa Marketing"
            className={inputClass}
            required
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="slug" className="text-sm font-medium text-slate-700">
            Identificador (slug)
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugManual(true);
            }}
            onBlur={() => {
              if (!slug.trim()) setSlugManual(false);
            }}
            placeholder="Ex: despesa-marketing"
            className={inputClass}
          />
          <p className="text-xs text-slate-500">
            Usado na URL e no sistema. Se vazio, e gerado a partir do nome.
          </p>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/configuracoes')}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar pagina
          </button>
        </div>
      </form>
    </div>
  );
}
