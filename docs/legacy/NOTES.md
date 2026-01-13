# Dosed (Pill Roulette) - Especificação de Arquitetura Frontend Inicial

> LEGADO: este documento foi movido para `docs/legacy` e não é a fonte da verdade de estrutura/stack.
> Para a estrutura alvo do projeto, use: `docs/00-start-here/estrutura-do-projeto.md`.
> Para a stack atual (conferir `package.json`), use: `steering/tech.md`.
> A documentação normativa atual está em `docs/`.

**Versão do Documento:** 1.0
**Data:** 13/12/2025
**Contexto:** Definição da estrutura de componentes React para a interface de jogo (Game UI).

---

## 1. Visão Geral

Este documento descreve a arquitetura de componentes frontend para o jogo **Dosed**, focando na implementação da interface de usuário inspirada em "Rick and Morty" (estética 8-bit sci-fi). A estrutura foi projetada para escalabilidade (2-6 jogadores), manutenção e reutilização de código.

## 2. Stack Tecnológica Sugerida

- **Core:** React 19 + TypeScript + Vite
- **Estilização:** Tailwind CSS (com configuração de cores neon customizadas)
- **UI Kit Base:** Shadcn/ui (altamente customizado para pixel art)
- **Ícones:** Lucide-React ou React-Icons (Pixelarticons)
- **Gerenciamento de Estado:** Zustand (para game state global)
- **Animações:** Framer Motion (para transições de pílulas e turnos)

---

## 3. Árvore de Componentes

A hierarquia visual da aplicação segue a estrutura abaixo:

```text
App
└── GameScreen (Layout Principal)
    ├── BackgroundEffects (Camada de Fundo: Scanlines, Estrelas, Portal)
    │
    ├── TopSection: OpponentList (Lista Horizontal)
    │   └── OpponentCard (Componente Repetível: 1 a 5 instâncias)
    │       ├── Avatar (com borda de status)
    │       ├── HealthBar (Corações Roxos)
    │       └── ShieldBar (Escudos Azuis/Dourados)
    │
    ├── CenterSection: GameTable (Mesa Central)
    │   ├── RoundStatus (Header: Rodada/Turno)
    │   ├── PillCounterBoard (Stats do Pool)
    │   │   └── PillCountItem (Indicadores numéricos)
    │   └── PillDispenser (Área Visual das Pílulas)
    │       └── PillToken (Item Interativo)
    │
    └── BottomSection (Grid Dividido)
        ├── LeftArea: PlayerDashboard (Painel do Usuário)
        │   ├── PlayerStats (Avatar Grande, HP, Resistência)
        │   └── InventoryGrid
        │       └── InventorySlot (Item Clicável/Tooltip)
        │
        └── RightArea: ActionCenter (Controles)
            ├── ActionButtons (Container Flex)
            │   ├── ShopButton
            │   └── ChatButton
            └── GameLog (Terminal de Texto Scrollável)

```

---

##4. Detalhamento dos Componentes###4.1. Layout & Wrapper**`GameScreen`**

- **Responsabilidade:** Container mestre, gerencia o aspect ratio e as bordas "alien metal".
- **Estilo:** `h-screen w-screen overflow-hidden bg-space-black relative`.
- **Children:** Renderiza as 3 seções principais (Top, Center, Bottom).

###4.2. Seção Superior (Oponentes)**`OpponentList`**

- **Responsabilidade:** Grid ou Flex container para dispor os inimigos. Deve lidar com responsividade se houver 1 ou 5 inimigos.

**`OpponentCard`**

- **Props:**
- `player: IPlayer` (Objeto contendo nome, avatar, hp, shield).
- `isActive: boolean` (Indica se é o turno deste oponente).

- **Estilo:** Borda roxa neon (`border-purple-500`), fundo escuro semitransparente.

###4.3. Seção Central (Mesa)**`GameTable`**

- **Responsabilidade:** O "coração" do jogo. Exibe o estado atual da rodada.

**`PillDispenser`**

- **Props:** `pills: IPill[]`.
- **Comportamento:**
- Renderiza pílulas ocultas (com `?`) ou reveladas.
- Lida com animações de entrada/saída de pílulas.

**`PillToken`**

- **Props:** `type` (Safe, Poison, etc - se revelado), `shape` (forma visual), `isUnknown`.
- **Interação:** `onClick` para selecionar a pílula a ser consumida.

###4.4. Seção Inferior (Jogador e Ações)

**`PlayerDashboard`**

- **Responsabilidade:** Exibir dados do jogador local ("YOU").
- **Destaque:** Deve ser visualmente maior que os `OpponentCard`.
- **Estilo:** Borda verde neon (`border-green-500`), efeito de brilho intenso.

**`InventoryGrid`**

- **Props:** `items: IItem[]`, `maxSlots: number`.
- **Lógica:** Grid fixo (ex: 2x5). Slots vazios devem ser renderizados visualmente (placeholders).

**`ActionCenter`**

- **Componentes:**
- `GameButton`: Botões blocky (quadrados). Variantes: `primary` (Verde/Shop), `secondary` (Roxo/Chat).
- `GameLog`: Lista de strings. Deve sempre fazer auto-scroll para a última mensagem. Estilo "Terminal CRT".

---

##5. Design System & Estilização (Tailwind Config)Para atingir a estética "Rick and Morty 8-bit", recomenda-se estender o tema do Tailwind:

```javascript
// tailwind.config.js (Exemplo)
module.exports = {
  theme: {
    extend: {
      colors: {
        'rick-green': '#00ff41', // Verde Ácido
        'morty-yellow': '#ffff00', // Amarelo Alerta
        'evil-purple': '#bd00ff', // Roxo Neon
        'portal-blue': '#00f0ff', // Azul Radioativo
        'ui-dark': '#0a0a1a', // Fundo Painel
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'], // Fonte sugerida
      },
      boxShadow: {
        pixel: '4px 4px 0px 0px rgba(0,0,0,1)', // Sombra dura
        'neon-green': '0 0 10px #00ff41',
      },
    },
  },
};
```

---

##6. Diretrizes de Implementação (Senior Tips)1. **State Management (Zustand):**

- Crie uma store `useGameStore` para dados voláteis (turno, HP, pílulas).
- Crie uma store `useUIStore` para dados locais (chat aberto, loja aberta, tooltips).

2. **Separação de Responsabilidades:**

- Componentes visuais (`components/ui`) não devem conter lógica de negócio.
- Use Custom Hooks (ex: `useInventory`) para injetar lógica nos componentes containers, somente se necessário.

3. **Performance:**

- O `GameLog` pode crescer muito. Use virtualização se as mensagens passarem de 100.
- O `PillDispenser` deve usar `key` única (IDs) para garantir animações corretas ao remover/adicionar pílulas.

4. **Acessibilidade [a11y]:** _(Opcional)_

- Mesmo sendo um jogo pixel art, mantenha navegação por teclado nos slots de inventário e botões de ação.
