// Tipos para Balanço Geral

export interface BalancoItem {
  descricao: string;
  valor: number;
  percentual: number;
}

export interface BalancoSecao {
  titulo: string;
  items: BalancoItem[];
  total: number;
}

export interface AtivoImobilizado {
  entrada: number;
  saida: number;
}

export interface BalancoMensal {
  mes: string;
  ano: number;
  valorTotal: number;
  despesas: BalancoSecao;
  vendas: BalancoSecao;
  outrosValores: BalancoSecao;
  mercadoriaEntrada: BalancoSecao;
  mercadoriaSaida: BalancoSecao;
  ativoImobilizado: AtivoImobilizado;
  investimento: number;
  rendaExtra: number;
}
