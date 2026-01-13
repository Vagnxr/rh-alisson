# Design System

## Principios de Design

### Fidelidade a Planilha
- Interface orientada a tabelas
- Fluxo de preenchimento similar ao Excel
- Navegacao minima entre telas
- Feedback visual imediato de calculos

### Entrada Rapida de Dados
- Foco em inputs
- Atalhos de teclado
- Tab navigation
- Auto-complete quando possivel

### Destaque por Situacao
- Cores por status
- Alertas visuais
- Estados claros (normal, warning, error)

## Base de Componentes

### shadcn/ui
Todos os componentes seguem o padrao do shadcn/ui:
- Componentes em `src/components/ui/`
- Nomenclatura kebab-case (ex.: `data-table.tsx`)
- Customizacoes mantendo o design system

### Componentes Principais
- **Button**: acoes primarias e secundarias
- **Input**: campos de texto, numeros, datas
- **Select**: dropdowns e comboboxes
- **DataTable**: tabelas dinamicas (TanStack Table)
- **Card**: containers de informacao
- **Dialog/Sheet**: modais e paineis laterais
- **Form**: formularios com validacao

## Paleta de Cores

### Status
- `success`: verde (#22c55e) - valores positivos, pagos
- `warning`: amarelo (#eab308) - atencao, proximos a vencer
- `error`: vermelho (#ef4444) - negativos, vencidos
- `info`: azul (#3b82f6) - informativo

### Neutros
- Background: slate-50/white
- Text: slate-900
- Muted: slate-500
- Border: slate-200

## Tipografia
- Font family: sistema (Inter, se customizado)
- Tamanhos: seguir escala Tailwind
- Numeros: usar fonte tabular para alinhamento

## Espacamento
- Seguir escala Tailwind (4, 8, 12, 16, 24, 32...)
- Padding consistente em cards e tabelas
- Margens respeitando hierarquia visual

## Responsividade
- Desktop-first
- Breakpoints Tailwind padrao
- Tabelas com scroll horizontal em mobile
- Menus colapsaveis em telas menores
