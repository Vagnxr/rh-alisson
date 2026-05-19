# Componentes UI compartilhados

Pasta com componentes Radix + shadcn + customizados. Complementa [frontend/CLAUDE.md](../../../CLAUDE.md).

## Componentes "smart" (com regra de negócio)

Ao precisar destas funcionalidades, **sempre** reutilizar — não recriar:

| Componente | Quando usar | Arquivo |
|---|---|---|
| `DateInput` | Qualquer input de data (formato BR DD/MM/YYYY na UI, ISO YYYY-MM-DD na API) | [date-input.tsx](date-input.tsx) |
| `Calendar` | Calendário standalone (raro — quase sempre via DateInput) | [calendar.tsx](calendar.tsx) |
| `DateFilter` | Filtro de período (dia/mês/ano/custom) no topo de páginas financeiras | [date-filter.tsx](date-filter.tsx) |
| `CurrencyInput` | Input monetário BR (10.000,50). Não usar `<input type=number>` para valor | [currency-input.tsx](currency-input.tsx) |
| `InputMasked` | CPF, CNPJ, CEP, Celular, Telefone, Data, Moeda — com validação inline | [input-masked.tsx](input-masked.tsx) |
| `SelectRecorrencia` | Selectbox de recorrência (unica/semanal/mensal/...) com badge | [select-recorrencia.tsx](select-recorrencia.tsx) |
| `LojaSelector` | Dropdown de lojas do tenant | [loja-selector.tsx](loja-selector.tsx) |
| `ExportButtons` | Exportar CSV/Excel a partir de array | [export-buttons.tsx](export-buttons.tsx) |
| `InputEndereco` | CEP + auto-fill via ViaCEP | [input-endereco.tsx](input-endereco.tsx) |
| `DataValorList` | Lista de pares {data, valor} para parcelas | [data-valor-list.tsx](data-valor-list.tsx) |

## DateInput / Calendar — adaptado para qualquer contexto

[date-input.tsx](date-input.tsx) abre `<Popover>` com `<Calendar>` interno. Já cobre:
- Modal/Dialog sem cortar o calendário (`avoidCollisions`, `collisionPadding={12}`)
- Telas pequenas (`max-w-[calc(100vw-1rem)]`)
- Botões "Hoje" e "Limpar" no rodapé
- Sem scroll interno — calendário compacto (cells `h-7`, `border-spacing-y-0`, `p-2`)

API:
```tsx
<DateInput
  value={dateString}         // YYYY-MM-DD (ou '')
  onChange={setDateString}
  placeholder="Selecione..."
  disabled={false}
  required={false}
/>
```

⚠️ Se algum dia precisar de **multi-select** ou **range**, criar wrapper novo. Não estender o atual com props condicionais.

## Padrão Button

[button.tsx](button.tsx):
- Variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- Sizes: `default` (h-10), `sm` (h-8), `lg` (h-11), `icon` (h-9 w-9)
- Usar `variant="ghost"` em ações dentro de tabela/card; `variant="outline"` em ações secundárias.

## Padrão Dialog

[dialog.tsx](dialog.tsx):
- `DialogHeader` + `DialogBody` (scrollável) + `DialogFooter`
- `max-height: 90vh`, `width: 70vw` por padrão
- Para forms longos, sempre estruturar com Header/Body/Footer (footer fica fixo no rodapé)
- `closeButtonDataTestId` prop pra testes (já adicionado)

## Padrão Popover

[popover.tsx](popover.tsx) — wrapper Radix. Defaults: `align="center"`, `sideOffset={4}`. Usar `avoidCollisions` + `collisionPadding` quando dentro de modal.

## Padrão Select

[select.tsx](select.tsx) — Radix com SelectItem/SelectGroup/SelectLabel. Para selects com >50 itens, considerar Combobox (não temos pronto — criar via shadcn).

## Inputs

- [input.tsx](input.tsx) — input base
- [input-uppercase.tsx](input-uppercase.tsx) — força UPPERCASE on type
- [input-password.tsx](input-password.tsx) — toggle visibilidade
- [input-masked.tsx](input-masked.tsx) — máscara + validação
- [currency-input.tsx](currency-input.tsx) — moeda BR

## Notificações

- [sonner.tsx](sonner.tsx) — toast system. Importar `toast` de `sonner`:
  ```tsx
  import { toast } from 'sonner';
  toast.success('Salvo!');
  toast.error('Falhou');
  ```
- [notification-bar.tsx](notification-bar.tsx) — barra no topo (não confundir com toast).

## Lista completa (não-smart)

`action-dock.tsx`, `alert-dialog.tsx`, `badge.tsx`, `button.tsx`, `calendar.tsx`, `checkbox.tsx`, `dialog.tsx`, `game-log-panel.tsx`, `glow-button.tsx`, `input.tsx`, `inputs.ts` (index), `label.tsx`, `pixel-card.tsx`, `popover.tsx`, `scroll-area.tsx`, `select.tsx`, `sonner.tsx`, `switch.tsx`, `tabs.tsx`.

## Padrões a seguir

- **Sempre** usar `cn()` de [lib/utils.ts](../../lib/utils.ts) para concatenar classes.
- Composição > props gigantes — preferir `<Dialog><DialogHeader/>...</Dialog>` sobre `<Dialog title="..." content={...}/>`.
- Classes Tailwind sempre literais (JIT). Não construir `bg-${color}-500`.
- Componentes neste diretório **NÃO** devem importar de `stores/` nem de `pages/` — apenas de `lib/` e outros componentes UI.
