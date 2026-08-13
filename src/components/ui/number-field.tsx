import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/**
 * Campo numerico editavel para taxa, prazo e tarifas.
 *
 * Substitui o padrao `<input type="number" value={n} onChange={parseFloat(v) || 0}>`,
 * que tinha tres defeitos:
 * - nao dava para APAGAR o campo (vazio virava 0 na hora);
 * - nao dava para digitar decimal: ao teclar "6," o parse intermediario
 *   devolvia 0 e o campo saltava de volta, tornando "6,3" impossivel;
 * - `type="number"` rejeita virgula em varios navegadores.
 *
 * Aqui o texto digitado fica num buffer local e so vira numero no commit (blur
 * ou Enter). Durante a digitacao nada e parseado, entao "0,79" e "6,3" podem ser
 * escritos caractere a caractere.
 */
interface NumberFieldProps {
  value: number | undefined;
  /** Chamado no blur/Enter com o valor ja parseado e limitado. */
  onCommit: (value: number | undefined) => void;
  /** Casas decimais aceitas. 0 = inteiro (prazo, dia do mes). */
  decimals?: number;
  min?: number;
  max?: number;
  /** Permite deixar vazio, comitando `undefined` (ex.: override que volta a herdar). */
  allowEmpty?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  title?: string;
  'aria-label'?: string;
  'data-testid'?: string;
}

/** Formata para exibicao, no padrao brasileiro (virgula decimal, sem separador de milhar). */
function paraTexto(value: number | undefined, decimals: number): string {
  if (value == null || !Number.isFinite(value)) return '';
  return decimals > 0 ? String(value).replace('.', ',') : String(Math.trunc(value));
}

/** Converte o texto digitado em numero. Devolve `undefined` para entrada vazia ou invalida. */
function paraNumero(texto: string, decimals: number): number | undefined {
  const limpo = texto.trim().replace(',', '.');
  if (limpo === '' || limpo === '-' || limpo === '.') return undefined;
  const n = Number(limpo);
  if (!Number.isFinite(n)) return undefined;
  return decimals > 0 ? Math.round(n * 10 ** decimals) / 10 ** decimals : Math.trunc(n);
}

export function NumberField({
  value,
  onCommit,
  decimals = 2,
  min,
  max,
  allowEmpty = false,
  placeholder,
  className,
  id,
  disabled,
  title,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}: NumberFieldProps) {
  const [texto, setTexto] = useState(() => paraTexto(value, decimals));
  const focado = useRef(false);
  /** Escape chama blur(), que dispararia o commit da edicao que se quer descartar. */
  const descartando = useRef(false);

  // Ressincroniza com o valor externo apenas quando o campo NAO esta focado —
  // do contrario o texto em digitacao seria sobrescrito a cada render.
  useEffect(() => {
    if (!focado.current) setTexto(paraTexto(value, decimals));
  }, [value, decimals]);

  const commit = () => {
    const parsed = paraNumero(texto, decimals);

    if (parsed === undefined) {
      if (allowEmpty) {
        setTexto('');
        onCommit(undefined);
      } else {
        // Sem allowEmpty, campo vazio volta ao valor anterior em vez de virar 0.
        setTexto(paraTexto(value, decimals));
      }
      return;
    }

    let final = parsed;
    if (min != null && final < min) final = min;
    if (max != null && final > max) final = max;

    setTexto(paraTexto(final, decimals));
    if (final !== value) onCommit(final);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      id={id}
      title={title}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      disabled={disabled}
      placeholder={placeholder}
      value={texto}
      onFocus={() => {
        focado.current = true;
      }}
      onChange={(e) => {
        // Somente sanitiza: nenhum parse, nenhum commit durante a digitacao.
        const permitido = decimals > 0 ? /[^0-9.,-]/g : /[^0-9-]/g;
        setTexto(e.target.value.replace(permitido, ''));
      }}
      onBlur={() => {
        focado.current = false;
        if (descartando.current) {
          descartando.current = false;
          setTexto(paraTexto(value, decimals));
          return;
        }
        commit();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commit();
        } else if (e.key === 'Escape') {
          descartando.current = true;
          setTexto(paraTexto(value, decimals));
          e.currentTarget.blur();
        }
      }}
      className={cn(
        'rounded-lg border border-input bg-background px-2 py-1.5 text-center text-sm text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500',
        'disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground',
        className,
      )}
    />
  );
}
