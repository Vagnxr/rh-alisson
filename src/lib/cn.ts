import { clsx, type ClassValue } from 'clsx';

/**
 * Helper para compor className de forma legível.
 * - Funciona com strings, arrays, objetos condicionais, etc. (via clsx)
 * - Mantém o uso simples: cn('a', cond && 'b', { c: cond2 })
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
