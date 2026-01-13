# Especificação do Projeto: UI da Tela Inicial (Home)

## 1. Visão Geral

A porta de entrada do jogo "DOSED: Pill Roulette", projetada como um console interdimensional caótico com menus vibrantes, desafios diários e perfil do jogador, estabelecendo a estética 8-bit Sci-Fi.

## 2. Estrutura de Navegação (Rotas)

- **/** (Home): Rota raiz da aplicação.
  - **Ação "Enter the Void"**: Redireciona para o Lobby ou Matchmaking.
  - **Ação "The Lab"**: Abre modal/página de Configurações.
  - **Ação "Multiplayer"**: Redireciona para a lista de servidores.

## 3. Funcionalidades e Regras de Negócio

- **Menu Principal**:
  - Deve apresentar botões grandes com animações de "pulse" ou "glitch" ao passar o mouse.
- **Desafio Diário (Daily Challenge)**:
  - Exibir um "Boss" aleatório (ex: Evil Morty) e a recompensa em Schmeckles.
  - Deve indicar se já foi completado hoje.
- **Marquee de Avisos (Rodapé)**:
  - Texto rolando infinitamente com mensagens de humor ácido (ex: "WARNING: DO NOT CONSUME GLOWING ROCKS").
- **Perfil Resumido**:
  - Mostrar Avatar, Nível atual ("Pickle Level") e Saldo de moedas.

## 4. Estrutura de Dados (Estado Global)

- `userProfile`:
  - `username`: string
  - `avatarUrl`: string
  - `level`: number
  - `schmeckles`: number
  - `rank`: string (ex: "Dimension C-137 Native")
- `dailyChallenge`:
  - `bossName`: string
  - `rewardAmount`: number
  - `isCompleted`: boolean

## 5. Componentes de UI Sugeridos

- **`GlitchTitle`**: Componente para o logo "DOSED" com efeitos de distorção cromática CSS.
- **`MenuStack`**: Container flex vertical para os botões principais.
- **`PixelButton`**: Botões variantes (Neon Green, Electric Purple) com bordas grossas.
- **`ScrollingMarquee`**: Componente de texto animado no rodapé (`overflow-hidden`, `whitespace-nowrap`).
- **`DailyBountyCard`**: Card pequeno no canto inferior esquerdo exibindo o alvo do dia.
