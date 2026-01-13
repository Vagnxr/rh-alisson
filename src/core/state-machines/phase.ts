export type Phase = 'LOBBY' | 'DRAFT' | 'MATCH' | 'RESULTS';

export const PHASES: readonly Phase[] = ['LOBBY', 'DRAFT', 'MATCH', 'RESULTS'] as const;

/**
 * Guard determinístico para transições de fase (alto nível).
 *
 * Regras:
 * - Permite permanecer na mesma fase (no-op).
 * - Permite fluxo principal: LOBBY -> DRAFT -> MATCH -> RESULTS.
 * - Permite reset para LOBBY a partir de qualquer fase.
 */
export function canTransition(from: Phase, to: Phase): boolean {
  if (from === to) return true;
  if (to === 'LOBBY') return true;

  if (from === 'LOBBY' && to === 'DRAFT') return true;
  if (from === 'DRAFT' && to === 'MATCH') return true;
  if (from === 'MATCH' && to === 'RESULTS') return true;

  return false;
}
