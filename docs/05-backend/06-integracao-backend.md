# Guia de Integracao Backend

Este documento orienta a **equipe de backend** a implementar e integrar a API com o frontend da melhor forma. Reune referencias aos contratos, ordem de implementacao, o que o front envia/espera e checklist do modulo Financeiro Operacional.

**Publico:** Desenvolvedores backend (NestJS + Prisma + PostgreSQL).

---

## 1. Documentos de referencia (ordem de leitura)

| Ordem | Documento | Conteudo |
|-------|------------|----------|
| 1 | **01-contrato-frontend-backend.md** | Contrato por pagina: endpoints, request/response, colunas de tabela (`columns`), tabelaIds. Fonte de verdade para payloads. |
| 2 | **api-specification.md** | Padroes gerais: formato de resposta (`success`/`data`/`error`), autenticacao JWT, multi-tenancy, listagens com `columns`. |
| 3 | **02-prisma-nestjs-implementacao.md** | Schema Prisma e estrutura de modulos NestJS. Ordem de implementacao dos modulos (Auth, Tenants, Lojas, Despesas, etc.). |
| 4 | **03-dashboard-relatorios-balanco.md** | Contrato do modulo financeiro Fase 2: Dashboard, Relatorios, Balanco Geral. |
| 5 | **04-socios-movimentacoes.md** | Contrato detalhado: Socios e Movimentacoes (CRUD, resumo, payloads). |
| 6 | **05-financeiro-operacional.md** | Contrato do **modulo Financeiro Operacional**: Caixa, Controle Cartoes, Vendas, Controle Dinheiro, Deposito, Venda Cartoes, Ativo Imobilizado, Entrada, Saida, Pago Dinheiro, Pedido de Venda. Modelos, endpoints, tabelaIds e regras. |
| 7 | **dtos-e-tipos.md** | DTOs e tipos (incluindo colunas e configuracoes). |
| 8 | **endpoints.md** | Resumo de endpoints; detalhes nos contratos. |

Implementar na ordem: **01 + api-spec** (convencoes) -> **02** (schema e modulos base) -> modulos por contrato (Lojas, Despesas, Fornecedores, Socios/04, Parcelamentos, Receitas, Investimentos, Configuracoes, Lembretes, Admin) -> **03** (Dashboard, Relatorios, Balanco) -> **05** (Financeiro Operacional).

---

## 2. O que o frontend envia (integracao)

O front usa um unico cliente HTTP (`src/lib/api.ts`) para todas as chamadas.

### 2.1 Base URL e ambiente

- **Base URL:** `VITE_API_URL` (variavel de ambiente) ou fallback `http://localhost:3004/api/v1`.
- Todas as requisicoes sao feitas para `{BASE_URL}/{path}` (ex.: `GET http://localhost:3004/api/v1/financeiro/caixa`).

### 2.2 Headers obrigatorios

| Header | Quando | Valor |
|--------|--------|--------|
| `Authorization` | Usuario autenticado | `Bearer <accessToken>` (token do login) |
| `Content-Type` | POST/PATCH/PUT | `application/json` |
| `X-Tenant-Id` | Operacoes por tenant | ID do tenant selecionado (enviado quando disponivel no storage) |

O front obtem o token de `localStorage` (chave `auth-storage`) e o tenant de `tenant-storage`. Em 401 (nao autorizado), o front limpa o storage e redireciona para `/login`.

### 2.3 Formato de resposta esperado

- **Sucesso:** `{ success: true, data: T }` ou `{ success: true, data: [], meta: { total, page, perPage, totalPages } }`.
- **Listagens que alimentam tabelas:** incluir tambem `columns`: array de `{ id, label, order, isRequired? }` (colunas visiveis, ordenadas). Ver **01-contrato** e **05-financeiro-operacional** (secao 13) para mapeamento endpoint -> tabelaId.
- **Erro:** `{ success: false, error: { code?, message, details? } }`. O front exibe `error.message`.

### 2.4 Filtro de periodo (modulo financeiro)

Nas telas com filtro de data, o front envia:

- **Query params:** `dataInicio` e `dataFim` em **YYYY-MM-DD**.
- Comportamento esperado: filtrar registros cuja data (campo relevante da entidade) esteja no intervalo **inclusivo** (`>= dataInicio` e `<= dataFim`).
- Se omitidos: backend pode retornar mes atual ou ultimos 30 dias (documentar o padrao adotado).

### 2.5 Valores e IDs

- **Valores monetarios:** sempre **number** (ex.: 1234.56). O front nao envia strings formatadas nos bodies.
- **IDs:** UUID (string) gerados pelo backend.

---

## 3. Ordem de implementacao sugerida

1. **Fase 1 (modulos de dados):** Auth, Tenants (available), Lojas, Despesas, Fornecedores, Socios e Movimentacoes (04), Parcelamentos, Receitas, Investimentos, Configuracoes, Lembretes, Admin (tenants e users). Seguir **02-prisma-nestjs-implementacao.md** e **01-contrato**.
2. **Fase 2 (modulo financeiro – relatorios):** Dashboard (resumo, transacoes recentes), Balanco Geral, Relatorios. Contrato em **03-dashboard-relatorios-balanco.md**.
3. **Fase 3 (Financeiro Operacional):** Todas as telas do menu Financeiro (Caixa, Controle Cartoes, Vendas, Controle Dinheiro, Controle Deposito, Venda Cartoes, Ativo Imobilizado, Entrada, Saida, Pago Dinheiro, Pedido de Venda). Contrato em **05-financeiro-operacional.md**. A tela **Calculadora de Margem** nao requer backend.

Apos cada fase, o front pode ser configurado para consumir a API (base URL e uso dos endpoints) em vez de mock ou estado local.

---

## 4. Modulo Financeiro Operacional – checklist de implementacao

Usar **05-financeiro-operacional.md** como unica fonte para modelos, endpoints e regras. Resumo abaixo para planejamento.

### 4.1 Recursos e endpoints (resumo)

| Recurso | GET (lista/detalhe) | POST | PATCH | DELETE |
|---------|---------------------|------|-------|--------|
| Caixa | /financeiro/caixa | /financeiro/caixa | /financeiro/caixa/:id | /financeiro/caixa/:id |
| Controle Cartoes | /financeiro/controle-cartoes | /financeiro/controle-cartoes | /financeiro/controle-cartoes/:id | /financeiro/controle-cartoes/:id |
| Vendas | /financeiro/vendas | /financeiro/vendas | /financeiro/vendas/:id | /financeiro/vendas/:id |
| Controle Dinheiro | /financeiro/controle-dinheiro | /financeiro/controle-dinheiro | /financeiro/controle-dinheiro/:id | /financeiro/controle-dinheiro/:id |
| Deposito | /financeiro/controle-deposito | /financeiro/controle-deposito | /financeiro/controle-deposito/:id | /financeiro/controle-deposito/:id |
| Valor Depositado | /financeiro/valor-depositado | /financeiro/valor-depositado | /financeiro/valor-depositado/:id | /financeiro/valor-depositado/:id |
| Venda Cartoes | /financeiro/venda-cartoes | /financeiro/venda-cartoes | /financeiro/venda-cartoes/:id | /financeiro/venda-cartoes/:id |
| Ativo Imobilizado | /financeiro/ativo-imobilizado | /financeiro/ativo-imobilizado | /financeiro/ativo-imobilizado/:id | /financeiro/ativo-imobilizado/:id |
| Entrada | /financeiro/entrada | /financeiro/entrada | /financeiro/entrada/:id | /financeiro/entrada/:id |
| Saida | /financeiro/saida | /financeiro/saida | /financeiro/saida/:id | /financeiro/saida/:id |
| Pago Dinheiro | /financeiro/pago-dinheiro | /financeiro/pago-dinheiro | /financeiro/pago-dinheiro/:id | /financeiro/pago-dinheiro/:id |
| Pedido Venda | /financeiro/pedidos-venda, /financeiro/pedidos-venda/:id | /financeiro/pedidos-venda | /financeiro/pedidos-venda/:id | /financeiro/pedidos-venda/:id |

Query params de periodo: `dataInicio`, `dataFim` (YYYY-MM-DD). Controle Cartoes: opcionalmente `tipo`, `bandeira`. Ativo Imobilizado: `tipo` obrigatorio (`entrada` ou `saida`).

### 4.2 Checklist tecnico

- [ ] **Schema Prisma:** Criar modelos para Caixa, ControleCartoes, Vendas, ControleDinheiro, Deposito, ValorDepositado, VendaCartoes, AtivoImobilizado, Entrada, Saida, PagoDinheiro, PedidoVenda, ItemPedido (e relacoes com Tenant). Todos com `tenantId` para isolamento.
- [ ] **Modulos NestJS:** Criar modulo `financeiro` (ou submodulos por recurso) com controllers e services; injetar Prisma e TenantContext/Guard.
- [ ] **DTOs e validacao:** Request DTOs para POST/PATCH conforme modelos do 05 (campos obrigatorios, tipos, enums onde houver).
- [ ] **Filtro por tenant:** Todas as queries e mutacoes filtradas pelo tenant do usuario (sessao ou `X-Tenant-Id`).
- [ ] **Filtro de periodo:** Em todo GET de listagem, aplicar `dataInicio`/`dataFim` no campo de data correto (dia, data, dataPedido); intervalo inclusivo.
- [ ] **Resposta com `columns`:** Em todo GET de listagem que alimenta tabela, buscar configuracao de colunas pelo **tabelaId** (secao 13 do 05) e incluir `columns` na resposta. Se nao houver config do usuario, retornar colunas padrao.
- [ ] **Configuracoes:** Incluir os novos tabelaIds do Financeiro Operacional no suporte a GET/PUT `/configuracoes/tabelas` e nos padroes de colunas (ver secao 5 abaixo).
- [ ] **Pedido de Venda:** Relacao PedidoVenda 1:N ItemPedido; DELETE em cascata; numero do pedido opcional (backend pode gerar sequencial por tenant).
- [ ] **Totais calculados:** Caixa e Venda Cartoes: definir se `total`/`totalDia` e calculado (soma dos campos) ou aceito no body; documentar.

---

## 5. Configuracoes – tabelaIds do Financeiro Operacional

O modulo **Configuracoes** (GET/PUT `/configuracoes/tabelas`, reset) deve reconhecer os seguintes **tabelaIds** para que as listagens do Financeiro Operacional retornem `columns` corretas e a tela de Configuracoes (quando o front incluir essas tabelas) permita configurar colunas.

| tabelaId | Descricao (para nome/descricao na config) |
|----------|------------------------------------------|
| financeiro-caixa | Caixa |
| financeiro-controle-cartoes | Controle Cartoes |
| financeiro-vendas | Vendas |
| financeiro-controle-dinheiro | Controle Dinheiro |
| financeiro-deposito | Controle Deposito (tabela Deposito) |
| financeiro-valor-depositado | Valor Depositado |
| financeiro-venda-cartoes | Venda Cartoes |
| financeiro-ativo-entrada | Ativo Imobilizado – Entrada |
| financeiro-ativo-saida | Ativo Imobilizado – Saida |
| financeiro-entrada | Entrada |
| financeiro-saida | Saida |
| financeiro-pago-dinheiro | Pago em Dinheiro |
| financeiro-pedido-venda | Pedido de Venda |

Para cada um, o backend deve ter um **padrao de colunas** (id, label, order, isRequired quando aplicavel) alinhado ao que o front exibe. As colunas padrao podem ser extraidas das tabelas do **05-financeiro-operacional.md** (modelos e colunas descritas por recurso) ou do frontend em `src/types/financeiro.ts` e nas paginas em `src/pages/financeiro/*.tsx`.

---

## 6. Exemplos de request (Financeiro Operacional)

### 6.1 GET com filtro de periodo

```
GET /api/v1/financeiro/caixa?dataInicio=2026-01-01&dataFim=2026-01-31
Authorization: Bearer <token>
X-Tenant-Id: <tenantId>
```

Resposta esperada:

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "dia": "2026-01-15",
      "dinheiroDeposito": 1000,
      "pagamentoPdv": 200,
      "pix": 500,
      "credito": 300,
      "debito": 100,
      "voucher": 0,
      "ifood": 150,
      "total": 2250
    }
  ],
  "columns": [
    { "id": "dia", "label": "Dia", "order": 1 },
    { "id": "dinheiroDeposito", "label": "Dinheiro (deposito)", "order": 2 },
    { "id": "total", "label": "Total", "order": 8 }
  ]
}
```

### 6.2 POST – criar registro

```
POST /api/v1/financeiro/caixa
Content-Type: application/json
Authorization: Bearer <token>
X-Tenant-Id: <tenantId>

{
  "dia": "2026-01-15",
  "dinheiroDeposito": 1000,
  "pagamentoPdv": 200,
  "pix": 500,
  "credito": 300,
  "debito": 100,
  "voucher": 0,
  "ifood": 150
}
```

Backend pode calcular `total` e retornar o objeto completo no `data`.

### 6.3 GET Pedido de Venda por ID

```
GET /api/v1/financeiro/pedidos-venda/:id
Authorization: Bearer <token>
X-Tenant-Id: <tenantId>
```

Resposta: objeto PedidoVenda completo com array `itens` (ItemPedido[]).

---

## 7. Validacao da integracao

- **Sucesso:** Todas as respostas de listagem retornam `success: true`, `data` array ou objeto, e onde aplicavel `columns` com pelo menos as colunas padrao.
- **401:** Backend retorna 401 para rotas protegidas sem token ou com token invalido; o front redireciona para login.
- **Tenant:** Sem `X-Tenant-Id` (ou com tenant invalido), o backend pode retornar 403 ou lista vazia conforme politica; o front envia sempre o tenant quando disponivel.
- **Erro de validacao:** Resposta 4xx com `{ success: false, error: { message, details? } }`; o front exibe a mensagem.

---

## 8. Resumo

| Tema | Onde esta |
|------|-----------|
| Contrato por pagina (endpoints, payloads, colunas) | 01-contrato-frontend-backend.md |
| Padroes de API (auth, multi-tenant, formato resposta) | api-specification.md |
| Schema Prisma e modulos NestJS | 02-prisma-nestjs-implementacao.md |
| Dashboard, Relatorios, Balanco | 03-dashboard-relatorios-balanco.md |
| Socios e Movimentacoes | 04-socios-movimentacoes.md |
| **Financeiro Operacional (Caixa, Vendas, Entrada, etc.)** | **05-financeiro-operacional.md** |
| Base URL, headers, filtro de periodo, checklist | Este documento (06-integracao-backend.md) |

Implementar o backend seguindo os contratos e este guia garante que o frontend consiga integrar apenas apontando a base URL e passando a consumir os endpoints em vez de mock ou estado local.

---

**Versao:** 1.0.0  
**Data:** 2026-02-04  
**Fonte:** docs/05-backend/*.md, src/lib/api.ts, src/pages/financeiro/*.tsx, src/types/financeiro.ts
