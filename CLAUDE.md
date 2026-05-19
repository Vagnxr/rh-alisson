# Frontend (React 18 + Vite + Zustand + Tailwind + Radix UI)

Complementa [CLAUDE.md raiz](../CLAUDE.md) e [AGENTS.md](AGENTS.md) (comunicação em PT, sem emojis). Foca em padrões globais. Para padrões de UI/stores/páginas, ver `src/components/ui/CLAUDE.md`, `src/stores/CLAUDE.md`, `src/pages/financeiro/CLAUDE.md`.

## API client

[src/lib/api.ts](src/lib/api.ts):

- Base URL: `VITE_API_URL` ou fallback `https://rh-alisson-api.onrender.com/api/v1`
- Headers automáticos:
  - `Authorization: Bearer ${token}` — lido de `localStorage['auth-storage'].state.accessToken`
  - `X-Tenant-Id: ${id}` — lido de `localStorage['tenant-storage'].state.currentTenant.id`
- Interceptor 401 → `clearStorageAndRedirectToLogin()`
- Response check: `success === true` ou throw

Métodos: `api.get/post/patch/put/delete/postForm<T>(path, body?, {params?, tenantId?})`.

Formato de response esperado:
```typescript
{ success: boolean, data: T, columns?: ColumnConfig[], meta?: PaginationMeta }
```

⚠️ Backend não é uniforme — alguns endpoints retornam array puro. Ao consumir endpoint legado, embrulhar ou adaptar no store.

## Auth e Tenant

- [src/stores/authStore.ts](src/stores/authStore.ts) — `login`, `logout`, `refresh` (Zustand persist)
- [src/stores/tenantStore.ts](src/stores/tenantStore.ts) — `currentTenant`, `availableTenants`, `selectTenant`
- Login → recebe `accessToken`, `refreshToken`, lista de tenants. Se >1 tenant, redireciona pra `/selecionar-empresa`.
- Ao trocar tenant: limpar `localStorage` exceto `auth-storage` + `tenant-storage`. Helper: [src/lib/clearTenantCache.ts](src/lib/clearTenantCache.ts).

## Roteamento

- Router em [src/App.tsx](src/App.tsx).
- Rotas estáticas + dinâmicas combinadas via [src/lib/routeRegistry.tsx](src/lib/routeRegistry.tsx).
- `PATH_TO_COMPONENT` mapeia `href` (de `MenuItem` do backend) → componente React.
- Rotas dinâmicas do admin (páginas custom) usam:
  - `/despesa/:categoria` → [DespesaCategoriaPage.tsx](src/pages/DespesaCategoriaPage.tsx)
  - `/tela-branca` → [TelaBrancaPage.tsx](src/pages/TelaBrancaPage.tsx)
- `DynamicProtectedRoutes` checa permissão antes de renderizar.

## Padrões globais

### Formatação BR

[src/lib/formatValor.ts](src/lib/formatValor.ts):
- `formatValorForInput(10000.5)` → `"10.000,50"` (mostra no input)
- `parseValorFromInput("10.000,50")` → `10000.5`

⚠️ **Sempre** usar essas funções ao tocar input monetário. Não chamar `toFixed`/`toString` direto.

### Máscaras e validação

[src/lib/masks.ts](src/lib/masks.ts):
- `applyMask(value, 'cpf'|'cnpj'|'celular'|'telefone'|'cep'|'currency'|'date')`
- Validadores: `isValidCPF/CNPJ/Celular/CEP`
- Componente pronto: [InputMasked](src/components/ui/input-masked.tsx) já encapsula

### CNPJ lookup

[src/lib/receitaws.ts](src/lib/receitaws.ts) consulta CNPJ (externo). [src/lib/viacep.ts](src/lib/viacep.ts) consulta CEP.

## Tema e styling

- Tailwind JIT — **todas** as classes devem ser strings literais. NUNCA construir nome de classe dinamicamente (`bg-${color}-500` quebra).
- Para temas por módulo (sidebar), usar mapas com classes completas: ver [src/components/dashboard/Sidebar.tsx](src/components/dashboard/Sidebar.tsx) `MODULE_THEME`.
- Cores semânticas: `slate-*` (neutro), `emerald-*` (verde primário), `red-*` (destrutivo), `amber-*` (warning).
- Componentes Radix vêm de shadcn — manter `components.json` em sincronia.

## Padrões a evitar

- **`as unknown` / `as any` casts** — frequentes no codebase, mas sinalizam dívida. Tipar corretamente quando possível.
- **`useEffect` com fetch** sem cleanup — usar o store que já tem `isLoading` + cache.
- **Inline state em página** — preferir store Zustand (CRUD) ou estado local pequeno (UI-only).
- **`window.location`** para navegar — usar `useNavigate` do react-router.

## TypeScript check

```bash
cd frontend && npx tsc --noEmit
```

Roda antes de cada PR. Zero erros é o padrão. Não há testes automatizados frontend.

## Dev server

```bash
npm run dev
```

Backend espera `localhost:3000/api/v1` mas variável é `localhost:3004` em alguns ambientes — checar `.env`.
