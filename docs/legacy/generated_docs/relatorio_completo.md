
# Relatório Técnico Dev Developer

## Recursos Identificados Visualmente (Não Documentados)
RECURSOS VISUAIS NÃO DOCUMENTADOS (HIDDEN FEATURES):

1. **Meta-Economia ('Schmeckles'):** A tela 'screen-home.jpg' mostra saldo de 1500 Schmeckles, sugerindo economia persistente fora das partidas, provavelmente para comprar cosméticos (ex: 'Cool Rick Sunglasses').
2. **Daily Challenges:** Widget na home com recompensa específica ('500 Schmeckles') e timer implícito.
3. **Backpack Expandida:** Imagem 'screen-draft-loadout.jpg' mostra grid de 8 slots, contradizendo os 5 slots do texto.
4. **Counter de Pool:** A barra superior em 'screen-match-2.jpg' mostra a CONTAGEM exata de tipos de pílulas restantes ([7] Safe, [4] Poison), indicando mecânica de informação perfeita (Card Counting) e não probabilidade oculta.
5. **Draft Timer:** O contador 'Draft Ends in: 00:15' implica fase síncrona de compra com pressão de tempo.
6. **Social Reporting:** Botão 'Report Player' visível nas telas de fim de jogo.
7. **Barra de XP:** Visualização de progresso de nível com animação de preenchimento ao fim da partida.

## Crítica Técnica
CRÍTICA TÉCNICA E RISCOS:

1. DISCREPÂNCIA DE INVENTÁRIO (RISCO ALTO): A documentação cita '5 slots fixos', mas a imagem 'screen-draft-loadout.jpg' mostra explicitamente 'Your Backpack (8 Slots)' e um grid 2x4. Isso altera fundamentalmente o balanceamento de itens e economia. Recomendo padronizar para 8 slots para acomodar a complexidade visual sugerida.

2. ECONOMIA DUAL CONFUSA: As imagens mostram 'Schmeckles' tanto no menu principal (Meta-game: 1500) quanto no Draft (In-game: 150). O texto menciona 'Pill Coins'. Risco de confusão do jogador. Solução: Usar 'Schmeckles' como moeda persistente (Cosméticos) e 'Credits/Tokens' para a economia da partida (Loja/Draft), ou clarificar se Schmeckles são apostados.

3. LATÊNCIA NO MULTIPLAYER (SUPABASE): O modelo 'Host-Authority' sugerido no texto é inseguro para jogos competitivos (cheating fácil via console). A arquitetura deve migrar para 'Server-Authoritative' usando Supabase Edge Functions para validar cada ação, o que introduz latência. O frontend deve implementar 'Optimistic UI' agressivo para mascarar o delay de ~100-300ms das Edge Functions.

4. PROGRESSÃO NÃO DOCUMENTADA: O sistema de XP, Níveis (Pickle Level: 137) e 'Daily Challenges' (screen-home.jpg) são vitais para retenção, mas estão ausentes nas specs de mecânica. Precisam ser definidos no DB Schema imediatamente.

## Arquitetura Supabase
ARQUITETURA SUPABASE SERVERLESS:

1. DATABASE (POSTGRES):
   - 'public.profiles': id (uuid), username, schmeckles_balance, cosmetic_json, xp, level.
   - 'public.matches': id, status (waiting, playing, finished), current_turn_index, pill_pool_json, created_at.
   - 'public.match_state': match_id, round_number, player_states_json (hp, items), last_action_timestamp.

2. REALTIME (BROADCAST & PRESENCE):
   - Canal 'match:room_{id}': Sincroniza estado do jogo.
   - Uso de 'Presence' para detectar desconexão de oponentes instantaneamente.
   - 'Postgres Changes' NÃO deve ser usado para game loop (lento); use 'Broadcast' via Edge Function.

3. EDGE FUNCTIONS (TYPESCRIPT):
   - 'game-engine': Recebe { action: 'EAT_PILL', pillId: 5 }, valida regras, atualiza DB, e transmite o novo estado via Broadcast.
   - 'matchmaking': Lógica de fila e criação de salas.

4. STORAGE:
   - Assets de cosméticos (avatares, skins de pílulas).

## Padrões de Projeto (Design Patterns)
PADRÕES DE PROJETO RECOMENDADOS:

1. COMMAND PATTERN (Rede):
   - Encapsular cada ação do jogador (ex: 'UseItem', 'EatPill') em objetos serializáveis ({ type: 'USE_ITEM', itemId: 'knife', targetId: 'player_2' }). Isso facilita envio para a Edge Function e implementação de 'Undo' ou 'Replay'.

2. STATE MACHINE (XSTATE ou ZUSTAND+ENUM):
   - O jogo tem estados rígidos: 'LOBBY' -> 'DRAFT' -> 'ROUND_START' -> 'PLAYER_TURN' -> 'RESOLVE_EFFECTS' -> 'ROUND_END'. Não use booleans soltos (isLoading, isPlaying). Use uma máquina de estados finita.

3. OPTIMISTIC UI UPDATES:
   - Ao clicar em 'Comer Pílula', o frontend deve imediatamente tocar a animação e reduzir o contador visualmente *antes* da confirmação do servidor, revertendo se houver erro. Essencial para 'game feel' fluido.

## Estrutura de Pastas Sugerida
```
dosed/
├── supabase/
│   ├── functions/
│   │   ├── _shared/           # Lógica Core do Jogo (GameEngine) compartilhada
│   │   ├── match-action/      # Endpoint: Processa ações/turnos
│   │   └── create-match/      # Endpoint: Inicializa sala/partida
│   ├── migrations/            # SQL Schemas
├── src/
│   ├── core/
│   │   ├── adapters/          # Supabase Client Wrappers
│   │   └── state-machines/    # XState ou lógica de fases
│   ├── components/
│   │   ├── game/
│   │   │   ├── table/         # A mesa de jogo (Conveyor, Bottle)
│   │   │   └── hud/           # Barras de vida, Stats
│   │   └── ui/                # 8bit UI Kit
│   ├── hooks/
│   ├── stores/
│   │   ├── matchStore.ts      # Sincronizado via Realtime
│   │   └── uiStore.ts         # Estado local (modals, sfx)
│   ├── types/
│   ├── lib/
│   └── screens/
└── public/
    └── assets/
        └── sprites/           # Spritesheets (Rick, Morty, Pills)
```

## Exemplos de Código
#### 1. Tabela SQL para Profiles (Supabase)
```sql
create table public.profiles (
  id uuid references auth.users not null primary key,
  username text unique not null,
  schmeckles integer default 0,
  xp_total integer default 0,
  -- JSONB para flexibilidade com cosméticos futuros
  inventory_cosmetics jsonb default '{"hats": [], "skins": []}'::jsonb,
  avatar_url text,
  created_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone."
  on profiles for select using ( true );
```

#### 2. Typescript Edge Function (Process Turn)
```typescript
// supabase/functions/match-action/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { matchId, action, payload } = await req.json()
  
  // 1. Carregar estado atual do Redis ou DB
  const gameState = await loadMatchState(matchId)
  
  // 2. Validar Ação (Engine Puro)
  if (!isValidMove(gameState, action)) {
    return new Response(JSON.stringify({ error: "Invalid Move" }), { status: 400 })
  }
  
  // 3. Processar Lógica (Ex: Reduzir HP, Calcular RNG)
  const newState = applyAction(gameState, action)
  
  // 4. Persistir e Broadcast
  await saveMatchState(matchId, newState)
  await supabase.channel(`match:${matchId}`).send({
    type: 'broadcast',
    event: 'GAME_UPDATE',
    payload: newState
  })
  
  return new Response(JSON.stringify(newState))
})
```

## Mecânicas
CONSULTORIA DE MECÂNICA E MATEMÁTICA:

1. 'DECK OF CARDS' vs 'RNG PURO':
   - A imagem 'screen-match-2.jpg' mostra contadores fixos ([7] SAFE, [4] POISON). Isso confirma um sistema de 'Sampling without Replacement' (Baralho). Isso permite 'Card Counting'.
   - MECÂNICA SUGERIDA: O pool é gerado no início da rodada. Ex: Array = [0,0,0,0,0,0,0, 1,1,1,1]. A probabilidade muda a cada pílula consumida. O HUD deve atualizar esses contadores em tempo real para permitir estratégia.

2. LÓGICA DE DRAFT (LEILÃO vs COMPRA):
   - A tela de Draft tem um timer (00:15). Em multiplayer, isso deve ser simultâneo. Se o tempo acabar, auto-fill aleatório.
   - Custo de Itens: Balancear Schmeckles iniciais (ex: 150) vs Preços (Beer: 50, Knife: 100). O jogador só pode comprar 1 item caro ou 3 baratos. Isso cria builds ('Aggro' vs 'Sustain').

3. CÁLCULO DE XP:
   - Baseado na imagem de vitória: XP = (Turnos Sobrevividos * 10) + (Inimigos Eliminados * 50) + (Bônus Vitória 500).
    