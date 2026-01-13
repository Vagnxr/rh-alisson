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