# Agenda – Ajustes para o backend

Documento objetivo com alterações necessárias no backend para o módulo Agenda.

---

## 1. Itens do dia: exibir origem e tipo da despesa

**Objetivo:** Na tela de detalhe do dia, o front exibe cada item com uma etiqueta indicando a **origem** (ex.: Despesa Fixa, Despesa Extra) e o **tipo** da despesa (ex.: ALUGUEL, LUZ).

**O que o backend deve retornar:**

Em **GET /agenda/dias** e **GET /agenda/dias/:data**, cada objeto em `itens[]` deve incluir:

| Campo         | Tipo   | Descrição |
|---------------|--------|-----------|
| **origem**    | string | Nome da categoria de origem. Ex.: `"Despesa Fixa"`, `"Despesa Extra"`, `"Despesa Funcionário"`, `"Despesa Imposto"`, `"Despesa Veículo"`, `"Despesa Banco"`, `"Agenda"` (quando for item lançado direto na agenda). |
| **tipoDespesa** | string | (Opcional) Tipo da despesa quando vier de despesa. Ex.: `"ALUGUEL"`, `"LUZ"`, `"MANUTENCAO"`. |

Quando o item vier de uma despesa (comunicarAgenda), preencher `origem` com o nome amigável da categoria e `tipoDespesa` com o campo `tipo` da despesa. Quando o item for lançado direto na agenda (POST /agenda/itens), `origem` pode ser `"Agenda"` e `tipoDespesa` omitido.

---

## 2. Total do dia sem sinal

**Objetivo:** O front já exibe apenas o **total líquido do dia** (entradas − saídas), **sem** caractere de mais ou menos; a cor (verde/vermelho) indica se é positivo ou negativo.

Nenhuma alteração obrigatória no backend. Manter o retorno com `totalEntradas` e `totalSaidas` por dia; o front calcula o total e formata sem sinal.

---

## 3. Lançar item direto na agenda – dois modos

O front da Agenda passou a usar o mesmo padrão de recorrência da Despesa Fixa: **recorrência por lista de datas** (checkbox "Recorrente" + tabela Data/Valor). O backend deve aceitar os dois formatos abaixo no **POST /agenda/itens**.

### 3.1 Modo único (um item)

Body com `data` e `valor` (sem array `parcelas`):

| Campo     | Tipo   | Obrigatório | Descrição |
|-----------|--------|-------------|-----------|
| data      | string | sim         | Data (YYYY-MM-DD). |
| valor     | number | sim         | Valor. |
| descricao | string | nao         | Descrição. |
| lojaId    | string | nao         | UUID da loja. |

Criar **um** item de agenda nessa data, com `origem: "Agenda"`.

### 3.2 Modo recorrente por lista (parcelas)

Body com **parcelas** (array). O front envia uma lista explícita de datas e valores (igual ao fluxo de Despesa Fixa).

| Campo      | Tipo   | Obrigatório | Descrição |
|------------|--------|-------------|-----------|
| descricao  | string | sim         | Descrição (única para toda a série). |
| lojaId     | string | nao         | UUID da loja. |
| **parcelas** | array | sim         | Lista de `{ data: string (YYYY-MM-DD), valor: number }`. Mínimo 1 elemento. |

**Regra:**

- Se o body contiver **parcelas** (array com pelo menos um elemento), **ignorar** os campos avulsos `data` e `valor`.
- Criar **um item de agenda por elemento** de `parcelas`, todos com a mesma `descricao` (e `lojaId` se informado).
- Cada item criado deve constar em GET /agenda/dias e GET /agenda/dias/:data com `origem: "Agenda"`.
- Tipo (entrada/saída): o front hoje envia apenas itens de saída na agenda direta; o backend pode fixar como `tipo: "saida"` ou aceitar um campo opcional `tipo` no body (e nas parcelas não há tipo por parcela).

**Exemplo de body (modo parcelas):**

```json
{
  "descricao": "Aluguel",
  "parcelas": [
    { "data": "2026-03-10", "valor": 1500 },
    { "data": "2026-04-10", "valor": 1500 },
    { "data": "2026-05-10", "valor": 1500 }
  ]
}
```

Resposta: 201 ou 200, conforme contrato atual. Não é obrigatório retornar os itens criados; o front recarrega a lista (fetchDias) após o POST.

### 3.3 Modo antigo (recorrência por periodicidade) – opcional

Se o backend já implementou POST com `recorrencia` e `recorrenciaFim`, pode manter para compatibilidade. O front da Agenda **não envia mais** esse formato; ele só envia **modo único** (data + valor) ou **modo parcelas** (descricao + parcelas).

---

## 4. Resumo

| Item | Ação no backend |
|------|------------------|
| Exibir despesa (fixa, etc.) | Incluir **origem** e **tipoDespesa** em cada item em GET /agenda/dias e GET /agenda/dias/:data. |
| Total do dia sem sinal | Nenhuma mudança. |
| Lançar direto na agenda | POST /agenda/itens aceitar: (1) **data** + **valor** + descricao para um item; (2) **descricao** + **parcelas** (array de `{ data, valor }`) para vários itens em uma única requisição. |
