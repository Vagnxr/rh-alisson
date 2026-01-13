# Setup local

## Requisitos
- Node.js 18+ (LTS)
- pnpm

## Comandos
```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
```

## Variaveis de ambiente (quando ativar backend)
- VITE_API_URL (URL da API)
- VITE_API_KEY (chave de autenticacao, se aplicavel)

## Regras de dependencias
- Nao adicionar libs novas sem necessidade real.
- Tailwind-first (evitar CSS adicional fora do padrao do projeto).
- Preferir componentes shadcn/ui antes de criar novos.
