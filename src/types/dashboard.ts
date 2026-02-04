/** Resposta do GET /dashboard/resumo */
export interface DashboardResumo {
  receitaTotal: { valor: number; variacaoPercentual: number };
  despesas: { valor: number; variacaoPercentual: number };
  saldoAtual: { valor: number; variacaoPercentual: number };
  investimentos: { valor: number; variacaoPercentual: number };
}

/** Item da lista GET /dashboard/transacoes-recentes */
export interface DashboardTransacao {
  id: string;
  description: string;
  category: string;
  value: number;
  date: string;
  type: 'income' | 'expense';
}

export interface DashboardFiltros {
  dataInicio?: string;
  dataFim?: string;
  lojaId?: string;
  limit?: number;
}
