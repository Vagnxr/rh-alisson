# Dashboard, Relatorios e Balanco Geral - Contrato Backend

Este documento e o **contrato** para o backend implementar o modulo financeiro que da vida ao sistema: **Dashboard**, **Relatorios** e **Balanco Geral**. O frontend ja possui as telas prontas com mock; ao expor estes endpoints, o front passara a consumir dados reais.

**Para o Agent / Implementacao do Backend:**
1. Implementar **apos** os modulos de dados estarem prontos (Lojas, Despesas, Receitas, Investimentos, Parcelamentos, Socios/Movimentacoes). Os dados do dashboard, relatorios e balanco sao **derivados** dessas entidades.
2. Seguir as mesmas convencoes de **01-contrato-frontend-backend.md** e **api-specification.md**: `{ success: true, data: ... }`, JWT, header `X-Tenant-Id` quando aplicavel.
3. Filtros de periodo: o front envia `dataInicio` e `dataFim` em formato **YYYY-MM-DD** (ISO). Opcionalmente `lojaId` para filtrar por loja.

---

## Convencoes comuns

- **Periodo:** Query params `dataInicio`, `dataFim` (YYYY-MM-DD). Se omitidos, o backend pode usar mes atual ou ultimos 30 dias (documentar o padrao).
- **Multi-loja:** Query param opcional `lojaId`. Se ausente, consolidar todas as lojas do tenant (ou as que o usuario tem permissao).
- **Resposta:** Sempre `{ success: true, data: ... }`. Nao e necessario `columns` nestes endpoints (nao sao listagens que alimentam tabelas configuráveis no sentido do contrato de colunas).

---

## 1. Dashboard (DashboardPage)

A tela exibe **cards de resumo** (receita, despesas, saldo, investimentos) com variacao percentual em relacao ao periodo anterior, e uma lista de **transacoes recentes**.

### 1.1 Resumo (cards)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/dashboard/resumo` | Totais do periodo e variacao % vs periodo anterior |

**Query params (opcionais):**
- `dataInicio` (YYYY-MM-DD)
- `dataFim` (YYYY-MM-DD)
- `lojaId` (UUID) — filtrar por loja; se omitido, consolidar todas

**Response 200:**
```json
{
  "success": true,
  "data": {
    "receitaTotal": { "valor": 45230.00, "variacaoPercentual": 12.5 },
    "despesas": { "valor": 28450.00, "variacaoPercentual": -3.2 },
    "saldoAtual": { "valor": 16780.00, "variacaoPercentual": 8.1 },
    "investimentos": { "valor": 32100.00, "variacaoPercentual": 5.4 }
  }
}
```

- **receitaTotal:** Soma de vendas/receitas do periodo (pode vir de modulo de vendas ou de receitas/renda extra, conforme modelo do negocio). **variacaoPercentual:** comparacao com o periodo anterior de mesma duracao (ex.: mes anterior).
- **despesas:** Soma de todas as despesas do periodo (todas as categorias). **variacaoPercentual:** idem.
- **saldoAtual:** Pode ser receita - despesas do periodo, ou saldo consolidado de caixa (conforme regra de negocio). **variacaoPercentual:** idem.
- **investimentos:** Soma dos investimentos (valor total aplicado ou saldo do periodo, conforme definicao). **variacaoPercentual:** idem.

O front exibe cada card com label (Receita Total, Despesas, Saldo Atual, Investimentos), valor formatado em moeda e linha "X% vs mes anterior" (usando variacaoPercentual). Valores negativos em variacao sao exibidos em vermelho.

### 1.2 Transacoes recentes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/dashboard/transacoes-recentes` | Ultimas transacoes (despesas + receitas + investimentos) para listagem |

**Query params (opcionais):**
- `dataInicio`, `dataFim` (YYYY-MM-DD)
- `lojaId` (UUID)
- `limit` (number, default 20) — quantidade maxima de itens

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "description": "string",
      "category": "string",
      "value": 0.00,
      "date": "YYYY-MM-DD",
      "type": "income | expense"
    }
  ]
}
```

- **id:** Identificador unico (pode ser o id da despesa, da receita ou do investimento; ou um id composto se for vista unificada).
- **description:** Descricao legivel (ex.: "Aluguel Loja Centro", "Venda Produtos", "Folha Pagamento").
- **category:** Categoria para exibicao (ex.: "Despesa Fixa", "Receita", "Funcionarios", "Renda Extra").
- **value:** Valor sempre positivo; o front usa `type` para exibir com sinal (+ ou -) e cor (verde/vermelho).
- **date:** Data da transacao em YYYY-MM-DD. O front pode formatar para DD/MM/YYYY.
- **type:** `"income"` (entrada) ou `"expense"` (saida).

Ordenacao: mais recentes primeiro (date desc, depois id desc).

**Origem dos dados:** O backend deve agregar de forma unificada a partir de:
- Despesas (todas as categorias: fixa, extra, funcionario, imposto, veiculo, banco)
- Receitas / Renda extra
- Investimentos (entradas/saidas ou movimentacoes, conforme modelo)

Parcelamentos e movimentacoes de socios podem ser incluidos como "expense" ou em categorias proprias, conforme regra de negocio.

---

## 2. Relatorios (RelatoriosPage)

A tela oferece varios **tipos de relatorio** (despesas por categoria, vendas por periodo, fluxo de caixa, lucro, por tipo, por loja, comparativo). O front usa filtro de periodo (DateFilter) e opcionalmente tipo de despesa. Cada tipo pode ter um ou mais endpoints ou um endpoint unico com query `tipo`.

### 2.1 Despesas por categoria

Agrupa despesas por categoria (ou por tipo) e retorna valor e percentual sobre o total de despesas.

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/relatorios/despesas-por-categoria` | Despesas agrupadas por categoria |

**Query params:** `dataInicio`, `dataFim`, `lojaId` (opcionais).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "total": 60300.00,
    "itens": [
      { "categoria": "DESPESA FIXA", "valor": 15000.00, "percentual": 25 },
      { "categoria": "FUNCIONARIOS", "valor": 20000.00, "percentual": 33 },
      { "categoria": "IMPOSTOS", "valor": 8000.00, "percentual": 13 },
      { "categoria": "VEICULOS", "valor": 5000.00, "percentual": 8 },
      { "categoria": "BANCARIAS", "valor": 3000.00, "percentual": 5 },
      { "categoria": "EXTRAS", "valor": 9000.00, "percentual": 16 }
    ]
  }
}
```

- **total:** Soma de todas as despesas no periodo.
- **itens:** Cada categoria corresponde a um tipo ou agrupamento (despesa-fixa, despesa-extra, despesa-funcionario, despesa-imposto, despesa-veiculo, despesa-banco). **percentual:** (valor / total) * 100.

### 2.2 Vendas por periodo

Valor de vendas (ou receitas) por mes no periodo informado.

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/relatorios/vendas-por-periodo` | Vendas/receitas por mes |

**Query params:** `dataInicio`, `dataFim`, `lojaId` (opcionais).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "itens": [
      { "mes": "JAN", "ano": 2026, "valor": 45000.00 },
      { "mes": "FEV", "ano": 2026, "valor": 52000.00 },
      { "mes": "MAR", "ano": 2026, "valor": 48000.00 }
    ]
  }
}
```

- **mes:** Sigla do mes (JAN, FEV, ...) ou numero (1-12), conforme preferencia; o front usa para rotulo no grafico.
- **ano:** Ano do periodo.
- **valor:** Total de vendas/receitas naquele mes.

Se o sistema nao tiver "vendas" como entidade separada, usar receitas + renda extra como proxy, ou definir regra de negocio.

### 2.3 Fluxo de caixa

Entradas e saidas por mes (ou por periodo).

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/relatorios/fluxo-caixa` | Entradas e saidas por mes |

**Query params:** `dataInicio`, `dataFim`, `lojaId` (opcionais).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "itens": [
      { "mes": "JAN", "entradas": 45000.00, "saidas": 35000.00 },
      { "mes": "FEV", "entradas": 52000.00, "saidas": 40000.00 }
    ]
  }
}
```

- **entradas:** Soma de receitas, renda extra, investimentos (resgates ou entradas), conforme regra.
- **saidas:** Soma de despesas (todas as categorias), parcelamentos, movimentacoes de socios (retiradas), etc.

O front exibe grafico de barras (entradas em verde, saidas em vermelho) e tabela com colunas mes, entradas, saidas, saldo (entradas - saidas).

### 2.4 Lucro liquido (por mes)

Lucro (entradas - saidas) por mes, para analise de lucratividade e margem.

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/relatorios/lucro` | Lucro por mes (e opcionalmente margem %) |

**Query params:** `dataInicio`, `dataFim`, `lojaId` (opcionais).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "itens": [
      { "mes": "JAN", "entradas": 45000.00, "saidas": 35000.00, "lucro": 10000.00, "margemPercentual": 22.2 },
      { "mes": "FEV", "entradas": 52000.00, "saidas": 40000.00, "lucro": 12000.00, "margemPercentual": 23.1 }
    ]
  }
}
```

- **margemPercentual:** (lucro / entradas) * 100. O front exibe "X% margem" por linha.

### 2.5 Por tipo de despesa / Por loja / Comparativo mensal

O front tem cards para "Por Tipo de Despesa", "Por Loja" e "Comparativo Mensal". Podem ser cobertos por:

- **Por tipo:** Mesmo que despesas-por-categoria com granularidade por tipo (ALUGUEL, LUZ, etc.) ou reutilizar o mesmo endpoint com agrupamento mais fino.
- **Por loja:** Mesmos relatorios (despesas, vendas, fluxo) com `lojaId` omitido e resposta incluindo quebra por loja (ex.: `itens: [{ lojaId, lojaNome, valor, ... }]`).
- **Comparativo mensal:** Variacao mes a mes (pode ser calculado no front a partir de vendas-por-periodo e fluxo-caixa, ou endpoint dedicado que retorne series mensais).

Implementacao exata pode ser um unico endpoint GET `/relatorios?tipo=despesas|vendas|fluxo-caixa|lucro|por-loja|comparativo` com resposta variando por tipo, ou endpoints separados como acima. O contrato acima (endpoints separados) e preferivel para clareza.

---

## 3. Balanco Geral / Balanco Mensal (BalancoGeralPage)

O balanco e um **resumo financeiro consolidado** do periodo (mensal), alinhado à planilha de origem. Inclui: Despesas (com % sobre vendas), Vendas, Outros Valores, Mercadoria (entrada/saida), Ativo Imobilizado (entrada/saida), Investimento total, Renda Extra. Suporta **multi-loja**: quando ha mais de uma loja, os itens podem ter `lojaId`/`lojaNome` e o front exibe colunas por loja e total.

### 3.1 Endpoint unico: balanco mensal

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/balanco/mensal` | Balanco consolidado do periodo (mensal) |

**Query params (opcionais):**
- `mes` (1-12)
- `ano` (ex.: 2026)
- `lojaId` — se informado, filtrar apenas essa loja; se omitido, retornar todas as lojas (com quebra por loja nos itens quando multi-loja)

Se `mes` e `ano` forem omitidos, o backend pode usar mes/ano atual.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "mes": "Janeiro",
    "mesNumero": 1,
    "ano": 2026,
    "valorTotalVendas": 53340.00,
    "despesas": {
      "items": [
        { "descricao": "DESP - FIXA", "valor": 3369.90, "percentual": 6.32, "lojaId": "uuid-opcional", "lojaNome": "Loja Centro" }
      ],
      "total": 28159.56
    },
    "vendas": {
      "items": [
        { "descricao": "DINHEIRO - DEPOSITO", "valor": 30000.00, "percentual": 56.24, "lojaId": "uuid-opcional", "lojaNome": "Loja Centro" }
      ],
      "total": 53340.00
    },
    "outrosValores": {
      "items": [
        { "descricao": "DESC. IFOOD", "valor": 0, "percentual": 0 },
        { "descricao": "DESC. LOJISTA", "valor": 0, "percentual": 0 },
        { "descricao": "DESC. SOCIOS", "valor": 0, "percentual": 0 }
      ],
      "total": 0
    },
    "mercadoriaEntrada": {
      "items": [
        { "descricao": "INDUSTRIALIZACAO", "valor": 0, "percentual": 0 },
        { "descricao": "COMERCIALIZACAO", "valor": 0, "percentual": 0 }
      ],
      "total": 0
    },
    "mercadoriaSaida": {
      "items": [
        { "descricao": "INDUSTRIALIZACAO", "valor": 0, "percentual": 0 }
      ],
      "total": 0
    },
    "ativoImobilizado": { "entrada": 10000.00, "saida": 5000.00 },
    "investimento": 10500.00,
    "rendaExtra": 4550.00
  }
}
```

**Campos:**
- **mes:** Nome do mes por extenso (ex.: "Janeiro") para exibicao.
- **mesNumero:** 1-12.
- **ano:** Ano do balanco.
- **valorTotalVendas:** Total de vendas do periodo (usado para calcular % sobre vendas nas despesas).
- **despesas:** Lista de itens com descricao (agrupamento por categoria/tipo: DESP - FIXA, DESP - EXTRA, DESP - FUNCIONARIO, DESP - IMPOSTO, DESP - PARCELAMENTO, DESP - VEICULO, DESP - BANCO, DESP - SOCIOS, DESP - CARTOES - TAXAS, etc.). **percentual:** (valor / valorTotalVendas) * 100. **lojaId** e **lojaNome** opcionais; quando multi-loja e sem filtro por loja, enviar por item para o front montar tabela com colunas por loja.
- **vendas:** Itens de venda por forma (DINHEIRO - DEPOSITO, PIX, CREDITO, DEBITO, etc.). Mesma estrutura (descricao, valor, percentual, lojaId, lojaNome opcionais).
- **outrosValores:** Descontos ou outros valores (IFOOD, LOJISTA, SOCIOS). Pode ser zerado ate o negocio definir origem.
- **mercadoriaEntrada / mercadoriaSaida:** Itens de mercadoria (INDUSTRIALIZACAO, COMERCIALIZACAO, EMBALAGEM, MATERIAL USO/CONS, MERCADORIA USO/CONS, GAS). Podem ser zerados ate existir modulo de estoque/mercadoria.
- **ativoImobilizado:** Entrada e saida totais (bens). Pode ser zerado ou vir de modulo futuro.
- **investimento:** Soma dos investimentos no periodo (ou saldo), vindo do modulo de investimentos.
- **rendaExtra:** Soma da renda extra no periodo, vindo do modulo de receitas/renda extra.

**Origem dos dados:**
- Despesas: agregar de todas as categorias de despesa (fixa, extra, funcionario, imposto, veiculo, banco) e parcelamentos, movimentacoes de socios (pro-labore, distribuicao, retiradas), conforme regra.
- Vendas: modulo de vendas ou, se nao houver, receitas/renda extra como proxy; formas de pagamento podem ser fixas na primeira versao (ex.: DINHEIRO - DEPOSITO, PIX, CREDITO, DEBITO).
- Investimento e rendaExtra: tabelas de investimentos e receitas (renda extra).

---

## 4. Resumo de Endpoints (modulo financeiro)

| Modulo | Metodo | Endpoint | Descricao |
|--------|--------|----------|-----------|
| Dashboard | GET | /dashboard/resumo | Cards: receita, despesas, saldo, investimentos (com variacao %) |
| Dashboard | GET | /dashboard/transacoes-recentes | Lista de transacoes recentes unificadas |
| Relatorios | GET | /relatorios/despesas-por-categoria | Despesas agrupadas por categoria |
| Relatorios | GET | /relatorios/vendas-por-periodo | Vendas por mes |
| Relatorios | GET | /relatorios/fluxo-caixa | Entradas e saidas por mes |
| Relatorios | GET | /relatorios/lucro | Lucro e margem por mes |
| Balanco | GET | /balanco/mensal | Balanco mensal completo (despesas, vendas, outros, mercadoria, ativo, investimento, renda extra) |

**Query params comuns:** `dataInicio`, `dataFim` (YYYY-MM-DD), `lojaId` (UUID). Onde aplicavel, `mes` e `ano` para balanco.

---

## 5. Ordem de implementacao sugerida

1. **Dashboard:** Implementar `GET /dashboard/resumo` e `GET /dashboard/transacoes-recentes` com base em despesas, receitas e investimentos ja existentes. Calcular variacao % em relacao ao periodo anterior.
2. **Relatorios:** Implementar os quatro endpoints de relatorios (despesas-por-categoria, vendas-por-periodo, fluxo-caixa, lucro) reutilizando as mesmas fontes de dados.
3. **Balanco:** Implementar `GET /balanco/mensal` agregando despesas por categoria, vendas (ou receitas) por forma, parcelamentos, socios, investimentos e renda extra. Secoes zeradas (outrosValores, mercadoria, ativoImobilizado) podem retornar estrutura vazia ou com itens zerados ate existir modulo especifico.

Apos a implementacao destes endpoints, o frontend podera trocar os mocks por chamadas reais (dashboardStore, relatoriosStore, balancoStore) e o sistema passara a ter vida com dados reais.

---

**Versao:** 1.0.0  
**Data:** 2026-02-03  
**Fonte:** Analise de `src/pages/DashboardPage.tsx`, `src/pages/RelatoriosPage.tsx`, `src/pages/BalancoGeralPage.tsx` e docs existentes em `docs/05-backend/`.
