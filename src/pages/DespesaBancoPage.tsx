import { DespesaBancoPageComponent } from '@/components/despesa/DespesaBancoPage';
import { useDespesaBancoStore } from '@/stores/despesaStore';

export function DespesaBancoPage() {
  const items = useDespesaBancoStore((s) => s.items);
  const isLoading = useDespesaBancoStore((s) => s.isLoading);
  const fetchItems = useDespesaBancoStore((s) => s.fetchItems);
  const addItem = useDespesaBancoStore((s) => s.addItem);
  const updateItem = useDespesaBancoStore((s) => s.updateItem);
  const deleteItem = useDespesaBancoStore((s) => s.deleteItem);

  return (
    <DespesaBancoPageComponent
      items={items}
      isLoading={isLoading}
      fetchItems={fetchItems}
      addItem={addItem}
      updateItem={updateItem}
      deleteItem={deleteItem}
    />
  );
}
