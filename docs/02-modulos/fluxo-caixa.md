# Modulo Fluxo de Caixa

## Descricao
Gestao de entradas e saidas de recursos financeiros.

## Funcionalidades

### Tabela Principal
- Registro de entradas (receitas)
- Registro de saidas (despesas)
- Saldo acumulado
- Destaque visual por tipo (entrada/saida)

### Calculos
- Saldo diario
- Saldo acumulado
- Projecao de fluxo
[Detalhes a documentar com base na planilha original]

### Multi-loja
- Filtro por loja
- Total por loja
- Total geral (consolidado)

## Regras de Negocio
[A documentar com base na planilha original]

## Permissoes
- `fluxo-caixa.visualizar` - Ver dados
- `fluxo-caixa.editar` - Editar dados
- `fluxo-caixa.excluir` - Excluir registros

## Mock de Dados
```text
src/mocks/fluxo-caixa.mock.json
```

## Contrato de API (esperado)
```typescript
interface FluxoCaixaItem {
  id: string;
  lojaId: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  data: string;
  descricao: string;
  categoria: string;
  createdAt: string;
  updatedAt: string;
}
```
