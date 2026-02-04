import { DespesaPage } from '@/components/despesa/DespesaPage';
import { useDespesaFuncionarioStore } from '@/stores/despesaStore';
import { DESPESA_CATEGORIAS } from '@/types/despesa';

export function DespesaFuncionarioPage() {
  const items = useDespesaFuncionarioStore((s) => s.items);
  const columns = useDespesaFuncionarioStore((s) => s.columns);
  const isLoading = useDespesaFuncionarioStore((s) => s.isLoading);
  const fetchItems = useDespesaFuncionarioStore((s) => s.fetchItems);
  const addItem = useDespesaFuncionarioStore((s) => s.addItem);
  const updateItem = useDespesaFuncionarioStore((s) => s.updateItem);
  const deleteItem = useDespesaFuncionarioStore((s) => s.deleteItem);

  return (
    <DespesaPage
      config={DESPESA_CATEGORIAS['despesa-funcionario']}
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
