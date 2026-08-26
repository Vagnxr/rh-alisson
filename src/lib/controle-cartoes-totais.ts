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
  /** Tarifa fixa do bloco (DOC), ja embutida no subtotal. Zero quando nao ha. */
  doc: number;
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
 * `doc` e a tarifa fixa da bandeira, cobrada UMA vez por bloco (nao por
 * lancamento). O cliente conferiu: 7 vendas de R$ 1.000,00 a 6,3% dao R$ 6.559,00
 * de a receber, e com o DOC de R$ 8,37 o valor real e R$ 6.550,63. Sai do a
 * receber e entra no desconto, para a identidade `valor - desconto = a receber`
 * continuar valendo no bloco.
 *
 * Blocos saem ordenados por data de recebimento crescente e, dentro de cada
 * bloco, os lancamentos saem em ordem cronologica de venda.
 */
export function agruparPorBlocoCorte(rows: ControleCartoesRow[], doc = 0): BlocoCorte[] {
  const tarifa = round2(Number(doc) || 0);
  const mapa = new Map<string, ControleCartoesRow[]>();
  for (const r of rows) {
    const chave = (r.dataAReceber ?? '').slice(0, 10);
    const atual = mapa.get(chave);
    if (atual) atual.push(r);
    else mapa.set(chave, [r]);
  }
  return [...mapa.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, itens]) => {
      const base = calcularTotais(itens);
      return {
        chave,
        rows: [...itens].sort((a, b) => (a.data ?? '').localeCompare(b.data ?? '')),
        doc: tarifa,
        subtotal:
          tarifa > 0
            ? {
                ...base,
                desconto: round2(base.desconto + tarifa),
                aReceber: round2(base.aReceber - tarifa),
              }
            : base,
      };
    });
}

/**
 * Total da aba somando os subtotais dos blocos — ou seja, ja com o DOC de cada
 * bloco descontado. Somar as linhas cruas ignoraria a tarifa e o rodape nao
 * fecharia com os subtotais exibidos logo acima.
 */
export function calcularTotaisDeBlocos(blocos: BlocoCorte[]): TotaisControleCartoes {
  const t = blocos.reduce(
    (acc, b) => {
      acc.valor += b.subtotal.valor;
      acc.desconto += b.subtotal.desconto;
      acc.aReceber += b.subtotal.aReceber;
      acc.valorLoja += b.subtotal.valorLoja;
      acc.quantidade += b.subtotal.quantidade;
      return acc;
    },
    { valor: 0, desconto: 0, aReceber: 0, valorLoja: 0, quantidade: 0 },
  );
  return {
    valor: round2(t.valor),
    desconto: round2(t.desconto),
    aReceber: round2(t.aReceber),
    valorLoja: round2(t.valorLoja),
    quantidade: t.quantidade,
  };
}

/** True quando alguma linha usa quantidade de cupons (define se a coluna aparece). */
export function temQtdCupons(rows: ControleCartoesRow[]): boolean {
  return rows.some((r) => (r.qtdCupons ?? 0) > 0);
}
