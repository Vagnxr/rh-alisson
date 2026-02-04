/** Item de uma secao do balanco (despesas, vendas, etc.) */
export interface BalancoItem {
  descricao: string;
  valor: number;
  percentual: number;
  lojaId?: string;
  lojaNome?: string;
}

export interface BalancoSecao {
  items: BalancoItem[];
  total: number;
}

/** Resposta do GET /balanco/mensal */
export interface BalancoMensal {
  mes: string;
  mesNumero: number;
  ano: number;
  valorTotalVendas: number;
  despesas: BalancoSecao;
  vendas: BalancoSecao;
  outrosValores: BalancoSecao;
  mercadoriaEntrada: BalancoSecao;
  mercadoriaSaida: BalancoSecao;
  ativoImobilizado: { entrada: number; saida: number };
  investimento: number;
  rendaExtra: number;
}

export interface BalancoFiltros {
  mes?: number;
  ano?: number;
  lojaId?: string;
}
