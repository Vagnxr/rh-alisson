import { DespesaPage } from '@/components/despesa/DespesaPage';
import { useDespesaImpostoStore } from '@/stores/despesaStore';
import { DESPESA_CATEGORIAS } from '@/types/despesa';

export function DespesaImpostoPage() {
  const items = useDespesaImpostoStore((s) => s.items);
  const isLoading = useDespesaImpostoStore((s) => s.isLoading);
  const fetchItems = useDespesaImpostoStore((s) => s.fetchItems);
  const addItem = useDespesaImpostoStore((s) => s.addItem);
  const updateItem = useDespesaImpostoStore((s) => s.updateItem);
  const deleteItem = useDespesaImpostoStore((s) => s.deleteItem);

  return (
    <DespesaPage
      config={DESPESA_CATEGORIAS['despesa-imposto']}
      items={items}
      isLoading={isLoading}
      fetchItems={fetchItems}
      addItem={addItem}
      updateItem={updateItem}
      deleteItem={deleteItem}
    />
  );
}
