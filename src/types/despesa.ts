export interface DespesaFixa {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  createdAt: string;
  updatedAt: string;
}

export interface DespesaFixaInput {
  data: string;
  descricao: string;
  valor: number;
}
