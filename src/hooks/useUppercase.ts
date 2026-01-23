import { useCallback } from 'react';

/**
 * Hook para normalizar texto para maiúsculas automaticamente
 * Exceção: campos de e-mail não são convertidos
 */
export function useUppercase() {
  const toUppercase = useCallback((value: string, isEmail = false): string => {
    if (isEmail) {
      // E-mail mantém formato original
      return value;
    }
    // Converte para maiúsculas independente do estado do teclado
    return value.toUpperCase();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, isEmail = false) => {
      const input = e.target;
      const cursorPosition = input.selectionStart;
      const originalValue = input.value;
      const newValue = toUppercase(originalValue, isEmail);

      // Atualiza o valor
      input.value = newValue;

      // Restaura posição do cursor
      // Ajusta posição se o valor mudou (ex: espaços removidos)
      const lengthDiff = newValue.length - originalValue.length;
      if (cursorPosition !== null) {
        const newPosition = Math.max(0, Math.min(newValue.length, cursorPosition + lengthDiff));
        input.setSelectionRange(newPosition, newPosition);
      }

      // Dispara evento de mudança
      const syntheticEvent = {
        ...e,
        target: input,
        currentTarget: input,
      } as typeof e;

      return syntheticEvent;
    },
    [toUppercase]
  );

  return {
    toUppercase,
    handleChange,
  };
}
