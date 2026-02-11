/** Item da agenda (entrada ou saida de um dia). */
export interface AgendaItem {
  id: string;
  descricao?: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  /** Origem do item (ex.: "Despesa Fixa", "Despesa Extra"). */
  origem?: string;
  /** Tipo da despesa quando vindo de despesa (ex.: ALUGUEL, LUZ). */
  tipoDespesa?: string;
  pago?: boolean;
}

/** Resumo de um dia (GET /agenda/dias). */
export interface DiaAgenda {
  data: string;
  totalEntradas: number;
  totalSaidas: number;
  itens?: AgendaItem[];
}

/** Payload para lancar item direto na agenda (apenas na agenda, sem despesa). Contrato backend: data, valor, descricao?, lojaId?. */
export interface AgendaItemDirectInput {
  data: string;
  descricao?: string;
  valor: number;
  lojaId?: string;
  /** Apenas no formulario (backend nao suporta ainda). */
  tipo?: 'entrada' | 'saida';
  recorrencia?: string;
  recorrenciaFim?: string;
}
