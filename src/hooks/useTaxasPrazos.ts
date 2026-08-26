import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import {
  MAQUININHAS_PADRAO_HABILITADAS,
  MAQUININHAS_PADRAO_IDS,
  MAQUININHAS_PADRAO_LIST,
} from '@/lib/maquininhas';
import { DEFAULT_MAQUININHAS_CORES } from '@/lib/cores-maquininha';
import {
  comVoucherSeed,
  DEFAULT_BANDEIRAS,
  getModulosHabilitados,
  type BandeiraCadastro,
  type ModulosHabilitados,
  type TaxasJsonShape,
  type TaxasPrazosPayload,
} from '@/types/taxas-prazos';

export interface MaquininhaInfo {
  id: string;
  label: string;
  custom?: boolean;
}

export interface TaxasPrazosState {
  /** JSON cru, para telas que precisam preservar chaves ao regravar. */
  json: TaxasJsonShape;
  loading: boolean;
  error: string | null;
  /** Cadastro completo de bandeiras (fonte unica). */
  bandeiras: BandeiraCadastro[];
  bandeirasCredito: BandeiraCadastro[];
  bandeirasDebito: BandeiraCadastro[];
  bandeirasVoucher: BandeiraCadastro[];
  /** Todas as maquininhas conhecidas (padrao + customizadas). */
  maquininhas: MaquininhaInfo[];
  /** Ids habilitados no Gerenciar maquininhas. */
  maquininhasHabilitadas: string[];
  /** Apenas as maquininhas habilitadas, na ordem do catalogo. */
  maquininhasVisiveis: MaquininhaInfo[];
  modulos: ModulosHabilitados;
  cores: Record<string, string>;
  refetch: () => Promise<void>;
}

/**
 * Fonte unica de bandeiras, maquininhas e modulos, lida do JSON de Taxas e Prazos.
 *
 * Antes cada tela (TaxasPrazos, ControleCartoes, AReceber) mantinha sua propria
 * lista hardcoded de bandeiras — com ordens e conteudos divergentes, e sem as
 * bandeiras personalizadas cadastradas pelo usuario. Os defaults so entram como
 * seed quando o tenant ainda nao tem cadastro (ou o GET falha).
 */
export function useTaxasPrazos(): TaxasPrazosState {
  const [json, setJson] = useState<TaxasJsonShape>({});
  const [bandeiras, setBandeiras] = useState<BandeiraCadastro[]>(DEFAULT_BANDEIRAS);
  const [maquininhas, setMaquininhas] = useState<MaquininhaInfo[]>(() =>
    MAQUININHAS_PADRAO_LIST.map((m) => ({ ...m, custom: false })),
  );
  const [maquininhasHabilitadas, setMaquininhasHabilitadas] = useState<string[]>(
    MAQUININHAS_PADRAO_HABILITADAS,
  );
  const [modulos, setModulos] = useState<ModulosHabilitados>({ voucher: true, ifood: true });
  const [cores, setCores] = useState<Record<string, string>>({ ...DEFAULT_MAQUININHAS_CORES });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<TaxasPrazosPayload>('financeiro/controle-cartoes/taxas-prazos');
      const wrapped = res.data && typeof res.data === 'object' ? res.data : {};
      const taxasJson: TaxasJsonShape =
        wrapped.taxas && typeof wrapped.taxas === 'object' && !Array.isArray(wrapped.taxas)
          ? (wrapped.taxas as TaxasJsonShape)
          : {};
      setJson(taxasJson);

      // Bandeiras: cadastro salvo e a fonte. Defaults novos sao acrescentados
      // para nao sumirem em tenants antigos, sem sobrescrever o que ja existe.
      const salvas = Array.isArray(taxasJson.bandeirasCadastradas) ? taxasJson.bandeirasCadastradas : [];
      const base = salvas.length > 0 ? salvas : DEFAULT_BANDEIRAS;
      const ids = new Set(base.map((b) => b.id));
      const novas = DEFAULT_BANDEIRAS.filter((b) => !ids.has(b.id));
      setBandeiras([...base, ...novas].map(comVoucherSeed));

      const customs = Array.isArray(taxasJson.maquininhasCustom) ? taxasJson.maquininhasCustom : [];
      setMaquininhas([
        ...MAQUININHAS_PADRAO_LIST.map((m) => ({ ...m, custom: false })),
        ...customs
          .filter((m) => m && m.id && m.label && !MAQUININHAS_PADRAO_IDS.has(m.id))
          .map((m) => ({ id: m.id, label: m.label, custom: true })),
      ]);

      setMaquininhasHabilitadas(
        Array.isArray(taxasJson.maquininhasHabilitadas) && taxasJson.maquininhasHabilitadas.length > 0
          ? taxasJson.maquininhasHabilitadas
          : MAQUININHAS_PADRAO_HABILITADAS,
      );
      setModulos(getModulosHabilitados(taxasJson));
      setCores({
        ...DEFAULT_MAQUININHAS_CORES,
        ...(taxasJson.maquininhasCores && typeof taxasJson.maquininhasCores === 'object'
          ? taxasJson.maquininhasCores
          : {}),
      });
    } catch (e) {
      // Falha de leitura cai nos defaults — a tela continua utilizavel.
      setError((e as Error)?.message ?? 'Erro ao carregar taxas e prazos');
      setBandeiras(DEFAULT_BANDEIRAS.map(comVoucherSeed));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  /**
   * Ordem alfabetica em pt-BR, aplicada na FONTE.
   *
   * As listas saiam na ordem de cadastro, entao bandeiras criadas depois (o
   * cliente citou Pluxee e Teste) apareciam no fim, fora de ordem, em todas as
   * telas. Ordenar aqui corrige Controle de Cartoes, Taxas e Prazos e A Receber
   * de uma vez. `sensitivity: base` ignora acento e caixa.
   */
  const porLabel = <T extends { label: string }>(lista: T[]): T[] =>
    [...lista].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }));

  const bandeirasCredito = useMemo(
    () => porLabel(bandeiras.filter((b) => b.tipo === 'credito')),
    [bandeiras],
  );
  const bandeirasDebito = useMemo(
    () => porLabel(bandeiras.filter((b) => b.tipo === 'debito')),
    [bandeiras],
  );
  const bandeirasVoucher = useMemo(
    () => porLabel(bandeiras.filter((b) => b.tipo === 'voucher')),
    [bandeiras],
  );
  const maquininhasOrdenadas = useMemo(() => porLabel(maquininhas), [maquininhas]);
  const maquininhasVisiveis = useMemo(
    () => maquininhasOrdenadas.filter((m) => maquininhasHabilitadas.includes(m.id)),
    [maquininhasOrdenadas, maquininhasHabilitadas],
  );

  return {
    json,
    loading,
    error,
    bandeiras,
    bandeirasCredito,
    bandeirasDebito,
    bandeirasVoucher,
    maquininhas: maquininhasOrdenadas,
    maquininhasHabilitadas,
    maquininhasVisiveis,
    modulos,
    cores,
    refetch,
  };
}
