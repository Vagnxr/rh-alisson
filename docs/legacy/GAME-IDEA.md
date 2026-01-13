# Dosed (Pill Roulette): Especificação Completa de Mecânicas

## 1. Visão Geral
**Dosed** é um jogo estratégico por turnos onde 2-4 jogadores competem para ser o último sobrevivente em um cenário de roleta russa com pílulas. A mecânica central combina **Gestão de Risco**, **Informação Oculta** e **Elementos Táticos** através de um sistema de saúde duplo, sistema de itens e progressão dinâmica.

### Características Principais
- **Sistema de Saúde Duplo**: Resistência (escudo temporário) + Vidas (saúde permanente)
- **Informação Oculta**: Efeitos das pílulas são revelados apenas ao consumir
- **Sistema de Itens**: 9+ power-ups em 4 categorias estratégicas
- **Shape Quests**: Complete sequências de formas para ganhar Pill Coins
- **Pill Store**: Loja com boosts e itens adicionais
- **Progressão Dinâmica**: Novos tipos de pílulas e formas desbloqueiam a cada rodada
- **IA Adaptativa**: 4 níveis de dificuldade com comportamentos distintos
- **Multiplayer Real-time**: Suporte para 2-4 jogadores via Supabase Realtime

## 2. Sistema de Jogador

### A. Sistema de Saúde Duplo

#### Vidas (Lives)
- **Função**: Contador permanente de sobrevivência
- **Valor Inicial**: 3 vidas por jogador
- **Condição de Derrota**: 0 vidas = eliminação permanente
- **Recuperação**: Apenas via pílula LIFE ou boost "1-Up" da Pill Store

#### Resistência (Resistance)
- **Função**: Escudo temporário que absorve dano
- **Valor Inicial**: 6 pontos por jogador
- **Mecânica de Colapso**:
  1. Resistência ≤ 0 → Jogador sofre **Colapso**
  2. **Penalidade**: -1 Vida
  3. **Reset**: Resistência restaurada ao máximo automaticamente
  4. **Continuidade**: Jogo continua imediatamente (sem perder turno)

### B. Inventário e Recursos

#### Inventário de Itens
- **Capacidade**: 5 slots por jogador
- **Aquisição**: Seleção pré-jogo + compras na Pill Store
- **Categorias**: Intel, Sustain, Control, Chaos

#### Pill Coins
- **Função**: Moeda do jogo para Pill Store
- **Obtenção**: Completar Shape Quests (+1 coin por quest)
- **Uso**: Comprar boosts e power-ups na loja

#### Efeitos Ativos
- **Shield**: Imunidade a dano por 1 rodada
- **Handcuffed**: Perde o próximo turno
- **Duração**: Baseada em rodadas, não turnos

---

## 3. Sistema de Pílulas (Pill Pool)

### A. Estrutura do Pool
- **Disposição**: Pílulas organizadas em grid visual na mesa
- **Estado Oculto**: Efeitos são revelados apenas ao consumir
- **Informação Pública**: Contadores de tipos e formas visíveis para todos
- **Permanência**: Pílulas permanecem até serem consumidas ou removidas por itens
- **Escalabilidade**: Quantidade aumenta de 6 a 12 pílulas conforme rodadas

### B. Sistema de Revelação
- **Scanner**: Revela tipo de 1 pílula específica
- **Shape Scanner**: Revela todas pílulas de uma forma
- **Persistência**: Pílulas reveladas permanecem visíveis até consumidas
- **Reset**: Shuffle embaralha e oculta todas as revelações

---

## 4. Tipos de Pílulas

### A. Tabela de Tipos

| Tipo | Nome | Efeito | Cor Visual | Desbloqueio | Probabilidade |
|------|------|--------|-------------|-------------|---------------|
| **SAFE** | Placebo | Nenhum efeito | Verde | Rodada 1 | 45% → 15% |
| **DMG_LOW** | Veneno Leve | -1 a -2 resistência | Amarelo | Rodada 1 | 40% → 20% |
| **DMG_HIGH** | Toxina | -3 a -4 resistência | Laranja | Rodada 3 | 15% → 25% |
| **HEAL** | Antídoto | +2 resistência | Ciano | Rodada 2 | 10% → 15% |
| **FATAL** | Cianeto | Zera resistência | Roxo | Rodada 6 | 5% → 18% |
| **LIFE** | Vida Extra | +1 vida | Rosa | Rodada 5 | 6% → 13% |

### B. Mecânicas Especiais

#### Modificadores de Item
- **Inverted**: Dano vira cura, cura vira dano (via Inverter)
- **Doubled**: Efeito multiplicado por 2 (via Double)
- **Shield**: Imunidade a dano, cura continua funcionando

#### Progressão Dinâmica
- **Interpolação**: Probabilidades mudam gradualmente entre rodadas
- **Balanceamento**: SAFE diminui, tipos perigosos aumentam
- **Teto**: Rodada 20 como máximo para interpolação

---

## 5. Sistema de Formas (Shapes)

### A. Conceito
Cada pílula possui uma **forma visual** independente do tipo de efeito, criando uma camada adicional de incerteza estratégica.

### B. Catálogo de Formas (16 Shapes)

| Shape | Arquivo | Descrição Visual | Progressão |
|-------|---------|------------------|------------|
| `capsule` | shape_1.png | Cápsula horizontal | Rodada 1 |
| `round` | shape_6.png | Pílula redonda | Rodada 1 |
| `triangle` | shape_8.png | Triângulo | Rodada 1 |
| `oval` | shape_11.png | Oval | Rodada 1 |
| `cross` | shape_2.png | Cruz | Rodada 1 |
| `heart` | shape_9.png | Coração | Rodada 1 |
| `flower` | shape_4.png | Flor | Rodada 1 |
| `star` | shape_13.png | Estrela | Rodada 1 |
| `pumpkin` | shape_12.png | Abóbora | Rodada 3 |
| `coin` | shape_14.png | Moeda | Rodada 1 |
| `bear` | shape_5.png | Urso | Rodada 5 |
| `gem` | shape_15.png | Gema | Rodada 1 |
| `skull` | shape_3.png | Caveira | Rodada 3 |
| `domino` | shape_16.png | Dominó | Rodada 7 |
| `pineapple` | shape_7.png | Abacaxi | Rodada 8 |
| `fruit` | shape_10.png | Fruta | Rodada 1 |

### C. Mecânicas de Shape

#### Distribuição Aleatória
- **Independência**: Forma não correlaciona com tipo de efeito
- **Progressão**: Novas formas desbloqueiam gradualmente
- **Balanceamento**: Distribuição proporcional baseada em probabilidades

#### Interação com Itens
- **Shape Scanner**: Revela todas pílulas de uma forma específica
- **Shape Bomb**: Remove todas pílulas de uma forma (futuro)
- **Targeting**: Alguns itens podem usar formas como critério

---

## 6. Sistema de Shape Quests

### A. Conceito
Objetivos pessoais de sequência que recompensam jogadores estratégicos com Pill Coins.

### B. Mecânicas

#### Geração de Quests
- **Frequência**: 1 quest ativo por jogador por vez
- **Tamanho**: 2-3 formas por sequência (aumenta após rodada 5)
- **Disponibilidade**: Apenas formas presentes no pool atual
- **Renovação**: Novo quest apenas no início de cada rodada

#### Exemplos de Quests
| Sequência | Dificuldade | Recompensa |
|-----------|-------------|------------|
| Triangle → Round | Fácil | +1 Pill Coin |
| Flower → Star → Heart | Médio | +2 Pill Coin |
| Skull → Cross → Bear → Star | Difícil | +3 Pill Coin |

#### Regras de Progresso
- **Ordem Obrigatória**: Deve consumir na sequência exata
- **Reset**: Consumir forma errada reseta progresso para 0
- **Persistência**: Progresso mantido entre turnos
- **Feedback Visual**: Animação de "shake" quando quest reseta

### C. Sistema de Pill Coins
- **Acumulação**: Coins persistem entre rodadas
- **Uso**: Exclusivo na Pill Store
- **Display**: Contador visível no painel do jogador
- **Interação**: Click no contador sinaliza interesse na loja

---

## 7. Pill Store (Sistema de Loja)

### A. Fluxo de Ativação

#### Durante a Rodada
1. **Sinalização**: Click no contador de Pill Coins = toggle "quero loja"
2. **Requisitos**: Deve ter `pillCoins > 0` para sinalizar
3. **Flexibilidade**: Pode mudar de ideia a qualquer momento
4. **Feedback**: Aviso se tentar sinalizar sem coins

#### Fim da Rodada
1. **Verificação**: Sistema checa quem sinalizou E tem coins
2. **Ativação**: Se alguém qualifica → fase shopping (30s timer)
3. **Bypass**: Se ninguém qualifica → próxima rodada direto
4. **Experiência**: Quem sinalizou vê loja, outros veem "Aguardando..."

### B. Mecânicas de Timer
- **Duração Base**: 30 segundos por jogador
- **Aceleração**: Confirmação de um jogador reduz timer do outro pela metade
- **Timeout**: Timer expirado = auto-confirma compras atuais
- **Sincronização**: Todos devem confirmar para prosseguir

### C. Catálogo da Loja

#### Boosts (Efeitos Imediatos)
| Item | Efeito | Custo | Disponibilidade |
|------|--------|-------|-----------------|
| **1-Up** | +1 Vida | 2 coins | Se vidas < máximo |
| **Reboot** | Resistência = MAX | 1 coins | Se resistência < máximo |
| **Scanner-2X** | 2 pílulas reveladas no início da próxima rodada | 1 coins | Sempre |

#### Power-ups (Adicionam ao Inventário)
| Item | Efeito | Custo | Disponibilidade |
|------|--------|-------|-----------------|
| **Scanner** | Adiciona Scanner ao inventário | 1 coins | Se inventário não cheio |
| **Shield** | Adiciona Shield ao inventário | 2 coins | Limitado a 1 por inventário |
| **Pocket Pill** | Adiciona Pocket Pill ao inventário | 1 coins | Se inventário não cheio |
| **Shape Scanner** | Adiciona Shape Scanner ao inventário | 2 coins | Se inventário não cheio |

### D. Regras de Compra
- **Stackable**: Power-ups podem ser comprados múltiplas vezes
- **Non-stackable**: Boosts limitados a 1 por inventário
- **Aplicação**: Boosts aplicados no início da próxima rodada
- **Inventário**: Power-ups adicionados ao inventário imediatamente após compra

---

## 8. Fluxo de Jogo (Game Loop)

### A. Fase Setup
1. **Seleção de Modo**: Single Player vs Multiplayer
2. **Configuração**: Dificuldade da IA (single) ou criação/entrada em sala (multi)
3. **Inicialização**: Geração de UUIDs para jogadores

### B. Fase de Seleção de Itens
1. **Catálogo**: Jogadores veem 9+ itens em 4 categorias
2. **Seleção**: Até 5 itens por jogador
3. **IA**: Seleção automática baseada em prioridades
4. **Confirmação**: Ambos devem confirmar para prosseguir
5. **Multiplayer**: Sincronização via Supabase Realtime

### C. Fase de Jogo (Playing)

#### Inicialização da Rodada
1. **Verificação**: Jogadores com vidas > 0
2. **Pool**: Geração de pílulas (tipos + formas)
3. **Quests**: Atribuição de Shape Quests individuais
4. **Boosts**: Aplicação de boosts da Pill Store
5. **Revelação**: Auto-reveal se boost Scanner-2X ativo

#### Estrutura do Turno
1. **Status Check**: Verifica efeitos (Handcuffed pula turno)
2. **Fase de Itens** (Opcional):
   - Uso ilimitado de itens do inventário
   - Targeting: self, opponent, ou pill específica
   - Efeitos imediatos (cura, reveal, etc.)
3. **Fase de Consumo** (Obrigatória):
   - Seleção de 1 pílula do pool
   - Exceção: Force Feed ou outros itens que pulam
4. **Resolução**:
   - Aplicação do efeito da pílula
   - Verificação de colapso (resistência ≤ 0)
   - Progresso de Shape Quest
   - Animações e feedback visual
5. **Fim do Turno**: Rotação para próximo jogador

#### Fim da Rodada
1. **Trigger**: Pool vazio ou todos jogadores eliminados
2. **Game Over Check**: Verifica vencedor
3. **Pill Store**: Se alguém sinalizou + tem coins
4. **Transição**: Nova rodada ou fim de jogo

### D. Fase Shopping (Opcional)
1. **Ativação**: Baseada em sinalização + coins
2. **Timer**: 30s por jogador com aceleração
3. **Compras**: Boosts e power-ups
4. **Aplicação**: Boosts na próxima rodada

### E. Fase Game Over
1. **Determinação**: Último jogador vivo = vencedor
2. **Estatísticas**: Rodadas, pílulas consumidas, etc.
3. **Opções**: Rematch (multiplayer) ou nova partida

---

## 9. Sistema de Itens

### A. Estrutura Geral
- **Capacidade**: 5 slots por jogador
- **Seleção**: Pré-jogo + compras na Pill Store
- **Uso**: Durante fase de itens do turno
- **Targeting**: Self, opponent, ou pílula específica

### B. Categorias e Itens

#### Intel (Informação)
| Item | Efeito | Target | Cor |
|------|--------|--------|-----|
| **Scanner** | Revela tipo de 1 pílula | Pill | Azul |
| **Inverter** | Inverte efeito de 1 pílula | Pill | Azul |
| **Double** | Dobra efeito de 1 pílula | Pill | Azul |
| **Shape Scanner** | Revela todas pílulas de uma forma | Pill | Azul |

#### Sustain (Sobrevivência)
| Item | Efeito | Target | Cor |
|------|--------|--------|-----|
| **Pocket Pill** | +4 resistência imediata | Self | Verde |
| **Shield** | Imunidade a dano por 1 rodada | Self | Verde |

#### Control (Controle)
| Item | Efeito | Target | Cor |
|------|--------|--------|-----|
| **Handcuffs** | Oponente perde próximo turno | Opponent | Amarelo |
| **Force Feed** | Força oponente a consumir pílula escolhida | Pill + Opponent | Amarelo |

#### Chaos (Caos)
| Item | Efeito | Target | Cor |
|------|--------|--------|-----|
| **Shuffle** | Embaralha pool, reseta revelações | None | Roxo |
| **Discard** | Remove 1 pílula sem ativar efeito | Pill | Roxo |

### C. Mecânicas Avançadas

#### Sistema de Targeting
- **Validação**: Apenas alvos válidos são selecionáveis
- **Feedback**: Highlight visual para alvos possíveis
- **Cancelamento**: ESC ou click fora cancela seleção

#### Interações Especiais
- **Shield vs Dano**: Bloqueia dano, permite cura
- **Inverted + Doubled**: Combinações de modificadores
- **Force Feed + Modifiers**: Pílula modificada é forçada

#### Limitações
- **Uso Único**: Cada item usado é removido do inventário
- **Ordem**: Itens aplicados antes do consumo obrigatório
- **Multiplayer**: Sincronização via eventos Realtime

---

## 10. Sistema de Progressão

### A. Progressão de Tipos
- **Desbloqueio Gradual**: Novos tipos por rodada
- **Interpolação**: Probabilidades mudam suavemente
- **Balanceamento**: SAFE diminui, perigo aumenta
- **Teto**: Rodada 20 como máximo para cálculos

### B. Progressão de Quantidade
| Rodadas | Pílulas | Observações |
|---------|---------|-------------|
| 1-3 | 6 | Tutorial suave |
| 4-6 | 7 | HEAL disponível |
| 7-9 | 8 | Tensão crescente |
| 10-12 | 9 | FATAL ativo |
| 13-15 | 10 | Late game |
| 16-18 | 11 | Máxima tensão |
| 19+ | 12 | Cap máximo |

### C. Progressão de IA

#### Níveis de Dificuldade
| Nível | Nome | Comportamento |
|-------|------|---------------|
| **Easy** | Paciente | Previsível, evita riscos |
| **Normal** | Cobaia | Balanceado, algumas táticas |
| **Hard** | Sobrevivente | Agressivo, usa itens estrategicamente |
| **Insane** | Hofmann | Calculista, sem piedade |

#### Adaptação por Rodada
- **Early Game**: IA mais conservadora
- **Mid Game**: Aumenta agressividade
- **Late Game**: Máxima pressão e risco

### D. Progressão de Formas
- **Desbloqueio**: Novas formas por rodada
- **Distribuição**: Proporcional baseada em probabilidades
- **Complexidade**: Quests mais longos após rodada 5

---

## 11. Modos de Jogo

### A. Single Player
- **Oponente**: IA com 4 níveis de dificuldade
- **Progressão**: Desbloqueio de níveis mais difíceis
- **Prática**: Ambiente seguro para aprender mecânicas

### B. Multiplayer
- **Tecnologia**: Supabase Realtime (WebSocket)
- **Capacidade**: 2-4 jogadores por sala
- **Autenticação**: Guest-first (sem cadastro obrigatório)
- **Sincronização**: Estado de jogo em tempo real
- **Reconexão**: Sistema de heartbeat e recuperação
- **Rematch**: Sistema de revanche pós-jogo

### C. Recursos Compartilhados
- **Saves**: Não há save/load (sessões temporárias)
- **Estatísticas**: Tracking básico por partida
- **Replay**: Histórico de ações para debug
- **Dev Tools**: Ferramentas de desenvolvimento (CTRL+SHIFT+D)

---

## 12. Considerações Técnicas

### A. Arquitetura
- **Frontend**: React 19 + TypeScript + Vite
- **Estado**: Zustand (stores modulares)
- **UI**: shadcn/ui + Tailwind CSS + Framer Motion
- **Backend**: Supabase (apenas Realtime)
- **Testes**: Vitest + property-based testing

### B. Performance
- **Otimizações**: Selectors otimizados, memoização
- **Assets**: PNG com transparência, SVG para ícones
- **Bundle**: Code splitting, lazy loading
- **Multiplayer**: Debounce de eventos, compressão

### C. Escalabilidade
- **N-Players**: Arquitetura suporta 2-4 jogadores
- **UUID**: Identificadores de sessão únicos
- **Modular**: Stores separados por domínio
- **Extensível**: Sistema de itens e tipos plugável
