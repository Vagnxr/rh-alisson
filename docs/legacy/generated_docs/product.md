# Product Requirements Document (PRD)

## 1. Game Overview
This project is a Supabase-first multiplayer game. This document defines the core mechanics, features, and business rules required for the greenfield implementation.

## 2. Core Gameplay Mechanics
CONSULTORIA DE MECÂNICA E MATEMÁTICA:

1. 'DECK OF CARDS' vs 'RNG PURO':
   - A imagem 'screen-match-2.jpg' mostra contadores fixos ([7] SAFE, [4] POISON). Isso confirma um sistema de 'Sampling without Replacement' (Baralho). Isso permite 'Card Counting'.
   - MECÂNICA SUGERIDA: O pool é gerado no início da rodada. Ex: Array = [0,0,0,0,0,0,0, 1,1,1,1]. A probabilidade muda a cada pílula consumida. O HUD deve atualizar esses contadores em tempo real para permitir estratégia.

2. LÓGICA DE DRAFT (LEILÃO vs COMPRA):
   - A tela de Draft tem um timer (00:15). Em multiplayer, isso deve ser simultâneo. Se o tempo acabar, auto-fill aleatório.
   - Custo de Itens: Balancear Schmeckles iniciais (ex: 150) vs Preços (Beer: 50, Knife: 100). O jogador só pode comprar 1 item caro ou 3 baratos. Isso cria builds ('Aggro' vs 'Sustain').

3. CÁLCULO DE XP:
   - Baseado na imagem de vitória: XP = (Turnos Sobrevividos * 10) + (Inimigos Eliminados * 50) + (Bônus Vitória 500).

## 3. UI & Experience Requirements
The following interface elements and features are mandatory for the frontend implementation:
RECURSOS VISUAIS NÃO DOCUMENTADOS (HIDDEN FEATURES):

1. **Meta-Economia ('Schmeckles'):** A tela 'screen-home.jpg' mostra saldo de 1500 Schmeckles, sugerindo economia persistente fora das partidas, provavelmente para comprar cosméticos (ex: 'Cool Rick Sunglasses').
2. **Daily Challenges:** Widget na home com recompensa específica ('500 Schmeckles') e timer implícito.
3. **Backpack Expandida:** Imagem 'screen-draft-loadout.jpg' mostra grid de 8 slots, contradizendo os 5 slots do texto.
4. **Counter de Pool:** A barra superior em 'screen-match-2.jpg' mostra a CONTAGEM exata de tipos de pílulas restantes ([7] Safe, [4] Poison), indicando mecânica de informação perfeita (Card Counting) e não probabilidade oculta.
5. **Draft Timer:** O contador 'Draft Ends in: 00:15' implica fase síncrona de compra com pressão de tempo.
6. **Social Reporting:** Botão 'Report Player' visível nas telas de fim de jogo.
7. **Barra de XP:** Visualização de progresso de nível com animação de preenchimento ao fim da partida.

## 4. System Constraints & Guardrails
The development must strictly adhere to the following limitations and architectural rules to prevent technical debt:
CRÍTICA TÉCNICA E RISCOS:

1. DISCREPÂNCIA DE INVENTÁRIO (RISCO ALTO): A documentação cita '5 slots fixos', mas a imagem 'screen-draft-loadout.jpg' mostra explicitamente 'Your Backpack (8 Slots)' e um grid 2x4. Isso altera fundamentalmente o balanceamento de itens e economia. Recomendo padronizar para 8 slots para acomodar a complexidade visual sugerida.

2. ECONOMIA DUAL CONFUSA: As imagens mostram 'Schmeckles' tanto no menu principal (Meta-game: 1500) quanto no Draft (In-game: 150). O texto menciona 'Pill Coins'. Risco de confusão do jogador. Solução: Usar 'Schmeckles' como moeda persistente (Cosméticos) e 'Credits/Tokens' para a economia da partida (Loja/Draft), ou clarificar se Schmeckles são apostados.

3. LATÊNCIA NO MULTIPLAYER (SUPABASE): O modelo 'Host-Authority' sugerido no texto é inseguro para jogos competitivos (cheating fácil via console). A arquitetura deve migrar para 'Server-Authoritative' usando Supabase Edge Functions para validar cada ação, o que introduz latência. O frontend deve implementar 'Optimistic UI' agressivo para mascarar o delay de ~100-300ms das Edge Functions.

4. PROGRESSÃO NÃO DOCUMENTADA: O sistema de XP, Níveis (Pickle Level: 137) e 'Daily Challenges' (screen-home.jpg) são vitais para retenção, mas estão ausentes nas specs de mecânica. Precisam ser definidos no DB Schema imediatamente.
