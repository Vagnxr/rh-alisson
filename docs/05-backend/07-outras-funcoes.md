# Outras Funcoes – Contrato Backend

Este documento e o **contrato** para o backend implementar o modulo **Outras funcoes**, com duas paginas: **A receber** e **Venda e perda**. O frontend ja possui as telas em `/financeiro/outras-funcoes/a-receber` e `/financeiro/outras-funcoes/venda-perda`; ao expor estes endpoints, o front passara a consumir dados reais.

**Convencoes:** Mesmas de **01-contrato-frontend-backend.md** e **api-specification.md**: `{ success: true, data: ... }`, JWT, header `X-Tenant-Id`. Filtro de periodo: `dataInicio` e `dataFim` em **YYYY-MM-DD** (intervalo inclusivo).

---

## 1. A receber (AReceberPage)

Pagina com **tres tabelas** por periodo:

- **Tabela 1 – Credito:** Uma linha por **bandeira** (as mesmas do Controle Cartoes: amex, elo-credito, hipercard, mastercard, visa, electron, elo-debito, maestro), com coluna **A receber** (valor).
- **Tabela 2 – Debito:** Mesma estrutura: uma linha por bandeira, coluna **A receber**.
- **Tabela 3 – Voucher:** Uma linha por **bandeira de voucher**. As bandeiras de voucher sao **dinamicas**: o usuario pode adicionar/remover na tela (dialog "Bandeiras voucher"). O backend deve armazenar a lista de bandeiras de voucher por tenant e retornar, para cada uma, o valor **A receber** no periodo.

Os valores "a receber" podem ser agregados a partir do modulo **Controle Cartoes** (tipo credito-debito por bandeira, tipo voucher por bandeira configurada), ou de tabelas dedicadas; fica a criterio do backend.

### 1.1 Modelo A receber (linha por bandeira)

| Campo    | Tipo   | Descricao                          |
|----------|--------|------------------------------------|
| bandeira | string | Id ou label da bandeira            |
| aReceber | number | Valor a receber no periodo         |

### 1.2 Endpoints A receber

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/financeiro/outras-funcoes/a-receber/credito` | Lista uma linha por bandeira (credito), com aReceber agregado no periodo |
| GET | `/financeiro/outras-funcoes/a-receber/debito`  | Lista uma linha por bandeira (debito), com aReceber agregado no periodo  |
| GET | `/financeiro/outras-funcoes/a-receber/voucher` | Lista uma linha por bandeira de voucher configurada, com aReceber no periodo |

**GET** – Query params: `dataInicio`, `dataFim` (YYYY-MM-DD). Response: `{ success: true, data: AReceberRow[] }`, onde cada item tem `bandeira` (string) e `aReceber` (number).

**Bandeiras credito/debito fixas:** amex, elo-credito, hipercard, mastercard, visa, electron, elo-debito, maestro. O backend deve retornar uma linha para cada uma (aReceber 0 se nao houver dado).

**Bandeiras voucher:** definidas pela config do usuario (ver secao 1.3).

### 1.3 Configuracao – Bandeiras Voucher

O usuario pode adicionar/remover "bandeiras" (linhas) da tabela Voucher. O backend deve persistir essa lista por tenant.

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET  | `/financeiro/outras-funcoes/config/bandeiras-voucher` | Retorna a lista de bandeiras de voucher do tenant |
| PUT  | `/financeiro/outras-funcoes/config/bandeiras-voucher` | Atualiza a lista (body: `{ bandeiras: string[] }`) |

**GET Response:** `{ success: true, data: string[] }` (array de nomes, ex.: `["Voucher A", "Voucher B"]`).

**PUT Body:** `{ bandeiras: string[] }`. Substitui a lista inteira. Persistir por tenant (ex.: tabela `ConfigOutrasFuncoes` ou campo JSON em tenant/config).

---

## 2. Venda e perda (VendaPerdaPage)

Pagina com **sete tabelas** de resumo (uma linha cada, exceto onde indicado):

| Tabela | Conteudo |
|--------|----------|
| 1 – Credito       | totalBruto, descontos, totalLiquido |
| 2 – Debito/PIX    | totalBruto, descontos, totalLiquido |
| 3 – Alim/ref      | totalBruto, descontos, totalLiquido |
| 4 – Food          | totalBruto, descontos, totalLiquido, viaLoja (opcional) |
| 5 – Total cartoes | valorBruto, descontos, totalLiquido |
| 6 – POS aluguel   | valor |
| 7 – Perda total   | valor |

Os valores podem ser agregados a partir de outros modulos (ex.: Venda Cartoes, Caixa, Controle Cartoes) ou de tabelas especificas de venda/perda; o backend define a regra.

### 2.1 Modelos (resumos)

Cada bloco e um objeto com os campos abaixo.

**Credito / DebitoPix / AlimRef:**
- totalBruto (number)
- descontos (number)
- totalLiquido (number)

**Food:**
- totalBruto (number)
- descontos (number)
- totalLiquido (number)
- viaLoja (string, opcional)

**Total cartoes:**
- valorBruto (number)
- descontos (number)
- totalLiquido (number)

**POS aluguel:** valor (number)

**Perda total:** valor (number)

### 2.2 Endpoint Venda e perda

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/financeiro/outras-funcoes/venda-perda` | Retorna os sete blocos de resumo do periodo |

**GET** – Query params: `dataInicio`, `dataFim` (YYYY-MM-DD).

**Response:** `{ success: true, data: { credito?, debitoPix?, alimRef?, food?, totalCartoes?, posAluguel?, perdaTotal? } }`.

Exemplo:

```json
{
  "success": true,
  "data": {
    "credito": { "totalBruto": 10000, "descontos": 200, "totalLiquido": 9800 },
    "debitoPix": { "totalBruto": 5000, "descontos": 100, "totalLiquido": 4900 },
    "alimRef": { "totalBruto": 0, "descontos": 0, "totalLiquido": 0 },
    "food": { "totalBruto": 1500, "descontos": 50, "totalLiquido": 1450, "viaLoja": "Loja 1" },
    "totalCartoes": { "valorBruto": 16500, "descontos": 350, "totalLiquido": 16150 },
    "posAluguel": { "valor": 200 },
    "perdaTotal": { "valor": 0 }
  }
}
```

Se algum bloco nao existir, o front usa valores zerados (totalBruto/descontos/totalLiquido 0, valor 0).

---

## 3. Resumo de endpoints (Outras funcoes)

| Recurso | GET |
|---------|-----|
| A receber – Credito  | /financeiro/outras-funcoes/a-receber/credito ?dataInicio, ?dataFim |
| A receber – Debito   | /financeiro/outras-funcoes/a-receber/debito ?dataInicio, ?dataFim |
| A receber – Voucher  | /financeiro/outras-funcoes/a-receber/voucher ?dataInicio, ?dataFim |
| Config bandeiras voucher | GET /financeiro/outras-funcoes/config/bandeiras-voucher |
| Config bandeiras voucher | PUT /financeiro/outras-funcoes/config/bandeiras-voucher (body: { bandeiras }) |
| Venda e perda       | /financeiro/outras-funcoes/venda-perda ?dataInicio, ?dataFim |

---

## 4. Regras de negocio sugeridas

1. **Tenant:** Todo dado e filtrado por tenant (sessao ou `X-Tenant-Id`).
2. **Periodo:** dataInicio e dataFim inclusivos; agregar por data do registro (campo relevante do modulo de origem).
3. **A receber – Credito/Debito:** Usar as mesmas bandeiras do Controle Cartoes (amex, elo-credito, hipercard, mastercard, visa, electron, elo-debito, maestro). Retornar sempre uma linha por bandeira; aReceber 0 quando nao houver movimentacao.
4. **A receber – Voucher:** Usar apenas as bandeiras retornadas por GET config/bandeiras-voucher; agregar por bandeira (ex.: do Controle Cartoes tipo voucher, se a bandeira for armazenada).
5. **Venda e perda:** Definir de onde vir cada total (qual modulo ou tabela); documentar no backend. O front apenas exibe os numeros.

---

**Versao:** 1.0.0  
**Data:** 2026-02-04  
**Fonte:** `src/pages/financeiro/AReceberPage.tsx`, `src/pages/financeiro/VendaPerdaPage.tsx`, `src/types/financeiro.ts`.
