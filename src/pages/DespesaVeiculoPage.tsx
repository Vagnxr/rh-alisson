import { DespesaPage } from '@/components/despesa/DespesaPage';
import { useDespesaVeiculoStore } from '@/stores/despesaStore';
import { DESPESA_CATEGORIAS } from '@/types/despesa';

export function DespesaVeiculoPage() {
  const items = useDespesaVeiculoStore((s) => s.items);
  const columns = useDespesaVeiculoStore((s) => s.columns);
  const isLoading = useDespesaVeiculoStore((s) => s.isLoading);
  const fetchItems = useDespesaVeiculoStore((s) => s.fetchItems);
  const addItem = useDespesaVeiculoStore((s) => s.addItem);
  const updateItem = useDespesaVeiculoStore((s) => s.updateItem);
  const deleteItem = useDespesaVeiculoStore((s) => s.deleteItem);

  return (
    <DespesaPage
      config={DESPESA_CATEGORIAS['despesa-veiculo']}
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
