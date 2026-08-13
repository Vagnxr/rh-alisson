/**
 * NumberField — correcao do "bug do valor zero" em Taxas e Prazos.
 *
 * O padrao anterior (`<input type="number" onChange={parseFloat(v) || 0}>`)
 * impedia apagar o campo e digitar decimais: valores intermediarios viravam 0.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { NumberField } from './number-field';

/** Wrapper controlado, como as telas usam o componente. */
function Controlado({
  inicial,
  onCommit,
  ...props
}: {
  inicial?: number;
  onCommit: (v: number | undefined) => void;
  decimals?: number;
  min?: number;
  max?: number;
  allowEmpty?: boolean;
}) {
  const [valor, setValor] = useState<number | undefined>(inicial);
  return (
    <NumberField
      value={valor}
      aria-label="campo"
      onCommit={(v) => {
        setValor(v);
        onCommit(v);
      }}
      {...props}
    />
  );
}

describe('NumberField — digitacao de decimais', () => {
  it('permite digitar 6,3 caractere a caractere', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Controlado inicial={0} onCommit={onCommit} />);

    const input = screen.getByLabelText('campo');
    await user.clear(input);
    await user.type(input, '6,3');

    // Durante a digitacao nada e comitado — e isso que permitia o campo saltar para 0.
    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue('6,3');

    await user.tab();
    expect(onCommit).toHaveBeenCalledWith(6.3);
  });

  it('aceita 0,79', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Controlado inicial={0} onCommit={onCommit} />);

    const input = screen.getByLabelText('campo');
    await user.clear(input);
    await user.type(input, '0,79');
    await user.tab();

    expect(onCommit).toHaveBeenCalledWith(0.79);
  });

  it('aceita ponto como separador decimal', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Controlado inicial={0} onCommit={onCommit} />);

    const input = screen.getByLabelText('campo');
    await user.clear(input);
    await user.type(input, '6.3');
    await user.tab();

    expect(onCommit).toHaveBeenCalledWith(6.3);
  });

  it('aceita inteiro simples', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Controlado inicial={0} onCommit={onCommit} />);

    const input = screen.getByLabelText('campo');
    await user.clear(input);
    await user.type(input, '2');
    await user.tab();

    expect(onCommit).toHaveBeenCalledWith(2);
  });

  it('aceita zero explicito', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Controlado inicial={5} onCommit={onCommit} />);

    const input = screen.getByLabelText('campo');
    await user.clear(input);
    await user.type(input, '0');
    await user.tab();

    expect(onCommit).toHaveBeenCalledWith(0);
  });
});

describe('NumberField — campo vazio', () => {
  it('com allowEmpty, apagar tudo comita undefined', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Controlado inicial={5} onCommit={onCommit} allowEmpty />);

    const input = screen.getByLabelText('campo');
    await user.clear(input);
    expect(input).toHaveValue(''); // o campo PODE ficar vazio durante a edicao
    await user.tab();

    expect(onCommit).toHaveBeenCalledWith(undefined);
  });

  it('sem allowEmpty, apagar tudo restaura o valor anterior (nao vira 0)', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Controlado inicial={7.5} onCommit={onCommit} />);

    const input = screen.getByLabelText('campo');
    await user.clear(input);
    await user.tab();

    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue('7,5');
  });
});

describe('NumberField — limites e teclas', () => {
  it('aplica min e max no commit', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Controlado inicial={10} onCommit={onCommit} min={0} max={28} decimals={0} />);

    const input = screen.getByLabelText('campo');
    await user.clear(input);
    await user.type(input, '99');
    await user.tab();

    expect(onCommit).toHaveBeenCalledWith(28);
  });

  it('decimals=0 trunca para inteiro', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Controlado inicial={1} onCommit={onCommit} decimals={0} />);

    const input = screen.getByLabelText('campo');
    await user.clear(input);
    await user.type(input, '30');
    await user.tab();

    expect(onCommit).toHaveBeenCalledWith(30);
  });

  it('Enter comita sem precisar sair do campo', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Controlado inicial={0} onCommit={onCommit} />);

    const input = screen.getByLabelText('campo');
    await user.clear(input);
    await user.type(input, '3,5{Enter}');

    expect(onCommit).toHaveBeenCalledWith(3.5);
  });

  it('Escape descarta a edicao', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Controlado inicial={4} onCommit={onCommit} />);

    const input = screen.getByLabelText('campo');
    await user.clear(input);
    await user.type(input, '99');
    await user.keyboard('{Escape}');

    expect(onCommit).not.toHaveBeenCalled();
    expect(input).toHaveValue('4');
  });

  it('nao comita quando o valor nao mudou', async () => {
    const user = userEvent.setup();
    const onCommit = vi.fn();
    render(<Controlado inicial={6.3} onCommit={onCommit} />);

    const input = screen.getByLabelText('campo');
    await user.click(input);
    await user.tab();

    expect(onCommit).not.toHaveBeenCalled();
  });
});
