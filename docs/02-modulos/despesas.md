# Modulo Despesas

## Descricao
Gestao completa de despesas da empresa.

## Funcionalidades

### Tabela Principal
- Categorias de despesas
- Status de pagamento
- Vencimentos
- Destaque de despesas vencidas

### Calculos
- Total por categoria
- Total por periodo
- Comparativo entre periodos
[Detalhes a documentar com base na planilha original]

### Multi-loja
- Despesas por loja
- Despesas compartilhadas (rateio)
- Total consolidado

## Regras de Negocio
[A documentar com base na planilha original]

## Permissoes
- `despesas.visualizar` - Ver dados
- `despesas.editar` - Editar dados
- `despesas.excluir` - Excluir registros
- `despesas.aprovar` - Aprovar despesas

## Mock de Dados
```text
src/mocks/despesas.mock.json
```

## Contrato de API (esperado)
```typescript
interface DespesaItem {
  id: string;
  lojaId: string;
  categoria: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: 'pendente' | 'pago' | 'vencido';
  descricao: string;
  createdAt: string;
  updatedAt: string;
}
```
