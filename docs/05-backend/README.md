# Backend - Documentacao para Implementacao

Esta pasta e a **fonte de verdade** para o agent (ou desenvolvedor) implementar o backend NestJS + Prisma + PostgreSQL da plataforma.

## Ordem de leitura / implementacao

1. **01-contrato-frontend-backend.md**  
   Contrato por pagina: endpoints, request/response, regras. Inclui a secao **Colunas de tabela**: todo GET de listagem que alimenta tabela deve retornar o campo `columns` (array `{ id, label, order, isRequired? }`). Mapeamento endpoint -> tabelaId para buscar configuracao do usuario.

2. **02-prisma-nestjs-implementacao.md**  
   Schema Prisma completo e estrutura de modulos NestJS. Ordem sugerida de implementacao (Auth, Tenants, Lojas, Despesas, etc.). Padrao de resposta (incluindo `columns` nas listagens).

3. **03-dashboard-relatorios-balanco.md**  
   Contrato do **modulo financeiro** (Fase 2): Dashboard (resumo + transacoes recentes), Relatorios (despesas por categoria, vendas, fluxo de caixa, lucro) e Balanco Geral (balanco mensal). Implementar apos os modulos de dados estarem prontos.

4. **04-socios-movimentacoes.md**  
   Contrato detalhado do modulo **Socios e Movimentacoes**: CRUD de socios (POST/PATCH/DELETE /socios), resumo por socio (GET /socios/resumo), CRUD de movimentacoes (GET/POST/PATCH/DELETE /movimentacoes-socios). Payloads, validacoes e regras de negocio.

5. **05-financeiro-operacional.md**  
   Contrato do modulo **Financeiro Operacional**: Caixa, Controle Cartoes, Vendas, Controle Dinheiro, Controle Deposito, Venda Cartoes, Ativo Imobilizado, Entrada, Saida, Pago Dinheiro, Pedido de Venda. Modelos, endpoints, query params, tabelaIds para colunas e regras de negocio. A tela Calculadora de Margem nao requer backend.

6. **06-integracao-backend.md**
7. **07-outras-funcoes.md**  
   Contrato do modulo **Outras funcoes**: pagina **A receber** (tabelas Credito, Debito, Voucher por bandeira; bandeiras voucher configuraveis) e pagina **Venda e perda** (sete tabelas de resumo). Endpoints e config bandeiras-voucher.  
   **Guia de integracao:** ordem de leitura dos docs, o que o front envia (base URL, headers, filtro de periodo), ordem de implementacao sugerida, checklist do modulo Financeiro Operacional, tabelaIds para Configuracoes e exemplos de request. Use este doc para implementar e integrar da melhor forma.

8. **api-specification.md**  
   Padroes gerais: formato de resposta (success/data/error), autenticacao JWT, multi-tenancy, listagens com `columns`.

9. **dtos-e-tipos.md**  
   DTOs e tipos (incluindo `TableColumnConfigFromApi` e `TabelaConfig`/`ColunaConfig` para configuracoes).

10. **endpoints.md**  
   Resumo de endpoints por modulo; detalhes no contrato (01).

11. **modelo-de-dados.md**  
   Visao conceitual; schema de implementacao no 02-prisma.

12. **estrategia.md**  
   Contexto da fase atual (backend a implementar) e stack definida.

## Escopo inicial (implementar agora)

- Auth (login, register, refresh, logout)
- Tenants (available para Super Admin)
- Lojas, Despesas, Fornecedores, Socios, Movimentacoes-socios, Parcelamentos, Receitas, Investimentos
- Configuracoes (tabelas/colunas por usuario)
- Lembretes
- Admin: tenants e users (Super Admin)

## Fase 2 - Modulo financeiro (Dashboard, Relatorios, Balanco)

- **Dashboard:** resumo (receita, despesas, saldo, investimentos com variacao %) e transacoes recentes.
- **Balanco geral:** balanco mensal (despesas, vendas, outros valores, mercadoria, ativo imobilizado, investimento, renda extra), com suporte multi-loja.
- **Relatorios:** despesas por categoria, vendas por periodo, fluxo de caixa, lucro.

Contrato completo em **03-dashboard-relatorios-balanco.md**. O frontend segue com mock nessas telas ate o backend expor os endpoints descritos nesse documento.

## Fase 3 - Financeiro Operacional

- **Telas do menu Financeiro:** Caixa, Controle Cartoes, Vendas, Controle Dinheiro, Controle Deposito, Venda Cartoes, Ativo Imobilizado, Entrada, Saida, Pago em Dinheiro, Pedido de Venda. Todas com CRUD completo no frontend; ao expor os endpoints, o front passara a consumir a API.
- **Calculadora de Margem:** nao requer backend (calculo no frontend).

Contrato completo em **05-financeiro-operacional.md**. Guia de implementacao e integracao em **06-integracao-backend.md**.

## Outras funcoes (A receber, Venda e perda)

- **A receber:** Tres tabelas (Credito, Debito, Voucher) com valor "a receber" por bandeira. Bandeiras do voucher sao dinamicas (configuraveis pelo usuario).
- **Venda e perda:** Sete tabelas de resumo (Credito, Debito/PIX, Alim/ref, Food, Total cartoes, POS aluguel, Perda total).

Contrato em **07-outras-funcoes.md**. Rotas do front: `/financeiro/outras-funcoes/a-receber`, `/financeiro/outras-funcoes/venda-perda`.

## Convencoes

- Resposta sucesso: `{ success: true, data: ... }` ou com `meta` (total, page, perPage, totalPages).
- Listagens para tabelas: incluir **`columns`** na resposta.
- Erro: `{ success: false, error: { code, message, details? } }`.
- Header: `Authorization: Bearer <accessToken>`; Super Admin pode usar `X-Tenant-Id`.

---

**Revalidado:** 2026-02-03. Frontend ja adaptado para consumir `columns`; documentacao alinhada para o backend ser implementado.
