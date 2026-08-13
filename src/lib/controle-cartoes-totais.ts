/**
 * Totais e subtotais da tabela de Controle de Cartoes.
 *
 * Funcoes puras, sem React nem DOM — o calculo dos rodapes precisa ser
 * verificavel isoladamente, e a tela apenas renderiza o resultado.
 *
 * O desconto exibido e sempre a diferenca financeira efetiva entre o bruto e o
 * liquido (`valor - aReceber`), nunca `valor x taxa`: bandeiras de voucher
 * tambem cobram tarifa por venda/cupom, que entra nessa diferenca.
 */
import type { ControleCartoesRow } from '@/types/financeiro';

export interface TotaisControleCartoes {
  valor: number;
  desconto: number;
  aReceber: number;
  /** So relevante no iFood; zero nas demais abas. */
  valorLoja: number;
  quantidade: number;
}

export interface BlocoCorte {
  /** Data de recebimento comum ao bloco (`YYYY-MM-DD`). */
  chave: string;
  rows: ControleCartoesRow[];
  subtotal: TotaisControleCartoes;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Desconto financeiro de uma linha: bruto menos liquido. */
export function descontoDaLinha(row: Pick<ControleCartoesRow, 'valor' | 'aReceber' | 'desconto'>): number {
  const valor = Number(row.valor) || 0;
  const aReceber = Number(row.aReceber) || 0;
  const diferenca = round2(valor - aReceber);
  // `desconto` persistido e a fonte primaria; a diferenca cobre lancamentos
  // gravados antes de o calculo existir em credito/debito/PIX.
  const persistido = Number(row.desconto) || 0;
  return persistido > 0 ? persistido : diferenca;
}

export function calcularTotais(rows: ControleCartoesRow[]): TotaisControleCartoes {
  const t = rows.reduce(
    (acc, r) => {
      acc.valor += Number(r.valor) || 0;
      acc.desconto += descontoDaLinha(r);
      acc.aReceber += Number(r.aReceber) || 0;
      acc.valorLoja += Number(r.valorLoja) || 0;
      return acc;
    },
    { valor: 0, desconto: 0, aReceber: 0, valorLoja: 0, quantidade: rows.length },
  );
  return {
    valor: round2(t.valor),
    desconto: round2(t.desconto),
    aReceber: round2(t.aReceber),
    valorLoja: round2(t.valorLoja),
    quantidade: t.quantidade,
  };
}

/**
 * Agrupa lancamentos por bloco de corte.
 *
 * O bloco e identificado pela data de recebimento: lancamentos que caem no mesmo
 * fechamento sao pagos juntos, na mesma data. Somar blocos diferentes num
 * subtotal unico misturaria ciclos distintos.
 *
 * Blocos saem ordenados por data de recebimento crescente.
 */
export function agruparPorBlocoCorte(rows: ControleCartoesRow[]): BlocoCorte[] {
  const mapa = new Map<string, ControleCartoesRow[]>();
  for (const r of rows) {
    const chave = (r.dataAReceber ?? '').slice(0, 10);
    const atual = mapa.get(chave);
    if (atual) atual.push(r);
    else mapa.set(chave, [r]);
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, itens]) => ({ chave, rows: itens, subtotal: calcularTotais(itens) }));
}

/** True quando alguma linha usa quantidade de cupons (define se a coluna aparece). */
export function temQtdCupons(rows: ControleCartoesRow[]): boolean {
  return rows.some((r) => (r.qtdCupons ?? 0) > 0);
}
