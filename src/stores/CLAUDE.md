# Stores Zustand — Padrão CRUD

27 stores seguindo o mesmo padrão. Ao criar nova store, **copie uma existente** ([despesaStore.ts](despesaStore.ts) ou [agendaStore.ts](agendaStore.ts) são boas referências).

## Estado típico

```typescript
interface FooState {
  items: Foo[];
  columns: TableColumnConfigFromApi[] | null;  // se a página usa colunas customizáveis
  isLoading: boolean;
  error: string | null;
  lastFetchParams?: FetchParams;                // pra refetch após CRUD
}
```

## Actions típicas

```typescript
{
  fetchItems(params?: FetchParams): Promise<void>;
  addItem(data: CreateFooDto): Promise<Foo>;
  updateItem(id: string, data: UpdateFooDto): Promise<Foo>;
  deleteItem(id: string): Promise<void>;
  reset(): void;
}
```

## Skeleton mínimo

```typescript
import { create } from 'zustand';
import { api } from '@/lib/api';

interface FooState {
  items: Foo[];
  isLoading: boolean;
  error: string | null;
  lastFetchParams?: FetchParams;
  fetchItems: (params?: FetchParams) => Promise<void>;
  addItem: (data: CreateFooDto) => Promise<Foo>;
  reset: () => void;
}

export const useFooStore = create<FooState>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,
  fetchItems: async (params) => {
    set({ isLoading: true, error: null, lastFetchParams: params });
    try {
      const res = await api.get<Foo[]>('/foos', { params });
      set({ items: res.data.map(normalizeFoo), isLoading: false });
    } catch (e: any) {
      set({ error: e?.message ?? 'Erro', isLoading: false });
    }
  },
  addItem: async (data) => {
    const res = await api.post<Foo>('/foos', data);
    const created = normalizeFoo(res.data);
    // refetch para manter consistência com filtros/ordenação do backend
    await get().fetchItems(get().lastFetchParams);
    return created;
  },
  reset: () => set({ items: [], isLoading: false, error: null }),
}));

function normalizeFoo(raw: any): Foo {
  return {
    id: raw.id,
    descricao: raw.descricao ?? '',
    valor: Number(raw.valor ?? 0),
    // defaults para campos opcionais; nunca confiar que API devolveu tudo
  };
}
```

## Regras

1. **Sempre** ter `normalize*()` que tipifica a response. Backend nem sempre devolve campos esperados (`null` vs `undefined`, Decimal vs number).
2. Após `add/update/delete`, **refetch** com `lastFetchParams` em vez de mutar localmente — backend pode ter mudado ordenação/agregados (ex: paginação, soma).
3. Tratar erro: `set({ error: msg, isLoading: false })` — UI deve mostrar.
4. `reset()` ao trocar tenant (chamado por [clearTenantCache.ts](../lib/clearTenantCache.ts)).
5. **NÃO** colocar lógica de negócio na store — só CRUD + cache. Negócio fica no backend ou no componente.

## Persist middleware (uso restrito)

Só usar `persist()` em stores cujo estado deve sobreviver a F5 (auth, tenant, draft de form longo). Ver [fornecedorStore.ts:31](fornecedorStore.ts) para padrão. Não persistir listas — sempre vão estar desatualizadas.

## Lista de stores (27)

`adminTenantsStore`, `adminUsersStore`, `agendaStore`, `appShellStore`, `authStore`, `balancoStore`, `bancoStore`, `chatStore`, `configuracaoStore`, `dashboardStore`, `despesaStore`, `despesaTiposStore`, `draftStore`, `flowStore`, `fornecedorStore`, `gameStore`, `investimentoStore`, `lembretesStore`, `lojaStore`, `notificationStore`, `parcelamentoStore`, `progressionStore`, `relatoriosStore`, `rendaExtraStore`, `sidebarStore`, `sociosStore`, `tenantStore`.

## Anti-padrões observados

- **Mutar `items` direto** ao criar/editar: `set({ items: [...items, novo] })` — fora de ordem, sem dedup, descasa com paginação. Sempre refetch.
- **`as unknown` em response**: indica que o tipo da API não casa. Atualizar o tipo (TS) ou o normalize().
- **`useEffect(fetchItems, [])` em página**: OK pra fetch inicial, mas a store deve evitar refetch duplicado (cache simples: `if (items.length && !force) return`).
