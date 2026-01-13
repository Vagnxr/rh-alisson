# Workflow de desenvolvimento

## Branch/commits
- Trabalhe em branches curtas por feature.
- Commits pequenos, com mensagem focada no porque.

## Guardrails
- Componentes: UI pura.
- Hooks: ponte entre UI e actions/selectors.
- Utils/lib: funcoes puras e reutilizaveis.
- Services: comunicacao com API (futura).
- Evitar aumentar codigo sem motivo.

## Qualidade
- Lint sempre verde.
- Testes unitarios para logica de negocios.
- Testes de integracao para fluxos criticos.

## Definicao de pronto
- UX: estados vazios, loading e erros definidos.
- Tabelas: colunas configuraveis e calculos corretos.
- Formularios: validacao completa e feedback visual.
- Permissoes: renderizacao condicional implementada.
