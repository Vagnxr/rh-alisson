import {
  useDespesaFixaStore,
  useDespesaExtraStore,
  useDespesaFuncionarioStore,
  useDespesaImpostoStore,
  useDespesaVeiculoStore,
  useDespesaBancoStore,
  useDespesaDinamicaStore,
} from '@/stores/despesaStore';
import { useAgendaStore } from '@/stores/agendaStore';
import { useLojaStore } from '@/stores/lojaStore';
import { useBalancoStore } from '@/stores/balancoStore';
import { useBancoStore } from '@/stores/bancoStore';
import { useParcelamentoStore } from '@/stores/parcelamentoStore';
import { useSociosStore } from '@/stores/sociosStore';
import { useFornecedorStore } from '@/stores/fornecedorStore';
import { useDespesaTiposStore } from '@/stores/despesaTiposStore';
import { useConfiguracaoStore } from '@/stores/configuracaoStore';
import { useInvestimentoStore } from '@/stores/investimentoStore';
import { useRendaExtraStore } from '@/stores/rendaExtraStore';

/** Chaves de persist (localStorage) que guardam dados por tenant; limpar ao trocar de empresa. */
const PERSIST_KEYS_TO_CLEAR = [
  'configuracao-storage',
  'loja-storage',
  'fornecedor-storage',
];

/**
 * Limpa todo o cache de dados escopo-tenant ao trocar de empresa.
 * Deve ser chamado antes de setCurrentTenant() ao selecionar outro tenant.
 * Reseta todos os stores com dados da empresa e remove do localStorage os que persistem.
 */
export function clearTenantCache(): void {
  useDespesaFixaStore.getState().reset();
  useDespesaExtraStore.getState().reset();
  useDespesaFuncionarioStore.getState().reset();
  useDespesaImpostoStore.getState().reset();
  useDespesaVeiculoStore.getState().reset();
  useDespesaBancoStore.getState().reset();
  useDespesaDinamicaStore.getState().reset();
  useAgendaStore.getState().reset();
  useLojaStore.getState().reset();
  useBalancoStore.getState().reset();
  useBancoStore.getState().reset();
  useParcelamentoStore.getState().reset();
  useSociosStore.getState().reset();
  useFornecedorStore.getState().reset();
  useDespesaTiposStore.getState().reset();
  useConfiguracaoStore.getState().reset();
  useInvestimentoStore.getState().reset();
  useRendaExtraStore.getState().reset();

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      PERSIST_KEYS_TO_CLEAR.forEach((key) => localStorage.removeItem(key));
    }
  } catch {
    // ignore
  }
}
