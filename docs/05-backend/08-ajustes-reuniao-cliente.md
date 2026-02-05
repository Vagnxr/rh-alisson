# Ajustes Reuniao Cliente – Backend

Documento para o backend implementar as alteracoes solicitadas na reuniao com o cliente. Tudo que depende de criacao/alteracao de API, modelo de dados ou regras de negocio esta descrito aqui.

**Fonte:** Anotacoes da call com o cliente.  
**Data:** 2026-02-04.

---

## 1. Login e Tenant

### 1.1 Tenant inexistente apos login ("Empresa alpha limitada")

**Problema:** Apos o login, o usuario e redirecionado para um tenant que nao existe ou aparece com nome errado (ex.: "Empresa alpha limitada").

**Sugestao backend:**
- Incluir no **response do login** o objeto do tenant atual quando `user.tenantId` estiver preenchido. Ex.: `user` + `tenant: { id, name, nomeFantasia, cnpj, isActive, isMultiloja, ... }`.
- Assim o front nao precisa buscar em `availableTenants` (que pode estar vazio para usuario nao super-admin) nem criar um tenant fallback.
- Alternativa: expor **GET /tenants/me** (ou GET /auth/me com tenant embed) para o front buscar o tenant apos o login usando o `tenantId` do user.

### 1.2 Permissoes no login (sidebar e rotas)

**Requisito:** Listar na sidebar apenas os itens permissionados (retornados do login).

**Backend:** O login ja retorna `user.permissoes: string[]`. Definir e documentar os **identificadores de permissao** que o front usara para filtrar o menu. Sugestao de convencao (um id por rota ou grupo):
- Ex.: `dashboard`, `despesa-fixa`, `despesa-extra`, `despesa-funcionario`, `despesa-imposto`, `despesa-veiculo`, `despesa-banco`, `parcelamento`, `renda-extra`, `investimento`, `financeiro-caixa`, `financeiro-controle-cartoes`, … `fornecedores`, `lojas`, `socios`, `balanco-geral`, `relatorios`, `lembretes`, `configuracoes`, `admin-empresas`, `admin-usuarios`.
- Ou um unico id por "pagina" que o front mapeia para o item do menu. O front filtra os `menuItems` deixando apenas aqueles cujo id esta em `user.permissoes`. Se `permissoes` for array vazio, o front pode tratar como "acesso total" (compatibilidade).

---

## 2. Despesas

### 2.1 CRUD de "Tipo" por categoria

- Permitir **criar e remover** tipos de despesa por categoria (despesa-fixa, despesa-extra, etc.).
- Endpoints sugeridos:
  - **GET /despesas/tipos?categoria=despesa-fixa** — lista tipos da categoria.
  - **POST /despesas/tipos** — body: `{ categoria, label }` — criar tipo.
  - **DELETE /despesas/tipos/:id** — remover tipo.
- **Regra:** Nao permitir **apagar nem editar** um tipo que ja tenha sido usado em algum lancamento. Se a pessoa tentar, retornar erro com mensagem clara (ex.: "Este tipo nao pode ser removido pois existem lancamentos vinculados."). O front exibira essa mensagem.

### 2.2 Descricao nao obrigatoria

- Nos endpoints de despesa (POST/PATCH), tornar o campo **descricao** opcional (nao obrigatorio).

### 2.3 Recorrencia (lancar 12 meses pra frente, etc.)

- Incluir suporte a **recorrencia**: ao criar uma despesa, a pessoa pode informar que e recorrente e quantos meses lancar (ex.: 12 meses a frente).
- Opcoes:
  - Campo **recorrente** (boolean) e **quantidadeMeses** (number) no body do POST /despesas.
  - Backend cria N registros (um por mes) conforme a regra.
- Contrato: definir no 01-contrato e no schema se a recorrencia e apenas no create ou se havera entidade "recorrencia" separada.

### 2.4 Comunicar agenda

- Campo **comunicarAgenda** ja existe no contrato. Garantir que, quando `comunicarAgenda === true`, o backend **insere o evento/lancamento na Agenda** (entidade ou modulo de agenda), para aparecer na tela de Agenda e poder marcar "pago" la.

### 2.5 Telas de despesa dinamicas (Configuracoes)

- **Requisito:** Possibilitar criar uma **tela de Despesa nova** nas configuracoes (ex.: o usuario cria "Despesa Marketing" como nova categoria).
- Backend precisa permitir **categorias de despesa customizadas** por tenant: CRUD de "categorias de despesa" (nome, slug ou id) e, por categoria, os tipos (como no 2.1). Assim o front pode listar "Despesa Fixa", "Despesa Extra", … e qualquer despesa customizada criada nas configuracoes.

---

## 3. Agenda

**Status:** Implementado no backend. Contrato e comportamento descritos abaixo.

Os itens entram na agenda quando **despesa**, **parcelamento** ou **ativo imobilizado** sao criados com `comunicarAgenda: true`. Ver secoes 2.4 (Despesas), 8.1 (Parcelamento) e 11.1 (Ativo Imobilizado).

### 3.1 Contrato da API

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | /agenda/dias?dataInicio=&dataFim=&lojaId= | Lista dias no periodo. **dataInicio** e **dataFim** sao opcionais:** se nao enviados, o backend usa o mes atual (dia 1 ao ultimo dia do mes). O front pode chamar sem query e receber dados do mes corrente. |
| GET | /agenda/dias/:data | Detalhes de um dia (lista de entradas/saidas com valor e origem: despesa, parcelamento, ativo, etc.). |
| POST | /agenda/itens/:id/marcar-pago | Marca um item como pago. Dialog de confirmacao no front. |
| POST | /agenda/itens/marcar-pago | Marca varios itens como pagos. Body: `{ ids: string[] }`. |

### 3.2 Formato da resposta – GET /agenda/dias

A resposta deve permitir ao front exibir, por dia, o total de entradas e saidas e, ao clicar no dia, os detalhes (itens com descricao, valor, origem). O formato exato (estrutura do JSON) deve estar documentado no contrato da API (ex.: array de dias com `data`, `totalEntradas`, `totalSaidas`, `itens` ou equivalente).

### 3.3 Comportamento ja implementado (resumo)

- Modulo Agenda (controller + service).
- GET /agenda/dias e GET /agenda/dias/:data.
- POST marcar-pago (um item e em lote com `ids`).
- Criacao de AgendaItem ao criar despesa, parcelamento ou ativo com `comunicarAgenda: true`.
- Ao marcar como pago um item de origem **ativo imobilizado**, o backend registra a saida no ativo.

---

## 4. Fornecedores

### 4.1 Campos obrigatorios

- **Unicos campos nao obrigatorios:** complemento (endereco), telefone principal e contato vendedor. Os demais (razao social, CNPJ, etc.) permanecem obrigatorios conforme regra de negocio.

### 4.2 Tabela exibir dados da empresa

- Na listagem de fornecedores (GET /fornecedores), garantir que a resposta inclua os campos necessarios para a **tabela exibir dados da empresa**: **CNPJ, razao social, nome fantasia** (para fornecedor PJ). O front hoje nao esta exibindo esses dados — verificar se o GET ja retorna e o front apenas nao mapeia, ou se o backend nao envia.

---

## 5. Usuarios (Admin)

### 5.1 Scroll e botao Criar

- Scroll na pagina de usuarios: problema de layout/CSS no front. Backend nao altera. (Se houver paginacao, garantir que o GET /admin/users retorne `meta` com total para o front exibir corretamente.)

### 5.2 Permissionamento por pagina

- **Requisito:** Ter permissionamento em cima do que esta incluso de paginas dentro da empresa.
- Backend deve suportar **permissoes por usuario** (ou por role): lista de "paginas" (ids) que o usuario pode acessar. O login ja retorna `permissoes: string[]`; esses ids devem refletir as paginas liberadas para aquele usuario (ver 1.2). O admin, ao criar/editar usuario, define quais paginas esse usuario tera. Isso implica:
  - Modelo: usuario tem muitas permissoes (paginas) ou role com conjunto de permissoes.
  - GET /admin/users e POST/PATCH devem aceitar/retornar **permissoes** (array de ids de pagina).
  - Documentar a lista de ids de pagina disponiveis para o front e para o admin.

---

## 6. Empresas (Tenants / Admin)

### 6.1 Opcao multiloja

- No **cadastro da empresa** (POST/PATCH /admin/tenants), incluir campo **isMultiloja** (boolean).
- Se for multiloja, liberar a tela de **Lojas** para esse tenant; caso contrario, nao (o front esconde o item do menu ou a rota quando `!tenant.isMultiloja`). Backend ja pode ter esse campo; garantir que o login/tenant retorne **isMultiloja**.

### 6.2 Permissionamento de telas por empresa

- **Requisito:** Opcao de permissionamento sobre **quais telas** essa empresa (tenant) tera acesso.
- Modelo: tenant tem um conjunto de "telas/paginas" habilitadas (ex.: array de ids). Ao criar/editar tenant, o super admin seleciona quais telas estarão disponiveis para aquela empresa.
- Endpoints: PATCH /admin/tenants/:id deve aceitar algo como **paginasPermitidas: string[]** (ou similar). GET /admin/tenants e GET /tenants/me (ou login) devem retornar essa lista para o front esconder menu/rotas.

### 6.3 Admin da empresa (dono) criar usuarios

- **Caso o perfil for administrador** (dono da empresa, nao super admin): deve ter opcao de **criar usuarios** para a sua empresa.
- Esse **administrador** so pode gerenciar as **paginas** que o usuario que ele esta criando tera, **em cima das paginas ja liberadas para ele** pelo super admin. Ou seja: o conjunto de paginas do novo usuario e um subconjunto das paginas do tenant (e das que o admin tem acesso).
- Backend:
  - Role **admin** (tenant): pode chamar POST /admin/users (ou POST /tenants/:tenantId/users) apenas para o proprio tenantId.
  - Ao criar usuario, o body inclui **permissoes** (paginas); o backend valida que cada permissao esta em **tenant.paginasPermitidas** (e, se houver, nas permissoes do admin que esta criando).

---

## 7. Renda Extra e Investimento

### 7.1 Descricao nao obrigatoria

- Em **receitas** (renda extra) e **investimentos**, tornar **descricao** opcional nos endpoints (POST/PATCH).

### 7.2 CRUD de "Tipo" (igual despesas)

- Mesmo padrao das despesas: **GET/POST/DELETE** para tipos de renda extra (ex.: /receitas/tipos) e tipos de investimento (ex.: /investimentos/tipos).
- Regra: nao permitir apagar tipo que ja tenha lancamento vinculado; retornar erro com mensagem.

### 7.3 Investimento: remover "Comunicar agenda"

- Na entidade/endpoints de **investimento**, **nao** ter o campo "comunicar agenda" (remover se existir). Apenas despesas (e parcelamento, conforme abaixo) comunicam agenda.

---

## 8. Parcelamento

### 8.1 Comunicar agenda

- Adicionar opcao **comunicar agenda** no parcelamento. Quando ativo, os itens do parcelamento devem aparecer na Agenda e poder ser marcados como pagos.

### 8.2 Parcelas nos meses corretos

- **Regra:** Ao lancar um registro com parcela **3/12** em **fevereiro**, o sistema deve gerar/corrigir os registros das parcelas **1/12** em dezembro e **2/12** em janeiro (e assim por diante), ou seja, **registros para os meses certos** conforme a sequencia da parcela.
- Backend deve:
  - Ao criar parcelamento (ex.: 3/12 em fevereiro), gerar ou atualizar os registros das parcelas 1 e 2 nos meses anteriores.
  - Oferecer **opcao para a pessoa ajustar as parcelas** (ex.: endpoint PATCH ou "recalcular parcelas") quando estiverem erradas ou adiantadas. Contrato: ex.: **PATCH /parcelamentos/:id/ajustar-parcelas** com body indicando nova sequencia ou datas desejadas.

---

## 9. Despesa Banco

### 9.1 Bancos customizaveis (CRUD)

- **Requisito:** Em vez de bancos fixos, permitir que a pessoa **crie e remova** os bancos que quiser (como a lista de socios: entra no banco e faz o registro).
- Endpoints:
  - **GET /bancos** (ou /despesa-banco/bancos) — lista bancos do tenant.
  - **POST /bancos** — criar banco (nome, codigo opcional, etc.).
  - **PATCH /bancos/:id** e **DELETE /bancos/:id**.
- **Icones:** Bancos "padroes" (lista conhecida, ex.: por codigo de banco) podem ter icone definido; os demais usam icone generico. Backend pode retornar **codigoBanco** (ex.: 001, 341) para o front exibir o icone certo para bancos padrao.

### 9.2 Erro ao salvar registro

- Investigar e corrigir o **erro ao salvar** registro de despesa banco (validacao, constraint, ou campo obrigatorio faltando). Garantir que POST/PATCH de despesa-banco estejam alinhados ao contrato e ao schema.

---

## 10. Entrada (Financeiro)

### 10.1 CNPJ do fornecedor obrigatorio e validacao

- Ao digitar o **CNPJ do fornecedor** (com mascara), se o fornecedor **nao estiver cadastrado**, o backend deve retornar **erro** (ex.: 400 com mensagem "Fornecedor nao encontrado para o CNPJ informado."). Front envia CNPJ (sem mascara ou padronizado) e backend valida contra a base de fornecedores.

### 10.2 Modelo da nota (NF-e, NFC-e, etc.)

- Incluir campo **modelo da nota** com opcao de **criar e remover** modelos. Ex.: NF-e, NFC-e, etc.
- Endpoints: GET/POST/DELETE **modelos-nota** (ou /entrada/modelos-nota). Entrada passa a ter **modeloNotaId** ou **modeloNota** (string).

### 10.3 Categoria (industrializacao, embalagem, etc.)

- Os campos "industrializacao", "embalagem", etc. sao na verdade **uma unica dimensao**: **categoria**. Essas sao as categorias; permitir **adicionar e remover** categorias (CRUD de categorias de entrada).
- Endpoints: GET/POST/DELETE **categorias** (ou /entrada/categorias). Entrada tem **categoriaId** ou **categoria**.

### 10.4 Forma de pagamento

- Incluir campo **forma de pagamento** (adicionar/remover opcoes). Se for **dinheiro ou PIX**, o lancamento ja vai direto (provavelmente para caixa/saida). Apos informar a forma de pagamento, abrir campo para informar **valor a ser pago** e validar se nao e divergente do valor da nota.

### 10.5 Campo valor por categoria

- Ter um campo **valor** que pode ser **relacionado com a categoria** e permitir **mais de um valor** (ex.: varios valores por categoria na mesma entrada). Definir modelo: ex. array de { categoriaId, valor } na entrada.

---

## 11. Ativo Imobilizado

### 11.1 Recorrencia e Comunicar agenda

- Colocar campo **recorrencia** (periodicidade).
- Colocar campo **comunicar agenda**. Quando **comunicar agenda** estiver ativo, o item so vai para o **DRO** (ou equivalente) quando o usuario **pagar** (marcar como pago na agenda). Se **nao** comunicar agenda, considerar pagamento a vista: alimentar **saida** na hora e ir para o balanco do mes.
- Quando o usuario, na **agenda**, marcar como "pago", o backend deve registrar no **ativo imobilizado** a **saida** correspondente (que foi paga).

---

## 12. Controle Cartoes

### 12.1 Abas credito e debito separadas

- Dividir em **abas separadas** (credito e debito). Backend pode expor listagens ou filtros por tipo (credito/debito).

### 12.2 Configuracao de taxa

- Permitir **configurar taxa** por cartao/bandeira. Endpoints de config (ex.: GET/PUT /configuracoes/controle-cartoes ou por bandeira).

### 12.3 Aba "Outras funcoes" – taxas e prazos

- Na aba **outras funcoes**, opcao de **configurar todas as taxas e prazos** para cada cartao.

### 12.4 Credito: a vista x parcelado

- Separar **Credito a vista** e **Credito parcelado** (e parcelado a prazo). Backend deve suportar tipo/flag ou categoria que diferencie isso nas listagens e nos calculos.

### 12.5 Remover campo Desconto

- O "desconto" deve ser **influenciado pela taxa/prazo**. O campo **a receber** ja deve ser **calculado no backend** (receber backend).

### 12.6 Coluna "Dia da semana" duplicada

- Verificar resposta da API e remover duplicidade da coluna "Dia da semana" (pode ser front ou backend).

### 12.7 Campos prazo e taxa

- Garantir que existam e sejam retornados os campos **prazo** e **taxa** nas listagens/forms.

### 12.8 Tela "A receber" (outras funcoes)

- Ter tela **A receber** dentro de outras funcoes, listando o "a receber" conforme o **prazo** lancado. Backend: endpoint ou filtro que retorne os valores a receber por bandeira/cartao e prazo (conforme 07-outras-funcoes.md).

---

## 13. Caixa

### 13.1 Colunas e inputs dinamicos

- Permitir que a pessoa **inclua/remova colunas** (e que isso influencie os **inputs** do formulario). Isso depende de **configuracoes de colunas** por usuario (tabelaId caixa). Backend ja deve retornar **columns** no GET do caixa (listagem) e aceitar config em PUT /configuracoes/tabelas/caixa. Front usa isso para montar colunas e campos.

### 13.2 Erro ao adicionar

- Corrigir **erro ao adicionar** registro no caixa (validacao, campos obrigatorios ou contrato).

### 13.3 Campos nao obrigatorios

- **Campos do caixa nao podem ser obrigatorios** (exceto os que a regra de negocio exigir). Ajustar validacao no backend.

### 13.4 Exportacao PDF e Excel

- Garantir que a listagem do caixa tenha dados suficientes para o front exportar **PDF e Excel** (ou backend expor endpoint de exportacao). Ver "Geral - logo no PDF e Excel" abaixo.

---

## 14. Configuracoes (colunas e totais)

### 14.1 Incluir/remover coluna em todas as telas

- **Todas** as telas com tabela devem respeitar a configuracao de colunas do usuario (retornar **columns** no GET e persistir em PUT /configuracoes/tabelas/:tabelaId). Garantir que **todas** as listagens que alimentam tabelas incluam **columns** e que o front use em todas as telas.

### 14.2 Somar no total do balanco (Caixa)

- Para tabelas que tem **total** (ex.: Caixa), ter opcao por coluna: **somar no total? (Sim ou Nao)**. Algumas colunas nao entram no total. Backend: em **ColunaConfig** (ou equivalente), incluir algo como **somarNoTotal: boolean**. Ao calcular totais (balanco, caixa), usar apenas colunas com somarNoTotal true.

---

## 15. Balanco Geral

### 15.1 Remover tabela "Outros valores"

- Remover a tabela/secao **outros valores** do balanco (backend e front).

### 15.2 Entrada/Saida no lugar de Lucro liquido

- Trocar **lucro liquido** por opcao do usuario visualizar **Entrada** ou **Saida** (e atualizar os dados do balanco para mostrar a soma de entrada e saida corretamente). Backend: endpoint ou query param que retorne totais por **entrada** e **saida** e permita filtrar/agrupar por isso.

### 15.3 Margem -> Resultado

- **Margem** trocar por **Resultado**: **faturamento - despesas - entrada = resultado**. Ajustar calculo e labels no backend (e front).

### 15.4 Nas despesas, trazer valor da venda

- Na parte de **despesas** do balanco, incluir/trazer o **valor da venda** (quando aplicavel). Definir fonte de dados e formato.

### 15.5 Botoes do header fixos no scroll

- Os 4 botoes do header (faturamento, etc.) devem ficar **fixos** ao scrollar a pagina. Isso e apenas front (CSS/layout). Backend nao altera.

---

## 16. Geral

### 16.1 Logo no PDF e Excel

- Exportacoes **PDF e Excel** devem **incluir a logo** (da empresa ou do sistema). Backend pode retornar URL da logo do tenant ou o front envia no request de export; se a exportacao for feita no backend, o backend deve aceitar ou buscar a logo e inserir no PDF/Excel.

### 16.2 Logo no header

- O **header** do dashboard deve exibir a **logo**. Backend pode retornar no tenant (ou em GET /tenants/me) a **urlLogo** ou **logoUrl** para o front exibir no header.

---

## 17. Designer (assets)

### 17.1 Imagem do login

- **Solicitar** a imagem do login ao cliente (asset). Nao e alteracao de backend; apenas front usa a imagem. Se a imagem for por tenant, backend pode retornar **urlImagemLogin** no tenant.

### 17.2 Favicon

- **Solicitar** icone de aba (favicon). Nao e alteracao de backend; front usa no index.html.

---

## 18. Resumo por modulo

| Modulo | Itens backend |
|--------|----------------|
| Auth/Login | Tenant no response ou GET /tenants/me; permissoes (ids de pagina) documentados |
| Despesas | CRUD tipos; descricao opcional; recorrencia; comunicar agenda; categorias customizadas (config) |
| Agenda | GET dias com totais e detalhes; marcar pago (um ou lote) |
| Fornecedores | Campos opcionais (complemento, telefone principal, contato vendedor); listagem com CNPJ, razao, fantasia |
| Admin Users | Permissoes (paginas) no CRUD de usuario |
| Admin Tenants | isMultiloja; paginasPermitidas; admin tenant pode criar usuarios com permissoes limitadas |
| Renda Extra / Investimento | Descricao opcional; CRUD tipos; investimento sem comunicar agenda |
| Parcelamento | Comunicar agenda; parcelas nos meses corretos; endpoint ajustar parcelas |
| Despesa Banco | CRUD bancos; icones padrao por codigo; corrigir erro ao salvar |
| Entrada | Validar fornecedor por CNPJ; CRUD modelo nota; CRUD categoria; forma pagamento; valor por categoria |
| Ativo Imobilizado | Recorrencia; comunicar agenda; DRO ao pagar; saida ao marcar pago na agenda |
| Controle Cartoes | Abas credito/debito; config taxas/prazos; credito vista x parcelado; a receber calculado; prazo/taxa; tela A receber |
| Caixa | Colunas dinamicas; corrigir erro adicionar; campos nao obrigatorios; export PDF/Excel |
| Configuracoes | columns em todas as listagens; coluna somarNoTotal (Caixa/balanco) |
| Balanco | Remover outros valores; entrada/saida; resultado; despesas com valor venda |
| Geral | Logo no PDF/Excel; logo no header (url no tenant) |

---

## 19. Nota de alinhamento (Front x Backend)

- **Itens apenas no front** (CSS, assets, telas): feitos no front; backend nao altera.
- **Itens que dependem de definicao de contrato/UX** — backend nao implementou ainda; quando o contrato estiver fechado, implementar em cima do que ja existe:
  - **Entrada:** CRUD modelo de nota (10.2), CRUD categorias (10.3), forma de pagamento (10.4), valor por categoria (10.5).
- **Front hoje:** na tela Entrada ha validacao de CNPJ e envio do CNPJ limpo; nao ha UI para modelo de nota, categorias, forma de pagamento nem valor por categoria — essas telas/campos serao adicionados quando o contrato e os endpoints estiverem definidos.

---

**Versao:** 1.0.0  
**Data:** 2026-02-04
