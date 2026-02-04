import type { ColumnDef } from '@tanstack/react-table';
import type { TableColumnConfigFromApi } from '@/types/configuracao';

/**
 * Monta o array de ColumnDef para useReactTable a partir das definicoes por id
 * e (opcionalmente) das colunas retornadas pela API.
 * Quando a API enviar `columns`, so exibe e ordena conforme o backend.
 * Quando nao houver (mock), usa defaultOrder.
 * @param columnDefsByKey Mapa id -> ColumnDef (sem a coluna de acoes)
 * @param apiColumns Colunas vindas da resposta (GET lista). Se presente, define ordem e quais exibir
 * @param defaultOrder Ordem padrao dos ids quando apiColumns nao existe
 * @param actionsColumn Coluna de acoes (ex.: editar, excluir). Sempre anexada ao final
 */
export function buildTableColumns<T>(
  columnDefsByKey: Record<string, ColumnDef<T>>,
  apiColumns: TableColumnConfigFromApi[] | null | undefined,
  defaultOrder: string[],
  actionsColumn?: ColumnDef<T>
): ColumnDef<T>[] {
  const order = apiColumns?.length
    ? [...apiColumns].sort((a, b) => a.order - b.order).map((c) => c.id)
    : defaultOrder;

  const result: ColumnDef<T>[] = [];
  for (const id of order) {
    const def = columnDefsByKey[id];
    if (def) result.push(def);
  }
  if (actionsColumn) result.push(actionsColumn);
  return result;
}
