# Dashboard

## Visao Geral
Tela inicial apos login, apresentando resumo financeiro e acesso rapido aos modulos.

## Componentes

### Header
- Logo da empresa
- Seletor de loja (quando multi-loja)
- Menu de usuario
- Notificacoes

### Cards de Resumo
- Saldo atual
- Receitas do periodo
- Despesas do periodo
- Alertas (vencimentos, etc.)

### Graficos
- Evolucao do fluxo de caixa
- Distribuicao de despesas
- Comparativo entre periodos

### Acesso Rapido
- Links para modulos principais
- Acoes frequentes
- Ultimas movimentacoes

## Estados

### Loading
- Skeletons nos cards
- Indicador de carregamento em graficos

### Vazio
- Mensagem de boas-vindas
- Orientacao para primeiros passos

### Erro
- Mensagem clara do problema
- Opcao de retry

## Permissoes
- Dados visiveis conforme permissao do usuario
- Modulos inacessiveis ficam ocultos ou desabilitados

## Mock de Dados
```text
src/mocks/dashboard.mock.json
```
