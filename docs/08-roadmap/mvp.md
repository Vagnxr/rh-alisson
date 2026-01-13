# Roadmap - MVP

## Objetivo do MVP
Entregar um frontend funcional que permita:
1. Validar UX com usuarios reais
2. Confirmar regras de calculo
3. Definir contratos de API

## Fase 1: Estrutura Base

### Entregaveis
- [ ] Setup do projeto (Vite + React + TS + Tailwind)
- [ ] Componentes base (shadcn/ui)
- [ ] Layout principal (sidebar, header)
- [ ] Roteamento basico
- [ ] Sistema de autenticacao (mock)

### Criterio de Conclusao
- Aplicacao rodando com navegacao funcional
- Login mockado funcionando
- Layout responsivo

## Fase 2: Modulo Financeiro

### Entregaveis
- [ ] Pagina de listagem com tabela dinamica
- [ ] CRUD completo (criar, editar, excluir)
- [ ] Filtros e ordenacao
- [ ] Calculos conforme planilha
- [ ] Multi-loja (filtro e totais)

### Criterio de Conclusao
- Todas as operacoes CRUD funcionando
- Calculos identicos a planilha
- Filtro por loja operacional

## Fase 3: Demais Modulos

### Entregaveis
- [ ] Modulo Despesas
- [ ] Modulo Fluxo de Caixa
- [ ] Modulo Consolidacao
- [ ] Dashboard com resumos

### Criterio de Conclusao
- Todos os modulos com CRUD funcional
- Calculos validados
- Consolidacao multi-loja operacional

## Fase 4: Polimento

### Entregaveis
- [ ] Relatorios basicos
- [ ] Exportacao (Excel/PDF)
- [ ] Testes das regras de calculo
- [ ] Documentacao de contratos de API

### Criterio de Conclusao
- Relatorios gerando corretamente
- Exportacao funcional
- Contratos documentados

## Cronograma Estimado

| Fase | Duracao Estimada |
|------|------------------|
| Fase 1 | 1-2 semanas |
| Fase 2 | 2-3 semanas |
| Fase 3 | 3-4 semanas |
| Fase 4 | 1-2 semanas |
| **Total** | **7-11 semanas** |

## Riscos e Mitigacoes

| Risco | Mitigacao |
|-------|-----------|
| Regras de calculo complexas | Documentar cada formula antes de implementar |
| Muitas colunas na planilha | Priorizar colunas essenciais primeiro |
| Escopo creep | Manter foco nas abas prioritarias |

## Proximos Passos (Pos-MVP)

1. Integracao com backend real
2. Sistema de permissoes completo
3. Offline-first
4. App mobile
