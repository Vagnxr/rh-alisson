/**
 * Totais e subtotais por bloco de corte do Controle de Cartoes.
 *
 * Funcoes puras — cobrem a exigencia do cliente de que os subtotais de Voucher
 * respeitem cada bloco de corte, sem somar lancamentos de ciclos diferentes.
 */
import { describe, expect, it } from 'vitest';
import type { ControleCartoesRow } from '@/types/financeiro';
import {
  abaterDocNasLinhas,
  agruparPorBlocoCorte,
  calcularTotais,
  calcularTotaisDeBlocos,
  descontoDaLinha,
  temQtdCupons,
} from './controle-cartoes-totais';

/** Linha minima; os campos nao informados nao influenciam os totais. */
function linha(over: Partial<ControleCartoesRow> = {}): ControleCartoesRow {
  return {
    id: Math.random().toString(36).slice(2),
    data: '2026-07-16',
    valor: 0,
    desconto: 0,
    aReceber: 0,
    dataAReceber: '2026-07-20',
    ...over,
  };
}

describe('descontoDaLinha', () => {
  it('usa o desconto persistido quando existe', () => {
    expect(descontoDaLinha(linha({ valor: 1000, desconto: 61.56, aReceber: 938.44 }))).toBe(61.56);
  });

  it('deriva de valor - aReceber quando o desconto esta zerado', () => {
    // Lancamento gravado antes de o calculo existir em credito/debito/PIX.
    expect(descontoDaLinha(linha({ valor: 1000, desconto: 0, aReceber: 980 }))).toBe(20);
  });

  it('devolve zero quando nao ha desconto real', () => {
    expect(descontoDaLinha(linha({ valor: 500, desconto: 0, aReceber: 500 }))).toBe(0);
  });

  it('arredonda para centavos', () => {
    expect(descontoDaLinha(linha({ valor: 33.33, desconto: 0, aReceber: 33 }))).toBe(0.33);
  });
});

describe('calcularTotais', () => {
  it('soma valor, desconto e a receber', () => {
    const totais = calcularTotais([
      linha({ valor: 1000, desconto: 20, aReceber: 980 }),
      linha({ valor: 500, desconto: 5, aReceber: 495 }),
    ]);
    expect(totais.valor).toBe(1500);
    expect(totais.desconto).toBe(25);
    expect(totais.aReceber).toBe(1475);
    expect(totais.quantidade).toBe(2);
  });

  it('mantem a identidade valor - desconto = a receber', () => {
    const rows = [
      linha({ valor: 1000, desconto: 0, aReceber: 980 }),
      linha({ valor: 333.33, desconto: 0, aReceber: 320 }),
      linha({ valor: 1000, desconto: 61.56, aReceber: 938.44 }),
    ];
    const t = calcularTotais(rows);
    expect(Math.round((t.valor - t.desconto - t.aReceber) * 100) / 100).toBe(0);
  });

  it('soma valorLoja separadamente (iFood)', () => {
    const t = calcularTotais([
      linha({ valor: 500, desconto: 52.5, aReceber: 447.5, valorLoja: 120 }),
      linha({ valor: 200, desconto: 21, aReceber: 179, valorLoja: 30 }),
    ]);
    expect(t.valor).toBe(700);
    expect(t.valorLoja).toBe(150);
    // valorLoja nao entra em valor nem em aReceber
    expect(t.aReceber).toBe(626.5);
  });

  it('lista vazia devolve tudo zerado', () => {
    const t = calcularTotais([]);
    expect(t).toEqual({ valor: 0, desconto: 0, aReceber: 0, valorLoja: 0, quantidade: 0 });
  });

  it('nao acumula erro de ponto flutuante', () => {
    const rows = Array.from({ length: 10 }, () => linha({ valor: 0.1, aReceber: 0.1 }));
    expect(calcularTotais(rows).valor).toBe(1);
  });
});

describe('agruparPorBlocoCorte', () => {
  it('agrupa por data de recebimento e ordena por data', () => {
    const blocos = agruparPorBlocoCorte([
      linha({ valor: 100, aReceber: 94, dataAReceber: '2026-08-17' }),
      linha({ valor: 200, aReceber: 188, dataAReceber: '2026-07-20' }),
      linha({ valor: 300, aReceber: 282, dataAReceber: '2026-08-17' }),
    ]);

    expect(blocos.map((b) => b.chave)).toEqual(['2026-07-20', '2026-08-17']);
    expect(blocos[0].subtotal.valor).toBe(200);
    expect(blocos[1].subtotal.valor).toBe(400);
    expect(blocos[1].rows).toHaveLength(2);
  });

  it('subtotal de um bloco nao inclui lancamentos de outro', () => {
    const blocos = agruparPorBlocoCorte([
      linha({ valor: 1000, desconto: 61.56, aReceber: 938.44, dataAReceber: '2026-07-20' }),
      linha({ valor: 5000, desconto: 300, aReceber: 4700, dataAReceber: '2026-08-17' }),
    ]);

    const primeiro = blocos.find((b) => b.chave === '2026-07-20')!;
    expect(primeiro.subtotal.valor).toBe(1000);
    expect(primeiro.subtotal.desconto).toBe(61.56);
    expect(primeiro.subtotal.aReceber).toBe(938.44);
  });

  it('a soma dos subtotais bate com o total geral', () => {
    const rows = [
      linha({ valor: 1000, desconto: 20, aReceber: 980, dataAReceber: '2026-07-20' }),
      linha({ valor: 500, desconto: 5, aReceber: 495, dataAReceber: '2026-07-20' }),
      linha({ valor: 300, desconto: 18, aReceber: 282, dataAReceber: '2026-08-17' }),
    ];
    const blocos = agruparPorBlocoCorte(rows);
    const somaSubtotais = blocos.reduce((acc, b) => acc + b.subtotal.valor, 0);
    expect(somaSubtotais).toBe(calcularTotais(rows).valor);
  });

  it('normaliza data com hora para YYYY-MM-DD', () => {
    const blocos = agruparPorBlocoCorte([
      linha({ dataAReceber: '2026-07-20T12:00:00.000Z' }),
      linha({ dataAReceber: '2026-07-20' }),
    ]);
    expect(blocos).toHaveLength(1);
    expect(blocos[0].chave).toBe('2026-07-20');
  });

  it('lista vazia nao gera bloco', () => {
    expect(agruparPorBlocoCorte([])).toEqual([]);
  });

  it('ordena os lancamentos dentro do bloco por data de venda', () => {
    const blocos = agruparPorBlocoCorte([
      linha({ data: '2026-08-25', dataAReceber: '2026-09-21' }),
      linha({ data: '2026-08-19', dataAReceber: '2026-09-21' }),
      linha({ data: '2026-08-22', dataAReceber: '2026-09-21' }),
    ]);
    expect(blocos[0].rows.map((r) => r.data)).toEqual(['2026-08-19', '2026-08-22', '2026-08-25']);
  });
});

describe('abaterDocNasLinhas', () => {
  /*
   * O DOC e abatido na ORIGEM das linhas, nao no agrupamento.
   *
   * Na primeira versao o abatimento vivia dentro de `agruparPorBlocoCorte`, mas
   * a tabela da tela desenha as celulas a partir dos dados de entrada: a coluna
   * A RECEBER seguia mostrando o valor cheio enquanto o subtotal logo abaixo ja
   * vinha com o DOC. Foi o que o cliente viu — "no a receber ta indo o valor sem
   * o doc". Abatendo aqui, todo consumidor le o mesmo numero.
   */

  /** Cenario exato da planilha do cliente: Ticket Alimentacao, DOC de 8,37. */
  const seteVendas = () =>
    Array.from({ length: 7 }, (_, i) =>
      linha({
        data: `2026-08-${19 + i}`,
        valor: 1000,
        desconto: 63,
        aReceber: 937,
        dataAReceber: '2026-09-21',
      }),
    );

  it('abate o DOC no a receber da linha quando ha um unico lancamento', () => {
    const [row] = abaterDocNasLinhas(
      [linha({ valor: 1000, desconto: 63, aReceber: 937, dataAReceber: '2026-09-21' })],
      8.37,
    );
    expect(row.aReceber).toBe(928.63);
    expect(row.desconto).toBe(71.37);
  });

  it('rateia o DOC entre as linhas do mesmo recebimento', () => {
    const rows = abaterDocNasLinhas(
      [
        linha({ valor: 1000, desconto: 63, aReceber: 937, dataAReceber: '2026-09-21' }),
        linha({ valor: 1000, desconto: 63, aReceber: 937, dataAReceber: '2026-09-21' }),
      ],
      8.37,
    );
    // 8,37 / 2 = 4,185, que arredonda para 4,18 em cada linha; o centavo que
    // sobra sai da maior (empate: a primeira), fechando exatamente 8,37.
    expect(rows.map((r) => r.aReceber)).toEqual([932.81, 932.82]);
  });

  it('cobra o DOC uma vez por data de recebimento, nao por lancamento', () => {
    const rows = abaterDocNasLinhas(seteVendas(), 8.37);
    const somaAReceber = rows.reduce((acc, r) => acc + r.aReceber, 0);
    // 7 vendas, um unico recebimento: 6.559,00 - 8,37.
    expect(Math.round(somaAReceber * 100) / 100).toBe(6550.63);
  });

  it('cobra um DOC para cada data de recebimento distinta', () => {
    const rows = abaterDocNasLinhas(
      [
        linha({ valor: 1000, desconto: 63, aReceber: 937, dataAReceber: '2026-09-14' }),
        linha({ valor: 1000, desconto: 63, aReceber: 937, dataAReceber: '2026-09-21' }),
        linha({ valor: 1000, desconto: 63, aReceber: 937, dataAReceber: '2026-09-21' }),
      ],
      8.37,
    );
    const t = calcularTotais(rows);
    expect(t.desconto).toBe(205.74); // 189 + 2 x 8,37
    expect(t.aReceber).toBe(2794.26); // 2811 - 16,74
  });

  it('preserva a ordem original das linhas', () => {
    const entrada = [
      linha({ id: 'c', data: '2026-08-21', valor: 300, aReceber: 281.1, dataAReceber: '2026-09-21' }),
      linha({ id: 'a', data: '2026-08-19', valor: 1000, aReceber: 937, dataAReceber: '2026-09-21' }),
      linha({ id: 'b', data: '2026-08-20', valor: 500, aReceber: 468.5, dataAReceber: '2026-09-21' }),
    ];
    expect(abaterDocNasLinhas(entrada, 8.37).map((r) => r.id)).toEqual(['c', 'a', 'b']);
  });

  it('nao altera nada quando a bandeira nao cobra DOC', () => {
    const entrada = [linha({ valor: 1000, desconto: 63, aReceber: 937, dataAReceber: '2026-09-21' })];
    expect(abaterDocNasLinhas(entrada, 0)[0].aReceber).toBe(937);
  });

  it('mantem valor - desconto = a receber em cada linha', () => {
    for (const r of abaterDocNasLinhas(seteVendas(), 8.37)) {
      expect(Math.round((r.valor - r.desconto - r.aReceber) * 100) / 100).toBe(0);
    }
  });
});

describe('agruparPorBlocoCorte', () => {
  /* Agrupa e soma; o DOC ja chegou abatido nas linhas (ver acima). */

  it('separa os lancamentos por data de recebimento', () => {
    const blocos = agruparPorBlocoCorte(
      abaterDocNasLinhas(
        [
          linha({ valor: 1000, desconto: 63, aReceber: 937, dataAReceber: '2026-09-14' }),
          linha({ valor: 1000, desconto: 63, aReceber: 937, dataAReceber: '2026-09-21' }),
          linha({ valor: 1000, desconto: 63, aReceber: 937, dataAReceber: '2026-09-21' }),
        ],
        8.37,
      ),
      8.37,
    );
    expect(blocos).toHaveLength(2);
    expect(blocos.map((b) => b.chave)).toEqual(['2026-09-14', '2026-09-21']);
  });

  it('o subtotal fecha exatamente com a soma das linhas do bloco', () => {
    const rows = abaterDocNasLinhas(
      [
        linha({ valor: 1000, desconto: 63, aReceber: 937, dataAReceber: '2026-09-21' }),
        linha({ valor: 500, desconto: 31.5, aReceber: 468.5, dataAReceber: '2026-09-21' }),
        linha({ valor: 300, desconto: 18.9, aReceber: 281.1, dataAReceber: '2026-09-21' }),
      ],
      8.37,
    );
    const [bloco] = agruparPorBlocoCorte(rows, 8.37);
    const soma = bloco.rows.reduce((acc, r) => acc + r.aReceber, 0);
    expect(Math.round(soma * 100) / 100).toBe(bloco.subtotal.aReceber);
  });

  it('nao cobra o DOC de novo no subtotal', () => {
    const rows = abaterDocNasLinhas(
      [linha({ valor: 1000, desconto: 63, aReceber: 937, dataAReceber: '2026-09-21' })],
      8.37,
    );
    const [bloco] = agruparPorBlocoCorte(rows, 8.37);
    expect(bloco.subtotal.aReceber).toBe(928.63);
    expect(bloco.doc).toBe(8.37);
  });
});

describe('calcularTotaisDeBlocos', () => {
  it('soma os subtotais ja com DOC, batendo com o rodape da tela', () => {
    const blocos = agruparPorBlocoCorte(
      abaterDocNasLinhas(
        [
          linha({ valor: 1000, desconto: 20, aReceber: 980, dataAReceber: '2026-07-20' }),
          linha({ valor: 500, desconto: 5, aReceber: 495, dataAReceber: '2026-08-17' }),
        ],
        10,
      ),
      10,
    );
    const t = calcularTotaisDeBlocos(blocos);
    expect(t.valor).toBe(1500);
    expect(t.aReceber).toBe(1455); // 1475 - 2 x 10 (um DOC por recebimento)
    expect(t.quantidade).toBe(2);
  });

  it('lista vazia devolve tudo zerado', () => {
    expect(calcularTotaisDeBlocos([])).toEqual({
      valor: 0,
      desconto: 0,
      aReceber: 0,
      valorLoja: 0,
      quantidade: 0,
    });
  });
});

describe('temQtdCupons', () => {
  it('true quando alguma linha usa cupons', () => {
    expect(temQtdCupons([linha(), linha({ qtdCupons: 2 })])).toBe(true);
  });

  it('false quando nenhuma usa', () => {
    expect(temQtdCupons([linha(), linha({ qtdCupons: 0 })])).toBe(false);
    expect(temQtdCupons([])).toBe(false);
  });
});
