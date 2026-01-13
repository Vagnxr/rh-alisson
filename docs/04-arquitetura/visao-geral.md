# Arquitetura - Visao Geral

## Camadas
- **UI (pages/components)**: Renderizacao e interacao
- **Hooks**: Ponte entre UI e estado/services
- **Stores**: Estado global (Zustand)
- **Services**: Comunicacao com API (futuro)
- **Utils/Lib**: Funcoes utilitarias puras

## Diagrama de Camadas

```text
Pages/Components (UI)
        |
      Hooks (bridge)
        |
    +---+---+
    |       |
  Stores  Services
    |       |
  State   API (mock/real)
```

## Principios

### Separacao de Responsabilidades
- Componentes sao UI pura
- Logica de negocio em hooks ou services
- Estado centralizado em stores

### Previsibilidade
- Estado imutavel
- Fluxo unidirecional de dados
- Acoes explicitas

### Testabilidade
- Logica desacoplada da UI
- Funcoes puras quando possivel
- Mocks para dependencias externas

## Fluxo de Dados

```text
User Action -> Component -> Hook -> Store/Service -> State Update -> Re-render
```

## Estrutura de Pastas

```text
src/
├── components/       # Componentes UI
├── pages/            # Paginas da aplicacao
├── modules/          # Modulos de negocio
├── hooks/            # Hooks customizados
├── stores/           # Zustand stores
├── services/         # Services de API
├── mocks/            # Dados mockados
├── utils/            # Funcoes utilitarias
├── lib/              # Configuracoes de libs
└── types/            # Tipos TypeScript
```
