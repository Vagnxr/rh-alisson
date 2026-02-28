import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

const inputClass =
  'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500';

function slugFromNome(nome: string): string {
  return (
    nome
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'despesa-custom'
  );
}

export interface NovaPaginaDespesaFormProps {
  onSuccess: (slug: string) => void;
  onCancel: () => void;
}

export function NovaPaginaDespesaForm({ onSuccess, onCancel }: NovaPaginaDespesaFormProps) {
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
      toast.success('Pagina de despesa criada.');
      onSuccess(slugFinal);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar pagina.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="nome" className="text-sm font-medium text-slate-700 uppercase">
          Nome da página
        </label>
        <input
          id="nome"
          type="text"
          value={nome}
          onChange={e => {
            setNome(e.target.value.toUpperCase());
            updateSlug(e.target.value.toUpperCase());
          }}
          placeholder="Ex: Despesa Marketing"
          className={inputClass}
          required
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="slug" className="text-sm font-medium text-slate-700 uppercase">
          Identificador (slug)
        </label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={e => {
            setSlug(e.target.value);
            setSlugManual(true);
          }}
          onBlur={() => {
            if (!slug.trim()) setSlugManual(false);
          }}
          placeholder="Ex: despesa-marketing"
          className={inputClass}
        />
        <p className="text-xs text-slate-500 uppercase">
          Usado na URL e no sistema. Se vazio, é gerado a partir do nome.
        </p>
      </div>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 uppercase hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white uppercase hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar página
        </button>
      </div>
    </form>
  );
}
