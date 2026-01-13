# Modulo Financeiro

## Descricao
Modulo central de controle financeiro, responsavel pela gestao de dados financeiros da empresa.

## Funcionalidades

### Tabela Principal
- Colunas configuraveis (ativar/desativar visibilidade)
- Colunas que entram ou nao no calculo total
- Destaque de linhas por status (cores, alertas)
- Ordenacao e filtragem

### Calculos
[A documentar com base na planilha original]

### Multi-loja
- Filtro por loja
- Total por loja
- Total geral (consolidado)

## Regras de Negocio
[A documentar com base na planilha original]

## Permissoes
- `financeiro.visualizar` - Ver dados
- `financeiro.editar` - Editar dados
- `financeiro.excluir` - Excluir registros
- `financeiro.exportar` - Exportar dados

## Mock de Dados
```text
src/mocks/financeiro.mock.json
```

## Contrato de API (esperado)
```typescript
interface FinanceiroItem {
  id: string;
  lojaId: string;
  // [campos a definir com base na planilha]
  createdAt: string;
  updatedAt: string;
}

// GET /api/financeiro
// POST /api/financeiro
// PUT /api/financeiro/:id
// DELETE /api/financeiro/:id
```
