# DTOs e Tipos - API Backend

Este documento detalha todos os DTOs (Data Transfer Objects) e tipos utilizados na API.

---

## 1. DTOs de Autenticacao

### LoginDto
```typescript
class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
```

### RegisterDto
```typescript
class RegisterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, {
    message: 'Senha deve conter maiuscula, minuscula, numero e caractere especial'
  })
  password: string;

  @IsString()
  @Match('password')
  confirmPassword: string;
}
```

### AuthResponseDto
```typescript
class AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDto;
}
```

### UserDto
```typescript
class UserDto {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cpf?: string;
  role: 'super_admin' | 'admin' | 'user';
  isSuperAdmin: boolean;
  isActive: boolean;
  tenantId?: string;
  tenant?: TenantBasicDto;
  lojas: string[];
  permissoes: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 2. DTOs de Tenant

### CreateTenantDto
```typescript
class CreateTenantDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome: string;

  @IsString()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
  cnpj: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\(\d{2}\) \d{4,5}-\d{4}$/)
  telefone?: string;

  @IsString()
  @IsOptional()
  responsavel?: string;

  @ValidateNested()
  @IsOptional()
  @Type(() => EnderecoDto)
  endereco?: EnderecoDto;
}
```

### UpdateTenantDto
```typescript
class UpdateTenantDto extends PartialType(CreateTenantDto) {}
```

### TenantResponseDto
```typescript
class TenantResponseDto {
  id: string;
  nome: string;
  cnpj: string;
  email?: string;
  telefone?: string;
  responsavel?: string;
  endereco?: EnderecoDto;
  isActive: boolean;
  usersCount: number;
  lojasCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### TenantBasicDto
```typescript
class TenantBasicDto {
  id: string;
  nome: string;
  cnpj: string;
}
```

---

## 3. DTOs de Endereco

### EnderecoDto
```typescript
class EnderecoDto {
  @IsString()
  @Matches(/^\d{5}-\d{3}$/)
  cep: string;

  @IsString()
  @MaxLength(255)
  logradouro: string;

  @IsString()
  @MaxLength(20)
  numero: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  complemento?: string;

  @IsString()
  @MaxLength(100)
  bairro: string;

  @IsString()
  @MaxLength(100)
  cidade: string;

  @IsString()
  @Length(2, 2)
  estado: string;
}
```

---

## 4. DTOs de Usuario

### CreateUserDto
```typescript
class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  @Matches(/^\(\d{2}\) \d{5}-\d{4}$/)
  telefone?: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
  cpf?: string;

  @IsEnum(['admin', 'user'])
  @IsOptional()
  role?: 'admin' | 'user';

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  lojas?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissoes?: string[];
}
```

### UpdateUserDto
```typescript
class UpdateUserDto extends PartialType(OmitType(CreateUserDto, ['password'])) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
```

### UpdatePasswordDto
```typescript
class UpdatePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;

  @IsString()
  @Match('newPassword')
  confirmPassword: string;
}
```

---

## 5. DTOs de Loja

### CreateLojaDto
```typescript
class CreateLojaDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome: string;

  @IsString()
  @IsOptional()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
  cnpj?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  endereco?: string;
}
```

### LojaResponseDto
```typescript
class LojaResponseDto {
  id: string;
  nome: string;
  cnpj?: string;
  endereco?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 6. DTOs de Despesa

### CreateDespesaDto
```typescript
class CreateDespesaDto {
  @IsEnum(['fixa', 'extra', 'funcionario', 'imposto', 'veiculo', 'banco'])
  categoria: 'fixa' | 'extra' | 'funcionario' | 'imposto' | 'veiculo' | 'banco';

  @IsDateString()
  data: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  descricao: string;

  @IsNumber()
  @Min(0.01)
  @Max(999999999.99)
  valor: number;

  @IsEnum(['unica', 'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'semestral', 'anual'])
  @IsOptional()
  recorrencia?: string;

  @IsDateString()
  @IsOptional()
  recorrenciaFim?: string;

  @IsUUID()
  @IsOptional()
  lojaId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observacao?: string;
}
```

### UpdateDespesaDto
```typescript
class UpdateDespesaDto extends PartialType(OmitType(CreateDespesaDto, ['categoria'])) {}
```

### DespesaResponseDto
```typescript
class DespesaResponseDto {
  id: string;
  categoria: string;
  data: string;
  descricao: string;
  valor: number;
  recorrencia: string;
  recorrenciaFim?: string;
  loja?: LojaBasicDto;
  observacao?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### DespesaFilterDto
```typescript
class DespesaFilterDto extends PaginationDto {
  @IsEnum(['fixa', 'extra', 'funcionario', 'imposto', 'veiculo', 'banco'])
  @IsOptional()
  categoria?: string;

  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;

  @IsUUID()
  @IsOptional()
  lojaId?: string;

  @IsString()
  @IsOptional()
  recorrencia?: string;

  @IsString()
  @IsOptional()
  search?: string;
}
```

---

## 7. DTOs de Parcelamento

### CreateParcelamentoDto
```typescript
class CreateParcelamentoDto {
  @IsDateString()
  data: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  descricao: string;

  @IsInt()
  @Min(1)
  parcelaAtual: number;

  @IsInt()
  @Min(1)
  parcelaTotal: number;

  @IsNumber()
  @Min(0.01)
  valor: number;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  valorTotal?: number;

  @IsUUID()
  @IsOptional()
  lojaId?: string;
}

// Validacao customizada: parcelaAtual <= parcelaTotal
```

### ParcelamentoResponseDto
```typescript
class ParcelamentoResponseDto {
  id: string;
  data: string;
  descricao: string;
  parcela: string; // "3/12"
  parcelaAtual: number;
  parcelaTotal: number;
  valor: number;
  valorTotal?: number;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  loja?: LojaBasicDto;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 8. DTOs de Receita

### CreateReceitaDto
```typescript
class CreateReceitaDto {
  @IsEnum(['renda-extra', 'venda', 'servico', 'outro'])
  @IsOptional()
  categoria?: string;

  @IsDateString()
  data: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  descricao: string;

  @IsNumber()
  @Min(0.01)
  valor: number;

  @IsUUID()
  @IsOptional()
  lojaId?: string;

  @IsString()
  @IsOptional()
  observacao?: string;
}
```

---

## 9. DTOs de Investimento

### CreateInvestimentoDto
```typescript
class CreateInvestimentoDto {
  @IsDateString()
  data: string;

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  descricao: string;

  @IsNumber()
  @Min(0.01)
  valor: number;

  @IsEnum(['acao', 'fundo', 'cdb', 'tesouro', 'outro'])
  @IsOptional()
  tipo?: string;

  @IsUUID()
  @IsOptional()
  lojaId?: string;

  @IsString()
  @IsOptional()
  observacao?: string;
}
```

---

## 10. DTOs de Socio

### CreateSocioDto
```typescript
class CreateSocioDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  nome: string;

  @IsString()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/)
  cpf: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentualSociedade: number;
}
```

### SocioResponseDto
```typescript
class SocioResponseDto {
  id: string;
  nome: string;
  cpf: string;
  percentualSociedade: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### SocioResumoDto
```typescript
class SocioResumoDto {
  socio: SocioResponseDto;
  totalProLabore: number;
  totalDistribuicao: number;
  totalRetiradas: number;
  totalAportes: number;
  saldoTotal: number;
}
```

---

## 11. DTOs de Movimentacao Socio

### CreateMovimentacaoSocioDto
```typescript
class CreateMovimentacaoSocioDto {
  @IsUUID()
  socioId: string;

  @IsDateString()
  data: string;

  @IsEnum(['pro-labore', 'distribuicao', 'retirada', 'aporte', 'outro'])
  tipo: 'pro-labore' | 'distribuicao' | 'retirada' | 'aporte' | 'outro';

  @IsString()
  @MinLength(2)
  @MaxLength(500)
  descricao: string;

  @IsNumber()
  @Min(0.01)
  valor: number;

  @IsUUID()
  @IsOptional()
  lojaId?: string;
}
```

### MovimentacaoSocioResponseDto
```typescript
class MovimentacaoSocioResponseDto {
  id: string;
  socioId: string;
  socioNome: string;
  data: string;
  tipo: string;
  descricao: string;
  valor: number;
  loja?: LojaBasicDto;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 12. DTOs de Balanco

### BalancoQueryDto
```typescript
class BalancoQueryDto {
  @IsInt()
  @Min(1)
  @Max(12)
  mes: number;

  @IsInt()
  @Min(2020)
  @Max(2100)
  ano: number;

  @IsUUID()
  @IsOptional()
  lojaId?: string;
}
```

### BalancoResponseDto
```typescript
class BalancoResponseDto {
  periodo: {
    mes: number;
    ano: number;
    dataInicio: string;
    dataFim: string;
  };
  resumo: {
    faturamentoTotal: number;
    despesasTotal: number;
    lucroLiquido: number;
    margemLucro: number;
  };
  despesas: {
    items: BalancoItemDto[];
    total: number;
    percentualTotal: number;
  };
  vendas: {
    items: BalancoItemDto[];
    total: number;
  };
  socios: {
    items: BalancoSocioItemDto[];
    total: number;
  };
  investimento: number;
  rendaExtra: number;
  ativoImobilizado: {
    entrada: number;
    saida: number;
  };
}
```

### BalancoItemDto
```typescript
class BalancoItemDto {
  descricao: string;
  valor: number;
  percentualVenda: number;
  loja?: LojaBasicDto;
}
```

---

## 13. DTOs de Configuracao

### CreateConfiguracaoDto
```typescript
class CreateConfiguracaoDto {
  @IsObject()
  valor: Record<string, any>;
}
```

### ConfiguracaoResponseDto
```typescript
class ConfiguracaoResponseDto {
  id: string;
  chave: string;
  valor: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 14. DTOs de Dashboard

### DashboardQueryDto
```typescript
class DashboardQueryDto {
  @IsDateString()
  @IsOptional()
  dataInicio?: string;

  @IsDateString()
  @IsOptional()
  dataFim?: string;

  @IsUUID()
  @IsOptional()
  lojaId?: string;
}
```

### DashboardResumoDto
```typescript
class DashboardResumoDto {
  receitaTotal: number;
  receitaVariacao: number;
  despesasTotal: number;
  despesasVariacao: number;
  saldoAtual: number;
  saldoVariacao: number;
  investimentos: number;
  investimentosVariacao: number;
}
```

### TransacaoRecenteDto
```typescript
class TransacaoRecenteDto {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  data: string;
  tipo: 'income' | 'expense';
}
```

---

## 15. DTOs Comuns

### PaginationDto
```typescript
class PaginationDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  perPage?: number = 20;

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

### PaginatedResponseDto<T>
```typescript
class PaginatedResponseDto<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}
```

### LojaBasicDto
```typescript
class LojaBasicDto {
  id: string;
  nome: string;
}
```

---

## 16. Enums

### Categorias de Despesa
```typescript
enum CategoriaDespesa {
  FIXA = 'fixa',
  EXTRA = 'extra',
  FUNCIONARIO = 'funcionario',
  IMPOSTO = 'imposto',
  VEICULO = 'veiculo',
  BANCO = 'banco',
}
```

### Tipos de Recorrencia
```typescript
enum TipoRecorrencia {
  UNICA = 'unica',
  SEMANAL = 'semanal',
  QUINZENAL = 'quinzenal',
  MENSAL = 'mensal',
  BIMESTRAL = 'bimestral',
  TRIMESTRAL = 'trimestral',
  SEMESTRAL = 'semestral',
  ANUAL = 'anual',
}
```

### Tipos de Movimentacao Socio
```typescript
enum TipoMovimentacaoSocio {
  PRO_LABORE = 'pro-labore',
  DISTRIBUICAO = 'distribuicao',
  RETIRADA = 'retirada',
  APORTE = 'aporte',
  OUTRO = 'outro',
}
```

### Status do Parcelamento
```typescript
enum StatusParcelamento {
  PENDENTE = 'pendente',
  PAGO = 'pago',
  ATRASADO = 'atrasado',
  CANCELADO = 'cancelado',
}
```

### Roles de Usuario
```typescript
enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  USER = 'user',
}
```

---

## 17. Decorators Customizados Sugeridos

### @TenantId()
Injeta o tenant_id do usuario logado automaticamente.

### @CurrentUser()
Injeta o usuario completo do JWT.

### @Permissions()
Define permissoes necessarias para o endpoint.

```typescript
@Permissions('despesas:write')
@Post()
create(@Body() dto: CreateDespesaDto, @TenantId() tenantId: string) {
  // ...
}
```

---

**Versao:** 1.0.0  
**Data:** 2026-01-14
