/** Classes semanticas reutilizaveis (light + dark via tokens do tema). */
export const PAGE_TITLE = 'text-xl font-bold text-foreground sm:text-2xl';
export const PAGE_SUBTITLE = 'mt-1 text-sm text-muted-foreground';

export const INPUT_CLASS =
  'flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

/** time/date nativos — legivel no dark mode (color-scheme via index.css) */
export const INPUT_TIME_CLASS = `${INPUT_CLASS} [&::-webkit-calendar-picker-indicator]:opacity-70 [&::-webkit-calendar-picker-indicator]:invert-0 dark:[&::-webkit-calendar-picker-indicator]:invert`;

/** Card/opcao selecionada (evita bg-*-50 fixo de light mode) */
export const OPTION_SELECTED =
  'border-primary bg-primary/15 text-foreground ring-1 ring-primary/25';
export const OPTION_DEFAULT =
  'border-border bg-background text-foreground hover:border-primary/40';

export const INFO_BANNER =
  'flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4';

export const TABLE_CARD = 'min-w-0 overflow-hidden rounded-xl border border-border bg-card';
export const TABLE_HEAD = 'border-b border-border bg-muted/40';
export const TABLE_TH =
  'px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground';
export const TABLE_TD = 'whitespace-nowrap px-6 py-4 text-sm text-foreground';
export const TABLE_ROW_HOVER = 'hover:bg-muted/50';
export const TABLE_EMPTY = 'px-6 py-12 text-center text-sm text-muted-foreground';
export const TABLE_DIVIDE = 'divide-y divide-border';

export const BTN_CANCEL =
  'inline-flex h-10 items-center justify-center rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground';

export const BTN_OUTLINE =
  'inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground';

export const CARD = 'rounded-xl border border-border bg-card';
export const CARD_PADDED = 'rounded-xl border border-border bg-card p-5';
export const CARD_INTERACTIVE =
  'cursor-pointer rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
export const EMPTY_STATE =
  'rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center';
export const MUTED_BOX = 'rounded-lg bg-muted p-2.5';
export const ICON_BTN =
  'rounded p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground';
export const ICON_BTN_DANGER =
  'rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive';
