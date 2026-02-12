import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DespesaPage } from '@/components/despesa/DespesaPage';
import { useDespesaDinamicaStore } from '@/stores/despesaStore';
import type { DespesaCategoriaConfig } from '@/types/despesa';

const DESPESA_FIXED_IDS = [
  'despesa-fixa',
  'despesa-extra',
  'despesa-funcionario',
  'despesa-imposto',
  'despesa-veiculo',
  'despesa-banco',
] as const;

function slugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
}

function configFromSlug(categoriaSlug: string): DespesaCategoriaConfig {
  return {
    key: categoriaSlug,
    title: slugToTitle(categoriaSlug),
    subtitle: 'Gerencie as despesas desta categoria',
    placeholder: 'Ex: descricao da despesa...',
  };
}

export function DespesaCategoriaPage() {
  const { categoria: categoriaSlug } = useParams<{ categoria: string }>();
  const navigate = useNavigate();
  const {
    categoria,
    setCategoria,
    items,
    columns,
    isLoading,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
  } = useDespesaDinamicaStore();

  const isFixed = categoriaSlug && DESPESA_FIXED_IDS.includes(categoriaSlug as (typeof DESPESA_FIXED_IDS)[number]);

  useEffect(() => {
    if (!categoriaSlug) return;
    if (isFixed) {
      navigate(`/${categoriaSlug}`, { replace: true });
      return;
    }
    setCategoria(categoriaSlug);
  }, [categoriaSlug, isFixed, setCategoria, navigate]);

  useEffect(() => {
    if (categoria) fetchItems();
  }, [categoria, fetchItems]);

  if (!categoriaSlug || isFixed) return null;
  if (!categoria) return null;

  const config = configFromSlug(categoria);

  return (
    <DespesaPage
      config={config}
      items={items}
      columns={columns}
      isLoading={isLoading}
      fetchItems={fetchItems}
      addItem={addItem}
      updateItem={updateItem}
      deleteItem={deleteItem}
    />
  );
}
