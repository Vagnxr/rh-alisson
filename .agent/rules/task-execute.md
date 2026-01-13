---
trigger: always_on
description: Always apply: executar tasks com fluxo de aprovação + revisão + rastreabilidade
---

## Objetivo
Executar tasks de forma consistente em modo Solo Dev, com proposta antes de mudanças, revisão após implementação e rastreabilidade via Spec.

## Fluxo obrigatório (para cada task)
### 1) Coleta de contexto (antes da proposta)
O agente deve coletar contexto suficiente para propor algo consistente:
- Ler `docs/` relevante (e `steering/` se for normativo)
- Ler o Spec atual em `./tasks/task-.../` (requirements/design/tasks)
- Inspecionar os arquivos reais que serão alterados
- Checar impacto (quantos arquivos, quais pastas)

### 2) Proposta e aprovação
- Apresentar proposta objetiva: o que muda, arquivos afetados, riscos e DoD.
- Solicitar aprovação explícita.
- Se negada: propor alternativa e repetir 1-2.

### 3) Implementação
Se aprovada:
- Implementar a mudança em passos pequenos.
- Manter o projeto “verde” (sem quebrar build).

### 4) Revisão
- Revisar o diff (coerência, simplicidade, nomes, imports, consistência com docs).
- Rodar verificações do projeto quando aplicável:
  - `pnpm lint`
  - `pnpm build`
- **Se** a mudança afetar regras de negócio, fluxo, arquitetura, stack, estrutura de pastas ou eventos, o agente **deve** revisar `steering/` e atualizar os arquivos normativos correspondentes (manter `steering/` consistente com `docs/`).
- Rodar validação de consistência do `steering/`:
  - `python .agent/scripts/check_steering.py`

### 5) Atualização do Spec (obrigatório)
- Em `tasks.md`, atualizar status:
  - marcar item implementado como `[~]` após implementar
  - marcar como `[x]` após revisão e checks passarem
  - usar `[-]` se for descartado

### 6) Documentação e fontes
- Atualizar docs/steering se necessário.
- Atualizar o apêndice de recência:
  - `python .agent/scripts/update_fontes_recencia.py`

### 7) Commit e push
- Commit com mensagem curta (Conventional Commits).
- Push.

### 8) Relatório breve
Ao final, apresentar um resumo curto:
- o que mudou
- arquivos/pastas principais
- comandos rodados
- status atualizado no `tasks.md`
