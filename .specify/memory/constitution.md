<!--
Sync Impact Report:
- Version: 2.0.0 (migrado para Plataforma Financeira)
- Ratification: 2026-01-13
- Principles established: 7 core principles
- Templates requiring updates:
  - plan-template.md - constitution check section aligns
  - spec-template.md - requirements structure aligns
  - tasks-template.md - task categorization aligns
- Follow-up: Revisar templates para contexto financeiro
-->

# Constitution - Plataforma Financeira & Operacional

## Core Principles

### I. Documentacao como Fonte da Verdade

A documentacao completa e normativa reside em `docs/`. Em caso de conflito, a prioridade e: `docs/` > `.cursor/rules/` > demais fontes.

**Rationale**: Manter uma unica fonte confiavel evita dispersao e inconsistencias que consomem tempo de desenvolvimento.

**Enforcement**:
- DEVE atualizar `docs/99-apendice/fontes-e-recencia.md` apos alteracoes em `docs/`
- Documentacao DEVE ser mantida atualizada com o codigo

### II. Simplicidade (Pragmatismo)

Preferir solucoes simples, testaveis e faceis de manter. Evitar over-engineering e novas dependencias sem necessidade real comprovada.

**Rationale**: Complexidade desnecessaria cria debito tecnico. Simplicidade permite velocidade sustentavel e manutenibilidade.

**Enforcement**:
- DEVE justificar explicitamente qualquer nova dependencia (lib/framework)
- DEVE considerar alternativas mais simples antes de abstracoes complexas
- Complexidade adicional DEVE ser documentada em "Complexity Tracking" durante planejamento

### III. Fidelidade a Planilha (Regras de Negocio)

O sistema DEVE reproduzir fielmente as regras de calculo e fluxos da planilha original. Divergencias nao sao aceitaveis.

**Rationale**: O objetivo e substituir a planilha, nao reinventa-la. Usuarios esperam comportamento identico.

**Enforcement**:
- Calculos DEVEM ter testes unitarios
- Regras de negocio DEVEM ser documentadas em `docs/02-modulos/`
- Qualquer divergencia DEVE ser aprovada pelo stakeholder

### IV. Frontend Mockado Primeiro

Desenvolvimento frontend 100% mockado antes de integrar com backend real.

**Rationale**: Validar UX e definir contratos de API antes de investir em backend reduz retrabalho.

**Enforcement**:
- Mocks DEVEM residir em `src/mocks/`
- Services DEVEM abstrair fonte de dados (mock ou API)
- Contratos DEVEM ser documentados em `docs/04-arquitetura/contratos-api.md`

### V. Multi-tenant & Multi-loja

O sistema DEVE suportar isolamento por empresa (tenant) e multiplas lojas por tenant.

**Rationale**: Requisito de negocio fundamental para o sistema.

**Enforcement**:
- Todas as queries DEVEM filtrar por tenant
- Listagens DEVEM ter filtro por loja
- Totais DEVEM mostrar consolidado e por loja

### VI. Convencoes Claras de Codigo

Componentes em `src/components/ui/` usam kebab-case (ex.: `data-table.tsx`). Componentes de dominio usam PascalCase (ex.: `FinancePage.tsx`). Hooks com prefixo `use`. Exports nomeados (evitar default export).

**Rationale**: Convencoes claras reduzem decisoes cognitivas e facilitam navegacao.

**Enforcement**:
- Componentes em `src/components/ui/` DEVEM usar kebab-case
- Componentes fora de `ui/` DEVEM usar PascalCase
- Hooks DEVEM ter prefixo `use`
- DEVE usar exports nomeados

### VII. Comunicacao em Portugues (Brasil)

Toda documentacao, mensagens e comunicacao do projeto DEVEM ser em portugues brasileiro. Codigo (variaveis, funcoes) em ingles por convencao tecnica. Sem emojis. Direto e objetivo.

**Rationale**: Consistencia linguistica facilita compreensao. Separacao (docs PT-BR, codigo EN) segue padroes da industria.

**Enforcement**:
- Documentacao DEVE ser em PT-BR
- Comentarios de codigo DEVEM ser em PT-BR
- Codigo (identificadores) em ingles
- NAO usar emojis em codigo ou documentacao

## Arquitetura e Estrutura

### Camadas da Aplicacao

```text
Pages (UI) -> Hooks (bridge) -> Stores (state) -> Services (API) -> Utils
```

### Organizacao de Componentes (Atomic Design)

```text
src/components/
├── atoms/        # inputs, buttons, badges
├── molecules/    # campos compostos, filtros
├── organisms/    # tabelas, formularios completos
├── templates/    # layouts de paginas
└── ui/           # componentes shadcn/ui
```

### Estrutura do Projeto

```text
plataforma-financeira/
├── src/
│   ├── components/       # Componentes UI
│   ├── pages/            # Paginas
│   ├── modules/          # Modulos de negocio
│   ├── hooks/            # Hooks customizados
│   ├── stores/           # Zustand stores
│   ├── services/         # Services de API
│   ├── mocks/            # Dados mockados
│   ├── utils/            # Funcoes utilitarias
│   ├── lib/              # Configuracoes de libs
│   └── types/            # Tipos TypeScript
├── docs/                 # Documentacao (fonte da verdade)
└── tests/                # Testes
```

### Rules e Ferramentas

- Rules normativas em `.cursor/rules/` (formato pasta com `RULE.md`)
- `AGENTS.md` define comunicacao e fonte da verdade

## Governanca

### Autoridade

Esta Constitution supersede todas as outras praticas e diretrizes. Em caso de conflito, os principios aqui estabelecidos tem precedencia.

### Compliance

- Todas as PRs e reviews DEVEM verificar compliance com os principios
- Violacoes DEVEM ser justificadas em "Complexity Tracking" no plano
- Constitution checks sao gates obrigatorios antes de implementacao

### Emendas

Emendas a Constitution DEVEM incluir:
1. Documentacao clara da mudanca e rationale
2. Atualizacao do numero de versao (semantic versioning)
3. Plano de migracao para codigo/docs existentes se necessario
4. Atualizacao de templates dependentes
5. Sync Impact Report no topo do arquivo

### Versioning

- **MAJOR**: mudancas incompativeis, remocao/redefinicao de principios
- **MINOR**: novos principios ou expansao material de guidance
- **PATCH**: clarificacoes, correcoes, refinamentos nao-semanticos

### Runtime Guidance

Para orientacoes operacionais durante desenvolvimento, consultar:
- `AGENTS.md` para comunicacao e fonte da verdade
- `.cursor/rules/` para rules especificas por dominio
- `docs/00-start-here/dev-workflow.md` para workflow de desenvolvimento

**Version**: 2.0.0 | **Ratified**: 2026-01-13 | **Last Amended**: 2026-01-13
