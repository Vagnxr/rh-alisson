/**
 * Ticker do login: os cards precisam PISCAR e atualizar os valores.
 *
 * Regressao reportada pelo cliente em 19/08/2026 ("no login parou de piscar e
 * atualizar os valores"). A causa era o `useEffect` depender de `market`: cada
 * tick recriava o efeito e o cleanup cancelava o timeout que apagaria o flash,
 * entao a classe `flash-*` grudava e o pisca-pisca morria.
 *
 * Com timers falsos da para afirmar o ciclo inteiro: acende, apaga, acende de novo.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { MarketTicker } from './MarketTicker';

const INTERVALO_TICK = 2200;

/** Quantos cards estao acesos neste instante. */
function cardsAcesos(container: HTMLElement): number {
  return container.querySelectorAll('.ticker-card.flash-up, .ticker-card.flash-down').length;
}

function primeiroValor(container: HTMLElement): string {
  return container.querySelector('.ticker-val')?.textContent ?? '';
}

describe('MarketTicker', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // usePrefersReducedMotion consulta matchMedia; sem ele o componente nem monta.
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('acende os cards no tick e apaga antes do proximo', () => {
    const { container } = render(<MarketTicker />);
    expect(cardsAcesos(container)).toBe(0);

    act(() => {
      vi.advanceTimersByTime(INTERVALO_TICK);
    });
    expect(cardsAcesos(container)).toBeGreaterThan(0);

    // O flash se apaga sozinho depois que o ultimo card acendeu (500ms + escalonamento).
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(cardsAcesos(container)).toBe(0);
  });

  it('volta a piscar nos ticks seguintes (nao trava aceso nem apagado)', () => {
    const { container } = render(<MarketTicker />);
    // Avanca ate o primeiro tick; dali em diante cada volta do laco cai
    // exatamente no tick seguinte (1300 + 900 = INTERVALO_TICK), sem deriva.
    act(() => {
      vi.advanceTimersByTime(INTERVALO_TICK);
    });

    for (let i = 0; i < 4; i++) {
      expect(cardsAcesos(container)).toBeGreaterThan(0);
      // 1300ms > 500 + 6 x 120: o ultimo card ja acendeu e o flash se apaga.
      act(() => {
        vi.advanceTimersByTime(1300);
      });
      expect(cardsAcesos(container)).toBe(0);
      act(() => {
        vi.advanceTimersByTime(INTERVALO_TICK - 1300);
      });
    }
  });

  it('atualiza os valores a cada tick', () => {
    const { container } = render(<MarketTicker />);
    const inicial = primeiroValor(container);

    act(() => {
      vi.advanceTimersByTime(INTERVALO_TICK * 3);
    });

    expect(primeiroValor(container)).not.toBe(inicial);
  });

  it('nao agenda nada quando o usuario pede movimento reduzido', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );
    const { container } = render(<MarketTicker />);
    const inicial = primeiroValor(container);

    act(() => {
      vi.advanceTimersByTime(INTERVALO_TICK * 3);
    });

    expect(primeiroValor(container)).toBe(inicial);
    expect(cardsAcesos(container)).toBe(0);
  });
});
