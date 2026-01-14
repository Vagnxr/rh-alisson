// Tipos para suporte multi-loja

export interface Loja {
  id: string;
  nome: string;
  cnpj?: string;
  endereco?: string;
  isAtiva: boolean;
}

export interface LojaState {
  lojas: Loja[];
  lojaAtual: Loja | null;
  isMultiLoja: boolean;
  fetchLojas: () => Promise<void>;
  setLojaAtual: (lojaId: string | null) => void;
}

// Mock de lojas para desenvolvimento
export const mockLojas: Loja[] = [
  { id: 'loja-1', nome: 'Loja Centro', cnpj: '12.345.678/0001-01', isAtiva: true },
  { id: 'loja-2', nome: 'Loja Shopping', cnpj: '12.345.678/0002-02', isAtiva: true },
  { id: 'loja-3', nome: 'Loja Bairro', cnpj: '12.345.678/0003-03', isAtiva: true },
];
