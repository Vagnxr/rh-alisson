import { DespesaPage } from '@/components/despesa/DespesaPage';
import { useDespesaBancoStore } from '@/stores/despesaStore';
import { DESPESA_CATEGORIAS } from '@/types/despesa';

export function DespesaBancoPage() {
  const items = useDespesaBancoStore((s) => s.items);
  const isLoading = useDespesaBancoStore((s) => s.isLoading);
  const fetchItems = useDespesaBancoStore((s) => s.fetchItems);
  const addItem = useDespesaBancoStore((s) => s.addItem);
  const updateItem = useDespesaBancoStore((s) => s.updateItem);
  const deleteItem = useDespesaBancoStore((s) => s.deleteItem);

  return (
    <DespesaPage
      config={DESPESA_CATEGORIAS['despesa-banco']}
      items={items}
      isLoading={isLoading}
      fetchItems={fetchItems}
      addItem={addItem}
      updateItem={updateItem}
      deleteItem={deleteItem}
    />
  );
}
