# Especificação do Projeto: UI de Seleção de Itens (Draft/Shop)

## 1. Visão Geral

Fase de economia estratégica visualizada como uma "Loja de Penhores Interdimensional", onde jogadores gastam Schmeckles para comprar itens antes da partida, com limite de tempo.

## 2. Estrutura de Navegação (Rotas)

- **/draft**: Rota temporária entre o Lobby e a Match.
  - Ao fim do temporizador (ou confirmação de todos), transição automática para **/match**.

## 3. Funcionalidades e Regras de Negócio

- **Carrossel de Itens (Esteira)**:
  - Exibir itens disponíveis para compra horizontalmente.
  - Ao clicar em "Comprar", deduzir o valor da carteira e mover item para o inventário.
- **Economia**:
  - O jogador não pode comprar se `wallet < itemCost`.
  - O inventário tem limite máximo de slots (ex: 8).
- **Temporizador**:
  - Contagem regressiva (ex: 15s) no topo. Ao zerar, a loja fecha.
- **Confirmação**:
  - Botão "Confirm Loadout" trava as escolhas do jogador.

## 4. Estrutura de Dados (Estado Global)

- `draftState`:
  - `timeLeft`: number (segundos)
  - `walletBalance`: number (Schmeckles atuais)
- `shopItems`: Array de itens disponíveis na rodada (ex: Cerveja, Algemas).
- `currentInventory`: Array de itens já comprados ou possuídos pelo jogador.

## 5. Componentes de UI Sugeridos

- **`ConveyorBelt`**: Container horizontal para os itens da loja, sugerindo movimento mecânico.
- **`ShopItemCard`**: Card vertical com Ícone 8-bit, Preço e Botão de Compra.
- **`InventoryGrid`**: Grade fixa na parte inferior mostrando os slots do jogador.
- **`EconomyHeader`**: Barra superior destacando o saldo de moedas e o relógio digital.
- **`MotionEffects`**: (CSS/Framer Motion) Animar o item "voando" da loja para o inventário.
