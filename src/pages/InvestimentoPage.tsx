import { DespesaPage } from '@/components/despesa/DespesaPage';
import { useInvestimentoStore } from '@/stores/investimentoStore';

const config = {
  key: 'investimento' as const,
  title: 'Investimentos',
  subtitle: 'Gerencie seus investimentos e aplicacoes financeiras',
  placeholder: 'Ex: CDB, Tesouro Direto, Fundos Imobiliarios...',
};

export function InvestimentoPage() {
  const items = useInvestimentoStore((s) => s.items);
  const columns = useInvestimentoStore((s) => s.columns);
  const isLoading = useInvestimentoStore((s) => s.isLoading);
  const fetchItems = useInvestimentoStore((s) => s.fetchItems);
  const addItem = useInvestimentoStore((s) => s.addItem);
  const updateItem = useInvestimentoStore((s) => s.updateItem);
  const deleteItem = useInvestimentoStore((s) => s.deleteItem);

  return (
    <DespesaPage
      config={config}
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
