# Testing

## Estrategia de Testes

### Prioridades
1. **Logica de calculos**: testes unitarios para regras de negocio
2. **Formularios**: validacao e submissao
3. **Tabelas**: filtragem, ordenacao, calculos
4. **Fluxos criticos**: CRUD completo

### Tipos de Teste

#### Unit Tests
Para logica pura e utilitarios:
```typescript
// utils/calculos.test.ts
describe('calcularTotal', () => {
  it('deve somar valores corretamente', () => {
    const items = [{ valor: 100 }, { valor: 200 }];
    expect(calcularTotal(items)).toBe(300);
  });

  it('deve retornar 0 para array vazio', () => {
    expect(calcularTotal([])).toBe(0);
  });
});
```

#### Integration Tests
Para fluxos completos:
```typescript
// components/FinanceForm.test.tsx
describe('FinanceForm', () => {
  it('deve submeter dados validos', async () => {
    render(<FinanceForm />);
    
    await userEvent.type(screen.getByLabelText('Valor'), '1000');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    
    expect(mockOnSubmit).toHaveBeenCalledWith({ valor: 1000 });
  });
});
```

## Ferramentas

### Stack de Testes
- **Vitest**: test runner
- **Testing Library**: testes de componentes
- **MSW**: mock de API (futuro)

### Comandos
```bash
pnpm test           # rodar todos os testes
pnpm test:watch     # modo watch
pnpm test:coverage  # com cobertura
```

## O que Testar

### Obrigatorio
- Calculos financeiros (identicos a planilha)
- Validacao de formularios
- Logica de permissoes

### Recomendado
- Componentes com logica complexa
- Fluxos de usuario criticos
- Edge cases

### Opcional
- Componentes de UI pura
- Estilos

## Boas Praticas

### Testes de Calculo
```typescript
describe('calcularFluxoCaixa', () => {
  it('deve calcular saldo corretamente', () => {
    const entradas = [{ tipo: 'entrada', valor: 1000 }];
    const saidas = [{ tipo: 'saida', valor: 300 }];
    
    expect(calcularSaldo([...entradas, ...saidas])).toBe(700);
  });

  it('deve lidar com valores decimais', () => {
    const items = [
      { tipo: 'entrada', valor: 100.50 },
      { tipo: 'saida', valor: 50.25 },
    ];
    
    expect(calcularSaldo(items)).toBe(50.25);
  });
});
```

### Testes de Formulario
```typescript
describe('DespesaForm', () => {
  it('deve mostrar erro para valor negativo', async () => {
    render(<DespesaForm />);
    
    await userEvent.type(screen.getByLabelText('Valor'), '-100');
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }));
    
    expect(screen.getByText('Valor deve ser positivo')).toBeInTheDocument();
  });
});
```

## Cobertura

### Metas
- Logica de negocios: > 90%
- Componentes criticos: > 70%
- Geral: > 60%

### Exclusoes
- Arquivos de configuracao
- Mocks
- Types
