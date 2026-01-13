# Formularios

## Visao Geral
Formularios para entrada e edicao de dados, com validacao e feedback visual.

## Tecnologias
- React Hook Form (gerenciamento de form state)
- Zod (validacao de schema)
- shadcn/ui (componentes de input)

## Padrao de Implementacao

### Estrutura
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  campo: z.string().min(1, 'Campo obrigatorio'),
  valor: z.number().positive('Valor deve ser positivo'),
});

type FormData = z.infer<typeof schema>;

export function MeuForm() {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    // processar
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* campos */}
      </form>
    </Form>
  );
}
```

## Componentes de Form

### Campos Basicos
- Input (texto, numero, email)
- Textarea
- Select/Combobox
- Checkbox/Switch
- RadioGroup
- DatePicker

### Campos Especiais
- CurrencyInput (valores monetarios)
- PercentInput (percentuais)
- MaskedInput (CPF, CNPJ, telefone)
- FileUpload (anexos)

## Validacao

### Client-side
- Validacao em tempo real (opcional)
- Validacao no submit
- Mensagens de erro claras

### Tipos de Validacao
- Obrigatoriedade
- Formato (email, CPF, etc.)
- Range (min/max)
- Dependencias entre campos

## Estados

### Normal
- Campos habilitados
- Labels claras
- Placeholders informativos

### Loading
- Submit desabilitado
- Indicador de processamento

### Sucesso
- Toast de confirmacao
- Redirecionamento ou limpeza

### Erro
- Destaque no campo com erro
- Mensagem de erro abaixo do campo
- Foco automatico no primeiro erro

## Acessibilidade
- Labels associadas aos inputs
- ARIA attributes
- Navegacao por Tab
- Mensagens de erro acessiveis
