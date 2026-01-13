# Estrategia de Backend

## Fase Atual: Frontend Mockado

Neste momento, o frontend e desenvolvido **100% mockado**, utilizando:
- JSONs estaticos em `src/mocks/`
- Dados representativos da planilha real
- Simulacao completa de fluxos

### Objetivos desta Fase
1. Validar UX com usuarios
2. Validar regras de calculo
3. Definir contratos de API
4. Reduzir retrabalho no backend

### Estrutura de Mocks
```text
src/mocks/
├── financeiro.mock.json
├── despesas.mock.json
├── fluxo-caixa.mock.json
├── consolidacao.mock.json
├── dashboard.mock.json
└── usuarios.mock.json
```

## Fase Futura: Backend Real

### Opcoes de Tecnologia
A definir com base em requisitos:
- Node.js + Express/Fastify
- Supabase (Postgres + Auth + Edge Functions)
- Firebase
- Outro

### Requisitos do Backend
- API REST ou GraphQL
- Autenticacao e autorizacao
- Multi-tenant (isolamento por empresa)
- Multi-loja (dados por loja)
- Permissoes granulares

## Contratos de API

O frontend e a **fonte de verdade da UX**. Apos validacao:
- Cada tela gera um contrato esperado
- Payloads e responses sao documentados
- O backend sera implementado com base nesses contratos

Ver: [04-arquitetura/contratos-api.md](../04-arquitetura/contratos-api.md)

## Consideracoes sobre Offline (Futuro)

O sistema sera preparado para evolucao offline:
- Cache de dados
- Prevencao de perda de informacoes
- Estrategia futura com Service Workers
