export interface Parcelamento {
  id: string;
  data: string;
  descricao: string;
  parcela: string; // Ex: "3/12"
  valor: number;
  createdAt: string;
  updatedAt: string;
}

export interface ParcelamentoInput {
  data: string;
  descricao: string;
  parcela: string;
  valor: number;
}
