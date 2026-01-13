# Project Architecture & File Map

## 1. Directory Structure
Este documento é gerado/derivado. A estrutura alvo mais atual está em `docs/00-start-here/estrutura-do-projeto.md`.

The project adheres to a strict feature-based architecture optimized for Supabase/React. Implement the following structure exactly:

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
│   │   │   ├── table/         # Mesa de jogo (Conveyor, Bottle)
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

## 2. Architectural Principles
- **Supabase First**: All complex logic resides in Edge Functions or Database Triggers. The client is for presentation and state reflection only.
- **Type Safety**: Strict TypeScript mode enabled. No `any` types allowed. Zod schemas required for all external data.
- **Component Modularity**: Use the Smart/Dumb component pattern. Logic resides in hooks; UI resides in pure components.

## 3. Naming Conventions
- **Components**: PascalCase (e.g., `GameCard.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useGameState.ts`)
- **Database Tables**: snake_case, plural (e.g., `users_profiles`, `game_matches`)
- **Edge Functions**: kebab-case (e.g., `process-turn`)
