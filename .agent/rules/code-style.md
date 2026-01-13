---
trigger: always_on
description: Always apply: padroes de Code Style
---

# Code Style (Plataforma Financeira)

## Fonte da verdade
- Documentacao de produto/arquitetura: `docs/`
- Estrutura alvo do projeto: `docs/00-start-here/estrutura-do-projeto.md`

## Regras gerais
- Nao usar emojis.
- Evitar over-engineering.
- Evitar adicionar dependencias novas sem necessidade real.

## React
- Componentes sempre funcionais.
- Exports nomeados (evitar default export).
- Props tipadas com `interface`.
- Componentes pequenos e focados.

## TypeScript
- Manter `strict` ligado.
- Evitar `any`; usar `unknown` quando necessario.
- Interfaces para objetos; types para unions.

## Hooks
- Prefixo `use` obrigatorio.
- Retornar objeto nomeado.

## Zustand
- Seletores granulares.
- Estado imutavel.

## Tailwind
- Tailwind-first.
- Evitar CSS extra.
