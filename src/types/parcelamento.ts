export interface Parcelamento {
  id: string;
  data: string;
  descricao: string;
  parcela: string; // Ex: "3/12"
  valor: number;
  comunicarAgenda?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParcelamentoInput {
  data: string;
  descricao: string;
  parcela: string;
  valor: number;
  comunicarAgenda?: boolean;
}
