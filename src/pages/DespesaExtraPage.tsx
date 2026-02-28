import { DespesaPage } from '@/components/despesa/DespesaPage';
import { useDespesaExtraStore } from '@/stores/despesaStore';
import { DESPESA_CATEGORIAS } from '@/types/despesa';

export function DespesaExtraPage() {
  const items = useDespesaExtraStore((s) => s.items);
  const columns = useDespesaExtraStore((s) => s.columns);
  const isLoading = useDespesaExtraStore((s) => s.isLoading);
  const fetchItems = useDespesaExtraStore((s) => s.fetchItems);
  const addItem = useDespesaExtraStore((s) => s.addItem);
  const addItemComParcelas = useDespesaExtraStore((s) => s.addItemComParcelas);
  const updateItem = useDespesaExtraStore((s) => s.updateItem);
  const deleteItem = useDespesaExtraStore((s) => s.deleteItem);

  return (
    <DespesaPage
      config={DESPESA_CATEGORIAS['despesa-extra']}
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
