// Tipos para suporte multi-loja

// Tipo de logradouro (compartilhado com fornecedor)
export type TipoLogradouro = 'RUA' | 'AVENIDA' | 'TRAVESSA' | 'ALAMEDA' | 'PRACA' | 'RODOVIA' | 'ESTRADA';

export const TIPOS_LOGRADOURO: { value: TipoLogradouro; label: string }[] = [
  { value: 'RUA', label: 'Rua' },
  { value: 'AVENIDA', label: 'Avenida' },
  { value: 'TRAVESSA', label: 'Travessa' },
  { value: 'ALAMEDA', label: 'Alameda' },
  { value: 'PRACA', label: 'Praça' },
  { value: 'RODOVIA', label: 'Rodovia' },
  { value: 'ESTRADA', label: 'Estrada' },
];

// Endereco da loja
export interface EnderecoLoja {
  cep: string;
  tipoLogradouro: TipoLogradouro;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
}

// Contato da loja
export interface ContatoLoja {
  telefonePrincipal: string;
  whatsapp?: string;
  emailPrincipal: string;
  emailFinanceiro?: string;
}

// Responsavel da loja
export interface ResponsavelLoja {
  nome: string;
  cpf: string;
  whatsapp: string;
  email: string;
}

// Interface principal da Loja
export interface Loja {
  id: string;
  tenantId: string; // Vinculo com a empresa (tenant)
  
  // Identificacao
  cnpj: string; // CNPJ da filial
  razaoSocial: string;
  nomeFantasia: string;
  apelido: string; // Usado no seletor de loja
  
  // Endereco
  endereco: EnderecoLoja;
  
  // Contato
  contato: ContatoLoja;
  
  // Responsavel
  responsavel?: ResponsavelLoja;
  
  // Observacoes
  observacoes?: string;
  
  // Status
  isAtiva: boolean;
  isMatriz: boolean; // Indica se e a loja matriz
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// DTO para criacao de loja
export interface CreateLojaDTO {
  tenantId: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  apelido: string;
  endereco: EnderecoLoja;
  contato: ContatoLoja;
  responsavel?: ResponsavelLoja;
  observacoes?: string;
  isMatriz?: boolean;
}

// DTO para atualizacao de loja
export interface UpdateLojaDTO extends Partial<Omit<CreateLojaDTO, 'tenantId'>> {
  isAtiva?: boolean;
}

// Estado do store
export interface LojaState {
  lojas: Loja[];
  lojaAtual: Loja | null;
  isMultiLoja: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchLojas: () => Promise<void>;
  setLojaAtual: (lojaId: string | null) => void;
  addLoja: (data: CreateLojaDTO) => Promise<Loja>;
  updateLoja: (id: string, data: UpdateLojaDTO) => Promise<Loja>;
  deleteLoja: (id: string) => Promise<void>;
  getLojasByTenant: (tenantId: string) => Loja[];
}

// Mock de lojas para desenvolvimento (vinculadas ao tenant-001)
export const mockLojas: Loja[] = [
  {
    id: 'loja-1',
    tenantId: 'tenant-001',
    cnpj: '12.345.678/0001-01',
    razaoSocial: 'EMPRESA ALPHA LTDA - FILIAL CENTRO',
    nomeFantasia: 'ALPHA CENTRO',
    apelido: 'LOJA CENTRO',
    endereco: {
      cep: '01310-100',
      tipoLogradouro: 'AVENIDA',
      logradouro: 'PAULISTA',
      numero: '1000',
      complemento: 'LOJA 01',
      bairro: 'BELA VISTA',
      cidade: 'SAO PAULO',
      uf: 'SP',
    },
    contato: {
      telefonePrincipal: '(11) 3333-4444',
      whatsapp: '(11) 99999-8888',
      emailPrincipal: 'centro@alpha.com.br',
      emailFinanceiro: 'financeiro.centro@alpha.com.br',
    },
    responsavel: {
      nome: 'JOAO SILVA',
      cpf: '123.456.789-00',
      whatsapp: '(11) 99999-1111',
      email: 'joao.silva@alpha.com.br',
    },
    observacoes: 'Loja matriz da empresa',
    isAtiva: true,
    isMatriz: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'loja-2',
    tenantId: 'tenant-001',
    cnpj: '12.345.678/0002-02',
    razaoSocial: 'EMPRESA ALPHA LTDA - FILIAL SHOPPING',
    nomeFantasia: 'ALPHA SHOPPING',
    apelido: 'LOJA SHOPPING',
    endereco: {
      cep: '04543-011',
      tipoLogradouro: 'AVENIDA',
      logradouro: 'ENGENHEIRO LUIS CARLOS BERRINI',
      numero: '1500',
      complemento: 'LOJA 205',
      bairro: 'CIDADE MONCOES',
      cidade: 'SAO PAULO',
      uf: 'SP',
    },
    contato: {
      telefonePrincipal: '(11) 3333-5555',
      whatsapp: '(11) 99999-7777',
      emailPrincipal: 'shopping@alpha.com.br',
    },
    responsavel: {
      nome: 'MARIA SANTOS',
      cpf: '987.654.321-00',
      whatsapp: '(11) 99999-2222',
      email: 'maria.santos@alpha.com.br',
    },
    isAtiva: true,
    isMatriz: false,
    createdAt: '2025-02-01T00:00:00Z',
    updatedAt: '2025-02-01T00:00:00Z',
  },
  {
    id: 'loja-3',
    tenantId: 'tenant-001',
    cnpj: '12.345.678/0003-03',
    razaoSocial: 'EMPRESA ALPHA LTDA - FILIAL BAIRRO',
    nomeFantasia: 'ALPHA BAIRRO',
    apelido: 'LOJA BAIRRO',
    endereco: {
      cep: '03164-000',
      tipoLogradouro: 'RUA',
      logradouro: 'VERGUEIRO',
      numero: '2500',
      bairro: 'VILA MARIANA',
      cidade: 'SAO PAULO',
      uf: 'SP',
    },
    contato: {
      telefonePrincipal: '(11) 3333-6666',
      whatsapp: '(11) 99999-6666',
      emailPrincipal: 'bairro@alpha.com.br',
    },
    isAtiva: true,
    isMatriz: false,
    createdAt: '2025-03-01T00:00:00Z',
    updatedAt: '2025-03-01T00:00:00Z',
  },
];
