import { DespesaPage } from '@/components/despesa/DespesaPage';
import { useDespesaFixaStore } from '@/stores/despesaStore';
import { DESPESA_CATEGORIAS } from '@/types/despesa';

export function DespesaFixaPage() {
  const items = useDespesaFixaStore((s) => s.items);
  const columns = useDespesaFixaStore((s) => s.columns);
  const isLoading = useDespesaFixaStore((s) => s.isLoading);
  const fetchItems = useDespesaFixaStore((s) => s.fetchItems);
  const addItem = useDespesaFixaStore((s) => s.addItem);
  const addItemComParcelas = useDespesaFixaStore((s) => s.addItemComParcelas);
  const updateItem = useDespesaFixaStore((s) => s.updateItem);
  const deleteItem = useDespesaFixaStore((s) => s.deleteItem);

  return (
    <DespesaPage
      config={DESPESA_CATEGORIAS['despesa-fixa']}
      items={items}
      columns={columns}
      isLoading={isLoading}
      fetchItems={fetchItems}
      addItem={addItem}
      addItemComParcelas={addItemComParcelas}
      updateItem={updateItem}
      deleteItem={deleteItem}
      useRecorrenciaDataValorList
    />
  );
}
