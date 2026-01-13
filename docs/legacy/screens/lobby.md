# Especificação do Projeto: UI da Sala de Espera (Lobby)

## 1. Visão Geral

Interface de preparação pré-jogo que simula uma "cela de contenção" ou área de embarque, permitindo gerenciamento de até 6 jogadores, chat em tempo real e configurações da sala.

## 2. Estrutura de Navegação (Rotas)

- **/lobby/:roomId**: Rota dinâmica para uma sala específica.
  - Se o jogador for expulso ou sair, redirecionar para **/** (Home).
  - Quando o Host iniciar, redirecionar todos para **/draft** ou **/match**.

## 3. Funcionalidades e Regras de Negócio

- **Slots de Jogadores**:
  - Grid de 6 posições. Slots vazios mostram estado "Searching/Empty".
  - Slots ocupados mostram Avatar e Status (Pronto/Não Pronto).
- **Status "Ready"**:
  - O jogo só pode começar quando todos os jogadores estiverem com status "READY" (Verde).
- **Chat da Sala**:
  - Área de texto para comunicação. Mensagens devem ter timestamp e nome do autor.
- **Código da Sala**:
  - Exibir código alfa-numérico copiável (ex: "X-7-Z") no topo.

## 4. Estrutura de Dados (Estado Global)

- `roomInfo`:
  - `code`: string
  - `hostId`: string
  - `status`: 'waiting' | 'starting'
- `playersList`: Array de objetos:
  - `id`: string
  - `name`: string
  - `avatar`: string
  - `isReady`: boolean
  - `isHost`: boolean
- `chatMessages`: Array de `{ author, text, timestamp }`.

## 5. Componentes de UI Sugeridos

- **`PlayerSlotCard`**: Componente com estados visuais distintos: "Vazio" (efeito estática), "Ocupado" (Avatar) e "Pronto" (Borda Verde brilhante).
- **`TerminalChat`**: Janela estilo DOS/Terminal (`bg-black`, fonte verde) para o chat.
- **`RoomHeader`**: Barra superior com o código da sala e indicador de status piscante.
- **`ReadyToggle`**: Botão grande de ação que alterna o estado do jogador local.
