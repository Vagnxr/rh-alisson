---
description: "Always apply: anotacoes de aprendizado e observacoes rapidas sobre o projeto"
alwaysApply: true
---

# Registro de Observacoes (Plataforma Financeira)

Use este arquivo para registrar observacoes rapidas (armadilhas, decisoes pequenas, heuristicas) durante o desenvolvimento.

## Como usar
- Adicionar entradas novas no topo.
- Se a observacao virar regra permanente, mover/replicar para `docs/` (documentacao) ou para as rules em `.cursor/rules`.

## Observacoes
- [Zustand] Nao desestruturar stores dentro de loops/callbacks. Preferir seletores granulares (`useStore(s => s.item)`) para evitar re-renders.
- [TanStack Table] Configurar colunas via metadados para facilitar customizacao sem alterar codigo.
- [Forms] Usar React Hook Form + Zod para validacao. Evitar validacao manual.
- [Mocks] Dados mockados devem representar fielmente os contratos esperados da API.
- [Multi-loja] Sempre considerar filtro por loja e totais consolidados em todas as listagens.
