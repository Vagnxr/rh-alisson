import {
  useDespesaFixaStore,
  useDespesaExtraStore,
  useDespesaFuncionarioStore,
  useDespesaImpostoStore,
  useDespesaVeiculoStore,
  useDespesaBancoStore,
} from '@/stores/despesaStore';
import { useAgendaStore } from '@/stores/agendaStore';
import { useLojaStore } from '@/stores/lojaStore';
import { useBalancoStore } from '@/stores/balancoStore';
import { useBancoStore } from '@/stores/bancoStore';
import { useParcelamentoStore } from '@/stores/parcelamentoStore';
import { useSociosStore } from '@/stores/sociosStore';
import { useFornecedorStore } from '@/stores/fornecedorStore';
import { useDespesaTiposStore } from '@/stores/despesaTiposStore';

/**
 * Limpa todo o cache de dados escopo-tenant ao trocar de empresa.
 * Deve ser chamado antes de clearTenant() ou ao selecionar outro tenant.
 */
export function clearTenantCache(): void {
  useDespesaFixaStore.getState().reset();
  useDespesaExtraStore.getState().reset();
  useDespesaFuncionarioStore.getState().reset();
  useDespesaImpostoStore.getState().reset();
  useDespesaVeiculoStore.getState().reset();
  useDespesaBancoStore.getState().reset();
  useAgendaStore.getState().reset();
  useLojaStore.getState().reset();
  useBalancoStore.getState().reset();
  useBancoStore.getState().reset();
  useParcelamentoStore.getState().reset();
  useSociosStore.getState().reset();
  useFornecedorStore.getState().reset();
  useDespesaTiposStore.getState().reset();
}
