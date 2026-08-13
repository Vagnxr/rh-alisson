/**
 * Calculadora de Margem — os dois cards precisam ser independentes.
 *
 * Antes ambos usavam o mesmo estado `precoCusto`, entao digitar o custo num
 * card alterava o outro em tempo real.
 */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { CalculadoraMargemPage } from './CalculadoraMargemPage';

/** Os dois cards, identificados pelo titulo. */
function pegarCards() {
  const esquerdo = screen.getByText('Margem e Markup').closest('div')!.parentElement!;
  const direito = screen.getByText('Descubra o preco de venda (margem)').closest('div')!.parentElement!;
  return { esquerdo, direito };
}

describe('CalculadoraMargem — estados independentes', () => {
  it('preco de custo do card esquerdo nao altera o direito', async () => {
    const user = userEvent.setup();
    render(<CalculadoraMargemPage />);

    const custoEsquerdo = document.querySelector('#markup-custo') as HTMLInputElement;
    await user.type(custoEsquerdo, '100');

    const custoDireito = document.querySelector('#margem-custo') as HTMLInputElement;
    expect(custoEsquerdo.value).not.toBe('');
    expect(custoDireito.value).toBe('');
  });

  it('preco de custo do card direito nao altera o esquerdo', async () => {
    const user = userEvent.setup();
    render(<CalculadoraMargemPage />);

    const custoDireito = document.querySelector('#margem-custo') as HTMLInputElement;
    await user.type(custoDireito, '250');

    const custoEsquerdo = document.querySelector('#markup-custo') as HTMLInputElement;
    expect(custoEsquerdo.value).toBe('');
    expect(custoDireito.value).not.toBe('');
  });

  it('os campos de custo tem ids distintos (nao compartilham chave)', () => {
    render(<CalculadoraMargemPage />);
    const esquerdo = document.querySelector('#markup-custo');
    const direito = document.querySelector('#margem-custo');
    expect(esquerdo).not.toBeNull();
    expect(direito).not.toBeNull();
    expect(esquerdo).not.toBe(direito);
  });
});

describe('CalculadoraMargem — calculos', () => {
  it('card esquerdo calcula lucro, markup e margem', async () => {
    const user = userEvent.setup();
    render(<CalculadoraMargemPage />);

    await user.type(document.querySelector('#markup-custo') as HTMLInputElement, '100');
    await user.type(document.querySelector('#markup-venda') as HTMLInputElement, '150');

    const { esquerdo } = pegarCards();
    // custo 100, venda 150 => lucro 50, markup 50%, margem 33,33%
    expect(within(esquerdo).getByText('50,00%')).toBeInTheDocument();
    expect(within(esquerdo).getByText('33,33%')).toBeInTheDocument();
  });

  it('card direito calcula o preco de venda pela margem desejada', async () => {
    const user = userEvent.setup();
    render(<CalculadoraMargemPage />);

    await user.type(document.querySelector('#margem-custo') as HTMLInputElement, '100');
    const margem = document.querySelector('#margem-desejada') as HTMLInputElement;
    await user.type(margem, '20');
    await user.tab();

    const { direito } = pegarCards();
    // 100 / (1 - 0,20) = 125,00
    expect(within(direito).getByText(/125,00/)).toBeInTheDocument();
  });

  it('calcular num card nao produz resultado no outro', async () => {
    const user = userEvent.setup();
    render(<CalculadoraMargemPage />);

    await user.type(document.querySelector('#markup-custo') as HTMLInputElement, '100');
    await user.type(document.querySelector('#markup-venda') as HTMLInputElement, '150');

    const { direito } = pegarCards();
    // Sem custo nem margem no card direito, o preco sugerido segue vazio.
    expect(within(direito).getAllByText('-').length).toBeGreaterThan(0);
  });
});
