# Contrato Frontend-Backend (por Pagina)

Este documento descreve, **pagina a pagina**, o que o frontend espera do backend. Use-o como contrato para implementar a API em NestJS + PostgreSQL + Prisma.

**Para o Agent / Implementacao do Backend:**
1. **Fonte de verdade:** Este doc e o contrato por pagina. Todas as respostas (payloads, campos, endpoints) devem seguir o que esta aqui.
2. **Ordem de implementacao:** Seguir o guia em `02-prisma-nestjs-implementacao.md` (schema Prisma + ordem dos modulos).
3. **Colunas de tabela:** Todo GET de listagem que alimenta uma tela com tabela deve incluir na resposta o campo **`columns`** (array de `{ id, label, order, isRequired? }`). Ver secao "Colunas de tabela" abaixo e mapeamento endpoint -> tabelaId.
4. **Modulo financeiro (Fase 2):** Dashboard, Balanco Geral e Relatorios tem contrato em **03-dashboard-relatorios-balanco.md**. Implementar apos os modulos de dados (lojas, despesas, receitas, etc.).

---

**Escopo Fase 2 (modulo financeiro):**  
Dashboard, Balanco geral e Relatorios estao especificados em **03-dashboard-relatorios-balanco.md**. O front segue com mock nessas telas ate o backend expor os endpoints descritos la. O restante deste contrato (auth, lojas, despesas, fornecedores, socios, parcelamentos, receitas, investimentos, configuracoes, lembretes, admin) e o que o backend deve implementar na Fase 1.

**Convencoes:**
- Todas as respostas de sucesso seguem o padrao `{ success: true, data: ... }` ou `{ success: true, data: [], meta: { total, page, perPage, totalPages } }`. Quando a lista alimenta uma **tabela com colunas configuráveis**, a resposta deve incluir tambem **`columns`** (ver secao "Colunas de tabela").
- Erros: `{ success: false, error: { code, message, details? } }`.
- Header obrigatorio: `Authorization: Bearer <accessToken>`.
- Super Admin: header opcional `X-Tenant-Id` para operacoes em nome de um tenant.
- Datas em ISO 8601 (YYYY-MM-DD ou YYYY-MM-DDTHH:mm:ssZ).
- IDs: UUID (string).

---

## Colunas de tabela (configuracao por usuario)

O usuario pode configurar quais colunas exibir em cada tabela (pagina Configuracoes). Para que o front renderize a tabela corretamente, **todo GET que retorna lista para uma tela com tabela deve incluir na resposta o campo `columns`**: as colunas que a tabela deve exibir (configuracao do usuario), em ordem.

**Regra para o backend:**
- Ao responder um GET de listagem (ex.: GET /lojas, GET /despesas, GET /fornecedores, etc.), buscar a configuracao de colunas do usuario para aquela tabela (por `tabelaId`) e incluir no JSON o campo **`columns`**.
- **`columns`**: array de colunas **visiveis** (isVisible: true) ordenadas por `order`. Formato de cada item: `{ id, label, order, isRequired? }`. O front usa isso para montar o cabecalho e as celulas da tabela.

**Formato do item em `columns`:**
```ts
{ id: string; label: string; order: number; isRequired?: boolean }
```

**Mapeamento endpoint -> tabelaId (para o backend buscar a config):**

| Endpoint (GET lista) | tabelaId |
|----------------------|----------|
| GET /lojas | `lojas` |
| GET /despesas | `despesa-fixa`, `despesa-extra`, `despesa-funcionario`, `despesa-imposto`, `despesa-veiculo` ou `despesa-banco` (conforme query `categoria`) |
| GET /fornecedores | `fornecedores` |
| GET /parcelamentos | `parcelamento` |
| GET /receitas | `renda-extra` |
| GET /investimentos | `investimento` |
| GET /socios | `socios` |
| GET /movimentacoes-socios | `movimentacoes-socios` |
| GET /admin/tenants | `admin-tenants` |
| GET /admin/users | `admin-users` |

Se o usuario ainda nao tiver configuracao salva para essa tabela, o backend retorna o **padrao** (todas as colunas definidas para essa tabela, com isVisible e order iguais ao padrao do sistema). Os padroes por tabela estao em `src/types/configuracao.ts` (TABELAS_CONFIGURACOES) no front; o backend deve ter o mesmo padrao.

**Adaptacao no front:** As paginas que exibem tabela (LojasPage, DespesaPage, FornecedoresPage, ParcelamentoPage, SociosPage, AdminTenantsPage, AdminUsersPage, etc.) devem usar o campo `columns` retornado no GET da lista para definir quais colunas renderizar e em que ordem, em vez de usar apenas colunas fixas ou apenas o store local de configuracao. Assim, ao abrir a pagina, um unico GET traz dados + colunas.

---

## 1. Login (LoginPage)

**Store:** `authStore.login(credentials)`

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/auth/login` | Login |

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": 3600,
    "user": {
      "id": "string",
      "nome": "string",
      "email": "string",
      "tenantId": "string | null",
      "lojas": ["string"],
      "permissoes": ["string"],
      "isSuperAdmin": false
    }
  }
}
```

- Se `user.tenantId` for `null` e `user.isSuperAdmin` for `true`, o front redireciona para **Selecao de Tenant**.
- Se `user.tenantId` for preenchido, o front pode setar o tenant atual e ir para Dashboard.
- O front persiste `user` e `isAuthenticated` no localStorage (auth-storage); o token pode ser enviado em cada request.

**Erro (credenciais invalidas):** retornar `success: false` e o front exibe `error` da store (mensagem livre).

---

## 2. Cadastro (RegisterPage)

**Store:** `authStore.register(data)`

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/auth/register` | Criar conta |

**Request:**
```json
{
  "nome": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

**Response 200:** Mesmo formato do login (user + tokens), para o front fazer login apos cadastro.

**Validacao front:** nome min 3, email valido, senha min 6, confirmPassword === password.

---

## 3. Selecao de Tenant (TenantSelectPage)

**Store:** `tenantStore.fetchAvailableTenants()` (apenas para Super Admin)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/tenants/available` ou `/auth/tenants` | Lista tenants que o usuario pode acessar |

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "nomeFantasia": "string",
      "cnpj": "string",
      "isActive": true,
      "isMultiloja": true,
      "createdAt": "string"
    }
  ]
}
```

- O front usa `tenant.name` (razao social) e `tenant.cnpj` na lista. Apos selecionar, chama `setCurrentTenant(tenant)` e navega para `/dashboard`.
- Nao enviar este endpoint para usuario nao super-admin; usuario normal ja tem `tenantId` no login.

---

## 4. Dashboard (DashboardPage) — Fase 2 (modulo financeiro)

**Contrato completo em 03-dashboard-relatorios-balanco.md.** Resumo:

- GET `/dashboard/resumo` — cards: receita, despesas, saldo, investimentos (valor + variacaoPercentual vs periodo anterior). Query: `dataInicio`, `dataFim`, `lojaId`.
- GET `/dashboard/transacoes-recentes` — ultimas transacoes unificadas (id, description, category, value, date, type: income|expense). Query: `dataInicio`, `dataFim`, `lojaId`, `limit`.

---

## 5. Lojas (LojasPage)

**Store:** `lojaStore`: `fetchLojas`, `addLoja`, `updateLoja`, `deleteLoja`.

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/lojas` | Lista lojas do tenant |
| POST | `/lojas` | Criar loja |
| PATCH | `/lojas/:id` | Atualizar loja |
| DELETE | `/lojas/:id` | Excluir loja (nao permitir se for matriz) |

**GET /lojas Response:** Incluir sempre o campo **`columns`** (colunas visiveis para a tabela `lojas`), para o front montar a tabela conforme configuracao do usuario.
```json
{
  "success": true,
  "data": [ ... ],
  "columns": [
    { "id": "apelido", "label": "Apelido", "order": 1 },
    { "id": "razaoSocial", "label": "Razao Social", "order": 2 },
    { "id": "cnpj", "label": "CNPJ", "order": 3 },
    { "id": "endereco", "label": "Endereco", "order": 4 },
    { "id": "contato", "label": "Contato", "order": 5 },
    { "id": "isAtiva", "label": "Status", "order": 6 }
  ]
}
```

**POST /lojas Body (CreateLojaDTO):**
- `tenantId`, `cnpj`, `razaoSocial`, `nomeFantasia`, `apelido`, `endereco` (objeto acima), `contato`, `responsavel` (opcional), `observacoes` (opcional), `isMatriz` (opcional, default false).

**PATCH /lojas/:id:** Partial do create + `isAtiva` (opcional).

**Regra:** Nao permitir DELETE em loja com `isMatriz: true`. Front desabilita botao excluir para matriz.

---

## 6. Despesas (DespesaFixaPage, DespesaExtraPage, DespesaFuncionarioPage, DespesaImpostoPage, DespesaVeiculoPage, DespesaBancoPage)

**Stores:** `despesaStore` por categoria (useDespesaFixaStore, useDespesaExtraStore, etc.). Todas usam o mesmo componente `DespesaPage` e o mesmo tipo de item.

**Tipos no front:** `DespesaBase` = { id, data, tipo, descricao, valor, comunicarAgenda?, createdAt, updatedAt }. `DespesaInput` = sem id e timestamps.

**Categorias de despesa (path ou query):** `despesa-fixa`, `despesa-extra`, `despesa-funcionario`, `despesa-imposto`, `despesa-veiculo`, `despesa-banco`.

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/despesas` | Lista com filtros. Query: `categoria`, `dataInicio`, `dataFim`, `lojaId`, `page`, `perPage`, `sortBy`, `sortOrder` |
| GET | `/despesas/:id` | Uma despesa |
| POST | `/despesas` | Criar. Body inclui `categoria` |
| PATCH | `/despesas/:id` | Atualizar |
| DELETE | `/despesas/:id` | Excluir |

**GET Response (lista):** Incluir sempre **`columns`** (colunas visiveis para a tabela da categoria, ex.: `despesa-fixa`). O `tabelaId` e o valor da query `categoria`.
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "data": "2026-01-05",
      "tipo": "ALUGUEL",
      "descricao": "string",
      "valor": 2500.00,
      "comunicarAgenda": false,
      "recorrencia": "mensal",
      "recorrenciaFim": "2026-12-05",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "meta": { "total": 45, "page": 1, "perPage": 20, "totalPages": 3 },
  "columns": [
    { "id": "data", "label": "Data", "order": 1, "isRequired": true },
    { "id": "tipo", "label": "Tipo", "order": 2 },
    { "id": "descricao", "label": "Descricao", "order": 3, "isRequired": true },
    { "id": "valor", "label": "Valor", "order": 4, "isRequired": true },
    { "id": "recorrencia", "label": "Recorrencia", "order": 5 }
  ]
}
```

**POST Body:** `data`, `tipo`, `descricao`, `valor`, `comunicarAgenda` (opcional), `recorrencia` (opcional, ex.: `unica`, `mensal`, `bimestral`), `recorrenciaFim` (opcional, YYYY-MM-DD). Backend deve receber tambem `categoria` (ou inferir pelo contexto do modulo) e `lojaId` (opcional).

**GET Response (cada item):** Incluir `recorrencia` e `recorrenciaFim` quando existirem, para o front exibir a coluna Recorrencia. Valores de `recorrencia`: `unica`, `semanal`, `quinzenal`, `mensal`, `bimestral`, `trimestral`, `semestral`, `anual`.

**Tipos por categoria (front usa como opcoes no select):**
- despesa-fixa: ALUGUEL, AGUA, LUZ, INTERNET, TELEFONE, CONDOMINIO, SEGURO, OUTROS
- despesa-extra: MANUTENCAO, MATERIAL, EQUIPAMENTO, SERVICO, OUTROS
- despesa-funcionario: SALARIO, VALE TRANSPORTE, VALE ALIMENTACAO, PLANO SAUDE, FERIAS, 13º SALARIO, RESCISAO, OUTROS
- despesa-imposto: ICMS, ISS, INSS, FGTS, PIS, COFINS, IRPJ, CSLL, SIMPLES, OUTROS
- despesa-veiculo: COMBUSTIVEL, MANUTENCAO, SEGURO, IPVA, LICENCIAMENTO, MULTA, PEDAGIO, ESTACIONAMENTO, OUTROS
- despesa-banco: TARIFA MENSAL, TED, DOC, PIX, TAXA CARTAO, JUROS, IOF, OUTROS

O front aplica filtro de data no cliente (dateFilter.startDate/endDate); o backend pode receber `dataInicio` e `dataFim` para otimizar.

---

## 7. Fornecedores (FornecedoresPage)

**Store:** `fornecedorStore`: fetchFornecedores, addFornecedor, updateFornecedor, deleteFornecedor, toggleFornecedorStatus.

**Tipos:** Fornecedor = FornecedorCNPJ | FornecedorCPF (union). Campos comuns: id, tipo, endereco, contatoEmpresa, contatoVendedor?, observacoes?, isAtivo, createdAt, updatedAt. CNPJ: cnpj, razaoSocial, nomeFantasia. CPF: cpf, nomeCompleto, nomeComercial?.

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/fornecedores` | Lista (tenant) |
| GET | `/fornecedores/:id` | Um fornecedor |
| POST | `/fornecedores` | Criar (body CNPJ ou CPF) |
| PATCH | `/fornecedores/:id` | Atualizar |
| DELETE | `/fornecedores/:id` | Excluir |
| PATCH | `/fornecedores/:id/toggle-status` | Ativar/desativar |

**Endereco:** cep, tipoLogradouro (Rua, Avenida, etc.), logradouro, numero, complemento?, bairro, cidade, uf. **ContatoEmpresa:** telefonePrincipal?, whatsapp?, emailPrincipal, emailFinanceiro?, site?, instagram?. **ContatoVendedor:** nome, whatsapp, email.

**GET /fornecedores Response:** Incluir **`columns`** (tabelaId `fornecedores`): colunas visiveis para o front montar a tabela.

---

## 8. Socios (SociosPage)

**Contrato detalhado em 04-socios-movimentacoes.md.** O front possui CRUD completo de socios (criar, editar, excluir) e de movimentacoes.

**Store:** `sociosStore`: fetchSocios, fetchResumo, fetchMovimentacoes, addSocio, updateSocio, deleteSocio, addMovimentacao, updateMovimentacao, deleteMovimentacao, getMovimentacoesPorSocio.

**Fluxo:** Pagina 1 = lista de cards (resumo por socio) com botao "Novo Socio" e acoes editar/excluir em cada card. Pagina 2 = detalhe do socio com tabela de movimentacoes e botoes "Editar Socio" e "Nova Movimentacao".

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/socios` | Lista socios do tenant |
| GET | `/socios/resumo` | Resumo por socio (totais pro-labore, distribuicao, retiradas, aportes, saldoTotal) |
| GET | `/socios/:id/movimentacoes` | Movimentacoes do socio (ou GET /movimentacoes-socios?socioId=) |
| POST | `/socios` | Criar socio (front nao tem tela de criar socio; pode existir na API) |
| PATCH | `/socios/:id` | Atualizar socio |
| DELETE | `/socios/:id` | Excluir socio |
| GET | `/movimentacoes-socios` | Lista movimentacoes (filtro por socioId e data) |
| POST | `/movimentacoes-socios` | Criar movimentacao |
| PATCH | `/movimentacoes-socios/:id` | Atualizar |
| DELETE | `/movimentacoes-socios/:id` | Excluir |

**Socio:** id, nome, cpf, percentualSociedade, isAtivo.

**MovimentacaoSocio:** id, socioId, socioNome, data, tipo, descricao, valor, createdAt, updatedAt. **tipo:** `pro-labore` | `distribuicao` | `retirada` | `aporte` | `outro`.

**GET /socios/resumo Response:**
```json
{
  "success": true,
  "data": [
    {
      "socio": { "id", "nome", "cpf", "percentualSociedade", "isAtivo" },
      "totalProLabore": 0,
      "totalDistribuicao": 0,
      "totalRetiradas": 0,
      "totalAportes": 0,
      "saldoTotal": 0
    }
  ]
}
```

**POST /movimentacoes-socios Body:** socioId, data, tipo, descricao, valor. Backend pode preencher socioNome ao retornar.

**GET /socios e GET /movimentacoes-socios Response:** Incluir **`columns`** (tabelaId `socios` e `movimentacoes-socios` respectivamente).

---

## 9. Parcelamentos (ParcelamentoPage)

**Store:** `parcelamentoStore`: fetchItems, addItem, updateItem, deleteItem.

**Tipo:** Parcelamento = id, data, descricao, parcela (ex: "3/12"), valor, createdAt, updatedAt. Input = sem id e timestamps.

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/parcelamentos` | Lista. Query: dataInicio, dataFim, lojaId, page, perPage |
| GET | `/parcelamentos/:id` | Um registro |
| POST | `/parcelamentos` | Criar |
| PATCH | `/parcelamentos/:id` | Atualizar |
| DELETE | `/parcelamentos/:id` | Excluir |

**GET /parcelamentos Response:** Incluir **`columns`** (tabelaId `parcelamento`).

**POST Body:** data, descricao, parcela, valor. (Opcional: parcelaAtual, parcelaTotal, valorTotal, lojaId se o backend normalizar "3/12".)

---

## 10. Renda Extra (RendaExtraPage) e Investimentos (InvestimentoPage)

Ambas usam o mesmo componente que Despesas (`DespesaPage`) com tipo `DespesaBase` / `DespesaInput`. Categorias no front: `renda-extra`, `investimento`. Tipos (select): renda-extra = CONSULTORIA, VENDA, COMISSAO, ALUGUEL, RENDIMENTOS, OUTROS; investimento = CDB, TESOURO DIRETO, FUNDOS, ACOES, IMOVEIS, OUTROS.

| Metodo | Endpoint (Renda Extra) | Endpoint (Investimentos) |
|--------|------------------------|--------------------------|
| GET | `/receitas` ou `/renda-extra` | `/investimentos` |
| POST | idem | idem |
| PATCH | idem/:id | idem/:id |
| DELETE | idem/:id | idem/:id |

**Formato de item:** mesmo de despesa (id, data, tipo, descricao, valor, comunicarAgenda?, createdAt, updatedAt). Backend pode ter tabelas separadas `receitas` e `investimentos` com mesmo shape.

**GET /receitas e GET /investimentos Response:** Incluir **`columns`** (tabelaId `renda-extra` e `investimento` respectivamente).

---

## 11. Balanco Geral (BalancoGeralPage) — Fase 2 (modulo financeiro)

**Contrato completo em 03-dashboard-relatorios-balanco.md.** GET `/balanco/mensal?mes=&ano=&lojaId=` retorna estrutura com despesas, vendas, outrosValores, mercadoriaEntrada/Saida, ativoImobilizado, investimento, rendaExtra (itens com descricao, valor, percentual; opcional lojaId/lojaNome para multi-loja).

---

## 12. Relatorios (RelatoriosPage) — Fase 2 (modulo financeiro)

**Contrato completo em 03-dashboard-relatorios-balanco.md.** Endpoints: `/relatorios/despesas-por-categoria`, `/relatorios/vendas-por-periodo`, `/relatorios/fluxo-caixa`, `/relatorios/lucro` (query: dataInicio, dataFim, lojaId). Payloads e formatos detalhados no documento 03.

---

## 13. Configuracoes (ConfiguracoesPage)

**Store:** `configuracaoStore`: fetchConfiguracoes, updateColunaVisibilidade, resetTabela.

**Tipo:** TabelaConfig = id, nome, descricao, colunas: ColunaConfig[]. ColunaConfig = id, label, isVisible, order, width?, isRequired?.

**Tabelas com configuracao de colunas (tabelaId):** despesa-fixa, despesa-extra, despesa-funcionario, despesa-imposto, despesa-veiculo, despesa-banco, parcelamento, renda-extra, investimento, lojas, fornecedores, socios, movimentacoes-socios, admin-tenants, admin-users, balanco (futuro).

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/configuracoes/tabelas` | Lista **todas** as configuracoes de colunas do usuario (para a tela de Configuracoes) |
| GET | `/configuracoes/tabelas/:tabelaId` | Configuracao de **uma** tabela (opcional; usado pelo front se quiser apenas as colunas antes de chamar o GET da lista) |
| PUT | `/configuracoes/tabelas/:tabelaId` | Atualizar colunas (body: { colunas: ColunaConfig[] }) |
| POST ou PUT | `/configuracoes/tabelas/:tabelaId/reset` | Restaurar padrao |

**GET /configuracoes/tabelas Response (todas as tabelas):**
```json
{
  "success": true,
  "data": [
    {
      "id": "despesa-fixa",
      "nome": "Despesa Fixa",
      "descricao": "Configuracoes da tabela de despesas fixas",
      "colunas": [
        { "id": "data", "label": "Data", "isVisible": true, "order": 1, "isRequired": true },
        { "id": "descricao", "label": "Descricao", "isVisible": true, "order": 2, "isRequired": true },
        { "id": "valor", "label": "Valor", "isVisible": true, "order": 3, "isRequired": true },
        { "id": "recorrencia", "label": "Recorrencia", "isVisible": true, "order": 4 },
        { "id": "observacao", "label": "Observacao", "isVisible": false, "order": 6 }
      ]
    }
  ]
}
```

**GET /configuracoes/tabelas/:tabelaId Response:** Um unico objeto TabelaConfig (id, nome, descricao, colunas[]). Persistir por usuario (user_id). Se nao houver config salva, retornar o padrao do sistema para essa tabela.

---

## 14. Lembretes (LembretesPage)

**Dados atuais:** estado local (useState). Nao ha store persistido; ao conectar ao backend, o front passara a usar API.

**Tipo Lembrete:** id, titulo, descricao?, data, hora?, prioridade ('baixa'|'media'|'alta'), status ('pendente'|'concluido'|'cancelado'), createdAt.

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/lembretes` | Lista. Query: status (todos|pendente|concluido|cancelado), dataInicio, dataFim |
| POST | `/lembretes` | Criar |
| PATCH | `/lembretes/:id` | Atualizar (incl. marcar concluido) |
| DELETE | `/lembretes/:id` | Excluir |
| PATCH | `/lembretes/:id/toggle-status` | Alternar pendente <-> concluido (opcional; ou PATCH com status) |

**POST Body:** titulo, descricao?, data, hora?, prioridade. Backend define status = 'pendente'.

---

## 15. Admin – Empresas (AdminTenantsPage)

**Store:** `adminTenantsStore`: fetchTenants, addTenant, updateTenant, deleteTenant, toggleTenantStatus. **Apenas Super Admin.**

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/admin/tenants` | Lista todas as empresas |
| POST | `/admin/tenants` | Criar empresa |
| PATCH | `/admin/tenants/:id` | Atualizar |
| DELETE | `/admin/tenants/:id` | Excluir (nao permitir se usersCount > 0) |
| PATCH | `/admin/tenants/:id/toggle-status` | Ativar/desativar |

**AdminTenant:** id, name, nomeFantasia, cnpj, email?, telefone?, endereco?, responsavel?, isActive, createdAt, usersCount.

**GET /admin/tenants Response:** Incluir **`columns`** (tabelaId `admin-tenants`).

**POST/PATCH Body (AdminTenantFormData):** name, cnpj?, email?, telefone?, endereco?, responsavel?, isActive.

---

## 16. Admin – Usuarios (AdminUsersPage)

**Store:** `adminUsersStore`: fetchUsers, addUser, updateUser, deleteUser, toggleUserStatus. Lista de tenants vinda de `adminTenantsStore.fetchTenants()` para o select de empresa.

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/admin/users` | Lista usuarios (todos ou por tenant conforme permissao) |
| POST | `/admin/users` | Criar usuario |
| PATCH | `/admin/users/:id` | Atualizar |
| DELETE | `/admin/users/:id` | Excluir |
| PATCH | `/admin/users/:id/toggle-status` | Ativar/desativar |

**AdminUser:** id, nome, email, telefone?, tenantId, tenantName?, role ('super_admin'|'admin'|'manager'|'user'), isActive, createdAt, lastLogin?.

**GET /admin/users Response:** Incluir **`columns`** (tabelaId `admin-users`).

**POST Body (AdminUserFormData):** nome, email, telefone?, tenantId, role, password (obrigatorio na criacao), isActive.

**PATCH:** mesmo sem password; se password for enviado, alterar senha.

---

## 17. Logout

**Store:** `authStore.logout()`. O front apenas limpa estado e tenant; pode opcionalmente chamar POST `/auth/logout` com refreshToken para invalidar no servidor.

---

## Resumo de Endpoints por Modulo

**Implementar agora:**

| Modulo | GET | POST | PATCH | DELETE |
|--------|-----|------|-------|--------|
| Auth | - | login, register, refresh, logout | - | - |
| Tenants (available) | /auth/tenants ou /tenants/available | - | - | - |
| Lojas | /lojas | /lojas | /lojas/:id | /lojas/:id |
| Despesas | /despesas | /despesas | /despesas/:id | /despesas/:id |
| Fornecedores | /fornecedores | /fornecedores | /fornecedores/:id, toggle-status | /fornecedores/:id |
| Socios | /socios, /socios/resumo, /socios/:id/movimentacoes | /socios, /movimentacoes-socios | /socios/:id, /movimentacoes-socios/:id | /socios/:id, /movimentacoes-socios/:id |
| Parcelamentos | /parcelamentos | /parcelamentos | /parcelamentos/:id | /parcelamentos/:id |
| Receitas/Renda Extra | /receitas | /receitas | /receitas/:id | /receitas/:id |
| Investimentos | /investimentos | /investimentos | /investimentos/:id | /investimentos/:id |
| Configuracoes | /configuracoes/tabelas | - | PUT tabelas/:id, reset | - |
| Lembretes | /lembretes | /lembretes | /lembretes/:id | /lembretes/:id |
| Admin Tenants | /admin/tenants | /admin/tenants | /admin/tenants/:id, toggle-status | /admin/tenants/:id |
| Admin Users | /admin/users | /admin/users | /admin/users/:id, toggle-status | /admin/users/:id |

**Fase 2 (modulo financeiro — contrato em 03-dashboard-relatorios-balanco.md):**

| Modulo | Endpoints |
|--------|-----------|
| Dashboard | GET /dashboard/resumo, GET /dashboard/transacoes-recentes |
| Balanco | GET /balanco/mensal |
| Relatorios | GET /relatorios/despesas-por-categoria, vendas-por-periodo, fluxo-caixa, lucro |

---

---

**Versao:** 1.0.0  
**Data:** 2026-02-03  
**Revalidado:** 2026-02-03 (front adaptado para consumir `columns`; documento revisado para o agent implementar o backend).  
**Fonte:** Analise de `src/pages`, `src/stores`, `src/types` e `src/lib/buildTableColumns.ts`.
