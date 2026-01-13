# Especificação do Projeto: UI da Tela de Partida (Match)

## 1. Visão Geral

Interface principal de gameplay para o jogo "DOSED: Pill Roulette", apresentando um layout de batalha por turnos estilo "mesa de cassino espacial" com estética 8-bit Sci-Fi (Rick and Morty), gerenciando até 6 jogadores, inventário e a máquina central de pílulas.

## 2. Estrutura de Navegação (Rotas)

Esta especificação foca na rota principal do jogo:

- **/** (Match/Game): A tela ativa onde a partida ocorre. Deve ser responsiva (Desktop 16:9 vs Mobile 9:16).

## 3. Funcionalidades e Regras de Negócio

- **Sistema de Turnos**:
  - O jogador atual deve ter destaque visual (borda brilhante ou glow neon).
  - O header da máquina central deve exibir "RODADA X | TURNO: [Nome do Jogador]".
- **Painel de Oponentes (Topo)**:
  - Renderizar lista de inimigos.
  - Exibir Vida (Corações Roxos) e Resistência (Escudos Azuis/Dourados) para cada um.
  - Oponentes eliminados devem aparecer acinzentados ou com ícone de caveira.
- **A Máquina (Centro)**:
  - **Contadores**: Exibir contagem atual de pílulas (Safe, Poison, Toxic, Antidote, Lethal). Os números devem ser dinâmicos.
  - **Fila de Pílulas**: Mostrar visualmente as pílulas "desconhecidas" na esteira.
- **HUD do Jogador (Inferior Esquerdo)**:
  - Exibir o card do jogador local ("YOU") com destaque maior.
  - **Inventário**: Grid de slots (máx 10). Ao clicar em um item, deve abrir um menu de contexto ou ativar a ação (simulado).
- **Ações e Log (Inferior Direito)**:
  - Botão "SHOP": Abre modal de loja (apenas visual por enquanto).
  - Botão "CHAT": Abre/fecha janela de chat.
  - **Game Log**: Área de texto com scroll automático mostrando as últimas ações (ex: "> Rick usou Cerveja.").

## 4. Estrutura de Dados (Estado Sugerido)

Dados que alimentam a interface para simulação:

- `gameState`:
  - `round`: number (ex: 2)
  - `currentTurnPlayerId`: string
  - `pillCounts`: { safe: 7, poison: 4, toxic: 2, antidote: 1, lethal: 0 }
  - `pillQueue`: Array<string> (representando as pílulas ocultas)

- `players`: Array de objetos contendo:
  - `id`: string
  - `name`: string (ex: "Birdperson")
  - `avatar`: string (url da imagem pixel art)
  - `hp`: number (max 4)
  - `shields`: number (max 4)
  - `isDead`: boolean
  - `inventory`: Array<Items>

- `localPlayer`:
  - Referência ao jogador principal para exibir no HUD grande.

## 5. Componentes de UI Sugeridos

Utilizar **Shadcn UI** altamente customizado com **Tailwind CSS** para o estilo Pixel Art/Neon:

- **`GameContainer`**: Wrapper com background de portal espacial e bordas de metal alienígena (Scanlines, Chromatic Aberration).
- **`OpponentCard`**: Card compacto para a fileira superior.
- **`PillDispenser`**: Componente central complexo com o display digital e a esteira de pílulas.
- **`PlayerHUD`**: Card expandido com barras de vida/escudo e grid de inventário.
- **`ActionLog`**: Componente tipo terminal (`bg-black`, fonte monoespaçada verde/roxa).
- **`PixelButton`**: Botões customizados com bordas grossas e efeitos de hover "glitch".
