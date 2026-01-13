---
trigger: always_on
description: Always apply: workflow de documentação (docs + steering) e auditoria de recência
---

## Princípio
- `docs` é a documentação completa.
- `steering/` é um conjunto curto e normativo que referencia `docs`.

## Ao alterar docs
- Se mudar `docs` ou `steering/`, regenere o apêndice de recência:

```bash
python .agent/scripts/update_fontes_recencia.py
```

- Se houver inconsistência entre `steering/` e `docs`, corrija para ficar consistente (priorize `docs`).

## Checagem rápida (steering)
- Sempre que houver mudanças que afetem regras de negócio, fluxo, arquitetura, stack, eventos ou estrutura, rode:

```bash
python .agent/scripts/check_steering.py
```
