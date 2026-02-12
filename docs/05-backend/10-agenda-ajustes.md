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

## 3. Lançar item direto na agenda (com recorrência)

**Objetivo:** O usuário pode lançar um item **só na agenda** (não cria despesa). O front envia **tipo** (entrada/saída), **recorrência** e **data fim da recorrência**. O backend deve aceitar esses campos e, quando houver recorrência, criar um item por ocorrência.

**Endpoint:** **POST /agenda/itens**

**Body aceito (campos adicionais):**

| Campo           | Tipo   | Obrigatório | Descrição |
|-----------------|--------|-------------|-----------|
| data            | string | sim         | Data da primeira ocorrência (YYYY-MM-DD). |
| valor           | number | sim         | Valor. |
| descricao       | string | nao         | Descrição do item. |
| lojaId          | string | nao         | UUID da loja. |
| **tipo**        | string | nao         | `"entrada"` ou `"saida"`. Default: `"saida"`. |
| **recorrencia** | string | nao         | `"unica"`, `"semanal"`, `"quinzenal"`, `"mensal"`, `"bimestral"`, `"trimestral"`, `"semestral"`, `"anual"`. Default: `"unica"`. |
| **recorrenciaFim** | string | nao      | Data limite (YYYY-MM-DD). Opcional; se omitido, gerar até 12 meses à frente (ou política do negócio). |

**Regra quando `recorrencia` ≠ `unica`:**

- Criar **um item de agenda por ocorrência**, com as mesmas características (descricao, valor, tipo), nas datas calculadas conforme a recorrência (mesma lógica das despesas recorrentes: mensal = mesmo dia no mês seguinte, etc.).
- Parar ao atingir `recorrenciaFim` ou 12 meses a partir de `data`, o que vier primeiro.
- Cada item criado deve constar em GET /agenda/dias e GET /agenda/dias/:data com `origem: "Agenda"` (ou equivalente).

---

## 4. Resumo

| Item | Ação no backend |
|------|------------------|
| Exibir despesa (fixa, etc.) | Incluir **origem** e **tipoDespesa** em cada item em GET /agenda/dias e GET /agenda/dias/:data. |
| Total do dia sem sinal | Nenhuma mudança. |
| Lançar direto na agenda com recorrência | POST /agenda/itens aceitar **tipo**, **recorrencia**, **recorrenciaFim** e gerar múltiplos itens quando houver recorrência. |
