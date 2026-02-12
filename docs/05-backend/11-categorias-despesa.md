# Categorias de despesa (paginas customizadas)

O front permite ao usuario **criar uma nova pagina de despesa** (ex.: "Despesa Marketing"). Isso gera uma nova **categoria** de despesa, que deve aparecer no menu e nas listagens, com os mesmos campos das categorias fixas (data, tipo, descricao, valor, etc.).

---

## Contrato

### POST – Criar categoria de despesa

**Endpoint sugerido:** `POST /despesas/categorias` (ou `POST /configuracoes/categorias-despesa`).

**Body (JSON):**

| Campo | Tipo   | Obrigatorio | Descricao |
|-------|--------|-------------|------------|
| nome  | string | sim         | Nome exibido no menu (ex.: "Despesa Marketing"). |
| slug  | string | sim         | Identificador unico (ex.: `despesa-marketing`). Usado na URL e no campo `categoria` ao criar/editar despesas. |

**Resposta esperada:** 201 com o objeto da categoria criada (ex.: `{ id, nome, slug }`) ou 200.

**Validacoes sugeridas:** slug unico; formato slug (minusculo, hifen); nome nao vazio.

---

### GET – Listar categorias (incluindo customizadas)

**Endpoint sugerido:** `GET /despesas/categorias`.

**Resposta esperada:** array de categorias, cada uma com pelo menos:

- `slug` – identificador (ex.: `despesa-fixa`, `despesa-marketing`)
- `nome` – nome para exibicao (ex.: "Despesa Fixa", "Despesa Marketing")
- `custom` (opcional) – `true` se for categoria criada pelo usuario (para o front diferenciar das fixas)

Exemplo:

```json
[
  { "slug": "despesa-fixa", "nome": "Despesa Fixa", "custom": false },
  { "slug": "despesa-extra", "nome": "Despesa Extra", "custom": false },
  { "slug": "despesa-marketing", "nome": "Despesa Marketing", "custom": true }
]
```

O front usara essa lista para montar o submenu Despesas e as rotas (ou uma rota generica com `?categoria=slug`). Ao criar/editar um lancamento de despesa, o campo `categoria` enviado sera o `slug` da categoria.

---

## Uso no front

- Em **Configuracoes**, o link "Criar pagina de despesa" leva a um formulario (nome + slug) que chama `POST /despesas/categorias`.
- O front espera que, apos implementacao no backend, um `GET /despesas/categorias` retorne as categorias fixas + as criadas pelo usuario, para exibir no menu e permitir escolher a categoria ao registrar uma despesa.

Se o backend ainda nao expuser esses endpoints, o front exibe mensagem de sucesso apos enviar o POST e o menu continuara com as categorias fixas ate o backend disponibilizar a listagem.
