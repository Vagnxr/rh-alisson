# Estrutura do projeto

Este documento define a **estrutura alvo** do projeto para a Plataforma Financeira.

## Estrutura alvo (recomendada)

```text
plataforma-financeira/
├── src/
│   ├── components/
│   │   ├── atoms/               # Inputs, buttons, badges
│   │   ├── molecules/           # Campos compostos, filtros
│   │   ├── organisms/           # Tabelas, formularios completos
│   │   ├── templates/           # Layout de paginas
│   │   └── ui/                  # Componentes shadcn/ui
│   ├── pages/                   # Paginas da aplicacao
│   ├── modules/                 # Modulos de negocio (financeiro, despesas, etc.)
│   ├── services/                # Comunicacao com API
│   ├── hooks/                   # Hooks customizados
│   ├── stores/                  # Zustand stores
│   ├── mocks/                   # Dados mockados (fase inicial)
│   ├── utils/                   # Funcoes utilitarias
│   ├── lib/                     # Configuracoes de libs (cn, etc.)
│   └── types/                   # Contratos TypeScript
├── public/
│   └── assets/                  # Assets estaticos
├── docs/                        # Documentacao (fonte da verdade)
└── tests/                       # Testes
```

## Por que esta estrutura
- **Atomic Design**: organizacao clara de componentes por complexidade.
- **Modulos**: separacao logica por dominio de negocio.
- **Mocks**: permite desenvolvimento frontend independente do backend.
- **Types**: contratos claros para API e dados.

## Padrao de arquivos
- Componentes em `src/components/ui/`: kebab-case (ex.: `data-table.tsx`)
- Componentes de dominio: PascalCase (ex.: `DashboardPage.tsx`)
- Hooks: prefixo `use` (ex.: `useFinanceData.ts`)
- Services: sufixo `.service.ts` (ex.: `finance.service.ts`)
- Types: sufixo `.types.ts` ou arquivo `types.ts` na pasta

## Nota sobre o estado atual do repo
O repositorio hoje ainda pode ter variacoes da estrutura de um projeto anterior (jogo). A decisao acima e o **target**; migracoes devem ser feitas de forma incremental.
