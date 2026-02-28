# Fluxo de recorrência nas páginas de despesas (frontend)

Este documento descreve o fluxo de recorrência implementado no frontend para as páginas de despesas que usam o componente `DespesaPage`. A exceção é **Despesa Banco**, que não utiliza recorrência.

---

## 1. Visão geral

- **Componente reutilizável:** `DataValorList` (`src/components/ui/data-valor-list.tsx`) – lista de linhas com colunas **Data** e **Valor**, botão "Adicionar valor" e total.
- **Modo de uso:** No formulário de despesa, o usuário marca o checkbox **Recorrente**; ao marcar, aparece a seção **"Datas da recorrencia"** com a tabela. Cada linha é uma parcela (data + valor). Ao clicar em "Adicionar valor", é inserida uma nova linha com a data do **mês seguinte** à última (e o mesmo valor do campo Valor); se o dia não existir no mês (ex.: 31 em fevereiro), usa-se o último dia do mês.
- **Envio ao backend:** Um único **POST com array `parcelas`** (modo B do doc `05-backend/09-despesas-recorrencia.md`). O backend cria uma despesa por parcela, todas com o mesmo `recorrenciaGrupoId`.
- **Listagem:** A coluna Recorrência exibe o índice da parcela na série (ex.: `1/3`) quando a API retorna `recorrenciaIndice`.

---

## 2. Onde está implementado

| Página | Store | useRecorrenciaDataValorList | addItemComParcelas |
|--------|--------|------------------------------|---------------------|
| Despesa Fixa | useDespesaFixaStore | sim | sim |
| Despesa Extra | useDespesaExtraStore | sim | sim |
| Despesa Funcionário | useDespesaFuncionarioStore | sim | sim |
| Despesa Imposto | useDespesaImpostoStore | sim | sim |
| Despesa Veículo | useDespesaVeiculoStore | sim | sim |
| Despesa (categoria dinâmica) | useDespesaDinamicaStore | sim, exceto quando categoria = despesa-banco | sim, exceto quando categoria = despesa-banco |
| Despesa Banco | DespesaBancoPage (outro componente) | não tem recorrência | — |

---

## 3. Componentes e props

### 3.1 DespesaPage

- **useRecorrenciaDataValorList** (boolean): quando `true`, o formulário exibe o checkbox Recorrente e, ao marcar, a seção "Datas da recorrencia" com o `DataValorList`.
- **addItemComParcelas** (função opcional): quando informada e o usuário está criando com Recorrente marcado, o submit envia um único POST com `parcelas` em vez de vários POSTs.

### 3.2 DataValorList

- **value** / **onChange**: lista de `{ data: string (YYYY-MM-DD), valor: string }`.
- **getNewItem** (opcional): `(currentValue) => DataValorItem`. Usado ao clicar em "Adicionar valor"; no DespesaPage retorna `{ data: addOneMonth(última data), valor: formData.valor }`.
- **showTotal**: exibe o total e a quantidade de recorrências (ex.: "Total: R$ X (N recorrências)").

### 3.3 addOneMonth (lib/date.ts)

- Recebe uma data `YYYY-MM-DD` e retorna a data um mês depois.
- Se o dia não existir no próximo mês (ex.: 31 em fevereiro), usa o último dia do mês.

---

## 4. Fluxo do usuário

1. Usuário preenche Data, Tipo, Descrição, Valor (e opcionalmente Comunicar Agenda).
2. Marca **Recorrente** → aparece a tabela "Datas da recorrencia" com uma linha pré-preenchida (data e valor dos campos acima).
3. Pode clicar em **Adicionar valor** para novas linhas; cada nova linha recebe a data do mês seguinte à última e o mesmo valor do campo Valor.
4. Ao salvar (criar): um único POST com `{ categoria, tipo, descricao, comunicarAgenda, parcelas: [{ data, valor }, ...] }`.
5. Ao editar um item: o primeiro registro é atualizado via PATCH; parcelas adicionais na mesma abertura do modal são criadas via POST (uma por linha nova).

---

## 5. Referências de código

- **Componente lista:** `src/components/ui/data-valor-list.tsx`
- **Página despesa:** `src/components/despesa/DespesaPage.tsx` (uso de DataValorList, getNewItem, addItemComParcelas, handleSubmit modo B)
- **Helpers de data:** `src/lib/date.ts` (`addOneMonth`, `formatDateToLocalYYYYMMDD`)
- **Store:** `src/stores/despesaStore.ts` (`addItemComParcelas`, tipo `DespesaComParcelasInput`)
- **Tipos:** `src/types/despesa.ts` (`ParcelaDespesaInput`, `DespesaComParcelasInput`)
- **Backend:** `docs/05-backend/09-despesas-recorrencia.md` (seção 6 – modo B)
