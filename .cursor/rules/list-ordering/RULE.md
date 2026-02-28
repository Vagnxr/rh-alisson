---
description: "Ordenacao de listas: manter ordem alfabetica"
alwaysApply: true
---

# Ordenacao de listas

## Regra

- Listas exibidas ao usuario (cards, opcoes, itens de menu, tabelas) devem ser ordenadas **alfabeticamente** por nome/titulo, salvo quando houver criterio explicito de ordenacao (ex.: data, prioridade).
- Usar `localeCompare` para ordenacao alfabetica em portugues quando o texto for visivel ao usuario (ex.: `items.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))`).

## Excecoes

- Ordem definida pelo produto (ex.: fluxo de steps).
- Ordem por data ou numero quando for o criterio principal da tela.
