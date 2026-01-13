# Componentes

## Base: shadcn/ui

Todos os componentes base seguem o padrao shadcn/ui:
- Localização: `src/components/ui/`
- Nomenclatura: kebab-case
- Customizacoes mantendo design system

## Componentes Principais

### Tabela Dinamica (DataTable)
Componente central do sistema, baseado em TanStack Table.

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  pagination?: boolean;
  filtering?: boolean;
  sorting?: boolean;
  onRowClick?: (row: T) => void;
}
```

Funcionalidades:
- Ordenacao por coluna
- Filtragem global e por coluna
- Paginacao
- Selecao de linhas
- Acoes em lote
- Virtualizacao (para grandes volumes)

### Formularios

#### Form Container
```typescript
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField name="campo" control={form.control} render={...} />
  </form>
</Form>
```

#### Campos Especiais
- **CurrencyInput**: valores monetarios com mascara
- **DatePicker**: seletor de data
- **Combobox**: select com busca
- **FileUpload**: upload de arquivos

### Cards e Containers

#### StatCard
Para metricas no dashboard:
```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: ReactNode;
}
```

#### PageContainer
Layout padrao de pagina:
```typescript
<PageContainer title="Financeiro" actions={<Button>Novo</Button>}>
  {children}
</PageContainer>
```

### Feedback

#### LoadingState
```typescript
<LoadingState message="Carregando dados..." />
```

#### EmptyState
```typescript
<EmptyState
  title="Nenhum registro"
  description="Adicione seu primeiro registro."
  action={<Button>Adicionar</Button>}
/>
```

#### ErrorState
```typescript
<ErrorState
  message="Erro ao carregar dados"
  onRetry={() => fetchData()}
/>
```

## Organizacao

```text
src/components/
├── atoms/
│   ├── Badge.tsx
│   ├── Button.tsx
│   └── Input.tsx
├── molecules/
│   ├── CurrencyInput.tsx
│   ├── DateRangePicker.tsx
│   └── SearchField.tsx
├── organisms/
│   ├── DataTable.tsx
│   ├── FinanceForm.tsx
│   └── DespesaForm.tsx
├── templates/
│   ├── PageContainer.tsx
│   └── AuthLayout.tsx
└── ui/
    ├── button.tsx
    ├── input.tsx
    └── ...shadcn components
```

## Criacao de Novos Componentes

1. Verificar se existe no shadcn/ui
2. Se nao existir, criar seguindo o padrao
3. Documentar props e uso
4. Adicionar ao Storybook (futuro)
