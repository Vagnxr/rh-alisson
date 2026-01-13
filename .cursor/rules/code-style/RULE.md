---
description: "Always apply: padroes de Code Style"
alwaysApply: true
---

# Code Style (Plataforma Financeira)

Este documento consolida o padrao de codigo do projeto.

## Fonte da verdade
- Documentacao de produto/arquitetura: `docs/`
- Estrutura alvo do projeto: `docs/00-start-here/estrutura-do-projeto.md`
- Stack atual: conferir `package.json`

## Regras gerais
- Nao usar emojis.
- Evitar over-engineering: preferir solucoes simples e testaveis.
- Evitar adicionar dependencias novas sem necessidade real.

## React
- Componentes sempre funcionais.
- Exports nomeados (evitar default export).
- Props tipadas com `interface`.
- Componentes pequenos e focados (ideal: < 200 linhas).
- Preferir composicao a heranca.

Exemplo:

```tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

## TypeScript
- Manter `strict` ligado.
- Evitar `any`; usar `unknown` quando necessario.
- Interfaces para objetos; types para unions/primitivos.
- Tipar explicitamente boundaries (ex.: payloads de API, dados externos).

## Hooks
- Prefixo `use` obrigatorio.
- Retornar objeto nomeado (evitar array).
- Se o hook ficar complexo, documentar com JSDoc.

```tsx
export function useFinanceData() {
  const data = useFinanceStore(s => s.data);
  const isLoading = useFinanceStore(s => s.isLoading);

  return { data, isLoading };
}
```

## Zustand (stores)
- Preferir seletores granulares (`useStore(s => s.x)`) para evitar re-render.
- Evitar desestruturar store dentro de loops/callbacks.
- Estado deve ser imutavel e serializavel.

## Tailwind
- Tailwind-first.
- Evitar CSS extra fora do padrao do projeto.
- Agrupar classes logicamente (layout, spacing, colors, states).

## Arquitetura (referencia rapida)
- Camadas: pages (UI) -> hooks (bridge) -> stores (state) -> services (API) -> utils.
- Padrao: Atomic Design para componentes.
- Dados mockados em: `src/mocks/`.
