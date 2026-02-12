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

export const TIPOS_MOVIMENTACAO: Record<TipoMovimentacaoSocio, { label: string; cor: string }> = {
  'pro-labore': { label: 'Pro-labore', cor: 'bg-blue-100 text-blue-700' },
  'distribuicao': { label: 'Distribuicao de Lucros', cor: 'bg-emerald-100 text-emerald-700' },
  'retirada': { label: 'Retirada', cor: 'bg-amber-100 text-amber-700' },
  'aporte': { label: 'Aporte', cor: 'bg-purple-100 text-purple-700' },
  'outro': { label: 'Outro', cor: 'bg-slate-100 text-slate-700' },
};

/** Retorna label e cor para exibicao (tipos fixos ou customizados). */
export function getTipoMovimentacaoDisplay(tipo: string): { label: string; cor: string } {
  const fixed = TIPOS_MOVIMENTACAO[tipo as TipoMovimentacaoSocio];
  if (fixed) return fixed;
  return { label: tipo, cor: 'bg-slate-100 text-slate-700' };
}

export interface ResumoSocio {
  socio: Socio;
  totalProLabore: number;
  totalDistribuicao: number;
  totalRetiradas: number;
  totalAportes: number;
  saldoTotal: number;
}
