import type { DespesaBase, DespesaInput } from '@/types/despesa';
import { formatDateStringToBR } from '@/lib/date';

export interface DespesaBanco extends DespesaBase {}

export interface DespesaBancoInput extends DespesaInput {
  bancoId?: string;
}

/** Ordem padrao quando a API nao envia columns. Deve refletir o payload de GET /despesas?categoria=despesa-banco (data, tipo, descricao, valor). */
export const DESPESA_BANCO_DEFAULT_ORDER = ['data', 'tipo', 'descricao', 'valor'];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string) {
  return formatDateStringToBR(date);
}

export function formatDateForInput(date: string) {
  return date.split('T')[0];
}
