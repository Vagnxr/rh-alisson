# Fontes e Decisoes

## Glossario

### Termos de Negocio
- **Tenant**: Empresa/organizacao que usa o sistema
- **Loja**: Unidade de negocio dentro de um tenant
- **Multi-tenant**: Isolamento de dados por empresa
- **Multi-loja**: Suporte a varias lojas por empresa

### Termos Tecnicos
- **Mock**: Dados simulados para desenvolvimento
- **CRUD**: Create, Read, Update, Delete
- **API**: Interface de programacao

## Decisoes Arquiteturais

### Frontend Mockado Primeiro
**Decisao**: Desenvolver frontend 100% mockado antes do backend.
**Motivo**: Validar UX e definir contratos antes de investir em backend.
**Implicacao**: Mocks em `src/mocks/`, services abstraidos.

### Atomic Design
**Decisao**: Usar Atomic Design para componentes.
**Motivo**: Organizacao clara e reusabilidade.
**Implicacao**: Pastas atoms/molecules/organisms/templates.

### TanStack Table
**Decisao**: Usar TanStack Table para tabelas dinamicas.
**Motivo**: Suporte a todas as funcionalidades necessarias (sort, filter, pagination, virtualization).
**Implicacao**: Configuracao via metadados.

### Zustand
**Decisao**: Usar Zustand para estado global.
**Motivo**: Simples, performatico, sem boilerplate.
**Implicacao**: Stores em `src/stores/`.

### shadcn/ui
**Decisao**: Usar shadcn/ui como base de componentes.
**Motivo**: Componentes solidos, customizaveis, Tailwind-based.
**Implicacao**: Componentes em `src/components/ui/`.

## Referencias

### Stack
- [React](https://react.dev)
- [Vite](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [TanStack Table](https://tanstack.com/table)
- [Zustand](https://zustand-demo.pmnd.rs)
- [React Hook Form](https://react-hook-form.com)
- [Zod](https://zod.dev)
