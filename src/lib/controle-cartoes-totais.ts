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
      const ordenados = [...itens].sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''));
      return {
        chave,
        rows: ordenados,
        doc: tarifa,
        // Subtotal sai das proprias linhas: elas ja chegam com o DOC abatido
        // (`abaterDocNasLinhas`, aplicado na origem dos dados da tela). Somar a
        // tarifa de novo aqui cobraria o DOC duas vezes.
        subtotal: calcularTotais(ordenados),
      };
    });
}

/**
 * Abate o DOC nas linhas, agrupando por data de recebimento, SEM reordenar.
 *
 * O rateio por bloco existia so dentro de `agruparPorBlocoCorte`, que a tela usa
 * apenas quando o fechamento e semanal ou quinzenal. Com fechamento `normal`
 * (Alelo e Ben, pela regra do cliente) a tela nao agrupa — e o DOC nao era
 * abatido em lugar nenhum do Controle de Cartoes, enquanto A Receber e Venda e
 * Perda abatiam. As tres telas mostravam numeros diferentes para a mesma venda.
 *
 * Aqui o criterio de bloco e o mesmo dos outros dois: uma data de recebimento
 * distinta e um bloco, com ou sem fechamento configurado.
 */
export function abaterDocNasLinhas(rows: ControleCartoesRow[], doc = 0): ControleCartoesRow[] {
  const tarifa = round2(Number(doc) || 0);
  if (tarifa <= 0 || rows.length === 0) return rows;

  const porData = new Map<string, ControleCartoesRow[]>();
  for (const r of rows) {
    const chave = (r.dataAReceber ?? '').slice(0, 10);
    const atual = porData.get(chave);
    if (atual) atual.push(r);
    else porData.set(chave, [r]);
  }

  const ajustadaPorId = new Map<string, ControleCartoesRow>();
  for (const doBloco of porData.values()) {
    for (const linha of ratearDoc(doBloco, tarifa)) ajustadaPorId.set(linha.id, linha);
  }
  return rows.map((r) => ajustadaPorId.get(r.id) ?? r);
}

/**
 * Distribui o DOC do bloco pelas linhas, proporcional ao a receber de cada uma.
 *
 * O DOC e cobrado uma vez por bloco, mas so aparecia no cabecalho e no subtotal:
 * a linha mostrava R$ 937,00 e o subtotal logo abaixo R$ 928,63, com a diferenca
 * sem explicacao visivel. O cliente: "o DOC tem que estar junto no A RECEBER e
 * nao separado, isso vale para todos".
 *
 * O resto do arredondamento vai para a maior linha, entao a soma das linhas
 * continua batendo exatamente com o subtotal do bloco.
 */
function ratearDoc(rows: ControleCartoesRow[], tarifa: number): ControleCartoesRow[] {
  const base = rows.reduce((acc, r) => acc + (Number(r.aReceber) || 0), 0);
  if (base <= 0) return rows;

  let distribuido = 0;
  const ajustadas = rows.map((r) => {
    const aReceber = Number(r.aReceber) || 0;
    const parte = round2((tarifa * aReceber) / base);
    distribuido = round2(distribuido + parte);
    return {
      ...r,
      aReceber: round2(aReceber - parte),
      desconto: round2(descontoDaLinha(r) + parte),
    };
  });

  const resto = round2(tarifa - distribuido);
  if (resto !== 0) {
    let iMaior = 0;
    for (let i = 1; i < ajustadas.length; i += 1) {
      if (ajustadas[i].aReceber > ajustadas[iMaior].aReceber) iMaior = i;
    }
    ajustadas[iMaior] = {
      ...ajustadas[iMaior],
      aReceber: round2(ajustadas[iMaior].aReceber - resto),
      desconto: round2(ajustadas[iMaior].desconto + resto),
    };
  }
  return ajustadas;
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
