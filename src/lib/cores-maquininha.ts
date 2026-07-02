/**
 * Paleta fixa de cores para cabecalhos de cards por maquininha/modulo
 * (A Receber, Controle de Cartoes). Pedido do cliente: cor "fraquinha" (clara)
 * no cabecalho, configuravel no Gerenciar maquininhas.
 *
 * Tailwind JIT exige classes literais — NUNCA construir `bg-${cor}-100`.
 * O JSON persiste apenas o id da paleta (ex.: 'azul').
 */

export const COR_IDS = ['azul', 'laranja', 'vermelho', 'roxo', 'verde', 'amarelo', 'rosa', 'cinza'] as const;

export type CorMaquininhaId = (typeof COR_IDS)[number];

interface CorMaquininha {
  label: string;
  /** Classes do cabecalho do card (fundo claro + texto escuro; par dark). */
  header: string;
  /** Bolinha/preview da cor em selects. */
  dot: string;
}

export const CORES_MAQUININHA: Record<CorMaquininhaId, CorMaquininha> = {
  azul: {
    label: 'Azul',
    header: 'bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200',
    dot: 'bg-blue-500',
  },
  laranja: {
    label: 'Laranja',
    header: 'bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:text-orange-200',
    dot: 'bg-orange-500',
  },
  vermelho: {
    label: 'Vermelho',
    header: 'bg-red-50 text-red-900 dark:bg-red-950/40 dark:text-red-200',
    dot: 'bg-red-500',
  },
  roxo: {
    label: 'Roxo',
    header: 'bg-purple-50 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200',
    dot: 'bg-purple-500',
  },
  verde: {
    label: 'Verde',
    header: 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
    dot: 'bg-emerald-500',
  },
  amarelo: {
    label: 'Amarelo',
    header: 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200',
    dot: 'bg-amber-500',
  },
  rosa: {
    label: 'Rosa',
    header: 'bg-pink-50 text-pink-900 dark:bg-pink-950/40 dark:text-pink-200',
    dot: 'bg-pink-500',
  },
  cinza: {
    label: 'Cinza',
    header: 'bg-slate-100 text-slate-900 dark:bg-slate-800/60 dark:text-slate-200',
    dot: 'bg-slate-500',
  },
};

/** Cores default por id (Cielo azul, Rede laranja, GetNet vermelho, Voucher roxo, iFood vermelho). */
export const DEFAULT_MAQUININHAS_CORES: Record<string, string> = {
  cielo: 'azul',
  rede: 'laranja',
  getnet: 'vermelho',
  voucher: 'roxo',
  ifood: 'vermelho',
};

/**
 * Classes do cabecalho para uma maquininha/modulo. `cores` vem do JSON
 * (`maquininhasCores`); cai nos defaults e por fim em neutro.
 */
export function corHeaderClasses(cores: Record<string, string> | undefined, id: string): string {
  const corId = (cores?.[id] ?? DEFAULT_MAQUININHAS_CORES[id]) as CorMaquininhaId | undefined;
  if (corId && CORES_MAQUININHA[corId]) return CORES_MAQUININHA[corId].header;
  return 'bg-muted/40 text-foreground';
}

/** Id de cor efetivo (para selects de cor no Gerenciar maquininhas). */
export function corIdDe(cores: Record<string, string> | undefined, id: string): CorMaquininhaId | '' {
  const corId = cores?.[id] ?? DEFAULT_MAQUININHAS_CORES[id];
  return COR_IDS.includes(corId as CorMaquininhaId) ? (corId as CorMaquininhaId) : '';
}
