// Tipos para cadastro de fornecedores (CNPJ e CPF)

export type TipoFornecedor = 'cnpj' | 'cpf';

export type TipoLogradouro =
  | 'Rua'
  | 'Avenida'
  | 'Travessa'
  | 'Alameda'
  | 'Praça'
  | 'Rodovia'
  | 'Estrada';

export interface EnderecoFornecedor {
  cep: string;
  tipoLogradouro: TipoLogradouro;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

export interface ContatoEmpresa {
  telefonePrincipal?: string;
  whatsapp?: string;
  emailPrincipal: string;
  emailFinanceiro?: string;
  site?: string;
  instagram?: string;
}

export interface ContatoVendedor {
  nome: string;
  whatsapp: string;
  email: string;
}

// Fornecedor Pessoa Jurídica (CNPJ)
export interface FornecedorCNPJ {
  id: string;
  tipo: 'cnpj';
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  endereco: EnderecoFornecedor;
  contatoEmpresa: ContatoEmpresa;
  contatoVendedor?: ContatoVendedor;
  observacoes?: string;
  logoUrl?: string;
  isAtivo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fornecedor Pessoa Física (CPF)
export interface FornecedorCPF {
  id: string;
  tipo: 'cpf';
  cpf: string;
  nomeCompleto: string;
  nomeComercial?: string;
  endereco: EnderecoFornecedor;
  contatoEmpresa: ContatoEmpresa;
  contatoVendedor?: ContatoVendedor;
  observacoes?: string;
  logoUrl?: string;
  isAtivo: boolean;
  createdAt: string;
  updatedAt: string;
}

// Union type para fornecedor
export type Fornecedor = FornecedorCNPJ | FornecedorCPF;

// DTOs para criação/atualização
export interface CreateFornecedorCNPJDto {
  tipo: 'cnpj';
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  endereco: EnderecoFornecedor;
  contatoEmpresa: ContatoEmpresa;
  contatoVendedor?: ContatoVendedor;
  observacoes?: string;
  logo?: File;
}

export interface CreateFornecedorCPFDto {
  tipo: 'cpf';
  cpf: string;
  nomeCompleto: string;
  nomeComercial?: string;
  endereco: EnderecoFornecedor;
  contatoEmpresa: ContatoEmpresa;
  contatoVendedor?: ContatoVendedor;
  observacoes?: string;
  logo?: File;
}

export type CreateFornecedorDto = CreateFornecedorCNPJDto | CreateFornecedorCPFDto;

export interface UpdateFornecedorCNPJDto extends Partial<Omit<CreateFornecedorCNPJDto, 'tipo'>> {
  tipo: 'cnpj';
}

export interface UpdateFornecedorCPFDto extends Partial<Omit<CreateFornecedorCPFDto, 'tipo'>> {
  tipo: 'cpf';
}

export type UpdateFornecedorDto = UpdateFornecedorCNPJDto | UpdateFornecedorCPFDto;

// Constantes para dropdowns
export const TIPOS_LOGRADOURO: TipoLogradouro[] = [
  'Rua',
  'Avenida',
  'Travessa',
  'Alameda',
  'Praça',
  'Rodovia',
  'Estrada',
];

// Mock data para desenvolvimento
export const mockFornecedores: Fornecedor[] = [
  {
    id: 'forn-1',
    tipo: 'cnpj',
    cnpj: '12.345.678/0001-90',
    razaoSocial: 'FORNECEDOR ABC LTDA',
    nomeFantasia: 'ABC FORNECEDORES',
    endereco: {
      cep: '01310-100',
      tipoLogradouro: 'Avenida',
      logradouro: 'PAULISTA',
      numero: '1000',
      complemento: 'SALA 101',
      bairro: 'BELA VISTA',
      cidade: 'SAO PAULO',
      uf: 'SP',
    },
    contatoEmpresa: {
      telefonePrincipal: '(11) 3333-4444',
      whatsapp: '(11) 99999-8888',
      emailPrincipal: 'contato@abc.com.br',
      emailFinanceiro: 'financeiro@abc.com.br',
    },
    contatoVendedor: {
      nome: 'JOAO SILVA',
      whatsapp: '(11) 99999-7777',
      email: 'joao@abc.com.br',
    },
    observacoes: 'FORNECEDOR PREFERENCIAL',
    isAtivo: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'forn-2',
    tipo: 'cpf',
    cpf: '123.456.789-00',
    nomeCompleto: 'MARIA SANTOS',
    nomeComercial: 'MARIA COMERCIO',
    endereco: {
      cep: '20000-000',
      tipoLogradouro: 'Rua',
      logradouro: 'DO COMERCIO',
      numero: '500',
      bairro: 'CENTRO',
      cidade: 'RIO DE JANEIRO',
      uf: 'RJ',
    },
    contatoEmpresa: {
      telefonePrincipal: '(21) 2222-3333',
      whatsapp: '(21) 98888-7777',
      emailPrincipal: 'maria@comercio.com.br',
    },
    isAtivo: true,
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
  },
];
