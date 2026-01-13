# Especificação do Projeto: UI de Fim de Jogo (Results)

## 1. Visão Geral

Tela de encerramento de partida focada em celebrar o vencedor (estilo "Survivor") ou humilhar os perdedores, exibindo estatísticas detalhadas, ganho de XP e recompensas (Loot Boxes).

## 2. Estrutura de Navegação (Rotas)

- **/results**: Rota final após o término do `gameState`.
  - Botão "Play Again": Retorna o grupo ao Lobby.
  - Botão "Main Menu": Retorna o jogador para a Home.

## 3. Funcionalidades e Regras de Negócio

- **Destaque do Vencedor**:
  - Avatar do vencedor em tamanho grande no centro com efeito de spotlight.
  - Texto "SURVIVED" (Vitória) ou "ELIMINATED" (Derrota) dependendo do contexto do jogador local.
- **Painéis de Estatísticas**:
  - Dados da partida: Turnos sobrevividos, Pílulas tomadas, Itens usados.
- **Progressão (XP)**:
  - Barra de progresso animada mostrando o ganho de XP e subida de nível.
- **Loot Drop**:
  - Se houver recompensa, exibir uma caixa pixelada que se abre com clique.

## 4. Estrutura de Dados (Estado Global)

- `matchResult`:
  - `winnerId`: string
  - `matchDuration`: string
- `playerStats`: Objeto com métricas da sessão (pillsEaten, itemsUsed).
- `rewards`:
  - `xpGained`: number
  - `newLevel`: number (opcional)
  - `itemDrop`: string | null (ex: "Cool Rick Sunglasses")

## 5. Componentes de UI Sugeridos

- **`SpotlightHero`**: Componente central para exibir o avatar do vencedor com partículas (confete ou gosma).
- **`StatsTable`**: Tabelas transparentes (`backdrop-blur`) laterais para dados numéricos.
- **`XpProgressBar`**: Barra de progresso com animação de preenchimento suave.
- **`LootBoxModal`**: Componente interativo para revelar recompensas cosméticas.
- **`ActionRow`**: Barra inferior com botões de navegação (Revanche/Sair).
