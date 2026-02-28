# Backlog da reunião – API vs Frontend

Documento que separa o que deve ser feito na **API** e no **Frontend** com base nas anotações da reunião.

---

## API (backend)

- [ ] **Despesa customizada – remoção completa**  
  Permitir remover despesa customizada: remover todos os dados e todos os acessos dos usuários (deixar limpo no banco). Endpoint/regra de negócio que faça a limpeza em cascata.

- [ ] **Endpoint próprio para acessos (sidebar)**  
  Criar endpoint dedicado para obter os acessos do usuário (menu/sidebar). Ao criar despesa customizada a sidebar deve atualizar sem precisar logar de novo; o front deve usar esse endpoint em vez do retorno do login.

- [ ] **Agenda – sincronização e regra de exclusão**  
  - Garantir que a agenda fique sempre sincronizada quando dados de despesa forem removidos.  
  - Regra: **proibir** excluir item de qualquer página de DESPESAS se esse item está na agenda e já foi **PAGO** / comunicado. Permitir excluir apenas se ainda não foi pago. A agenda é a fonte da verdade para “pago ou não”.

- [ ] **Socios – validação de 100%**  
  O erro de “100% dos socios” só deve ocorrer quando **exceder** 100%. Se a soma das porcentagens for menor ou igual a 100%, permitir.

- [ ] **Recorrência (despesas) – comunicar agenda**  
  Garantir que “comunicar agenda” funcione para todas as periodicidades (validar todas) quando o usuário salva recorrência.

- [ ] **Regra global: não permitir apagar se comunicado e pago**  
  Em todos os pontos que “comunicam agenda”: validar no backend e **não permitir** apagar o registro se ele foi comunicado na agenda e já foi pago.

- [ ] **Ativo imobilizado – boleto/parcelas e agenda**  
  Se for boleto: suportar parcelas (vencimento, valor) e opção “comunicar agenda”. Persistir e expor via API para o front usar na tabela de parcelas.

---

## Frontend

### Despesas

- [x] **Página Despesa**
  Deixar no padrão tudo maiúsculo (labels/títulos) – aplicado em Criar página de despesa; acento em “página”.

- [ ] **Config de colunas – despesa fixa**  
  Fazer a config de colunas da despesa fixa funcionar.

- [ ] **Config – categoria e observação**  
  Remover campos “categoria” e “observação” das configs de colunas (não existem nas colunas e não são necessários nas configs).

- [ ] **Campos obrigatórios = colunas obrigatórias**  
  Todos os campos obrigatórios no registro devem ser colunas obrigatórias de visualização na tabela (configs).

- [ ] **Recorrente e “comunicar agenda” só em despesa funcionário**  
  Nas configs de colunas, apenas “despesa funcionário” deve ter “recorrente” e “comunicar agenda” (manter como está).

- [ ] **Despesa – bloquear exclusão se pago na agenda**  
  Se o item foi comunicado na agenda e está pago, desabilitar exclusão e mostrar mensagem clara (a regra de negócio fica na API; o front deve refletir isso).

### Recorrência (despesas)

- [ ] **Periodicidade**  
  Deixar só periodicidades de bimestral em diante (remover as que não fazem sentido).

- [ ] **Tabela de lançamento**  
  Ao selecionar periodicidade, mostrar tabela com colunas: data, valor, descrição, permitindo editar para salvar os dados do lançamento da recorrência.

- [ ] **Remover campo “data fim (opcional)”**.

- [ ] **Scroll do modal**  
  Corrigir scroll do modal de recorrência.

- [ ] **Comunicar agenda**  
  Garantir que “comunicar agenda” envie para a agenda (validar todas as periodicidades no fluxo do front; a API deve estar correta conforme item da API).

### Agenda

- [x] **Número do dia no card**
  Colocar o número do dia no canto superior esquerdo do card, não no centro.

- [x] **Popup do filtro**
  Ajustar layout (texto muito apertado/misturando).

- [x] **Total do mês**
  Remover o total do mês que fica embaixo (já existe em cima).

### Socios

- [x] **Nova movimentação – sidebar**
  Aumentar largura da sidebar; o botão “+” está travando (header com shrink-0 e botão não encolhe).

- [x] **Números da página**
  Deixar todos os números em preto.

### Geral / padrões

- [ ] **Acentuação**
  Padronizar palavras com acento em todo o sistema (onde estiver sem acento, colocar com acento). Testar emissão de PDF e Excel.

- [x] **Sidebar – cor do selecionamento**
  Deixar a cor do item selecionado na sidebar mais verde.

### Configurações

- [ ] **Tabelas por aba**  
  Nas configurações, separar as tabelas por aba; cada aba corresponde à sidebar (ex.: aba Financeiro = colunas das páginas que existem em Financeiro).

### Caixa

- [ ] **Colunas**  
  Ajustar nomes das colunas conforme relatório enviado.

- [ ] **Configurações Caixa – coluna D**  
  Remover ou corrigir coluna “D” que está aparecendo.

- [ ] **Configurações Caixa – coluna Total**  
  Coluna “total” obrigatória, sem opções de somar/subtrair; não deve influenciar outras colunas.

- [ ] **Configurações Caixa – coluna Desconto**  
  Coluna DESCONTO deve vir por padrão neutra (nem somar nem subtrair). Hoje está com “somar” ativado.

- [ ] **Modal – inputs**  
  Deixar os inputs do “modal 2” lado a lado por linha.

- [ ] **Editar linha – número com vírgula**  
  Ao editar linha, exibir números com vírgula no input (ponto só quando for decimal). Gravar corretamente na API; ajustar formatação no front.

### Controle de cartões

- [ ] **Coluna Food**  
  Remover coluna “food”.

### Controle de depósito

- [x] **Modal de depósito – maiúsculas**
  Na visualização do modal, exibir em maiúsculas (gravar na tabela já em maiúsculo).

- [x] **Editar – vírgula e ponto**
  Mesmo ajuste de formatação de número (vírgula/ponto) ao editar, igual ao Caixa.

- [x] **Botões PDF e Excel**
  Deixar cada par de botão (PDF/Excel) próximo da tabela respectiva (uma dupla por tabela).

### Pago em dinheiro

- [ ] **Campos obrigatórios**  
  Todos os campos do lançamento devem ser obrigatórios.

### Ativo imobilizado

- [ ] **Atualização da tabela de saída**  
  Ao lançar ativo imobilizado pago em dinheiro ou PIX, atualizar a tabela de saída automaticamente (sem precisar dar refresh).

- [ ] **Editar – vírgula e ponto**  
  Mesmo padrão de formatação numérica ao editar (vírgula/ponto).

- [ ] **Boleto – tabela de parcelas**  
  Se for boleto: abrir tabela (como na recorrência) com colunas vencimento e valor; campo para o usuário informar quantidade de parcelas; opção “comunicar agenda”. Não usar o termo “recorrência”; usar “parcelas”.

- [ ] **Tabela de SAÍDA**  
  Na tabela de SAÍDA **não** deve ter opções de editar e excluir; tudo é relacionado à entrada.

---

## Resumo

| Onde   | Quantidade (aprox.) |
|--------|----------------------|
| API    | 7 itens              |
| Front  | 35+ itens            |

Itens que dependem dos dois: API define regras (ex.: não apagar se pago na agenda) e front aplica (desabilitar botão, mensagem, refetch de acessos, formatação de números, etc.).
