/** Item da agenda (entrada ou saida de um dia). */
export interface AgendaItem {
  id: string;
  descricao?: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  /** Origem do item (ex.: "Despesa Fixa", "Parcelamento"). */
  origem?: string;
  /** Tipo da despesa quando vindo de despesa (ex.: ALUGUEL, LUZ). */
  tipoDespesa?: string;
  /** Parcela quando origem e Parcelamento (ex.: "1/3"). Exibir na agenda para identificar qual parcela. */
  parcela?: string;
  pago?: boolean;
}

/** Resumo de um dia (GET /agenda/dias). */
export interface DiaAgenda {
  data: string;
  totalEntradas: number;
  totalSaidas: number;
  itens?: AgendaItem[];
}

/** Payload para lancar item direto na agenda (apenas na agenda, sem despesa). Agenda e so soma; sem campo tipo. */
export interface AgendaItemDirectInput {
  data: string;
  descricao: string;
  valor: number;
  lojaId?: string;
  recorrencia?: string;
  recorrenciaFim?: string;
}

/** Parcela para POST com array (recorrencia por lista de datas). */
export interface AgendaParcelaInput {
  data: string;
  valor: number;
}

/** Body para lancar na agenda em lote (POST com parcelas). */
export interface AgendaItemDirectComParcelasInput {
  descricao: string;
  lojaId?: string;
  parcelas: AgendaParcelaInput[];
}
