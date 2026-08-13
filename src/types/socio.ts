// Tipos para gestao de socios

export interface Socio {
  id: string;
  nome: string;
  cpf: string;
  percentualSociedade: number;
  isAtivo: boolean;
}

export interface MovimentacaoSocio {
  id: string;
  socioId: string;
  socioNome: string;
  data: string;
  /** Tipo fixo ou customizado (backend pode aceitar string). */
  tipo: TipoMovimentacaoSocio | string;
  descricao: string;
  valor: number;
  createdAt: string;
  updatedAt: string;
}

export type TipoMovimentacaoSocio = 'pro-labore' | 'distribuicao' | 'retirada' | 'aporte' | 'outro';

/**
 * Os badges de tipo usam o mesmo padrao neutro de Despesas
 * (`<Badge variant="secondary">`), com tokens do tema. As cores fixas anteriores
 * (`bg-*-100 text-*-700`) ficavam ilegiveis no tema escuro.
 */
export const TIPOS_MOVIMENTACAO: Record<TipoMovimentacaoSocio, { label: string }> = {
  'pro-labore': { label: 'Pro-labore' },
  'distribuicao': { label: 'Distribuicao de Lucros' },
  'retirada': { label: 'Retirada' },
  'aporte': { label: 'Aporte' },
  'outro': { label: 'Outro' },
};

/** Retorna o label para exibicao (tipos fixos ou customizados). */
export function getTipoMovimentacaoDisplay(tipo: string): { label: string } {
  return TIPOS_MOVIMENTACAO[tipo as TipoMovimentacaoSocio] ?? { label: tipo };
}

export interface ResumoSocio {
  socio: Socio;
  totalProLabore: number;
  totalDistribuicao: number;
  totalRetiradas: number;
  totalAportes: number;
  saldoTotal: number;
}
