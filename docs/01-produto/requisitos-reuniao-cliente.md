# Requisitos - Reunião Cliente

**Data:** Janeiro 2025  
**Status:** Pendente implementação

---

## 1. Cadastro de Fornecedores

### 1.1 Estrutura Unificada (CNPJ e CPF)

O cadastro de fornecedores deve funcionar tanto para Pessoa Jurídica (CNPJ) quanto Pessoa Física (CPF), com campos condicionais baseados no tipo selecionado.

#### Tipo de Fornecedor
- **Pessoa Jurídica (CNPJ)**
- **Pessoa Física (CPF)**

#### Se CNPJ
- CNPJ
- Razão Social
- Nome Fantasia

#### Se CPF
- CPF
- Nome Completo
- Nome Comercial

### 1.2 Endereço (Comum para ambos)

- **CEP** - Preenchimento automático via API (ViaCEP) ao informar o CEP
- **Logradouro** (dropdown):
  - Rua
  - Avenida
  - Travessa
  - Alameda
  - Praça
  - Rodovia
  - Estrada
- **Número**
- **Complemento**
- **Bairro** - Preenchimento automático
- **Cidade** - Preenchimento automático
- **UF** - Preenchimento automático

### 1.3 Contato Empresa

- Telefone Principal
- WhatsApp
- E-mail Principal
- E-mail Financeiro (opcional)

### 1.4 Contato Vendedor

- Nome
- WhatsApp
- E-mail

### 1.5 Observações Gerais

- Campo de texto livre para anotações internas, alertas, histórico de negociação ou particularidades do fornecedor

### 1.6 Logo da Empresa

- Upload de imagem (anexar logo)

---

## 2. Cadastro de Empresa (Tenant) - CNPJ

### 2.1 Identificação da Empresa

- **CNPJ**
- **Razão Social**
- **Nome Fantasia**
- **Apelido** (usado para exibição no seletor de loja em multiloja)
- **Natureza Jurídica** (dropdown):
  - Empresário Individual (EI)
  - Sociedade Limitada (LTDA)
  - Sociedade Limitada Unipessoal (SLU)
  - Sociedade Simples
  - Sociedade Anônima (S/A)
  - Microempreendedor Individual (MEI)
  - Cooperativa
  - Associação
  - Fundação
  - Outros
- **Regime Tributário** (dropdown):
  - Simples Nacional
  - SIMEI (Micro Empreendedor Individual)
  - Lucro Presumido
  - Lucro Real
  - Lucro Arbitrado
  - Outros
- **Tipo de Atividade** (dropdown):
  - Comércio
  - Indústria
  - Prestação de Serviços
  - Outros

### 2.2 Endereço

- **CEP** - Preenchimento automático via API
- **Logradouro** (dropdown):
  - Rua
  - Avenida
  - Travessa
  - Alameda
  - Praça
  - Rodovia
  - Estrada
- **Número**
- **Complemento**
- **Bairro** - Preenchimento automático
- **Cidade** - Preenchimento automático
- **UF** - Preenchimento automático

### 2.3 Contatos da Empresa

- Telefone Principal
- WhatsApp
- E-mail Principal
- E-mail Financeiro (opcional)
- Site (opcional)
- Instagram (opcional)

### 2.4 Responsáveis

#### Responsável Legal
- Nome
- CPF
- WhatsApp
- E-mail

#### Responsável Financeiro
- Nome
- CPF
- WhatsApp
- E-mail

### 2.5 Observações Gerais

- Campo de texto livre para anotações internas

### 2.6 Logo da Empresa

- Upload de imagem (anexar logo)

---

## 3. Cadastro de Cliente (CPF)

### 3.1 Identificação do Cliente

- **CPF**
- **Nome Completo**
- **Data de Nascimento**
- **Estado Civil** (dropdown):
  - Solteiro(a)
  - Casado(a)
  - União Estável
  - Divorciado(a)
  - Viúvo(a)

### 3.2 Dados Comerciais

- Nome Empresarial
- Apelido
- **Tipo de Atividade** (dropdown):
  - Comércio
  - Indústria
  - Prestação de Serviços
  - Autônomo
  - Outros

### 3.3 Endereço

- Mesma estrutura do cadastro de fornecedor (CEP com preenchimento automático)

### 3.4 Contatos

- Mesma estrutura do cadastro de fornecedor

### 3.5 Responsáveis

#### Responsável Principal
- Nome
- CPF
- WhatsApp
- E-mail

#### Responsável Financeiro
- Nome
- CPF
- WhatsApp
- E-mail

### 3.6 Observações Gerais

- Campo de texto livre

### 3.7 Logo da Empresa

- Upload de imagem

---

## 4. Funcionalidades Gerais

### 4.1 Exportação de Dados

**Todas as telas devem ter opção de exportar:**
- **Excel** (.xlsx)
- **PDF** (.pdf)

**Formatação dos arquivos exportados:**
- Logo da empresa no cabeçalho
- Data e hora da exportação
- Numeração de páginas (ex: 1/10, 2/10, etc.)

### 4.2 Seletor de Loja (Multiloja)

**Nas telas com multiloja:**
- Exibir seletor de loja similar ao seletor de data
- Mostrar o **APELIDO** cadastrado no cadastro da empresa (campo "Apelido")
- Manter também o seletor na parte superior (comportamento atual)

**Comportamento:**
- Quando selecionar uma loja específica: filtrar dados daquela loja
- Quando selecionar "TODAS": mostrar dados consolidados

### 4.3 Normalização de Texto

**Regra geral para campos de texto:**
- Converter automaticamente para **MAIÚSCULAS** durante a digitação
- **Exceção:** Campos de e-mail devem manter formato original (não converter para maiúsculas)
- Aplicar independente do estado do teclado do usuário (Caps Lock)

**Campos afetados:**
- Nomes de pessoas
- Nomes de empresas
- Razão Social
- Nome Fantasia
- Descrições
- Observações
- Todos os campos de texto, exceto e-mail

---

## 5. Módulo Parcelamento

### 5.1 Alteração de Texto

**Atual:**
> "Gerencie seus parcelamentos e compras parceladas"

**Novo:**
> "Gerencie seus parcelamentos"

---

## 6. Módulo Balanço Geral

### 6.1 Balanço Analítico - Percentual sobre Vendas

**Funcionalidade:** [IMPLEMENTADO]
- Nas despesas, exibir o quanto cada despesa representa em relação às vendas totais
- Mostrar o valor total de vendas como referência
- Cada item de despesa deve exibir: "tal despesa representou X% da minha venda"

**Indicadores visuais:**
- Verde: despesas que representam até 5% das vendas
- Amarelo: despesas que representam entre 5% e 10% das vendas
- Vermelho: despesas que representam mais de 10% das vendas

**Card de resumo:**
- Total de despesas em valor absoluto
- Percentual total de despesas sobre vendas

### 6.2 Visualização Multiloja - Modo Comparativo

**Quando selecionar "TODAS" as lojas:**

Exibir dados em formato de colunas para facilitar comparação entre lojas.

**Exemplo de layout:**

```
Despesas:

Despesa Fixa:        Loja Centro  %          Loja Shopping  %
                                 10.000,00   5%           11.000,00       6%
```

**Estrutura:**
- Linha: Categoria de despesa/receita
- Colunas: Uma coluna por loja, contendo:
  - Valor formatado em moeda
  - Percentual em relação ao total
- Última coluna: Total consolidado (opcional)

**Aplicar para:**
- Despesas (todas as categorias)
- Receitas
- Outros itens do balanço

---

## 7. Módulo Despesas

### 7.1 Recorrência no Lançamento

**Funcionalidade:**
- Ao lançar uma despesa, oferecer opção de criar recorrência
- Permitir definir quantidade de meses futuros para replicar a despesa

**Exemplo:**
- Usuário está em Janeiro
- Lança despesa "ALUGUEL" de R$ 5.000,00
- Seleciona opção "Criar recorrência para próximos 12 meses"
- Sistema cria automaticamente 12 registros (Janeiro a Dezembro) com os mesmos dados

**Campos replicados:**
- Descrição
- Valor
- Categoria
- Loja (se aplicável)
- Outros campos relevantes

**Campos ajustados automaticamente:**
- Data de vencimento: incrementada mensalmente

### 7.2 Categorias de Despesa

**Em Configurações:**
- Adicionar opção para criar novas categorias de despesa
- Permitir edição e exclusão de categorias existentes
- Validar que categoria não esteja em uso antes de excluir

### 7.3 Despesas Banco - Múltiplos Bancos

**Funcionalidade:**
- Implementar sistema similar ao módulo de Sócios
- Permitir que cliente trabalhe com mais de um banco
- Cada despesa bancária deve estar vinculada a um banco específico

**Estrutura sugerida:**
- Cadastro de bancos (similar ao cadastro de sócios)
- Ao lançar despesa bancária, selecionar o banco
- Filtros e visualizações por banco

---

## 8. Cadastro de Lojas (Multi-Loja)

**Status:** [IMPLEMENTADO]

### 8.1 Conceito

- Cada empresa (Tenant) pode ter múltiplas lojas/filiais
- As lojas são vinculadas à empresa do usuário logado
- O campo "Apelido" é usado para exibir no seletor de loja
- Todas as despesas, receitas e outros registros podem ser vinculados a uma loja específica

### 8.2 Campos do Cadastro de Loja

#### Identificação
- **CNPJ** (da filial)
- **Razão Social**
- **Nome Fantasia**
- **Apelido** (usado no seletor de loja - campo obrigatório)
- **É Matriz?** (checkbox para identificar a loja matriz)

#### Endereço
- **CEP** - Preenchimento automático via ViaCEP
- **Tipo de Logradouro** (dropdown): Rua, Avenida, Travessa, Alameda, Praça, Rodovia, Estrada
- **Logradouro** - Preenchimento automático
- **Número**
- **Complemento**
- **Bairro** - Preenchimento automático
- **Cidade** - Preenchimento automático
- **UF** - Preenchimento automático

#### Contato da Loja
- Telefone Principal
- WhatsApp
- E-mail Principal
- E-mail Financeiro (opcional)

#### Responsável (Opcional)
- Nome
- CPF
- WhatsApp
- E-mail

#### Observações
- Campo de texto livre para anotações internas

### 8.3 Funcionalidades

- **CRUD completo**: Criar, Visualizar, Editar e Excluir lojas
- **Proteção da matriz**: Não é possível excluir a loja marcada como matriz
- **Filtro por tenant**: Cada empresa só vê suas próprias lojas
- **Exportação**: Excel e PDF com dados das lojas
- **Busca**: Campo de busca para filtrar lojas na tabela

### 8.4 Vinculação com Outros Módulos

- **Despesas**: Cada despesa pode ser vinculada a uma loja específica
- **Balanço Geral**: Visualização por loja ou consolidada ("TODAS")
- **Seletor de Loja**: Presente nas telas relevantes para filtrar dados

---

## 9. Menu Lateral

### 9.1 Opção de Fixar Menu

**Funcionalidade:**
- Adicionar toggle/opção para fixar o menu lateral
- Quando fixado: menu permanece visível (não colapsa)
- Quando não fixado: comportamento atual (colapsa/expande)

**Localização:**
- Preferencialmente no header do menu ou em configurações

---

## 10. Observações Técnicas

### 10.1 Integração ViaCEP

- Implementar busca automática de endereço ao informar CEP
- Preencher automaticamente: Logradouro, Bairro, Cidade, UF
- Permitir edição manual dos campos preenchidos

### 10.2 Validações

- CNPJ: validar formato e dígitos verificadores
- CPF: validar formato e dígitos verificadores
- E-mail: validar formato
- CEP: validar formato e existência

### 10.3 Upload de Logo

- Formatos aceitos: JPG, PNG, SVG
- Tamanho máximo: definir limite (sugestão: 2MB)
- Dimensões recomendadas: definir (sugestão: 200x200px)
- Preview antes de salvar

---

## 11. Priorização Sugerida

### Alta Prioridade
1. Cadastro de Fornecedores (CNPJ/CPF) - [IMPLEMENTADO]
2. Normalização de texto (maiúsculas) - [IMPLEMENTADO]
3. Exportação Excel/PDF - [IMPLEMENTADO]
4. Seletor de loja nas telas - [IMPLEMENTADO]
5. Cadastro de Lojas - [IMPLEMENTADO]

### Média Prioridade
6. Recorrência em despesas
7. Balanço Geral - modo comparativo
8. Categorias de despesa em configurações
9. Despesas Banco - múltiplos bancos

### Baixa Prioridade
10. Fixar menu lateral
11. Alteração de texto em Parcelamento - [IMPLEMENTADO]

---

## 12. Estrategia Multi-Loja (Arquitetura)

**Status:** Pendente implementacao

### 12.1 Conceito Geral

O sistema opera com **isolamento por Tenant (empresa)** e suporta **multiplas lojas por tenant**.

```
Plataforma
  └── Tenant (Empresa Alpha Ltda)
        ├── Loja Centro (matriz)
        ├── Loja Shopping (filial)
        └── Loja Bairro (filial)
```

### 12.2 Fluxo de Dados

Cada registro (despesa, receita, parcelamento, etc.) pertence a:
- **tenantId**: ID da empresa (filtro automatico pelo token JWT)
- **lojaId**: ID da loja especifica (selecionado pelo usuario)

### 12.3 Estrategia de UX (Duas Abordagens Complementares)

#### A) Seletor de Contexto Global (Header)

Localizado no header, ao lado do seletor de data:
- Opcao "TODAS" = visao consolidada de todas as lojas
- Opcao "LOJA X" = visao filtrada apenas para aquela loja

**Comportamento:**
- Quando "TODAS": tabelas mostram dados de todas as lojas (com coluna "Loja")
- Quando "LOJA X": tabelas filtram apenas aquela loja (sem coluna "Loja")

#### B) Seletor de Loja no Formulario

Ao cadastrar qualquer registro (despesa, receita, etc.):
- Campo obrigatorio para selecionar a loja
- Se contexto ja e uma loja especifica: pre-seleciona aquela loja
- Se contexto e "TODAS": obriga o usuario a escolher

### 12.4 Impacto nos Tipos (Frontend)

**Antes:**
```typescript
interface DespesaBase {
  id: string;
  data: string;
  descricao: string;
  valor: number;
}
```

**Depois:**
```typescript
interface DespesaBase {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  lojaId: string;
  loja?: {
    id: string;
    apelido: string;
  };
}
```

### 12.5 Impacto na API (Backend)

**Headers obrigatorios:**
```
Authorization: Bearer <token>  // Contem tenantId no JWT
X-Loja-Id: <lojaId>            // Opcional, para filtrar por loja
```

**Query params para listagens:**
```
GET /api/v1/despesas?lojaId=<uuid>&dataInicio=2026-01-01&dataFim=2026-01-31
```

**Body para criacao:**
```json
{
  "categoria": "fixa",
  "data": "2026-01-15",
  "descricao": "Aluguel",
  "valor": 3500.00,
  "lojaId": "7890abcd-1234-5678-9abc-def012345678"  // OBRIGATORIO
}
```

### 12.6 Onde Aplicar

| Modulo | Tem lojaId | Seletor no Form | Filtro no Header |
|--------|------------|-----------------|------------------|
| Despesas (todas) | Sim | Sim | Sim |
| Parcelamentos | Sim | Sim | Sim |
| Renda Extra | Sim | Sim | Sim |
| Investimentos | Opcional* | Opcional | Opcional |
| Socios | Nao** | Nao | Nao |
| Balanco Geral | - | - | Sim (consolidado) |

*Investimentos podem ser da empresa como um todo
**Socios pertencem ao tenant, nao a uma loja especifica

### 12.7 Estado Global (Zustand)

```typescript
// lojaStore.ts - ja implementado
interface LojaState {
  lojas: Loja[];
  lojaAtual: Loja | null;  // null = "TODAS"
  isMultiLoja: boolean;
  
  setLojaAtual: (lojaId: string | null) => void;
  fetchLojas: () => Promise<void>;
}
```

**Uso nos componentes:**
```typescript
const { lojaAtual, isMultiLoja } = useLojaStore();

// Se lojaAtual === null, mostrar dados de todas as lojas
// Se lojaAtual !== null, filtrar por lojaAtual.id
```

### 12.8 Prioridade de Implementacao

1. [x] Cadastro de Lojas - **FEITO**
2. [ ] Atualizar tipos de Despesa com lojaId
3. [ ] Adicionar seletor de loja no header (contexto global)
4. [ ] Adicionar seletor de loja nos formularios de despesa
5. [ ] Exibir coluna "Loja" nas tabelas quando contexto = "TODAS"
6. [ ] Aplicar em outros modulos (Parcelamento, Renda Extra, etc.)

---

## 13. Referencias

- Documentacao existente: `docs/`
- Modulo de Socios: referencia para implementacao de multiplos bancos
- Sistema de multiloja: ja implementado, adaptar para novos requisitos
- Backend API: `backend.md` - ja contempla lojaId nas despesas
