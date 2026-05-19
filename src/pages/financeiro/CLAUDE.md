# Páginas financeiras — Padrões

16 páginas em `frontend/src/pages/financeiro/`. Todas seguem o mesmo esqueleto. Complementa [frontend/CLAUDE.md](../../../CLAUDE.md), [src/stores/CLAUDE.md](../../stores/CLAUDE.md), [src/components/ui/CLAUDE.md](../../components/ui/CLAUDE.md).

## Esqueleto padrão

```tsx
export default function FooPage() {
  // 1. Filtros
  const [dateFilter, setDateFilter] = useState<DateFilterState>(/* default mês atual */);

  // 2. Estado da store
  const { items, columns, isLoading, fetchItems, addItem, updateItem, deleteItem } = useFooStore();

  // 3. Estado UI local
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Foo | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 4. Fetch ao mudar filtro
  useEffect(() => {
    fetchItems({ dataInicio: dateFilter.from, dataFim: dateFilter.to });
  }, [dateFilter]);

  // 5. Header (DateFilter + Export + Novo) → Tabela → Dialogs
  return (
    <PageShell title="Foo">
      <PageHeader>
        <DateFilter value={dateFilter} onChange={setDateFilter} />
        <ExportButtons data={items} columns={columns} />
        <Button onClick={() => { setEditing(null); setIsDialogOpen(true); }}>+ Novo</Button>
      </PageHeader>

      <FooTable items={items} columns={columns} onEdit={(i) => { setEditing(i); setIsDialogOpen(true); }} onDelete={setDeleteId} />

      <FooFormDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} initial={editing} onSubmit={async (data) => {
        if (editing) await updateItem(editing.id, data);
        else await addItem(data);
        toast.success('Salvo');
        setIsDialogOpen(false);
      }} />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        {/* confirmação */}
      </AlertDialog>
    </PageShell>
  );
}
```

## Páginas e suas particularidades

| Página | Particularidade |
|---|---|
| [AgendaPage.tsx](AgendaPage.tsx) | Calendário semanal navegável; sem tabela. Click dia → lista do dia + modal criar/editar. |
| [EntradaPage.tsx](EntradaPage.tsx) | Linhas de categoria/valor dinâmicas (ver [entrada/EntradaFormDialog.tsx](entrada/EntradaFormDialog.tsx)). Inicia com 1 linha vazia (`{categoriaId:'',valor:''}`). |
| [SaidaPage.tsx](SaidaPage.tsx) | Read-only para Saídas geradas por Entrada PIX/Dinheiro. Coluna `industrializacao` adicionada. CNPJ/CPF resolvido pra nome. |
| [ControleCartoesPage.tsx](ControleCartoesPage.tsx) | Tabs por modalidade (credito/debito/pix/voucher/ifood/outras). Maquininhas customizáveis persistidas em JSON via taxas-prazos. |
| [TaxasPrazosPage.tsx](TaxasPrazosPage.tsx) | Edição do JSON de taxas/prazos por bandeira+modalidade. |
| [VendaCartoesPage.tsx](VendaCartoesPage.tsx) | Lançamento de venda — joga taxa da config. |
| [CaixaPage.tsx](CaixaPage.tsx) | Caixa diário com abertura/fechamento. |
| [ControleDinheiroPage.tsx](ControleDinheiroPage.tsx) | Movimentação em dinheiro. |
| [ControleDepositoPage.tsx](ControleDepositoPage.tsx) | Controle de depósitos bancários. |
| [PagoDinheiroPage.tsx](PagoDinheiroPage.tsx) | Pagamentos em dinheiro (sai sem agenda). |
| [VendasPage.tsx](VendasPage.tsx) | Resumo de vendas. |
| [AtivoImobilizadoPage.tsx](AtivoImobilizadoPage.tsx) | 3 modos de criar (único / parcelas / recorrência). Forma de pagamento muda fluxo (Dinheiro/PIX cria saída direto, Boleto via agenda). |
| [PedidoVendaPage.tsx](PedidoVendaPage.tsx) | Pedidos com itens. |
| [CalculadoraMargemPage.tsx](CalculadoraMargemPage.tsx) | Calculadora — sem persistência. |
| [AReceberPage.tsx](AReceberPage.tsx) | Tela "outras-funcoes" — vendas a receber. |
| [VendaPerdaPage.tsx](VendaPerdaPage.tsx) | Tela "outras-funcoes" — perdas. |

## DateFilter — único filtro de período

[components/ui/date-filter.tsx](../../components/ui/date-filter.tsx). Modos: `dia | mes | ano | custom`. Sempre usar — não criar variante por página.

Padrão de fetch: `{ dataInicio: 'YYYY-MM-DD', dataFim: 'YYYY-MM-DD' }`.

## Tabela e colunas customizáveis

Algumas páginas (Entrada, Saída, Despesas) suportam **colunas customizáveis** por usuário:
- Endpoint backend retorna `columns: TableColumnConfigFromApi[]` junto com `data`
- Frontend renderiza só as visíveis (`isRequired || visible`)
- Helper [src/lib/buildTableColumns.ts](../../lib/buildTableColumns.ts)

Para suportar em página nova:
1. Backend retorna `columns` no `findAll`
2. Store armazena `columns` separado de `items`
3. Componente Table itera `columns` (não hardcoda)

## Modais de form

Convenção: arquivo separado por entidade. Ex: [entrada/EntradaFormDialog.tsx](entrada/EntradaFormDialog.tsx).

Estrutura:
```tsx
<Dialog open onOpenChange>
  <DialogHeader title="Nova/Editar X" />
  <DialogBody>
    {/* fields */}
  </DialogBody>
  <DialogFooter>
    <Button variant="outline" onClick={cancel}>Cancelar</Button>
    <Button onClick={submit} disabled={!isValid}>Salvar</Button>
  </DialogFooter>
</Dialog>
```

Validação local (não bibioteca):
- Strings: trim + check vazio
- Valores: `parseValorFromInput` + check `>= 0`
- Datas: check formato YYYY-MM-DD não-vazio
- Bater regras com o backend (ver [src/financeiro/CLAUDE.md](../../../../backend/src/financeiro/CLAUDE.md))

## Confirmação de delete

Usar [AlertDialog](../../components/ui/alert-dialog.tsx). Padrão:
```tsx
<AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
  <AlertDialogContent>
    <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
    <AlertDialogDescription>Isso não pode ser desfeito.</AlertDialogDescription>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={async () => { await deleteItem(deleteId); setDeleteId(null); toast.success('Excluído'); }}>Excluir</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## Exportação

[ExportButtons](../../components/ui/export-buttons.tsx) — CSV/Excel. Recebe `data: any[]` e `columns: ColumnConfig[]`. Funciona out-of-the-box se a página já segue padrão de colunas.

## Armadilhas comuns

1. **Esquecer de refetch após CRUD** — usar `lastFetchParams` na store (ver [src/stores/CLAUDE.md](../../stores/CLAUDE.md)).
2. **Construir classe Tailwind dinamicamente** — quebra no build. Manter mapa de classes estáticas.
3. **Não tratar `columns: null`** — quando o usuário ainda não configurou colunas. Default: mostrar todas.
4. **Filtros vazios passam `''` ao backend** — virar `null`/`undefined` ou omitir do query (alguns endpoints quebram com string vazia).
5. **Dialog dentro de Dialog** — Radix lida, mas o foco pode bagunçar. Preferir único nível.
6. **Marcar pago no UI sem refletir saída gerada** — após `marcarPago`, refetch as duas listas afetadas (agenda + saída/ativo correspondente).
