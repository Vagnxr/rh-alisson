import { DespesaPage } from '@/components/despesa/DespesaPage';
import { useRendaExtraStore } from '@/stores/rendaExtraStore';

const config = {
  key: 'renda-extra' as const,
  title: 'Renda Extra',
  subtitle: 'Gerencie suas rendas extras e receitas eventuais',
  placeholder: 'Ex: Consultoria, Venda de equipamento, Comissao...',
};

export function RendaExtraPage() {
  const items = useRendaExtraStore((s) => s.items);
  const columns = useRendaExtraStore((s) => s.columns);
  const isLoading = useRendaExtraStore((s) => s.isLoading);
  const fetchItems = useRendaExtraStore((s) => s.fetchItems);
  const addItem = useRendaExtraStore((s) => s.addItem);
  const addItemComParcelas = useRendaExtraStore((s) => s.addItemComParcelas);
  const updateItem = useRendaExtraStore((s) => s.updateItem);
  const deleteItem = useRendaExtraStore((s) => s.deleteItem);

  return (
    <DespesaPage
      config={config}
      items={items}
      columns={columns}
      isLoading={isLoading}
      fetchItems={fetchItems}
      addItem={addItem}
      addItemComParcelas={addItemComParcelas}
      updateItem={updateItem}
      deleteItem={deleteItem}
      showComunicarAgenda={false}
      useRecorrenciaDataValorList
    />
  );
}
