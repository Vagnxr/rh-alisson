# Financeiro Operacional - Contrato Backend

Este documento e o **contrato** para o backend implementar o modulo **Financeiro Operacional**: todas as telas do menu Financeiro (Caixa, Controle Cartoes, Vendas, Controle Dinheiro, Controle Deposito, Venda Cartoes, Ativo Imobilizado, Entrada, Saida, Pago em Dinheiro, Pedido de Venda). O frontend possui CRUD completo em todas essas telas; ao expor estes endpoints, o front passara a consumir dados reais.

**Observacao:** A tela **Calculadora de Margem** nao requer backend (calculo feito no frontend).

**Para o Agent / Implementacao do Backend:**
1. Seguir as convencoes de **01-contrato-frontend-backend.md** e **api-specification.md**: `{ success: true, data: ... }`, JWT, header `X-Tenant-Id` para multi-tenant.
2. **Colunas de tabela:** Todo GET de listagem deve incluir na resposta o campo **`columns`** (tabelaId conforme tabela abaixo), exceto onde indicado.
3. Isolamento por **tenant**: todos os recursos devem ser filtrados pelo tenant do usuario.
4. **Filtro de periodo:** O front envia `dataInicio` e `dataFim` em **YYYY-MM-DD**. O backend deve filtrar registros cuja data (campo relevante) esteja no intervalo inclusivo. Se omitidos, o backend pode retornar mes atual ou ultimos 30 dias (documentar o padrao).

---

## Convencoes comuns

- **Datas:** Sempre em formato **YYYY-MM-DD** (ou ISO 8601 com time quando houver hora). O front pode enviar `dataInicio`/`dataFim` nas queries.
- **Valores monetarios:** Sempre **number** (ex.: 1234.56). Nao enviar strings formatadas.
- **Resposta lista:** `{ success: true, data: [...], columns?: [...] }`. Incluir `columns` quando a tela for tabela configurável (conforme mapeamento endpoint -> tabelaId no contrato 01; novos tabelaIds abaixo).
- **IDs:** UUID (string) gerados pelo backend.

---

## 1. Caixa (CaixaPage)

Registros diarios: dinheiro (deposito), pagamento PDV, PIX, credito, debito, voucher, iFood e total.

### 1.1 Modelo Caixa

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | string (UUID) | sim | Gerado pelo backend |
| dia | string | sim | Data do registro (YYYY-MM-DD) |
| dinheiroDeposito | number | sim | Valor em dinheiro (deposito) |
| pagamentoPdv | number | sim | Pagamento no PDV |
| pix | number | sim | Valor PIX |
| credito | number | sim | Cartao credito |
| debito | number | sim | Cartao debito |
| voucher | number | sim | Voucher |
| ifood | number | sim | iFood |
| total | number | sim | Total do dia (soma dos anteriores ou informado) |

### 1.2 Endpoints Caixa

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/financeiro/caixa` | Lista registros do periodo |
| POST | `/financeiro/caixa` | Cria registro |
| PATCH | `/financeiro/caixa/:id` | Atualiza registro |
| DELETE | `/financeiro/caixa/:id` | Exclui registro |

**GET** – Query params: `dataInicio`, `dataFim` (YYYY-MM-DD). Response: `{ success: true, data: Caixa[], columns?: [...] }`. tabelaId: `financeiro-caixa`.

**POST** – Body: `{ dia, dinheiroDeposito, pagamentoPdv, pix, credito, debito, voucher, ifood }`. Backend pode calcular `total` como soma ou aceitar no body se enviado.

**PATCH** – Body: partial dos campos. **DELETE** – 204 ou 200.

---

## 2. Controle Cartoes (ControleCartoesPage)

Registros por tipo (Credito/Debito com bandeiras, PIX, Voucher, iFood, Outras funcoes). Header: Prazo, taxa %, data a receber, bruto, desconto, liquido. Tabela: dia da semana, data, valor, desconto, a receber, data a receber, dia da semana.

### 2.1 Modelo ControleCartoes

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | string (UUID) | sim | Gerado pelo backend |
| tipo | string | sim | `credito-debito` \| `pix` \| `voucher` \| `ifood` \| `outras` |
| bandeira | string | nao | Para credito-debito: `amex`, `elo-credito`, `hipercard`, `mastercard`, `visa`, `electron`, `elo-debito`, `maestro` |
| data | string | sim | Data (YYYY-MM-DD) |
| valor | number | sim | Valor bruto |
| desconto | number | sim | Desconto |
| aReceber | number | sim | Valor liquido (valor - desconto) |
| dataAReceber | string | sim | Data prevista para recebimento (YYYY-MM-DD) |

O front calcula `diaSemana` e `diaSemanaAReceber` a partir das datas; o backend pode armazenar apenas as datas ou denormalizar.

### 2.2 Endpoints Controle Cartoes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/financeiro/controle-cartoes` | Lista registros (filtro por tipo/bandeira e periodo) |
| POST | `/financeiro/controle-cartoes` | Cria registro |
| PATCH | `/financeiro/controle-cartoes/:id` | Atualiza registro |
| DELETE | `/financeiro/controle-cartoes/:id` | Exclui registro |

**GET** – Query params: `dataInicio`, `dataFim`, `tipo` (opcional), `bandeira` (opcional, quando tipo=credito-debito). Response inclui `data` e opcionalmente resumo agregado (bruto, desconto, liquido) no mesmo payload ou em endpoint separado GET `/financeiro/controle-cartoes/resumo`. tabelaId: `financeiro-controle-cartoes`.

**POST** – Body: `{ tipo, bandeira?, data, valor, desconto, dataAReceber }`. Backend calcula `aReceber = valor - desconto`.

---

## 3. Vendas (VendasPage)

Registros diarios: dia e valor.

### 3.1 Modelo Vendas

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | string (UUID) | sim | Gerado pelo backend |
| dia | string | sim | Data (YYYY-MM-DD) |
| valor | number | sim | Valor da venda |

### 3.2 Endpoints Vendas

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/financeiro/vendas` | Lista vendas do periodo |
| POST | `/financeiro/vendas` | Cria registro |
| PATCH | `/financeiro/vendas/:id` | Atualiza registro |
| DELETE | `/financeiro/vendas/:id` | Exclui registro |

**GET** – Query: `dataInicio`, `dataFim`. tabelaId: `financeiro-vendas`.

---

## 4. Controle Dinheiro (ControleDinheiroPage)

Registros: data, dia (semana), deposito, sobra, pag. PDV, total dia.

### 4.1 Modelo ControleDinheiro

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | string (UUID) | sim | Gerado pelo backend |
| data | string | sim | Data (YYYY-MM-DD) |
| dia | string | nao | Dia da semana (ex.: Segunda) |
| deposito | number | sim | Valor depositado |
| sobra | number | sim | Sobra |
| pagPdv | number | sim | Pagamento PDV |
| totalDia | number | sim | Total do dia |

### 4.2 Endpoints Controle Dinheiro

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/financeiro/controle-dinheiro` | Lista registros do periodo |
| POST | `/financeiro/controle-dinheiro` | Cria registro |
| PATCH | `/financeiro/controle-dinheiro/:id` | Atualiza registro |
| DELETE | `/financeiro/controle-dinheiro/:id` | Exclui registro |

**GET** – Query: `dataInicio`, `dataFim`. tabelaId: `financeiro-controle-dinheiro`.

---

## 5. Controle Deposito (ControleDepositoPage)

Duas listagens: **Deposito** (data, dia, dinheiro, sobra, total) e **Valor depositado** (data, dia, dinheiro).

### 5.1 Modelo Deposito (Tabela 1)

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | string (UUID) | sim | Gerado pelo backend |
| data | string | sim | Data (YYYY-MM-DD) |
| dia | string | nao | Dia da semana |
| dinheiro | number | sim | Dinheiro |
| sobra | number | sim | Sobra |
| total | number | sim | Total |

### 5.2 Modelo Valor Depositado (Tabela 2)

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | string (UUID) | sim | Gerado pelo backend |
| data | string | sim | Data (YYYY-MM-DD) |
| dia | string | nao | Dia da semana |
| dinheiro | number | sim | Valor depositado |

### 5.3 Endpoints Controle Deposito

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/financeiro/controle-deposito` | Lista registros da tabela Deposito (periodo) |
| POST | `/financeiro/controle-deposito` | Cria registro Deposito |
| PATCH | `/financeiro/controle-deposito/:id` | Atualiza registro Deposito |
| DELETE | `/financeiro/controle-deposito/:id` | Exclui registro Deposito |
| GET | `/financeiro/valor-depositado` | Lista registros Valor depositado (periodo) |
| POST | `/financeiro/valor-depositado` | Cria registro Valor depositado |
| PATCH | `/financeiro/valor-depositado/:id` | Atualiza registro Valor depositado |
| DELETE | `/financeiro/valor-depositado/:id` | Exclui registro Valor depositado |

**GET** – Query: `dataInicio`, `dataFim` para ambos. tabelaIds: `financeiro-deposito`, `financeiro-valor-depositado`.

---

## 6. Venda Cartoes (VendaCartoesPage)

Registros diarios: dia, credito, debito, voucher, PIX, iFood, total dia.

### 6.1 Modelo VendaCartoes

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | string (UUID) | sim | Gerado pelo backend |
| dia | string | sim | Data (YYYY-MM-DD) |
| credito | number | sim | Valor credito |
| debito | number | sim | Valor debito |
| voucher | number | sim | Voucher |
| pix | number | sim | PIX |
| food | number | sim | iFood |
| totalDia | number | sim | Total (soma ou informado) |

### 6.2 Endpoints Venda Cartoes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/financeiro/venda-cartoes` | Lista registros do periodo |
| POST | `/financeiro/venda-cartoes` | Cria registro |
| PATCH | `/financeiro/venda-cartoes/:id` | Atualiza registro |
| DELETE | `/financeiro/venda-cartoes/:id` | Exclui registro |

**GET** – Query: `dataInicio`, `dataFim`. tabelaId: `financeiro-venda-cartoes`.

---

## 7. Ativo Imobilizado (AtivoImobilizadoPage)

Duas listagens: **Entrada** e **Saida**. Campos: data, N.F., descricao/fornecedor, valor.

### 7.1 Modelo AtivoImobilizado

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | string (UUID) | sim | Gerado pelo backend |
| tipo | string | sim | `entrada` \| `saida` |
| data | string | sim | Data (YYYY-MM-DD) |
| nf | string | nao | Numero da nota fiscal |
| descricaoFornecedor | string | sim | Descricao ou nome do fornecedor |
| valor | number | sim | Valor |

### 7.2 Endpoints Ativo Imobilizado

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/financeiro/ativo-imobilizado` | Lista entradas e saidas (query `tipo=entrada` ou `tipo=saida`, periodo) |
| POST | `/financeiro/ativo-imobilizado` | Cria registro (body com `tipo`) |
| PATCH | `/financeiro/ativo-imobilizado/:id` | Atualiza registro |
| DELETE | `/financeiro/ativo-imobilizado/:id` | Exclui registro |

**GET** – Query: `dataInicio`, `dataFim`, `tipo` (obrigatorio: `entrada` ou `saida`). Response: lista de registros do tipo solicitado. tabelaIds: `financeiro-ativo-entrada`, `financeiro-ativo-saida`.

**POST** – Body: `{ tipo, data, nf?, descricaoFornecedor, valor }`.

---

## 8. Entrada (EntradaPage)

Registros de entrada por fornecedor e categorias de valor.

### 8.1 Modelo Entrada

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | string (UUID) | sim | Gerado pelo backend |
| data | string | sim | Data (YYYY-MM-DD) |
| fornecedor | string | nao | Nome do fornecedor |
| industrializacao | number | sim | Valor |
| comercializacao | number | sim | Valor |
| embalagem | number | sim | Valor |
| materialUsoCons | number | sim | Material uso/consumo |
| mercadoriaUsoCons | number | sim | Mercadoria uso/consumo |
| gas | number | sim | Gas |

### 8.2 Endpoints Entrada

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/financeiro/entrada` | Lista registros do periodo |
| POST | `/financeiro/entrada` | Cria registro |
| PATCH | `/financeiro/entrada/:id` | Atualiza registro |
| DELETE | `/financeiro/entrada/:id` | Exclui registro |

**GET** – Query: `dataInicio`, `dataFim`. tabelaId: `financeiro-entrada`.

---

## 9. Saida (SaidaPage)

Mesmo modelo da Entrada, usado para saidas.

### 9.1 Modelo Saida

Mesmos campos de Entrada (id, data, fornecedor, industrializacao, comercializacao, embalagem, materialUsoCons, mercadoriaUsoCons, gas).

### 9.2 Endpoints Saida

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/financeiro/saida` | Lista registros do periodo |
| POST | `/financeiro/saida` | Cria registro |
| PATCH | `/financeiro/saida/:id` | Atualiza registro |
| DELETE | `/financeiro/saida/:id` | Exclui registro |

**GET** – Query: `dataInicio`, `dataFim`. tabelaId: `financeiro-saida`.

---

## 10. Pago em Dinheiro (PagoDinheiroPage)

Registros: data, descricao/fornecedor, valor.

### 10.1 Modelo PagoDinheiro

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | string (UUID) | sim | Gerado pelo backend |
| data | string | sim | Data (YYYY-MM-DD) |
| descricaoFornecedor | string | nao | Descricao ou fornecedor |
| valor | number | sim | Valor pago em dinheiro |

### 10.2 Endpoints Pago em Dinheiro

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/financeiro/pago-dinheiro` | Lista registros do periodo |
| POST | `/financeiro/pago-dinheiro` | Cria registro |
| PATCH | `/financeiro/pago-dinheiro/:id` | Atualiza registro |
| DELETE | `/financeiro/pago-dinheiro/:id` | Exclui registro |

**GET** – Query: `dataInicio`, `dataFim`. tabelaId: `financeiro-pago-dinheiro`.

---

## 11. Pedido de Venda (PedidoVendaPage)

Documento de pedido com cabecalho (empresa, numero, data, comprador, comercio, escopo, forma de pagamento), dados do fornecedor e itens (QTDE, UND, descricao, unit, total, %).

### 11.1 Modelo PedidoVenda

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | string (UUID) | sim | Gerado pelo backend |
| nomeEmpresa | string | nao | Nome da empresa |
| numeroPedido | string | nao | Numero do pedido |
| dataPedido | string | sim | Data do pedido (YYYY-MM-DD) |
| comprador | string | nao | Nome do comprador |
| comercio | string | nao | Comercio |
| escopo | string | nao | Escopo |
| formaPgto | string | nao | Forma de pagamento (ex.: BOLETO) |
| codigo | string | nao | Codigo fornecedor |
| razaoSocial | string | nao | Razao social fornecedor |
| cnpj | string | nao | CNPJ |
| inscEstadual | string | nao | Inscricao estadual |
| inscMun | string | nao | Inscricao municipal |
| telefone | string | nao | Telefone |
| celular | string | nao | Celular |
| endereco | string | nao | Endereco |
| cep | string | nao | CEP |
| municipioUf | string | nao | Municipio/UF |
| email | string | nao | E-mail |
| contato | string | nao | Contato |
| obs | string | nao | Observacoes |
| itens | ItemPedido[] | sim | Lista de itens (minimo 1) |

### 11.2 Modelo ItemPedido

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | string (UUID) | sim | Gerado pelo backend (ou front para novos itens) |
| qtde | string | nao | Quantidade (pode vir "10,00") |
| und | string | nao | Unidade |
| descricao | string | nao | Descricao do produto |
| unit | string | nao | Preco unitario (pode vir "1,00") |
| total | string | nao | Total (pode vir "10,00") |
| percent | string | nao | Percentual (ex.: "33,33") |

O front pode enviar numeros como string formatada (virgula decimal); o backend pode armazenar como string ou normalizar para number conforme necessidade.

### 11.3 Endpoints Pedido de Venda

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/financeiro/pedidos-venda` | Lista pedidos (opcionalmente periodo ou filtros) |
| GET | `/financeiro/pedidos-venda/:id` | Busca um pedido com itens |
| POST | `/financeiro/pedidos-venda` | Cria pedido (com itens no body) |
| PATCH | `/financeiro/pedidos-venda/:id` | Atualiza pedido (e/ou itens) |
| DELETE | `/financeiro/pedidos-venda/:id` | Exclui pedido (e itens em cascata) |

**GET lista** – Query: `dataInicio`, `dataFim` (opcional). Response: array de pedidos (pode ser resumo: id, numeroPedido, dataPedido, comprador, total calculado). tabelaId: `financeiro-pedido-venda`.

**GET :id** – Response: objeto PedidoVenda completo com array `itens`.

**POST** – Body: objeto PedidoVenda (sem id ou com id vazio; itens com ou sem id). Backend gera ids e numeroPedido se nao informado (ex.: sequencial por tenant).

**PATCH** – Body: partial do pedido e/ou array `itens` completo (substituir itens) ou array de itens com id para atualizar/criar/remover. Definir politica: substituicao total de itens ou merge por id.

---

## 12. Resumo de endpoints (Financeiro Operacional)

| Recurso | GET | POST | PATCH | DELETE |
|---------|-----|------|-------|--------|
| Caixa | /financeiro/caixa (?dataInicio, ?dataFim) | /financeiro/caixa | /financeiro/caixa/:id | /financeiro/caixa/:id |
| Controle Cartoes | /financeiro/controle-cartoes (?dataInicio, ?dataFim, ?tipo, ?bandeira) | /financeiro/controle-cartoes | /financeiro/controle-cartoes/:id | /financeiro/controle-cartoes/:id |
| Vendas | /financeiro/vendas (?dataInicio, ?dataFim) | /financeiro/vendas | /financeiro/vendas/:id | /financeiro/vendas/:id |
| Controle Dinheiro | /financeiro/controle-dinheiro (?dataInicio, ?dataFim) | /financeiro/controle-dinheiro | /financeiro/controle-dinheiro/:id | /financeiro/controle-dinheiro/:id |
| Deposito | /financeiro/controle-deposito (?dataInicio, ?dataFim) | /financeiro/controle-deposito | /financeiro/controle-deposito/:id | /financeiro/controle-deposito/:id |
| Valor Depositado | /financeiro/valor-depositado (?dataInicio, ?dataFim) | /financeiro/valor-depositado | /financeiro/valor-depositado/:id | /financeiro/valor-depositado/:id |
| Venda Cartoes | /financeiro/venda-cartoes (?dataInicio, ?dataFim) | /financeiro/venda-cartoes | /financeiro/venda-cartoes/:id | /financeiro/venda-cartoes/:id |
| Ativo Imobilizado | /financeiro/ativo-imobilizado (?dataInicio, ?dataFim, ?tipo) | /financeiro/ativo-imobilizado | /financeiro/ativo-imobilizado/:id | /financeiro/ativo-imobilizado/:id |
| Entrada | /financeiro/entrada (?dataInicio, ?dataFim) | /financeiro/entrada | /financeiro/entrada/:id | /financeiro/entrada/:id |
| Saida | /financeiro/saida (?dataInicio, ?dataFim) | /financeiro/saida | /financeiro/saida/:id | /financeiro/saida/:id |
| Pago Dinheiro | /financeiro/pago-dinheiro (?dataInicio, ?dataFim) | /financeiro/pago-dinheiro | /financeiro/pago-dinheiro/:id | /financeiro/pago-dinheiro/:id |
| Pedido Venda | /financeiro/pedidos-venda (?dataInicio, ?dataFim), /financeiro/pedidos-venda/:id | /financeiro/pedidos-venda | /financeiro/pedidos-venda/:id | /financeiro/pedidos-venda/:id |

---

## 13. TabelaIds para colunas (Configuracoes)

Para listagens que retornam `columns`, usar os seguintes **tabelaId** ao buscar configuracao do usuario:

| Endpoint GET (lista) | tabelaId |
|----------------------|----------|
| GET /financeiro/caixa | financeiro-caixa |
| GET /financeiro/controle-cartoes | financeiro-controle-cartoes |
| GET /financeiro/vendas | financeiro-vendas |
| GET /financeiro/controle-dinheiro | financeiro-controle-dinheiro |
| GET /financeiro/controle-deposito | financeiro-deposito |
| GET /financeiro/valor-depositado | financeiro-valor-depositado |
| GET /financeiro/venda-cartoes | financeiro-venda-cartoes |
| GET /financeiro/ativo-imobilizado (tipo=entrada) | financeiro-ativo-entrada |
| GET /financeiro/ativo-imobilizado (tipo=saida) | financeiro-ativo-saida |
| GET /financeiro/entrada | financeiro-entrada |
| GET /financeiro/saida | financeiro-saida |
| GET /financeiro/pago-dinheiro | financeiro-pago-dinheiro |
| GET /financeiro/pedidos-venda | financeiro-pedido-venda |

Se o usuario nao tiver config salva, retornar colunas padrao (todas as colunas da tela em ordem logica).

---

## 14. Regras de negocio sugeridas

1. **Tenant:** Todo registro do modulo financeiro operacional pertence a um tenant. Filtrar sempre por tenant (sessao do usuario ou `X-Tenant-Id`).
2. **Datas:** Filtrar por `dataInicio` e `dataFim` no campo de data apropriado de cada entidade (dia, data, dataPedido). Intervalo inclusivo (>= dataInicio e <= dataFim).
3. **Valores:** Armazenar como number. Validar valor >= 0 quando fizer sentido (evitar negativos em caixa, vendas, etc., exceto se a regra permitir).
4. **Total calculado:** Em Caixa e Venda Cartoes, o backend pode calcular `total` / `totalDia` como soma dos campos ou aceitar valor informado; documentar a regra adotada.
5. **Pedido de Venda:** Numero do pedido pode ser sequencial por tenant (ex.: 1, 2, 3). Ao excluir pedido, excluir itens em cascata.
6. **Controle Cartoes:** Resumo (bruto, desconto, liquido) pode ser calculado agregando os registros do periodo/tipo/bandeira; opcionalmente expor GET `/financeiro/controle-cartoes/resumo` com query params.

---

**Versao:** 1.0.0  
**Data:** 2026-02-04  
**Fonte:** `src/types/financeiro.ts`, `src/pages/financeiro/*.tsx`, `src/pages/financeiro/PedidoVendaPage.tsx` (PedidoVenda, ItemPedido). Frontend com CRUD completo em todas as telas do menu Financeiro (exceto Calculadora de Margem).
