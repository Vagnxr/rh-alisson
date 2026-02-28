# Endpoints da API

## Visao Geral

**Resumo de referencia.** A documentacao **completa** (payloads, query params, formato de resposta com `columns`, regras de negocio) esta em **01-contrato-frontend-backend.md**. Use o contrato como fonte de verdade para implementacao.

**Convencoes:**
- Resposta de sucesso: `{ success: true, data: ... }` ou com paginacao `{ success: true, data: [], meta: { total, page, perPage, totalPages } }`.
- **Listagens que alimentam tabelas:** incluir na resposta o campo **`columns`** (array de `{ id, label, order, isRequired? }`) conforme secao "Colunas de tabela" do contrato.
- Erro: `{ success: false, error: { code, message, details? } }`.
- Header: `Authorization: Bearer <accessToken>`; Super Admin pode usar `X-Tenant-Id`.

---

## Autenticacao

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | /auth/login | Login (email, password) -> tokens + user |
| POST | /auth/register | Cadastro (nome, email, password, confirmPassword) |
| POST | /auth/refresh | Renovar access token |
| POST | /auth/logout | Invalidar refresh token (opcional) |

Detalhes em 01-contrato (Login, Cadastro) e api-specification.md.

---

## Tenants (disponiveis para Super Admin)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /tenants/available ou /auth/tenants | Lista tenants que o usuario pode acessar |

---

## Lojas

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /lojas | Lista (resposta deve incluir `columns`) |
| POST | /lojas | Criar |
| PATCH | /lojas/:id | Atualizar |
| DELETE | /lojas/:id | Excluir (nao permitir se matriz) |

---

## Despesas

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /despesas | Lista (query: categoria, dataInicio, dataFim, lojaId, page, perPage). Resposta com `columns` (tabelaId = categoria) |
| GET | /despesas/:id | Uma despesa |
| POST | /despesas | Criar (body + categoria) |
| PATCH | /despesas/:id | Atualizar |
| DELETE | /despesas/:id | Excluir |

---

## Fornecedores

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /fornecedores | Lista (resposta com `columns`, tabelaId `fornecedores`) |
| GET | /fornecedores/:id | Um fornecedor |
| POST | /fornecedores | Criar |
| PATCH | /fornecedores/:id | Atualizar |
| DELETE | /fornecedores/:id | Excluir |
| PATCH | /fornecedores/:id/toggle-status | Ativar/desativar |

---

## Consulta CNPJ (ReceitaWS)

Proxy para evitar CORS: o front chama o backend, que consulta a ReceitaWS. Ver **12-consulta-cnpj-receitaws.md**.

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /consulta-cnpj?cnpj=14digitos | Retorna dados do CNPJ (razão social, endereço, etc.) em `data` |

---

## Socios e Movimentacoes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /socios | Lista (resposta com `columns`, tabelaId `socios`) |
| GET | /socios/resumo | Resumo por socio (totais) |
| GET | /socios/:id/movimentacoes ou /movimentacoes-socios?socioId= | Movimentacoes |
| GET | /movimentacoes-socios | Lista (resposta com `columns`, tabelaId `movimentacoes-socios`) |
| POST/PATCH/DELETE | /socios, /movimentacoes-socios | CRUD |

---

## Parcelamentos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /parcelamentos | Lista (resposta com `columns`, tabelaId `parcelamento`) |
| GET | /parcelamentos/:id | Um registro |
| POST | /parcelamentos | Criar |
| PATCH | /parcelamentos/:id | Atualizar |
| DELETE | /parcelamentos/:id | Excluir |

---

## Receitas (Renda Extra) e Investimentos

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET/POST/PATCH/DELETE | /receitas | CRUD (resposta GET com `columns`, tabelaId `renda-extra`) |
| GET/POST/PATCH/DELETE | /investimentos | CRUD (resposta GET com `columns`, tabelaId `investimento`) |

---

## Configuracoes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /configuracoes/tabelas | Todas as configuracoes de colunas do usuario |
| GET | /configuracoes/tabelas/:tabelaId | Uma tabela |
| PUT | /configuracoes/tabelas/:tabelaId | Atualizar colunas |
| POST ou PUT | /configuracoes/tabelas/:tabelaId/reset | Restaurar padrao |

---

## Lembretes

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /lembretes | Lista (query: status, dataInicio, dataFim) |
| POST | /lembretes | Criar |
| PATCH | /lembretes/:id | Atualizar / marcar concluido |
| DELETE | /lembretes/:id | Excluir |

---

## Admin (Super Admin)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET/POST/PATCH/DELETE | /admin/tenants | CRUD empresas (GET com `columns`, tabelaId `admin-tenants`) |
| PATCH | /admin/tenants/:id/toggle-status | Ativar/desativar |
| GET/POST/PATCH/DELETE | /admin/users | CRUD usuarios (GET com `columns`, tabelaId `admin-users`) |
| PATCH | /admin/users/:id/toggle-status | Ativar/desativar |

---

## Modulo Financeiro (Futuro – nao implementar agora)

Dashboard (resumo, transacoes-recentes), Balanco (/balanco/mensal), Relatorios. Ver 01-contrato secoes marcadas FUTURO.

---

## Codigos de Erro

| Codigo | Significado |
|--------|-------------|
| 400 | Bad Request - dados invalidos |
| 401 | Unauthorized - nao autenticado |
| 403 | Forbidden - sem permissao |
| 404 | Not Found - recurso nao encontrado |
| 409 | Conflict - conflito de dados |
| 500 | Internal Server Error |
