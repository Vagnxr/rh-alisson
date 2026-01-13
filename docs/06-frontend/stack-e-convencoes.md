# Frontend - Stack e Convencoes

## Stack Tecnologica

### Core
- **React 18**: UI declarativa e modular
- **Vite**: Build rapido e moderno
- **TypeScript**: Tipagem forte e previsibilidade

### Estilizacao
- **Tailwind CSS**: Estilizacao utilitaria
- **shadcn/ui**: Base de componentes com padrao solido

### Estado e Dados
- **Zustand**: Estado global simples
- **TanStack Query**: Gerenciamento de cache/fetch (futuro)
- **TanStack Table**: Tabelas dinamicas

### Formularios
- **React Hook Form**: Gerenciamento de forms
- **Zod**: Validacao de schemas

## Restricoes
- Evitar novas libs sem justificativa real
- Tailwind-first (evitar CSS adicional)
- Preferir componentes shadcn/ui

## Convencoes de Codigo

### Nomenclatura de Arquivos
- **Componentes em `src/components/ui/`**: kebab-case
  - Exemplo: `data-table.tsx`, `date-picker.tsx`
  - Segue padrao shadcn/ui
- **Componentes de dominio**: PascalCase
  - Exemplo: `FinancePage.tsx`, `DespesaForm.tsx`
- **Hooks**: prefixo `use`
  - Exemplo: `useFinanceData.ts`
- **Services**: sufixo `.service.ts`
  - Exemplo: `finance.service.ts`
- **Types**: sufixo `.types.ts` ou `types.ts`
  - Exemplo: `finance.types.ts`

### Componentes
```typescript
// Props tipadas com interface
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

// Exports nomeados (evitar default export)
export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
```

### Hooks
```typescript
// Prefixo use, retornar objeto nomeado
export function useFinanceData() {
  const data = useFinanceStore((s) => s.data);
  const isLoading = useFinanceStore((s) => s.isLoading);
  
  return { data, isLoading };
}
```

### TypeScript
- Manter `strict` ligado
- Evitar `any`; usar `unknown` quando necessario
- Interfaces para objetos; types para unions
- Tipar explicitamente dados externos

## Organizacao de Componentes

### Atomic Design
```text
src/components/
├── atoms/        # Inputs, buttons, badges
├── molecules/    # Campos compostos, filtros
├── organisms/    # Tabelas, formularios completos
├── templates/    # Layouts de paginas
└── ui/           # Componentes shadcn/ui
```

### Regras
- Componentes pequenos e focados (< 200 linhas ideal)
- Preferir composicao a heranca
- UI pura, sem logica de negocio
- Logica em hooks ou services
