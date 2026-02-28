import { DespesaPage } from '@/components/despesa/DespesaPage';
import { useDespesaImpostoStore } from '@/stores/despesaStore';
import { DESPESA_CATEGORIAS } from '@/types/despesa';

export function DespesaImpostoPage() {
  const items = useDespesaImpostoStore((s) => s.items);
  const columns = useDespesaImpostoStore((s) => s.columns);
  const isLoading = useDespesaImpostoStore((s) => s.isLoading);
  const fetchItems = useDespesaImpostoStore((s) => s.fetchItems);
  const addItem = useDespesaImpostoStore((s) => s.addItem);
  const addItemComParcelas = useDespesaImpostoStore((s) => s.addItemComParcelas);
  const updateItem = useDespesaImpostoStore((s) => s.updateItem);
  const deleteItem = useDespesaImpostoStore((s) => s.deleteItem);

  return (
    <DespesaPage
      config={DESPESA_CATEGORIAS['despesa-imposto']}
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
