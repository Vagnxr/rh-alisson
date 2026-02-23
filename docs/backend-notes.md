# Anotações para o Backend

Documento gerado durante as correções do frontend. Enviar ao agent do backend para alinhar APIs, regras e contratos.

---

## Histórico

- **2026-02-21**: Início – ajustes a partir do feedback do cliente (planilha/prints).

---

## 1. Formulário Novo Registro / Recorrência (feedback cliente 2026-02-21)

### 1.1 Campo "Data fim (opcional)" – mecânica

- **O que é:** Data limite da última ocorrência da série recorrente.
- **Regra:** A **data** enviada no body (campo `data`) é sempre a **primeira ocorrência**. Exemplo: se o usuário informa data `2026-02-13` e recorrência mensal para 6 meses, as ocorrências devem ser: 13/02, 13/03, 13/04, 13/05, 13/06, 13/07 (6 itens).
- **Se `recorrenciaFim` for enviado:** gerar ocorrências até essa data (última ocorrência <= `recorrenciaFim`).
- **Se `recorrenciaFim` for omitido/vazio:** gerar até 12 meses a partir de `data` (ou política do negócio já documentada em `docs/05-backend/09-despesas-recorrencia.md`).

### 1.2 Lógica igual ao parcelamento

- O cliente pediu que a recorrência funcione como o **parcelamento**: a data informada já conta como a primeira parcela/ocorrência. Ou seja, "6 meses" = 6 datas, sendo a primeira a própria data informada. O backend já deve seguir isso; confirmar que o cálculo de datas está assim (primeira ocorrência = `data`, demais = conforme periodicidade).

### 1.3 Comunicar Agenda – bugs reportados

- O cliente relatou: **"Do jeito que está fiz vários testes, principalmente comunicando agenda. Tem vários BUG."**
- **Backend:** Revisar o fluxo quando `comunicarAgenda: true` no POST de despesas (e no lançamento direto na agenda com recorrência): criação/atualização dos itens na Agenda para cada ocorrência, sem duplicar ou omitir datas. Garantir que os itens apareçam corretamente na tela de Agenda por data e que marcar como pago funcione.

### 1.4 Frontend já ajustado (só referência)

- Label da opção única de recorrência alterada de "Unica" para "Sem recorrência" (valor enviado continua `unica`).
- Texto de ajuda adicionado no campo "Data fim (opcional)" explicando a mecânica (primeira data = primeira ocorrência; em branco = até 12 meses).
- Nenhuma mudança de contrato (payload) por enquanto; backend pode continuar aceitando `recorrencia`, `recorrenciaFim` e `comunicarAgenda` como já especificado em `09-despesas-recorrencia.md` e `10-agenda-ajustes.md`.

---

## 2. Despesas Fixas (e demais tabelas de despesa) – ordem das colunas e índice de recorrência (feedback cliente 2026-02-21)

### 2.1 Ordem das colunas na tabela

- A ordem desejada é a mesma do formulário **Novo Registro**: **Data – Tipo – Descricao – Valor – Recorrencia**.
- O frontend passou a **forçar** essa ordem nas tabelas de despesa (Despesas Fixas, Despesa Extra, etc.), mesmo quando a API envia `columns` na resposta. Ou seja, o front já exibe nessa ordem.
- **Backend (opcional):** Para consistência, nas respostas GET que incluem `columns` para as tabelas de despesa (`despesa-fixa`, `despesa-extra`, `despesa-funcionario`, `despesa-imposto`, `despesa-veiculo`, `despesa-banco`), enviar os itens em `columns` já nessa ordem, por exemplo: `[{ id: 'data', ... }, { id: 'tipo', ... }, { id: 'descricao', ... }, { id: 'valor', ... }, { id: 'recorrencia', ... }]` com `order` 1, 2, 3, 4, 5 respectivamente.

### 2.2 Indício da ocorrência na recorrência (ex.: TRIMESTRAL 2/3)

- O cliente pediu que, quando houver recorrência (ex.: TRIMESTRAL), seja exibido **em qual ocorrência aquele registro está** (ex.: "2/3" = segunda de três).
- **Contrato:** Nos itens de despesa retornados (GET lista ou GET por id), o backend pode enviar o campo opcional **`recorrenciaIndice`** (string), por exemplo `"2/3"`. O frontend exibe ao lado do badge de recorrência (ex.: "TRIMESTRAL 2/3").
- **Backend:** Para cada despesa que faz parte de uma série recorrente, calcular e preencher `recorrenciaIndice` no formato `"atual/total"` (ex.: `"1/4"`, `"2/3"`). Se não for possível ou não fizer sentido para o negócio, o campo pode ser omitido; o front apenas não exibe o sufixo.

---

## 3. Despesa Funcionário – campo Tipo e abreviações (feedback cliente 2026-02-21)

- **Layout:** Ajustado no front para o campo Tipo não “sair do esquadro” e o botão “+” (adicionar/gerenciar tipos) ficar sempre visível (select com `min-w-0`, container com `min-w-0`).
- **Abreviações:** No front, os tipos longos de Despesa Funcionário passam a ser **exibidos** abreviados no select e na coluna da tabela (ex.: ADIANT. SALARIO, EX. ADMISSIONAL, EX. PERIODICO, PAGTO SALARIO). O valor enviado e armazenado continua o nome completo (ex.: `ADIANTAMENTO DE SALARIO`). **Nenhuma alteração de contrato no backend**; o front só muda o rótulo exibido.

---

## 4. Socios – totais, validacoes e socios inativos (feedback cliente 2026-02-21)

### 4.1 Exibicao dos totais (Total Geral e Total lancado)

- No front, os valores negativos passam a ser exibidos **sem o sinal de menos**, em valor absoluto, com estilo em vermelho (para indicar que e saida/negativo). Nenhuma mudanca de contrato; o backend continua enviando o valor com sinal (ex.: -5000).

### 4.2 Validacao da soma dos percentuais

- O front passou a validar que a **soma dos percentuais de participacao deve ser 100%** ao cadastrar ou editar socio. Se a soma for diferente de 100%, exibe mensagem de alerta e nao envia o request.
- **Backend (recomendado):** Validar tambem no POST/PATCH de socios que a soma dos percentuais (considerando os demais socios ativos) seja 100%, e retornar erro claro (ex.: 400 com mensagem "Soma dos percentuais deve ser 100%") se nao for.

### 4.3 CPF ja cadastrado

- Ao tentar cadastrar um socio com CPF ja existente, o front exibe o alerta **"CPF já cadastrado"** quando o backend retorna erro que indique isso (ex.: status 409 ou mensagem contendo "cpf" ou "cadastrado").
- **Backend:** Garantir que, ao receber POST de socio com CPF duplicado, retorne um erro identificavel (ex.: **409 Conflict** ou **400** com `message` contendo "CPF" ou "cadastrado"), para o front exibir a mensagem correta.

### 4.4 Socio ativo / Socios inativos

- Na lista principal de Socios, o front passou a exibir **apenas socios ativos** (`isAtivo === true`). O "Total Geral" considera apenas ativos.
- Foi adicionado o botao **"Socios Inativos"**, que exibe a lista de socios com `isAtivo === false`. Nessa tela, o usuario pode clicar em **"Ativar"** para reativar um socio (PATCH com `isAtivo: true`), que volta a aparecer na lista principal.
- **Backend:** Garantir que GET /socios e GET /socios/resumo retornem o campo `isAtivo` em cada socio; o front ja envia e recebe esse campo no POST/PATCH.

---

## 5. Movimentacoes de Socios – data, obrigatoriedade e maiusculas (feedback cliente 2026-02-21)

### 5.1 Bug da data (dia anterior ao salvar)

- **Problema:** Ao registrar uma nova movimentacao no dia 13/02, a data era salva como 12/02 (dia anterior). Causa provavel: uso de data em UTC no front ou interpretacao com timezone no backend.
- **Ajuste no front:** O front passou a usar **data local** ao abrir o formulario (YYYY-MM-DD via `formatDateToLocalYYYYMMDD`) e a enviar apenas **YYYY-MM-DD** (sem hora, sem Z) no POST/PATCH de movimentacoes (campo `data`).
- **Backend (importante):** Garantir que o endpoint de movimentacoes (POST/PATCH) **receba e armazene** o campo `data` como **data apenas (YYYY-MM-DD)**, sem aplicar conversao de fuso. Ao **retornar** (GET movimentacoes), enviar `data` **sempre no formato YYYY-MM-DD** (ex.: `"2026-02-12"`), **sem** hora nem sufixo Z. Se o backend retornar data com hora (ex.: `2026-02-12T00:00:00.000Z`), o formulario de **Editar Movimentacao** pode exibir a data errada (ex.: dia atual em vez do dia da movimentacao). O front agora sincroniza o formulario com os dados da movimentacao ao abrir a edicao; mesmo assim, o backend deve retornar `data` como YYYY-MM-DD para evitar problemas.

### 5.2 Campos obrigatorios

- **Data, Tipo e Valor** sao obrigatorios no formulario de Nova/Editar Movimentacao. O front valida e exibe "Preencha Data, Tipo e Valor." se faltar algum.
- **Backend (recomendado):** Validar no POST/PATCH que `data`, `tipo` e `valor` estejam presentes e validos; retornar 400 com mensagem clara se algum estiver ausente ou invalido.

### 5.3 Padrao maiusculo (Tipo e Descricao)

- O front envia **descricao** em maiusculas (apos trim). Para **tipo**, envia em maiusculas apenas quando for tipo customizado (nao fixo); tipos fixos (pro-labore, distribuicao, retirada, etc.) continuam com a key em minusculas.
- **Backend:** Aceitar `tipo` tanto em minusculas (tipos fixos) quanto em maiusculas (customizados). Aceitar `descricao` em maiusculas; persistir e retornar como recebido.

### 5.5 Formato de valor ao editar (padrao BR)

- Nos formularios de edicao (movimentacoes, despesas, parcelamento, etc.), o front passou a exibir o campo **Valor** no padrao brasileiro: **milhar com ponto** (10.000) e **decimal com virgula** (10,82). Ao abrir para editar, o valor e formatado assim; ao salvar, o front envia o numero normalmente (ex.: 10000 ou 10.82) no payload. Nenhuma alteracao de contrato no backend.

### 5.6 Tipo novo nao deixa adicionar movimentacao

- **Problema:** Ao criar um novo tipo em "Gerenciar tipos" (Socios) e tentar usar esse tipo em "Nova Movimentacao", o sistema nao permitia adicionar (erro nao era exibido).
- **Ajuste no front:** (1) Try/catch no submit da movimentacao para exibir em toast a mensagem de erro retornada pelo backend. (2) Apos adicionar um tipo no dialog "Gerenciar tipos", o front chama `fetchTipos('socios')` para atualizar a lista com o retorno do backend, garantindo que o valor enviado na movimentacao seja o mesmo aceito pelo backend.
- **Backend (importante):** O endpoint **POST (e PATCH) de movimentacoes-socios** deve **aceitar** o campo `tipo` como **qualquer string** que corresponda a um tipo valido: tanto os fixos (pro-labore, distribuicao, retirada, aporte, outro) quanto **tipos customizados** criados pelo usuario via **POST despesas/tipos** com `categoria: "socios"`. Rejeitar um tipo customizado (ex.: "ESCOLA") com erro 400 ou similar faz com que o usuario nao consiga adicionar a movimentacao. Validar que o tipo exista em GET despesas/tipos?categoria=socios ou aceitar qualquer string para flexibilidade.

### 5.4 Botao "Editar Socio" na tela de detalhes

- O botao "Editar Socio" na tela de detalhes do socio (quando um card e clicado) foi **removido**, pois nao funcionava corretamente e a edicao ja existe na tela principal de Socios. Nenhuma alteracao de backend.

---

## 6. Socios – solicitacoes de novas funcionalidades (feedback cliente 2026-02-21)

### 6.1 Recorrencia e Comunicar Agenda em movimentacoes

- O cliente solicitou que, em Socios, existam **Recorrencia** e **Comunicar Agenda** (analogo ao modulo de despesas).
- **Backend:** Seria necessario definir contrato para movimentacoes com recorrência (ex.: campos `recorrencia`, `recorrenciaFim`) e para "comunicar agenda" (ex.: `comunicarAgenda: boolean`), gerando itens na Agenda quando marcado. Documentar e implementar conforme regras ja usadas em despesas (ver `09-despesas-recorrencia.md` e `10-agenda-ajustes.md`).

### 6.2 Relatorios Excel e PDF

- O cliente solicitou **relatorios em Excel e PDF** (provavelmente para Socios e/ou movimentacoes).
- **Backend:** Definir endpoints ou fluxo para geracao de relatorios (ex.: GET com `format=excel` ou `format=pdf`, ou endpoint dedicado), retornando arquivo para download. Incluir na planejamento de backlog se ainda nao estiver previsto.

---

## 7. Parcelamento e Agenda (feedback cliente 2026-02-21)

### 7.1 Parcelamento – Descricao maiusculo, campos obrigatorios e campo Parcela na edicao

- **Descricao em maiusculas:** O campo Descricao no formulario de Parcelamento passou a aceitar apenas maiusculas (onChange com toUpperCase e classe uppercase), alinhado ao padrao do sistema.
- **Campos obrigatorios:** Data, Descricao, Parcela e Valor estao marcados como obrigatorios (asterisco vermelho) e com validacao no submit.
- **Edicao – exibir Parcela:** Ao editar um registro, o formulario passou a exibir o campo **Parcela** em modo somente leitura (valor do registro), para o usuario ver qual parcela esta editando. Nenhuma alteracao de backend.

### 7.2 Renda Extra – sem Comunicar Agenda

- Na tela **Renda Extra**, a opcao **Comunicar Agenda** nao e exibida (checkbox removido do formulario Novo/Editar Registro). O front passou a usar `showComunicarAgenda={false}` nessa pagina. Nenhuma alteracao de contrato no backend; se o backend receber `comunicarAgenda` para renda-extra, pode ignora-lo ou nao criar itens na agenda.

### 7.3 Agenda – exibir parcela quando item vem de Parcelamento

- O cliente pediu que, ao criar um parcelamento com "Comunicar Agenda", na agenda apareca **qual parcela** e (ex.: 1/3).
- **Frontend:** O tipo `AgendaItem` passou a ter o campo opcional **`parcela`** (string). Na lista de itens do dia, quando `item.parcela` existe, ele e exibido ao lado da descricao (ex.: "teste 1/3").
- **Backend:** Em **GET /agenda/dias/:data** (ou equivalente), para itens cuja origem e Parcelamento, incluir o campo **`parcela`** (string, ex.: `"1/3"`) em cada item, para o front exibir na agenda. Se hoje a descricao ja vier concatenada (ex.: "teste 1/3"), o front continua exibindo; porem e preferivel enviar **`parcela`** separado para que o front possa formatar de forma consistente (ex.: descricao + " " + parcela).

### 7.4 Investimentos – ordem das colunas na tabela

- Na tela **Investimentos**, a ordem das colunas da tabela deve ser **Data – Tipo – Descricao – Valor – Recorrencia** (mesmo padrao das demais tabelas de despesa).
- **Frontend:** A pagina de Investimentos passou a **nao usar** o campo `columns` retornado pela API para essa tela; a ordem e sempre a canonica acima (via `columns={null}` no DespesaPage).
- **Backend (opcional):** Em GET investimentos, se a API enviar `columns`, o front ignora para ordenacao. Para consistencia com as demais despesas, enviar `columns` na ordem: data, tipo, descricao, valor, recorrencia (ids e order 1..5).

---

## 8. Ativo Imobilizado (feedback cliente 2026-02-21)

### 8.1 Nova Entrada – campos obrigatorios, maiusculas e Forma de Pagto

- **Frontend:** No modal **Nova Entrada** (e Editar Entrada), os campos **Data**, **N.F.**, **Descricao/Fornecedor** e **Valor (R$)** sao obrigatorios (asterisco vermelho e validacao no submit). O campo **Descricao/Fornecedor** e enviado em **maiusculas** (trim + toUpperCase). Foi adicionado o campo **Forma de Pagto** (obrigatorio), apos Valor, com opcoes: **Dinheiro**, **PIX**, **Boleto**. O front envia `formaPagto` no POST/PATCH de entradas (valor `"Dinheiro"` | `"PIX"` | `"Boleto"`).
- **Backend:** Aceitar e persistir `formaPagto` nas entradas de Ativo Imobilizado. Validar presenca de `data`, `nf`, `descricaoFornecedor` e `valor`; retornar 400 com mensagem clara se algum estiver ausente. Aceitar `descricaoFornecedor` em maiusculas.

### 8.2 Saida Ativo Imobilizado – geracao automatica (sem botao + Novo)

- **Frontend:** O botao **"+ Novo"** na secao **Ativo Imobilizado - Saida** foi **removido**. A Saida e preenchida automaticamente conforme regras de negocio (ver abaixo). A secao exibe texto explicativo: "Preenchido automaticamente conforme Entrada e pagamentos na Agenda." O usuario ainda pode **editar** e **excluir** registros de saida (botoes na tabela) para correcoes.
- **Backend (obrigatorio):**
  - **Forma de Pagto Dinheiro ou PIX:** Ao criar ou atualizar uma **Entrada** com `formaPagto: "Dinheiro"` ou `formaPagto: "PIX"`, o backend deve **gerar automaticamente** um registro de **Saida** de Ativo Imobilizado **no mesmo dia** da entrada (mesma data do lancamento), com os mesmos dados relevantes (N.F., descricao/fornecedor, valor).
  - **Forma de Pagto Boleto:** Quando a entrada for com `formaPagto: "Boleto"`, o sistema deve permitir preencher **datas de vencimento e valores** (parcelas) para **comunicar a Agenda**. O backend deve criar itens na Agenda com essas datas/valores. **Quando o usuario marcar como pago** um item dessa origem na **Agenda**, o backend deve **gerar automaticamente** o registro correspondente em **Saida** Ativo Imobilizado (data do pagamento, valor pago, dados da entrada original).
- **Contrato sugerido para Boleto:** Definir como a entrada com formaPagto Boleto envia parcelas (ex.: campo `parcelas?: { dataVencimento: string; valor: number }[]` ou uso de `recorrencia` + `recorrenciaFim`). Garantir que, ao marcar item da Agenda como pago, o servico de agenda chame ou dispare a criacao do registro de Saida Ativo Imobilizado vinculado a essa entrada/parcela.

---

## 9. Agenda – exibicao e totais (feedback cliente 2026-02-21)

### 9.1 Valores e logica de agregacao

- **Agenda e so SOMA, nao faz subtracao:** No calendario e no detalhe do dia, o front passou a exibir apenas a **soma** dos valores (totalEntradas + totalSaidas) por dia, em **uma cor so (preto)**. Nao ha mais exibicao de saldo (entradas - saidas) em verde/vermelho nessa tela.
- **Valores no calendario:** Valores por dia estao centralizados na celula, em fonte maior e em preto. Dias dos meses anterior/seguinte (quando aparecem na grade) exibem valores em cor mais fraca e tamanho menor, se houver lancamentos.
- **Backend:** Nenhuma alteracao de contrato. O front continua usando `totalEntradas` e `totalSaidas` retornados por GET /agenda/dias (ou por dia); a unica mudanca e no calculo de exibicao: valor do dia = totalEntradas + totalSaidas.

### 9.2 Total do mes e navegacao

- **Total do mes:** Foi adicionado o campo **Total do mes** no cabecalho do calendario e abaixo da grade, somando (totalEntradas + totalSaidas) de todos os dias do mes exibido.
- **Navegacao mes/ano:** Mantidas as setas para avancar/retroceder mes. Foi adicionado um seletor de mes e ano: ao clicar no titulo do mes (ex.: "fevereiro de 2026"), abre um painel com ano (e setas para alterar) e os 12 meses; ao escolher um mes, a vista navega para ele e o painel fecha. Os nomes dos meses so aparecem quando o usuario abre esse painel.

### 9.3 Lancar na agenda – sem Tipo, campos obrigatorios e edicao

- **Campo Tipo removido:** No modal **Lancar na agenda**, o campo **Tipo** (Entrada/Saida) foi removido. A agenda e so soma; o front **nao envia** mais `tipo` no POST de itens diretos (POST /agenda/itens).
- **Campos obrigatorios:** **Data**, **Descricao** e **Valor (R$)** sao obrigatorios no formulario. O front valida e envia sempre `data`, `descricao` (trim) e `valor`. **Backend:** Validar presenca de `data`, `descricao` e `valor` no POST; retornar 400 com mensagem clara se algum estiver ausente.
- **Edicao de lancamentos diretos:** Lancamentos feitos direto na agenda (via "Lancar na agenda") devem ser **editaveis**. O front exibe botao **Editar** (lapis) nos itens que considera "direto" (itens sem `origem` ou com `origem === "Agenda"`). Ao clicar, abre modal para alterar data, descricao e valor; o submit chama **PATCH /agenda/itens/:id** com body `{ data: string, descricao: string, valor: number }`.
- **Backend:** (1) Aceitar POST /agenda/itens **sem** `tipo` (ou ignorar se enviado). (2) Aceitar **PATCH /agenda/itens/:id** para atualizar itens criados direto na agenda; body com `data`, `descricao`, `valor`. Se a data for alterada, o item deve passar a constar no novo dia. (3) Opcional: retornar `origem: "Agenda"` nos itens criados pelo lancamento direto, para o front exibir o botao Editar apenas nesses itens.

### 9.4 Agenda – desmarcar como pago (obrigatorio para o fluxo)

- **Requisito:** Quando um item e marcado como pago na Agenda e salvo, o usuario **precisa poder desmarcar** (voltar ao estado "nao pago"). Sem isso, nao e possivel corrigir o lancamento na origem: para alterar na origem (ex.: despesa, entrada), e preciso desmarcar como pago na Agenda primeiro. Vale para itens vindos de Despesa, Entrada ou da propria Agenda.
- **Frontend:** Em **todos** os itens marcados como "Pago", e exibido o botao **"Pago · Desmarcar"**. Ao clicar, o front chama **POST /agenda/itens/:id/desmarcar-pago** (sem body), atualiza o estado e recarrega o dia e a lista de dias. A descricao do modal do dia informa: "Para corrigir na origem (despesa, entrada ou agenda), use Pago · Desmarcar antes."
- **Backend (obrigatorio):** E necessario implementar **POST /agenda/itens/:id/desmarcar-pago** (ou equivalente, ex.: PATCH /agenda/itens/:id com `{ pago: false }`) que reverta o status de pago do item. Apos desmarcar, o item deve voltar a aparecer como nao pago nos GET da agenda. Qualquer efeito colateral do "marcar como pago" (ex.: geracao de Saida em Ativo Imobilizado) deve ser tratado conforme regra de negocio (reversao ou nao).

---

## 10. Entrada (Nova Entrada) – formulario e formas de pagamento (feedback cliente 2026-02-21)

### 10.1 Ordem do formulario, Nº da nota e modal mais largo

- **Campo Sequencia removido:** O formulario **nao possui** campo "Sequencia". O front **nao envia** `sequencia` no POST/PATCH de entrada.
- **Ordem e nomes (igual ao Excel):** Modelo da nota, CNPJ do fornecedor, Data entrada, Data emissao (nota), **Nº da nota** (opcional), Tipo, Valor/Categoria (valores por categoria), Forma de pagamento, Valor a ser pago (conferencia) quando Dinheiro/PIX, Contas a pagar (apenas Vencimento e Valor) quando BOLETO. Mesmos nomes do Excel.
- **Nº da nota:** O front envia **`numeroNota`** (string, opcional) no POST/PATCH quando preenchido. Ex.: 156.
- **Modal mais largo:** O modal Nova Entrada / Editar Entrada foi ampliado (**sm:max-w-3xl**) para melhor leitura e alinhamento.
- **Backend:** Aceitar **`numeroNota`** (opcional) no payload. Manter ordem/nomes conforme documentacao. Se ainda existir `sequencia` no contrato, pode ser ignorado ou removido.

### 10.2 Modelos de nota, Categorias e Formas de pagamento – padroes e criacao

- **Nomes padrao nao podem ser apagados:** Nos botoes de configuracao (Modelos nota, Categorias, Formas pag.), os itens **padrao do sistema** nao podem ser excluidos. O front desabilita o botao Remover para: modelos em MODELOS_NOTA_INICIAIS (NF-e, NFC-e, NFS-e, ENT SN, BONIFICACAO), categorias em CATEGORIAS_INICIAIS (COMERCIALIZACAO, INDUSTRIALIZACAO, etc.), formas em FORMAS_PAGAMENTO_INICIAIS (DINHEIRO, PIX, BOLETO). **Backend (opcional):** Se essas listas forem persistidas no servidor, impedir exclusao dos itens padrao.
- **Criacao:** O front **permite adicionar** novos modelos, categorias e formas (campo + botao Adicionar). Hoje a adicao e apenas em estado local (na sessao). **Se o backend persistir** essas listas, e necessario expor endpoints de listagem e **criacao** (ex.: POST) e o front deve chamar ao adicionar; caso contrario o usuario pode ter a impressao de que "nao esta deixando criar" apos recarregar a pagina. Garantir que a criacao funcione (retorno 201/200 e item na lista).

### 10.3 Forma de pagamento – Comunica Agenda

- **Requisito:** Algumas formas de pagamento **comunicam a Agenda** (ex.: BOLETO – gera itens na Agenda com vencimentos/valores); outras nao (DINHEIRO, PIX). Ao **criar uma nova forma de pagamento** na tela de configuracao, o usuario deve informar se aquela forma **comunica Agenda** ou nao (checkbox "Comunica Agenda").
- **Frontend:** As formas de pagamento passaram a ser armazenadas com o atributo **`comunicaAgenda`** (boolean). Padroes: DINHEIRO e PIX com `comunicaAgenda: false`, BOLETO com `comunicaAgenda: true`. No dialog de configuracao, ao adicionar nova forma, ha checkbox "Comunica Agenda". O valor e usado no front para exibir Contas a pagar quando a forma e do tipo que comunica (ex.: BOLETO).
- **Backend:** (1) Se as formas forem persistidas, o modelo/cadastro deve incluir **`comunicaAgenda: boolean`**. (2) Endpoints de criacao/atualizacao de formas de pagamento devem aceitar e persistir esse campo. (3) A logica que gera itens na Agenda (ex.: ao salvar entrada com BOLETO e parcelas) deve usar esse flag ou a convencao (BOLETO = comunica).

### 10.4 Contas a pagar (parcelas) quando Forma = BOLETO

- **Requisito:** Quando a forma de pagamento for BOLETO (ou outra que comunica Agenda), o usuario deve poder informar **mais de um vencimento e valor** (ex.: nota de 3.000 com 3 boletos de 1.000 em datas diferentes). O front exibe a secao **Contas a pagar** com linhas (Vencimento, Valor); sem campo Codigo de Barras.
- **Frontend:** Quando **Forma de pagamento** e BOLETO, e exibida a secao **Contas a pagar** com botao "Adicionar parcela". Cada linha tem **Vencimento** (date) e **Valor**; e possivel remover linhas. No submit, e enviado **`contasAPagar`**: array de `{ vencimento: string (YYYY-MM-DD), valor: number }` (apenas linhas com vencimento e valor preenchidos).
- **Backend:** (1) Aceitar no POST/PATCH de **entrada** o campo opcional **`contasAPagar`**: array de `{ vencimento: string, valor: number }`. (2) Para cada parcela, criar item na Agenda na data de vencimento com o valor informado, de modo que ao marcar como pago na Agenda o fluxo existente seja acionado. (3) Retornar `contasAPagar` no GET de entrada quando existir, para o front preencher o formulario na edicao.

### 10.5 Lista de Entrada – opcao de editar e excluir

- **Requisito:** Na tela Entrada, o usuario deve poder **editar** e **excluir** lancamentos existentes (alteracoes conforme fluxo da aba anterior / Nova Entrada).
- **Frontend:** Na tabela, cada linha tem na coluna **Acoes** os botoes **Editar** (lapis + texto) e **Excluir** (lixeira). Ao clicar em Editar, abre o mesmo modal Nova Entrada preenchido com os dados do registro; o submit envia **PATCH financeiro/entrada/:id**. Ao clicar em Excluir, abre confirmacao e envia **DELETE financeiro/entrada/:id**. A coluna **Nº nota** exibe o valor de `numeroNota` quando existir. O estado vazio informa: "Use + Novo para adicionar... Quando houver registros, use o botao Editar na coluna Acoes para alterar o lancamento."
- **Backend:** Garantir que **PATCH financeiro/entrada/:id** e **DELETE financeiro/entrada/:id** estejam implementados e que o GET retorne `numeroNota` quando existir, para a edicao e a tabela exibirem corretamente.

---

## 11. Agenda – exibicao de valores, total do mes e navegacao (feedback cliente 2026-02-21)

### 11.1 Valores em preto, centralizados e maiores

- **Frontend:** Na grade do calendario, os valores monetarios de cada dia passaram a ser exibidos em **uma so cor (preto/slate-900)**, **centralizados** na celula e com **fonte maior** (text-base, font-semibold). Nao ha mais destaque em vermelho ou verde por tipo.

### 11.2 Agenda e so soma (nao subtracao)

- **Regra:** A Agenda exibe apenas **soma** dos valores por dia e no total do mes; nao faz subtracao (entradas menos saidas).
- **Frontend:** O total do dia e calculado como `totalEntradas + totalSaidas`; o total do mes e a soma desses totais de todos os dias do mes. Nenhuma alteracao de contrato.
- **Backend (recomendado):** Em GET agenda/dias (e por data), enviar **`totalEntradas`** e **`totalSaidas`** de forma que a **soma** reflita o que o usuario deve ver (ex.: valores positivos; se a convencao for "saidas como valor a pagar", manter positivos para o front apenas somar).

### 11.3 Campo Total do mes

- **Frontend:** Foi criado um **campo em destaque** para o **Total do mes** acima da grade (ao lado da navegacao mes/ano), com label "Total do mes" e valor em destaque (fonte maior, negrito). O mesmo total e exibido abaixo do calendario, no rodape.

### 11.4 Navegacao por mes e ano

- **Frontend:** A navegacao por **setas** (mes anterior/seguinte) foi mantida. Ha tambem **navegacao por mes e ano**: ao clicar no titulo do mes (ex.: "fevereiro de 2026"), abre um painel com **ano** (e setas para mudar ano) e **grade de meses** (JAN-DEC) para escolher o mes. Os meses nao ficam visiveis o tempo todo; aparecem ao abrir o painel. Nenhuma alteracao de backend.

### 11.5 Valores dos dias do mes anterior/seguinte

- **Frontend:** Quando a grade exibe dias do **mes anterior** ou do **mes seguinte** (para completar as linhas do calendario), o numero do dia ja aparece em **cor fraca** (text-slate-400). Os **valores** lancados nesses dias passaram a ser exibidos tambem em **cor fraca e tamanho menor** (text-[10px] text-slate-400), em relacao aos valores do mes atual. Nenhuma alteracao de backend.

### 11.6 Modal "Lancar na agenda" – sem Tipo, campos obrigatorios e itens editaveis

- **Sem campo Tipo (Entrada/Saida):** A agenda e **so soma**; o modal **Lancar na agenda** **nao possui** campo Tipo (Entrada/Saida). O front **nao envia** `tipo` no POST para itens diretos (POST agenda/itens). O backend pode armazenar internamente como quiser; na resposta (GET dias/itens) cada item continua com `tipo: 'entrada' | 'saida'` para totais por dia, mas o formulario de lancamento direto nao exibe nem envia tipo.
- **Data, Descricao e Valor obrigatorios:** No modal, **Data**, **Descricao** e **Valor (R$)** sao obrigatorios (asterisco vermelho e validacao no submit). O front valida e exibe "Preencha Data, Descricao e Valor." se faltar algum. **Backend (recomendado):** Validar no POST agenda/itens que `data`, `descricao` e `valor` estejam presentes e validos; retornar 400 com mensagem clara se algum estiver ausente.
- **Lancamentos diretos devem ser editaveis:** Itens criados pelo **Lancar na agenda** (lancamento direto) precisam poder ser **editados** pelo usuario. O front exibe o botao **Editar** (lapis) para itens cuja **`origem`** e **"Agenda"** ou nao informada. Ao clicar, abre o dialog "Editar item da agenda" (data, descricao, valor) e envia **PATCH agenda/itens/:id**. **Backend:** (1) Para itens criados via POST agenda/itens (lancamento direto), retornar **`origem: "Agenda"`** (ou omitir origem) nos GET agenda/dias e GET agenda/dias/:data, para o front exibir o botao Editar. (2) Permitir **PATCH agenda/itens/:id** para esses itens (alterar data, descricao, valor).

---

## 12. Saida – preenchimento automatico, ordem das colunas e GAS/GLP (feedback cliente 2026-02-21)

### 12.1 Saida sem botao "+ Novo" – preenchimento automatico

- **Requisito:** A tela **Saida** nao possui criacao manual de registros. Os registros sao **preenchidos automaticamente** conforme a Entrada: (1) Se a **Entrada** for **Dinheiro ou PIX**, a saida correspondente e gerada **no mesmo dia** do lancamento. (2) Se a Entrada for **Boleto**, a saida e gerada quando o item for **marcado como pago na Agenda**.
- **Frontend:** O botao **"+ Novo"** foi **removido** da tela Saida. A descricao da pagina e o estado vazio informam que a Saida e preenchida automaticamente. O usuario ainda pode **Editar** e **Excluir** registros existentes (botoes na coluna Acoes) para correcoes.
- **Backend:** Implementar a logica para **criar automaticamente** registros de Saida: (1) Ao salvar uma **Entrada** com forma de pagamento **Dinheiro ou PIX**, gerar o registro de Saida no mesmo dia (mesma data). (2) Ao **marcar como pago** na Agenda um item cuja origem e Entrada com Boleto, gerar o registro de Saida correspondente (data do pagamento, dados da entrada). Nao expor endpoint de criacao manual (POST saida) para uso pela UI, ou documentar que a UI nao o utiliza.

### 12.2 Ordem das colunas e troca GAS por GLP

- **Ordem das colunas (categorias):** Na tabela e no formulario de edicao, a ordem das colunas de categoria e: **Comercializacao – Industrializacao – Embalagem – Material uso/cons. – Mercadoria uso/cons. – GLP**.
- **Troca GAS por GLP:** O rotulo **"GAS"** foi alterado para **"GLP"** em todo o sistema (tela Saida e tela Entrada, na lista de categorias). O front exibe **GLP**; o campo na API pode continuar como **`gas`** (id/campo) para compatibilidade, ou o backend pode migrar para `glp` se preferir padronizar.
- **Frontend:** Em **Entrada**, a categoria que antes aparecia como "GÁS" (id `gas`) passou a ser exibida como **"GLP"**. Em **Saida**, o cabecalho da coluna e o label no formulario de edicao passaram a **"GLP"**. Export Excel/PDF da Saida usa a coluna "GLP".

### 12.3 Categorias da Entrada refletidas na Saida

- **Requisito:** Quando o usuario **criar uma nova categoria** na tela **Entrada** (configuracao de categorias), essa categoria deve **existir automaticamente** na **Saida** (mesma lista de categorias ou espelho). A Saida e um espelho da Entrada: ao dar baixa (marcar como pago), devem ser trazidas **todas as colunas** da Entrada para o registro de Saida.
- **Backend:** (1) Garantir que as categorias usadas na Entrada (incl. customizadas) estejam disponiveis na Saida – modelo unificado de categorias ou replicacao ao criar na Entrada. (2) Ao gerar automaticamente um registro de Saida a partir de uma Entrada paga, preencher **todas as colunas** equivalentes (data, forma pagamento, fornecedor, valores por categoria, etc.) a partir dos dados da Entrada.

---

## 13. Caixa – padrao menor, ordem das colunas e configuracao (feedback cliente 2026-02-21)

### 13.1 Ordem padrao e labels menores (evitar barra de rolagem)

- **Requisito:** A tabela Caixa deve usar um **padrao menor** (labels mais curtos) para nao gerar barra de rolagem horizontal.
- **Ordem padrao das colunas:** Data (dia), Dinheiro, Pag. (PDV), Pag. (Escrit.), PIX, Credito, Debito, Voucher, Troca, Devol. Dinheiro, Desconto, iFood, Total. Colunas de valor que **somam** no total: Dinheiro, Pag. (PDV), Pag. (Escrit.), PIX, Credito, Debito, Voucher, Troca, Devol. Dinheiro, iFood. **Desconto** e **NEUTRO** (nao soma nem subtrai no total do dia). **Total** e o resultado.
- **Frontend:** Configuracao padrao em `TABELAS_CONFIGURACOES` atualizada com labels curtos (ex.: "Dinheiro" em vez de "Dinheiro (dep.)", "Pag. (Escrit.)" para pagamento escritorio). Novas colunas padrao: **pagamentoEscritorio**, **troca**, **devolucaoDinheiro**, **desconto** (somarNoTotal: false, subtrairNoTotal: false).
- **Backend:** GET/POST/PATCH de caixa devem aceitar e retornar os campos **pagamentoEscritorio**, **troca**, **devolucaoDinheiro**, **desconto** (numeros). O calculo do total do dia no backend deve respeitar **somarNoTotal** e **subtrairNoTotal** por coluna (Desconto = neutro).

### 13.2 Configuracao – nao apagar padroes; criar nova com SOMA/SUBTRAI/NEUTRO

- **Colunas padrao nao podem ser apagadas:** Em **Configuracoes**, na tabela Caixa, as colunas **padrao do sistema** nao podem ser **removidas**. O usuario pode apenas **inibir (ocultar)** usando a opcao "desativar" (isVisible: false). O front desabilita o botao Remover para as colunas em **CAIXA_COLUNAS_PADRAO_IDS** (dia, dinheiroDeposito, pagamentoPdv, pagamentoEscritorio, pix, credito, debito, voucher, troca, devolucaoDinheiro, desconto, ifood, total). Texto exibido: "Padrao do sistema; use desativar para ocultar."
- **Criar nova coluna com SOMA/SUBTRAI/NEUTRO:** Ao adicionar uma **nova coluna** no Caixa (dialog "Nova coluna"), o usuario deve escolher como ela entra no total do dia: **SOMA** (somarNoTotal: true), **SUBTRAI** (subtrairNoTotal: true) ou **NEUTRO** (ambos false). O front envia e persiste **somarNoTotal** e **subtrairNoTotal** na configuracao da coluna.
- **Backend:** Se a configuracao de colunas do Caixa for persistida, (1) nao permitir exclusao de colunas cujo id esteja na lista padrao; (2) aceitar **somarNoTotal** e **subtrairNoTotal** em colunas customizadas e usar no calculo do total.

---

## 14. Controle Dinheiro – remocao (consolidado no Caixa)

- **Contexto:** O fluxo de "Controle Dinheiro" (data, dia, deposito, sobra, pag. PDV, total do dia) passou a ser tratado na tela **Caixa**. A pagina "Controle Dinheiro" era somente leitura (reflexo do caixa).
- **Frontend:** Removidos o item de menu "Controle Dinheiro" no Financeiro, a rota `/financeiro/controle-dinheiro` e a permissao `financeiro-controle-dinheiro`. A pagina `ControleDinheiroPage` e o arquivo permanecem no codigo sem rota/menu (podem ser apagados depois se desejado).
- **Backend:** O front nao chama mais o endpoint **GET financeiro/controle-dinheiro**. O backend pode **descontinuar ou remover** esse endpoint quando conveniente; usuarios antigos com permissao "Financeiro - Controle Dinheiro" deixam de ter um destino no front (a funcionalidade foi consolidada no Caixa).

---

## 15. Controle Deposito – formulario e campos (feedback cliente 2026-02-21)

### 15.1 Lancamento manual; remocao de Sobra e Total

- **Contexto:** O fluxo de Caixa passou a ser a referencia. Em "Controle Deposito", o valor de **Dinheiro** nao e mais trazido automaticamente do Caixa; o usuario **lança manualmente** quanto foi depositado no modal "Novo Deposito".
- **Campos removidos do formulario e da tabela:** **Sobra (R$)** e **Total (R$)**. O front nao envia mais `sobra` nem `total` no POST/PATCH de `financeiro/controle-deposito`. A tabela e o export exibem apenas: Data, Dia, Dinheiro, Responsavel.
- **Backend:** (1) POST/PATCH de `financeiro/controle-deposito` devem aceitar o novo campo **`responsavelDeposito`** (string, obrigatorio). (2) Podem deixar de exigir/retornar `sobra` e `total`, ou mante-los opcionais/zerados por compatibilidade. (3) GET deve retornar **`responsavelDeposito`** quando existir.

### 15.2 Campo Dia (dia da semana)

- **Correcao:** O dia da semana era exibido errado (ex.: data 18/02/2026 = quarta-feira aparecia como "Ter"). O front passou a calcular o dia em **data local** (evitando UTC) e a exibir por **extenso** (ex.: "Quarta-feira" em vez de "Qua").
- **Comportamento:** O campo "Dia" e preenchido automaticamente a partir da "Data" (somente leitura). O front envia `dia` no body no formato por extenso (ex.: "Quarta-feira"). **Backend:** Aceitar e persistir `dia` como string nesse formato; opcionalmente, pode passar a ignorar ou a recalcular no servidor a partir de `data`.

### 15.3 Responsavel pelo Deposito e validacao

- **Novo campo:** No modal "Novo Deposito" foi adicionado o campo **Responsavel pelo Deposito** (nome de quem foi depositar o dinheiro). Obrigatorio no front.
- **Validacao:** Todos os campos do modal (Data, Dia, Dinheiro, Responsavel pelo Deposito) sao obrigatorios no front antes do envio.

---

## 16. Pago em Dinheiro – campos obrigatorios e maiusculas (feedback cliente 2026-02-21)

- **Campos obrigatorios:** No formulario (Novo / Editar Pago em Dinheiro), os campos **Data**, **Descricao / Fornecedor** e **Valor (R$)** sao todos obrigatorios no front. O front nao envia o formulario sem preencher e exibe toast de erro se a descricao estiver vazia apos trim.
- **Descricao em maiusculas:** O campo "Descricao / Fornecedor" segue o **padrao maiusculo**: o front converte o texto para maiusculas ao digitar e envia `descricaoFornecedor` sempre em maiusculas no POST/PATCH. Nenhuma alteracao de contrato; o backend continua recebendo e retornando o mesmo campo; pode opcionalmente persistir/retornar em maiusculas para consistencia.

---

## 17. Fornecedores – campos opcionais e layout (feedback cliente 2026-02-21)

- **Campos nao obrigatorios:** No cadastro de Fornecedores (CNPJ ou CPF), os campos **E-mail Principal**, **E-mail Financeiro**, **Site** e **Instagram** nao sao mais obrigatorios. O front nao valida nem exige preenchimento; os labels passaram a indicar "(opcional)" onde aplicavel.
- **Site e Instagram removidos do formulario:** Os campos **Site** e **Instagram** foram **removidos da tela** de cadastro. O front continua enviando `contatoEmpresa` no POST/PATCH com `site` e `instagram` (vazios em novo cadastro; em edicao, mantem os valores ja existentes se o backend retornar). **Backend:** Pode manter `site` e `instagram` opcionais na API; nao e necessario remover os campos do contrato.
- **Layout do modal:** O modal de cadastro/edicao de Fornecedor foi ampliado (`max-w-5xl`) para que os e-mails apareçam por completo quando preenchidos.

---

## 18. Fornecedores – edicao preenchendo dados e status Ativo/Inativo (feedback cliente 2026-02-21)

### 18.1 Bug: dados nao aparecem ao editar

- **Problema:** Ao abrir um fornecedor para edicao, os dados preenchidos (endereco, contato empresa) nao apareciam no formulario.
- **Causa provavel:** A lista (GET fornecedores) pode retornar objetos aninhados incompletos ou com campos null/omitidos; o formulario esperava estrutura completa.
- **Frontend:** O formulario passou a **normalizar** os dados ao carregar: `endereco` e `contatoEmpresa` sao mesclados com valores padrao (strings vazias, tipoLogradouro "Rua", etc.), garantindo que todos os campos existam. Assim, mesmo que a API retorne apenas parte dos dados, os inputs sao preenchidos corretamente.
- **Backend (recomendado):** Garantir que o **GET fornecedores** (lista) retorne, para cada item, `endereco` e `contatoEmpresa` completos (todos os campos presentes, mesmo que vazios), para consistencia. O GET por ID (se existir) tambem deve retornar a estrutura completa.

### 18.2 Campo Ativo/Inativo no cadastro

- **Requisito:** No cadastro (novo e edicao) deve haver campo **Status** com opcoes **Ativo** e **Inativo**. Novo fornecedor e criado como Ativo por padrao.
- **Frontend:** Incluido campo Status (radio Ativo/Inativo) no formulario. O DTO de criacao e atualizacao passa a enviar **`isAtivo`** (boolean). Na criacao o front envia `isAtivo: true` por padrao.
- **Backend:** Aceitar **`isAtivo`** opcional no POST (criacao) e no PATCH (atualizacao). Se omitido na criacao, considerar `true`. Persistir e retornar `isAtivo` no GET.

### 18.3 Lista principal apenas ativos; aba Inativos

- **Comportamento:** A **lista principal** exibe somente fornecedores **ativos**. Foi adicionada alternancia **Ativos** | **Inativos** (abas) na tela: em "Ativos" aparecem apenas `isAtivo !== false`; em "Inativos" apenas `isAtivo === false`. Ao inativar um fornecedor (editar e marcar Inativo), ele some da lista principal e passa a aparecer na aba Inativos.
- **Backend:** Nenhuma mudanca obrigatoria. O front continua usando GET fornecedores e filtra no cliente. Opcionalmente, o backend pode oferecer query params (ex.: `?isAtivo=true`) para filtrar e reduzir payload.

---

## 19. Lembretes – data ao salvar e notificacao (feedback cliente 2026-02-21)

### 19.1 Bug da data salvando com dia anterior

- **Problema:** Ao criar ou editar lembrete, a data escolhida era salva/exibida como o **dia anterior** (ex.: escolhe 18/02, aparece 17/02). Causa tipica: interpretar "YYYY-MM-DD" como meia-noite UTC, que em fusos como Brasil (UTC-3) vira o dia anterior.
- **Frontend:** (1) **Envio:** O front passou a enviar a data no formato **ISO com meio-dia UTC** (ex.: `2026-02-18T12:00:00.000Z`) em POST/PATCH, para o dia nao “deslizar” ao persistir. (2) **Exibicao:** A funcao de formatacao trata string no formato **YYYY-MM-DD** como **data local** (parse com `new Date(ano, mes-1, dia)`), evitando deslocamento no fuso. (3) **Edicao:** Ao abrir o lembrete para editar, o valor do campo data e normalizado para os primeiros 10 caracteres (YYYY-MM-DD) para o input type="date".
- **Backend:** (1) Se o backend receber **data em ISO** (`...T12:00:00.000Z`), deve persistir a **data civil** (ano-mes-dia) sem depender de meia-noite UTC. (2) Se receber apenas **YYYY-MM-DD**, deve tratar como data-only (nao converter para UTC 00:00:00 ao persistir) para evitar dia anterior. (3) Ao retornar no GET, preferir **YYYY-MM-DD** ou ISO com horario que preserve o dia no fuso do usuario.

### 19.2 Opcao de marcar como cancelado

- **Requisito:** O usuario nao tinha como marcar um lembrete como **cancelado**; existia apenas a aba/filtro CANCELADO.
- **Frontend:** Incluido botao **"Marcar como cancelado"** (icone XCircle) em cada lembrete (pendente ou concluido), que chama PATCH com **`status: 'cancelado'`**. Para lembretes ja cancelados, exibido botao **"Reabrir"** (icone RotateCcw) que envia **`status: 'pendente'`**.
- **Backend:** Garantir que o **PATCH lembretes/:id** aceite **`status`** com valores `pendente`, `concluido` e `cancelado`, e persista o novo status.

### 19.3 Notificacao / sinalizacao

- **Feedback do cliente:** "Em Lembrete fiz o teste mais nao esta sinalizando para avisar..."
- **Implicacao:** O sistema de **aviso/notificacao** dos lembretes (push, e-mail, notificacao no browser ou outro canal) nao esta funcionando ou nao foi implementado.
- **Backend:** Implementar ou revisar o fluxo de notificacao (ex.: job/cron que verifica lembretes pendentes por data/hora e envia notificacao; integracao com push ou e-mail). O front nao envia notificacoes; depende do backend ou de um servico externo configurado.
