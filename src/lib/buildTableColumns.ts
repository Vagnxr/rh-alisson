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
 * @param ensureColumnIds Ids que devem aparecer na tabela; se a API nao enviar, sao inseridos apos "data"
 */
export function buildTableColumns<T>(
  columnDefsByKey: Record<string, ColumnDef<T>>,
  apiColumns: TableColumnConfigFromApi[] | null | undefined,
  defaultOrder: string[],
  actionsColumn?: ColumnDef<T>,
  ensureColumnIds?: string[]
): ColumnDef<T>[] {
  let order = apiColumns?.length
    ? [...apiColumns].sort((a, b) => a.order - b.order).map((c) => c.id)
    : defaultOrder;

  if (ensureColumnIds?.length) {
    for (const id of ensureColumnIds) {
      if (!order.includes(id) && columnDefsByKey[id]) {
        const afterData = order.indexOf('data');
        const insertAt = afterData >= 0 ? afterData + 1 : 0;
        order = [...order.slice(0, insertAt), id, ...order.slice(insertAt)];
      }
    }
  }

  const result: ColumnDef<T>[] = [];
  for (const id of order) {
    const def = columnDefsByKey[id];
    if (def) result.push(def);
  }
  if (actionsColumn) result.push(actionsColumn);
  return result;
}
