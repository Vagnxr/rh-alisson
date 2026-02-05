/** Item da agenda (entrada ou saida de um dia). */
export interface AgendaItem {
  id: string;
  descricao?: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  origem?: string;
  pago?: boolean;
}

/** Resumo de um dia (GET /agenda/dias). */
export interface DiaAgenda {
  data: string;
  totalEntradas: number;
  totalSaidas: number;
  itens?: AgendaItem[];
}
