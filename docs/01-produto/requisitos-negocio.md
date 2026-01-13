# Requisitos de Negocio

## Objetivo Principal
Transportar todas as abas da planilha principal para paginas do sistema, respeitando:
- Fluxo de preenchimento semelhante ao Excel
- Regras de calculo ja existentes
- Visualizacao clara e consolidada
- Suporte a multiplas lojas, empresas e usuarios

## Criterios de Conclusao
O projeto e considerado concluido quando:
- Todas as abas da planilha estiverem representadas no sistema
- Os calculos estiverem identicos
- UX validada pelo cliente
- Contratos de API definidos

## Requisitos Funcionais

### Multi-tenant
- Isolamento total por empresa (tenant)
- Usuarios vinculados a empresas especificas
- Dados nunca vazam entre tenants

### Multi-loja
- Varias lojas por empresa
- Visao consolidada (todas as lojas)
- Visao individual por loja
- Total geral e total por loja sempre disponiveis

### Permissoes
- Controle por modulo
- Controle por acao (visualizar, editar, excluir)
- Renderizacao condicional de telas e acoes
- Nenhuma tela assume acesso irrestrito

### Tabelas Dinamicas
- Colunas variaveis (ativar/desativar)
- Colunas que entram ou nao no calculo total
- Destaque de linhas por status
- Consolidacao por loja e geral
- Comportamento semelhante ao Excel
- Configuravel via metadados, nao fixo em codigo

## Requisitos Nao-Funcionais
- Responsividade (desktop-first, mas adaptavel)
- Performance em tabelas com muitos dados
- Preparado para offline-first (evolucao futura)
