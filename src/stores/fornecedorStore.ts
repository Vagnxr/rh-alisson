import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Fornecedor,
  CreateFornecedorDto,
  UpdateFornecedorDto,
  FornecedorCNPJ,
  FornecedorCPF,
} from '@/types/fornecedor';
import { mockFornecedores } from '@/types/fornecedor';

interface FornecedorState {
  fornecedores: Fornecedor[];
  isLoading: boolean;
  error: string | null;
}

interface FornecedorActions {
  fetchFornecedores: () => Promise<void>;
  getFornecedor: (id: string) => Fornecedor | undefined;
  addFornecedor: (data: CreateFornecedorDto) => Promise<Fornecedor>;
  updateFornecedor: (id: string, data: UpdateFornecedorDto) => Promise<void>;
  deleteFornecedor: (id: string) => Promise<void>;
  toggleFornecedorStatus: (id: string) => Promise<void>;
  getFornecedoresByTipo: (tipo: 'cnpj' | 'cpf') => Fornecedor[];
}

type FornecedorStore = FornecedorState & FornecedorActions;

export const useFornecedorStore = create<FornecedorStore>()(
  persist(
    (set, get) => ({
      fornecedores: [],
      isLoading: false,
      error: null,

      fetchFornecedores: async () => {
        set({ isLoading: true, error: null });
        
        // Simula delay de API
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // Em produção, buscar do backend
        set({ fornecedores: mockFornecedores, isLoading: false });
      },

      getFornecedor: (id: string) => {
        return get().fornecedores.find((f) => f.id === id);
      },

      addFornecedor: async (data: CreateFornecedorDto) => {
        set({ isLoading: true, error: null });
        
        // Simula delay de API
        await new Promise((resolve) => setTimeout(resolve, 300));

        const now = new Date().toISOString();
        let novoFornecedor: Fornecedor;

        if (data.tipo === 'cnpj') {
          novoFornecedor = {
            id: `forn-${Date.now()}`,
            tipo: 'cnpj',
            cnpj: data.cnpj,
            razaoSocial: data.razaoSocial,
            nomeFantasia: data.nomeFantasia,
            endereco: data.endereco,
            contatoEmpresa: data.contatoEmpresa,
            contatoVendedor: data.contatoVendedor,
            observacoes: data.observacoes,
            isAtivo: true,
            createdAt: now,
            updatedAt: now,
          } as FornecedorCNPJ;
        } else {
          novoFornecedor = {
            id: `forn-${Date.now()}`,
            tipo: 'cpf',
            cpf: data.cpf,
            nomeCompleto: data.nomeCompleto,
            nomeComercial: data.nomeComercial,
            endereco: data.endereco,
            contatoEmpresa: data.contatoEmpresa,
            contatoVendedor: data.contatoVendedor,
            observacoes: data.observacoes,
            isAtivo: true,
            createdAt: now,
            updatedAt: now,
          } as FornecedorCPF;
        }

        set((state) => ({
          fornecedores: [...state.fornecedores, novoFornecedor],
          isLoading: false,
        }));

        return novoFornecedor;
      },

      updateFornecedor: async (id: string, data: UpdateFornecedorDto) => {
        set({ isLoading: true, error: null });
        
        // Simula delay de API
        await new Promise((resolve) => setTimeout(resolve, 300));

        set((state) => ({
          fornecedores: state.fornecedores.map((f) => {
            if (f.id === id) {
              return {
                ...f,
                ...data,
                updatedAt: new Date().toISOString(),
              } as Fornecedor;
            }
            return f;
          }),
          isLoading: false,
        }));
      },

      deleteFornecedor: async (id: string) => {
        set({ isLoading: true, error: null });
        
        // Simula delay de API
        await new Promise((resolve) => setTimeout(resolve, 300));

        set((state) => ({
          fornecedores: state.fornecedores.filter((f) => f.id !== id),
          isLoading: false,
        }));
      },

      toggleFornecedorStatus: async (id: string) => {
        set({ isLoading: true, error: null });
        
        // Simula delay de API
        await new Promise((resolve) => setTimeout(resolve, 200));

        set((state) => ({
          fornecedores: state.fornecedores.map((f) => {
            if (f.id === id) {
              return {
                ...f,
                isAtivo: !f.isAtivo,
                updatedAt: new Date().toISOString(),
              };
            }
            return f;
          }),
          isLoading: false,
        }));
      },

      getFornecedoresByTipo: (tipo: 'cnpj' | 'cpf') => {
        return get().fornecedores.filter((f) => f.tipo === tipo);
      },
    }),
    {
      name: 'fornecedor-storage',
      partialize: (state) => ({
        fornecedores: state.fornecedores,
      }),
    }
  )
);
