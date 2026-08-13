import { useCallback, useRef } from 'react';

/**
 * Protege telas com filtro contra respostas fora de ordem.
 *
 * Trocar mes, aba, maquininha ou bandeira dispara uma nova busca enquanto a
 * anterior ainda esta em voo. Sem guarda, a resposta antiga pode chegar depois
 * e sobrescrever a tela com dados do periodo errado — normalmente zerando tudo,
 * porque o filtro anterior costuma nao ter resultado.
 *
 * Uso:
 * ```ts
 * const iniciarBusca = useLatestRequest();
 * const fetchData = useCallback(() => {
 *   const ehAtual = iniciarBusca();
 *   api.get(...).then((r) => { if (ehAtual()) setDados(r.data); });
 * }, [params, iniciarBusca]);
 * ```
 *
 * @returns funcao que registra uma nova busca e devolve `ehAtual()` — `true`
 *          enquanto nenhuma busca mais recente tiver comecado.
 */
export function useLatestRequest(): () => () => boolean {
  const ultima = useRef(0);

  return useCallback(() => {
    const id = ++ultima.current;
    return () => id === ultima.current;
  }, []);
}
