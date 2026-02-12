# Despesas – Recorrência (especificação para o backend)

Este documento descreve o contrato e as regras de recorrência no módulo de despesas, conforme usado pelo frontend.

---

## 1. Campos no contrato

### 1.1 Request (POST /despesas e PATCH /despesas/:id)

O front envia no body:

| Campo             | Tipo    | Obrigatório | Descrição |
|-------------------|---------|-------------|-----------|
| categoria         | string  | sim (POST)  | `despesa-fixa`, `despesa-extra`, `despesa-funcionario`, `despesa-imposto`, `despesa-veiculo`, `despesa-banco` |
| data              | string  | sim         | Data do vencimento (YYYY-MM-DD). Na recorrência, é a **data da primeira ocorrência**. |
| tipo              | string  | sim         | Tipo da despesa (ex.: ALUGUEL, LUZ, OUTROS). |
| descricao         | string  | nao         | Descrição (opcional no backend). |
| valor             | number  | sim         | Valor em reais. |
| comunicarAgenda   | boolean | nao         | Se `true`, o backend deve criar/atualizar itens na **Agenda** (para o usuário marcar como pago por dia). |
| **recorrencia**   | string  | nao         | Ver valores aceitos abaixo. Default: `unica`. |
| **recorrenciaFim**| string  | nao         | Data limite da recorrência (YYYY-MM-DD). Opcional; se omitido, considerar até 12 meses à frente ou política do negócio. |
| lojaId            | string  | nao         | UUID da loja (multi-loja). |

### 1.2 Valores aceitos para `recorrencia`

O front usa exatamente estes valores (enum):

- `unica` – pagamento único, sem repetição
- `semanal` – repete toda semana
- `quinzenal` – a cada 15 dias
- `mensal` – todo mês (mesmo dia do mês)
- `bimestral` – a cada 2 meses
- `trimestral` – a cada 3 meses
- `semestral` – a cada 6 meses
- `anual` – todo ano (mesmo dia/mês)

Recomendação no backend: validar como enum e persistir como string (ex.: coluna `recorrencia VARCHAR(50) DEFAULT 'unica'`).

### 1.3 Response (GET lista, GET :id, POST, PATCH)

Todo item de despesa retornado deve poder incluir:

- `recorrencia`: string (ex.: `"mensal"`, `"unica"`)
- `recorrenciaFim`: string (YYYY-MM-DD) ou `null`/omitido

O front normaliza e exibe na tabela e no formulário de edição.

---

## 2. Regras de negócio (recorrência)

### 2.1 Quando o backend deve gerar ocorrências futuras

- **POST /despesas** com `recorrencia` diferente de `unica` (e opcionalmente `recorrenciaFim`):
  - Criar **um registro de despesa** para a **primeira ocorrência** (data = `data` do body).
  - Gerar **demais ocorrências** conforme o tipo de recorrência, até:
    - a data `recorrenciaFim` (se informada), ou
    - **12 meses** a partir de `data` (recomendação do produto), o que vier primeiro.

- Exemplo: POST com `data: "2026-01-15"`, `recorrencia: "mensal"`, `recorrenciaFim: "2026-12-15"`  
  → Backend cria 12 despesas (uma por mês: 15/01, 15/02, …, 15/12), mesmo descrição, tipo, valor, categoria, lojaId.

### 2.2 Cálculo das datas das próximas ocorrências

- **Mensal:** mesmo dia do mês; próximo mês (ex.: 15/01 → 15/02 → 15/03).
- **Bimestral:** +2 meses (ex.: 15/01 → 15/03 → 15/05).
- **Trimestral:** +3 meses.
- **Semestral:** +6 meses.
- **Anual:** mesmo dia e mês no ano seguinte.
- **Semanal:** +7 dias.
- **Quinzenal:** +15 dias.

Tratar fim de mês (ex.: 31/01 → 28/02 ou 29/02 em ano bissexto) conforme regra de negócio (último dia do mês ou dia fixo capado no máximo ao último dia).

### 2.3 Comportamento no PATCH /despesas/:id

- **Opção A (recomendada para simplicidade):**  
  PATCH altera **apenas o registro** com o `id` informado. Não cria nem altera outras ocorrências. O front hoje envia `recorrencia` e `recorrenciaFim` também no PATCH; o backend pode atualizar só esses campos naquele registro (para exibição/consulta), sem gerar novas ocorrências no PATCH.

- **Opção B (avançada):**  
  Se no futuro o produto quiser “alterar esta e as próximas”, pode-se definir um contrato específico (ex.: query `propagate=true` ou body `atualizarProximas: true`). Por ora, não é exigido pelo front.

### 2.4 Exclusão (DELETE /despesas/:id)

- Excluir **apenas** o registro com o `id` informado.
- Não excluir automaticamente outras ocorrências da “mesma série”; o usuário pode excluir uma por uma ou o backend pode oferecer um endpoint futuro “excluir série”.

---

## 3. Integração com a Agenda

- Quando `comunicarAgenda === true` no **POST** (e, se aplicável, na lógica de criação das ocorrências):
  - Para **cada** despesa criada (incluindo as geradas pela recorrência), o backend deve **inserir/atualizar o item correspondente na Agenda** (módulo de agenda), para que apareça na tela de Agenda por data e possa ser marcado como pago.
- Contrato da Agenda: ver documento de agenda (ex.: POST /agenda/itens ou equivalente); o front espera que, ao filtrar por data, os itens daquele dia (incluindo os vindos de despesas com `comunicarAgenda: true`) sejam retornados.
- Quando `comunicarAgenda === false`, o backend **não** precisa criar/atualizar itens de agenda para essa despesa.

---

## 4. Resumo para implementação

1. **Schema:**  
   - Campos na tabela de despesas: `recorrencia` (string, default `'unica'`), `recorrencia_fim` (date, opcional).

2. **POST /despesas:**  
   - Aceitar `recorrencia` e `recorrenciaFim`.  
   - Se `recorrencia` não for `unica`, gerar N despesas (datas calculadas conforme o tipo), até `recorrenciaFim` ou 12 meses.  
   - Para cada despesa criada, se `comunicarAgenda === true`, criar/atualizar item na Agenda.

3. **PATCH /despesas/:id:**  
   - Aceitar `recorrencia` e `recorrenciaFim` e persistir apenas no registro alterado (sem gerar novas ocorrências).

4. **GET (lista e por id):**  
   - Incluir `recorrencia` e `recorrenciaFim` em cada item retornado.

5. **Filtro opcional:**  
   - GET /despesas pode aceitar query `recorrencia` (ex.: `recorrencia=mensal`) para filtrar por tipo de recorrência, conforme api-specification.md.

---

## 5. Referências no frontend

- Tipos: `src/types/despesa.ts` (DespesaBase, DespesaInput), `src/types/recorrencia.ts` (TipoRecorrencia, RECORRENCIAS).
- UI: checkbox “recorrente”, select de periodicidade e campo “data fim” em `DespesaPage` e `CriarDespesaPage`; valores enviados em POST/PATCH em `despesaStore` e nas páginas.
- Cálculo de datas (apenas referência; o backend deve ter sua própria lógica): `calcularProximasOcorrencias` em `src/types/recorrencia.ts`.
