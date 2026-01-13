# Technical Specification & Stack Definition

## 1. Core Technology Stack
- **Frontend**: React 19, Vite, TypeScript, TailwindCSS
- **Backend**: Supabase (Auth, Postgres, Realtime, Edge Functions)
- **State Management**: Zustand (Global), React Query (Server State)
- **Styling**: TailwindCSS with Lucide React icons
- **Testing**: Vitest + Testing Library

## 2. Backend Architecture (Supabase)
The database and serverless architecture is defined as follows:

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

## 3. Design Patterns
The system implements the following software design patterns:

PADRÕES DE PROJETO RECOMENDADOS:

1. COMMAND PATTERN (Rede):
   - Encapsular cada ação do jogador (ex: 'UseItem', 'EatPill') em objetos serializáveis ({ type: 'USE_ITEM', itemId: 'knife', targetId: 'player_2' }). Isso facilita envio para a Edge Function e implementação de 'Undo' ou 'Replay'.

2. STATE MACHINE (XSTATE ou ZUSTAND+ENUM):
   - O jogo tem estados rígidos: 'LOBBY' -> 'DRAFT' -> 'ROUND_START' -> 'PLAYER_TURN' -> 'RESOLVE_EFFECTS' -> 'ROUND_END'. Não use booleans soltos (isLoading, isPlaying). Use uma máquina de estados finita.

3. OPTIMISTIC UI UPDATES:
   - Ao clicar em 'Comer Pílula', o frontend deve imediatamente tocar a animação e reduzir o contador visualmente *antes* da confirmação do servidor, revertendo se houver erro. Essencial para 'game feel' fluido.

## 4. Reference Implementation (Ground Truth)
Use the following code snippets as the absolute standard for implementation style, error handling, and typing:

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
