---
trigger: always_on
description: Always apply: frontend (React/TS/Tailwind/Zustand)
---

## Stack
- Antes de afirmar versoes, conferir `package.json`.
- Stack esperada: React 18, Vite 5, TypeScript 5, Tailwind 4, Zustand.
- Bibliotecas de apoio: TanStack Table, React Hook Form, Zod, shadcn/ui.

## Convencoes
- Components: PascalCase, exports nomeados.
- Components em `src/components/ui/`: kebab-case (padrao shadcn/ui).
- Props: `interface`.
- Hooks: prefixo `use`, retornar objeto nomeado.

## Tailwind
- Tailwind-first.
- Evitar CSS adicional fora do padrao do projeto.

## Estado
- Zustand para estado global.
- Preferir seletores granulares; evitar desestruturacao em loops/callbacks.

## Dependencias
- Nao adicionar libs novas sem pedido explicito.
- Preferir componentes shadcn/ui.

## Organizacao (Atomic Design)
- atoms/: inputs, buttons, badges
- molecules/: campos compostos, filtros
- organisms/: tabelas, formularios completos
- templates/: layouts de paginas
- ui/: componentes shadcn/ui
