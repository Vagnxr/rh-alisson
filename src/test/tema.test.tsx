/**
 * Renderizacao no tema claro e escuro.
 *
 * jsdom nao aplica o CSS do Tailwind, entao nao da para medir contraste real
 * aqui. O que este teste trava e a CAUSA dos defeitos reportados: classes de cor
 * fixa que o shim de `index.css` nao cobre e que ficavam ilegiveis no escuro.
 */
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { CalculadoraMargemPage } from '@/pages/financeiro/CalculadoraMargemPage';

/** Classes que o shim de dark mode nao cobre — nao podem aparecer no markup. */
const CLASSES_PROIBIDAS = [
  'text-black',
  'divide-slate-100',
  // Par classico de badge claro: fundo claro + texto medio, ilegivel no escuro.
  /bg-\w+-100(?=.*text-\w+-700)/,
];

function classesDoDom(container: HTMLElement): string {
  return [...container.querySelectorAll('*')]
    .map((el) => el.getAttribute('class') ?? '')
    .join(' ');
}

function comTema(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
}

afterEach(() => {
  document.documentElement.classList.remove('dark');
});

describe('Calculadora de Margem — tema', () => {
  it('renderiza no tema claro sem classes de cor problematicas', () => {
    comTema(false);
    const { container } = render(<CalculadoraMargemPage />);
    const classes = classesDoDom(container);

    for (const proibida of CLASSES_PROIBIDAS) {
      if (typeof proibida === 'string') {
        expect(classes).not.toContain(proibida);
      } else {
        expect(classes).not.toMatch(proibida);
      }
    }
  });

  it('renderiza no tema escuro mantendo a estrutura', () => {
    comTema(true);
    const { container, getByText } = render(<CalculadoraMargemPage />);

    expect(getByText('Margem e Markup')).toBeInTheDocument();
    expect(getByText('Descubra o preco de venda (margem)')).toBeInTheDocument();
    expect(classesDoDom(container)).not.toContain('text-black');
  });

  it('valores de resultado usam token de tema ou variante dark explicita', () => {
    const { container } = render(<CalculadoraMargemPage />);
    const celulas = [...container.querySelectorAll('td')];
    expect(celulas.length).toBeGreaterThan(0);

    for (const td of celulas) {
      const cls = td.getAttribute('class') ?? '';
      const temCorFixaSemDark = /text-(emerald|blue|green|red|amber)-(600|700|800|900)\b/.test(cls) && !cls.includes('dark:');
      expect(temCorFixaSemDark).toBe(false);
    }
  });
});

describe('Badges de tipo — padrao neutro', () => {
  it('socio.ts nao expoe mais classes de cor fixa', async () => {
    const { TIPOS_MOVIMENTACAO, getTipoMovimentacaoDisplay } = await import('@/types/socio');

    for (const valor of Object.values(TIPOS_MOVIMENTACAO)) {
      expect(valor).not.toHaveProperty('cor');
    }
    expect(getTipoMovimentacaoDisplay('tipo-customizado')).toEqual({ label: 'tipo-customizado' });
  });
});
