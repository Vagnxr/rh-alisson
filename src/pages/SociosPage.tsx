import { DespesaPage } from '@/components/despesa/DespesaPage';
import { useSociosStore } from '@/stores/sociosStore';

const config = {
  key: 'socios' as const,
  title: 'Socios',
  subtitle: 'Gerencie pro-labore, distribuicao de lucros e pagamentos aos socios',
  placeholder: 'Ex: Pro-labore, Distribuicao de lucros, Retirada...',
};

export function SociosPage() {
  const items = useSociosStore((s) => s.items);
  const isLoading = useSociosStore((s) => s.isLoading);
  const fetchItems = useSociosStore((s) => s.fetchItems);
  const addItem = useSociosStore((s) => s.addItem);
  const updateItem = useSociosStore((s) => s.updateItem);
  const deleteItem = useSociosStore((s) => s.deleteItem);

  return (
    <DespesaPage
      config={config}
      items={items}
      isLoading={isLoading}
      fetchItems={fetchItems}
      addItem={addItem}
      updateItem={updateItem}
      deleteItem={deleteItem}
    />
  );
}
