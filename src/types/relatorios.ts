/** Item de GET /relatorios/despesas-por-categoria */
export interface RelatorioDespesasCategoriaItem {
  categoria: string;
  valor: number;
  percentual: number;
}

export interface RelatorioDespesasPorCategoria {
  total: number;
  itens: RelatorioDespesasCategoriaItem[];
}

/** Item de GET /relatorios/vendas-por-periodo */
export interface RelatorioVendasItem {
  mes: string;
  ano: number;
  valor: number;
}

export interface RelatorioVendasPorPeriodo {
  itens: RelatorioVendasItem[];
}

/** Item de GET /relatorios/fluxo-caixa */
export interface RelatorioFluxoCaixaItem {
  mes: string;
  entradas: number;
  saidas: number;
}

export interface RelatorioFluxoCaixa {
  itens: RelatorioFluxoCaixaItem[];
}

/** Item de GET /relatorios/lucro */
export interface RelatorioLucroItem {
  mes: string;
  entradas: number;
  saidas: number;
  lucro: number;
  margemPercentual: number;
}

export interface RelatorioLucro {
  itens: RelatorioLucroItem[];
}

export interface RelatoriosFiltros {
  dataInicio?: string;
  dataFim?: string;
  lojaId?: string;
}
