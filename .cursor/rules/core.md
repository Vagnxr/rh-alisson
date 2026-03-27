---
trigger: always_on
description: Always apply: diretrizes globais e fonte da verdade
---

- Responder sempre em **Portugues (Brasil)**.
- Nao usar emojis.
- Ser direto e objetivo.

## Fonte da verdade
- Documentacao completa e normativa: `docs/`

## Mindset
- Preferir solucoes simples, testaveis e faceis de manter.
- Evitar over-engineering e dependencias novas sem necessidade real.

## Conflitos entre docs
- Prioridade: `docs` > `.cursor/rules/` > demais.
- Para rastrear precedencia/recencia, use: `docs/99-apendice/fontes-e-recencia.md`.

## Sobre o Projeto
Este e o frontend de uma **Plataforma Financeira & Operacional**:
- Interface orientada a tabelas (similar ao Excel)
- Multi-tenant (isolamento por empresa)
- Multi-loja (consolidacao e visao individual)
- Frontend mockado inicialmente
