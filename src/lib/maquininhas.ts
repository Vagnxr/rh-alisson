/**
 * Catalogo compartilhado de maquininhas (operadoras) — usado em duas paginas:
 * - ControleCartoesPage: lista as maquininhas disponiveis para selecionar no lancamento
 * - TaxasPrazosPage: lista as maquininhas que precisam de taxa+prazo configurada
 *
 * Para criar uma maquininha custom (Banescard, etc.), o usuario usa o "Gerenciar maquininhas"
 * em Controle de Cartoes. Customs sao persistidas em `taxas.maquininhasCustom` no JSON do tenant.
 */

/** Maquininha padrao (id + label exibida). */
export interface MaquininhaPadrao {
  id: string;
  label: string;
}

/** Lista de maquininhas padrao do sistema. Sempre disponiveis (nao podem ser deletadas). */
export const MAQUININHAS_PADRAO_LIST: MaquininhaPadrao[] = [
  { id: 'cielo', label: 'Cielo' },
  { id: 'rede', label: 'Rede' },
  { id: 'getnet', label: 'GetNet' },
  { id: 'stone', label: 'Stone' },
  { id: 'pagbank', label: 'PagBank' },
  { id: 'mercado-pago', label: 'Mercado Pago' },
  { id: 'safrapay', label: 'SafraPay' },
  { id: 'infinite-pay', label: 'InfinitePay' },
];

/** Set de ids para lookup rapido. */
export const MAQUININHAS_PADRAO_IDS: Set<string> = new Set(MAQUININHAS_PADRAO_LIST.map((m) => m.id));

/** Habilitadas por padrao quando o tenant nao configurou nada ainda. */
export const MAQUININHAS_PADRAO_HABILITADAS: string[] = ['cielo', 'rede', 'getnet'];
