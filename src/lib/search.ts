/**
 * Normaliza texto para comparacao de pesquisa: minusculo e sem acentos.
 * Reutilizavel em qualquer filtro por termo (maiusculo/minusculo, com ou sem acento).
 */
export function normalizeForSearch(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/**
 * Verifica se um texto contem o termo de pesquisa (case-insensitive, ignora acentos).
 * Use para filtrar listas por nome ou qualquer campo textual.
 *
 * @param text - Texto em que buscar (ex.: nome do item)
 * @param searchTerm - Termo digitado pelo usuario
 * @returns true se o texto contem o termo
 *
 * @example
 * matchesSearchTerm('Controle Depósito', 'deposito') // true
 * matchesSearchTerm('Despesa Fixa', 'FIXA') // true
 */
export function matchesSearchTerm(text: string, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;
  const normalizedText = normalizeForSearch(text);
  const normalizedTerm = normalizeForSearch(searchTerm);
  return normalizedText.includes(normalizedTerm);
}

/**
 * Filtra um array por termo de pesquisa em um ou mais campos.
 *
 * @param items - Array de itens
 * @param searchTerm - Termo digitado pelo usuario
 * @param getSearchableText - Funcao que retorna o(s) texto(s) do item para buscar (ex.: (item) => item.nome)
 * @returns Itens cujo texto contem o termo (ou todos se searchTerm vazio)
 *
 * @example
 * filterBySearchTerm(tabelas, term, (t) => t.nome)
 * filterBySearchTerm(users, term, (u) => [u.nome, u.email].join(' '))
 */
export function filterBySearchTerm<T>(
  items: T[],
  searchTerm: string,
  getSearchableText: (item: T) => string
): T[] {
  if (!searchTerm.trim()) return items;
  const normalizedTerm = normalizeForSearch(searchTerm);
  return items.filter((item) => {
    const text = getSearchableText(item);
    return normalizeForSearch(text).includes(normalizedTerm);
  });
}
