# Socios e Movimentacoes - Contrato Backend

Este documento e o **contrato** para o backend implementar o modulo **Socios** e **Movimentacoes de Socios**. O frontend possui CRUD completo: cadastro, edicao e exclusao de socios, alem de movimentacoes (pro-labore, distribuicao, retirada, aporte, outro) por socio.

**Para o Agent / Implementacao do Backend:**
1. Seguir as convencoes de **01-contrato-frontend-backend.md** e **api-specification.md**: `{ success: true, data: ... }`, JWT, header `X-Tenant-Id` para multi-tenant.
2. **Colunas de tabela:** GET `/socios` e GET `/movimentacoes-socios` devem incluir na resposta o campo **`columns`** (tabelaId `socios` e `movimentacoes-socios`), conforme secao "Colunas de tabela" do contrato 01.
3. Isolamento por **tenant**: todos os recursos (socios e movimentacoes) devem ser filtrados pelo tenant do usuario (ou pelo `X-Tenant-Id` quando Super Admin).

---

## 1. Modelo de dados

### 1.1 Socio

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | string (UUID) | sim | Gerado pelo backend |
| nome | string | sim | Nome completo do socio |
| cpf | string | sim | CPF (11 digitos; pode armazenar apenas numeros e formatar na resposta) |
| percentualSociedade | number | sim | Participacao na sociedade (0 a 100) |
| isAtivo | boolean | sim | Se o socio esta ativo (default true na criacao) |

- **tenantId:** O backend deve associar cada socio a um tenant. Nao e retornado no JSON para o front; o front filtra por tenant via contexto do usuario.

### 1.2 MovimentacaoSocio

| Campo | Tipo | Obrigatorio | Descricao |
|-------|------|-------------|-----------|
| id | string (UUID) | sim | Gerado pelo backend |
| socioId | string (UUID) | sim | Referencia ao socio |
| socioNome | string | sim | Nome do socio (preenchido pelo backend; pode ser denormalizado ou buscado ao retornar) |
| data | string | sim | Data da movimentacao (YYYY-MM-DD) |
| tipo | enum | sim | Ver valores abaixo |
| descricao | string | sim | Descricao livre |
| valor | number | sim | Valor (sempre positivo; o front exibe com sinal conforme o tipo) |
| createdAt | string (ISO 8601) | sim | Data de criacao |
| updatedAt | string (ISO 8601) | sim | Data de atualizacao |

**tipo (enum):** `pro-labore` | `distribuicao` | `retirada` | `aporte` | `outro`

### 1.3 ResumoSocio (visao agregada)

Usado na lista de cards da SociosPage. Nao e uma entidade de banco; e resultado de agregacao.

| Campo | Tipo | Descricao |
|-------|------|-----------|
| socio | Socio | Objeto do socio |
| totalProLabore | number | Soma das movimentacoes com tipo `pro-labore` |
| totalDistribuicao | number | Soma das movimentacoes com tipo `distribuicao` |
| totalRetiradas | number | Soma das movimentacoes com tipo `retirada` |
| totalAportes | number | Soma das movimentacoes com tipo `aporte` |
| saldoTotal | number | Saldo consolidado (ex.: totalProLabore + totalDistribuicao - totalRetiradas + totalAportes; regra de negocio pode variar) |

---

## 2. Endpoints – Socios

### 2.1 Listar socios

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/socios` | Lista todos os socios do tenant |

**Headers:** `Authorization: Bearer <token>`, `X-Tenant-Id` (opcional para Super Admin).

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nome": "string",
      "cpf": "12345678901",
      "percentualSociedade": 50,
      "isAtivo": true
    }
  ],
  "columns": [
    { "id": "nome", "label": "Nome", "order": 1 },
    { "id": "cpf", "label": "CPF", "order": 2 },
    { "id": "percentualSociedade", "label": "Participacao %", "order": 3 },
    { "id": "isAtivo", "label": "Status", "order": 4 }
  ]
}
```

- Retornar apenas socios do tenant do usuario.
- **columns:** Configuracao de colunas da tabela (tabelaId `socios`). Se o usuario nao tiver config salva, retornar o padrao.

### 2.2 Criar socio

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/socios` | Cadastra um novo socio |

**Request body:**
```json
{
  "nome": "string",
  "cpf": "string",
  "percentualSociedade": 50,
  "isAtivo": true
}
```

- **nome:** Obrigatorio, nao vazio.
- **cpf:** Obrigatorio; 11 digitos (aceitar com ou sem formatacao; armazenar normalizado). Validar CPF (digitos verificadores) se possivel.
- **percentualSociedade:** Numero entre 0 e 100. Regra de negocio: a soma dos percentuais dos socios ativos pode ser validada (ex.: nao ultrapassar 100% ou permitir conforme regra).
- **isAtivo:** Boolean; default true.

**Response 200:** Objeto Socio criado (com `id`, `createdAt`/`updatedAt` se o modelo tiver).
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nome": "string",
    "cpf": "12345678901",
    "percentualSociedade": 50,
    "isAtivo": true
  }
}
```

**Erros esperados:** 400 (validacao), 409 (ex.: CPF duplicado no mesmo tenant).

### 2.3 Atualizar socio

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| PATCH | `/socios/:id` | Atualiza um socio existente |

**Request body:** Partial do body de criacao (nome, cpf, percentualSociedade, isAtivo). Apenas os campos enviados devem ser atualizados.

**Response 200:** Objeto Socio atualizado.

**Erros:** 404 (socio nao encontrado ou de outro tenant), 400 (validacao).

### 2.4 Excluir socio

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| DELETE | `/socios/:id` | Exclui um socio |

- Deve excluir em cascata as **movimentacoes** vinculadas ao socio (ou impedir exclusao se houver movimentacoes e a regra for essa). O front espera que a exclusao seja permitida e que as movimentacoes sejam removidas ou que o backend retorne erro explicativo.
- Retornar 204 No Content ou 200 com `{ "success": true, "data": null }` conforme padrao da API.

**Erros:** 404 (socio nao encontrado ou de outro tenant).

### 2.5 Resumo por socio

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/socios/resumo` | Retorna um resumo por socio (totais de movimentacoes por tipo e saldo) |

Usado na primeira tela da SociosPage (cards). Calcular totais a partir das movimentacoes agrupadas por socio.

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "socio": {
        "id": "uuid",
        "nome": "string",
        "cpf": "12345678901",
        "percentualSociedade": 50,
        "isAtivo": true
      },
      "totalProLabore": 10000.00,
      "totalDistribuicao": 5000.00,
      "totalRetiradas": 3000.00,
      "totalAportes": 0,
      "saldoTotal": 12000.00
    }
  ]
}
```

- Incluir apenas socios do tenant. Opcionalmente filtrar apenas `isAtivo: true`; o front hoje exibe todos os que vierem no resumo.
- **saldoTotal:** Definir regra de negocio (ex.: totalProLabore + totalDistribuicao - totalRetiradas + totalAportes).

---

## 3. Endpoints – Movimentacoes de Socios

### 3.1 Listar movimentacoes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/movimentacoes-socios` | Lista movimentacoes (opcionalmente filtradas por socio) |

**Query params (opcionais):**
- `socioId` (UUID) — filtrar por socio. O front chama com ou sem esse parametro.
- `dataInicio` (YYYY-MM-DD)
- `dataFim` (YYYY-MM-DD)

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "socioId": "uuid",
      "socioNome": "Nome do Socio",
      "data": "2026-01-15",
      "tipo": "pro-labore",
      "descricao": "Pro-labore Janeiro",
      "valor": 5000.00,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-15T10:00:00.000Z"
    }
  ],
  "columns": [
    { "id": "data", "label": "Data", "order": 1 },
    { "id": "tipo", "label": "Tipo", "order": 2 },
    { "id": "descricao", "label": "Descricao", "order": 3 },
    { "id": "valor", "label": "Valor", "order": 4 }
  ]
}
```

- **socioNome:** Preencher com o nome do socio (join ou campo denormalizado) para exibicao na tabela.
- **columns:** TabelaId `movimentacoes-socios`.

### 3.2 Criar movimentacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/movimentacoes-socios` | Cria uma movimentacao para um socio |

**Request body:**
```json
{
  "socioId": "uuid",
  "data": "2026-01-15",
  "tipo": "pro-labore",
  "descricao": "Pro-labore Janeiro",
  "valor": 5000.00
}
```

- **socioId:** Obrigatorio; deve ser socio do mesmo tenant.
- **data:** YYYY-MM-DD.
- **tipo:** Um de: `pro-labore`, `distribuicao`, `retirada`, `aporte`, `outro`.
- **descricao:** Obrigatorio.
- **valor:** Numero positivo.

**Response 200:** Objeto MovimentacaoSocio criado (com `id`, `socioNome`, `createdAt`, `updatedAt`).

**Erros:** 400 (validacao), 404 (socio nao encontrado).

### 3.3 Atualizar movimentacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| PATCH | `/movimentacoes-socios/:id` | Atualiza uma movimentacao |

**Request body:** Partial de `data`, `tipo`, `descricao`, `valor`. Nao permitir alterar `socioId` (ou documentar se permitir).

**Response 200:** Objeto MovimentacaoSocio atualizado.

### 3.4 Excluir movimentacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| DELETE | `/movimentacoes-socios/:id` | Exclui uma movimentacao |

**Response:** 204 ou 200 com `{ "success": true }`.

**Erros:** 404 (movimentacao nao encontrada ou de outro tenant).

---

## 4. Regras de negocio sugeridas

1. **Tenant:** Todo socio e toda movimentacao pertencem a um tenant. Nenhum usuario pode ver ou alterar socios/movimentacoes de outro tenant.
2. **CPF:** Unicidade por tenant (nao permitir dois socios ativos com o mesmo CPF no mesmo tenant). Validar formato/digitos verificadores.
3. **Percentual:** Opcionalmente validar para que a soma dos percentuais dos socios ativos nao ultrapasse 100% (ou aplicar a regra que fizer sentido para o negocio).
4. **Exclusao de socio:** Ao excluir um socio, excluir em cascata todas as movimentacoes desse socio (ou retornar erro se a regra for impedir exclusao quando houver movimentacoes).
5. **Resumo:** O endpoint `/socios/resumo` deve considerar apenas movimentacoes do tenant e agrupar por socio. Ordenar por nome do socio ou por saldo, conforme preferencia.

---

## 5. Resumo de endpoints

| Recurso | GET | POST | PATCH | DELETE |
|---------|-----|------|-------|--------|
| Socios | /socios (lista + columns), /socios/resumo | /socios | /socios/:id | /socios/:id |
| Movimentacoes | /movimentacoes-socios (?socioId, ?dataInicio, ?dataFim) + columns | /movimentacoes-socios | /movimentacoes-socios/:id | /movimentacoes-socios/:id |

---

**Versao:** 1.0.0  
**Data:** 2026-02-03  
**Fonte:** Contrato 01 (Socios), `src/types/socio.ts`, `src/stores/sociosStore.ts`, `src/pages/SociosPage.tsx`. Frontend com CRUD completo de socios e movimentacoes.
